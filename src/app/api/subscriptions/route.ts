import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentMonth, getCurrentYear } from '@/lib/utils'
import { cachedFetch, CacheKeys } from '@/lib/api-utils'

async function ensureSubscriptionsExist(month: number, year: number) {
  // BOLT: Run client and existing subscription checks in parallel
  const [clients, existingSubs] = await Promise.all([
    db.client.findMany({ select: { id: true } }),
    db.subscription.findMany({
      where: { month, year },
      select: { clientId: true },
    })
  ])

  const existingClientIds = new Set(existingSubs.map(s => s.clientId))
  const missingClients = clients.filter(c => !existingClientIds.has(c.id))

  if (missingClients.length > 0) {
    // BOLT: Fetch all required settings in a single batch query
    const settings = await db.settings.findMany({
      where: {
        key: { in: ['payment.defaultClasses', 'payment.defaultPrice'] }
      }
    })

    const settingsMap = new Map(settings.map(s => [s.key, s.value]))
    const defaultClasses = parseInt(settingsMap.get('payment.defaultClasses') || '4')
    const defaultPrice = parseInt(settingsMap.get('payment.defaultPrice') || '5000')

    // BOLT: Use createMany for efficient bulk insertion
    await db.subscription.createMany({
      data: missingClients.map(client => ({
        clientId: client.id,
        month,
        year,
        status: 'PENDIENTE',
        billingPeriod: 'FULL',
        classesTotal: defaultClasses,
        classesUsed: 0,
        amount: defaultPrice,
      })),
      skipDuplicates: true, // Safety check
    })
  }
}

// GET /api/subscriptions - Get subscriptions with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const clientId = searchParams.get('clientId') || ''
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : getCurrentMonth()
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : getCurrentYear()

    // BOLT: Always ensure subscriptions exist before fetching (non-cached part)
    await ensureSubscriptionsExist(month, year)

    const params = {
      clientId,
      month: String(month),
      year: String(year)
    }

    // BOLT: Implement 30s cache for subscriptions list to improve performance
    // in Payments and Billing views.
    const subscriptions = await cachedFetch(
      CacheKeys.subscriptions(params),
      async () => {
        const whereClause: {
          clientId?: string
          month?: number
          year?: number
        } = {}

        if (clientId) whereClause.clientId = clientId
        if (month) whereClause.month = month
        if (year) whereClause.year = year

        return db.subscription.findMany({
          where: whereClause,
          include: {
            client: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                telefono: true,
                grupo: {
                  select: {
                    id: true,
                    name: true,
                    color: true,
                  },
                },
              },
            },
          },
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
        })
      },
      30 * 1000 // 30 seconds cache
    )

    return NextResponse.json({
      success: true,
      data: subscriptions,
    })
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener suscripciones' },
      { status: 500 }
    )
  }
}
