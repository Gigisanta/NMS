import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentMonth, getCurrentYear } from '@/lib/utils'
import { cachedFetch, CacheKeys } from '@/lib/api-utils'

export async function ensureSubscriptionsExist(month: number, year: number) {
  // BOLT OPTIMIZATION: Parallelize fetching clients and existing subscriptions
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
    // BOLT OPTIMIZATION: Parallelize fetching default settings
    const [defaultClassesSetting, defaultPriceSetting] = await Promise.all([
      db.settings.findUnique({ where: { key: 'payment.defaultClasses' } }),
      db.settings.findUnique({ where: { key: 'payment.defaultPrice' } })
    ])

    const defaultClasses = defaultClassesSetting ? parseInt(defaultClassesSetting.value) : 4
    const defaultPrice = defaultPriceSetting ? parseInt(defaultPriceSetting.value) : 5000

    // BOLT OPTIMIZATION: Use createMany for efficient bulk insertion
    // Reduces database roundtrips from O(N) to O(1)
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
      skipDuplicates: true,
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

    // BOLT PERFORMANCE: Ensure subscriptions exist for all clients BEFORE caching
    // This handles synchronization logic that must always run
    await ensureSubscriptionsExist(month, year)

    const params = {
      clientId,
      month: String(month),
      year: String(year)
    }

    // BOLT OPTIMIZATION: Use server-side caching for subscriptions (30s TTL)
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
