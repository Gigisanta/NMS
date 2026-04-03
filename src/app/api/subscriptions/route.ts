import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentMonth, getCurrentYear } from '@/lib/utils'
import { cachedFetch, CacheKeys } from '@/lib/api-utils'

async function ensureSubscriptionsExist(month: number, year: number) {
  // BOLT OPTIMIZATION: Parallelize initial queries to avoid sequential database roundtrips
  const [clients, existingSubs, defaultClassesSetting, defaultPriceSetting] = await Promise.all([
    db.client.findMany({ select: { id: true, monthlyAmount: true } }),
    db.subscription.findMany({
      where: { month, year },
      select: { clientId: true },
    }),
    db.settings.findUnique({ where: { key: 'payment.defaultClasses' } }),
    db.settings.findUnique({ where: { key: 'payment.defaultPrice' } }),
  ])

  const existingClientIds = new Set(existingSubs.map(s => s.clientId))
  const missingClients = clients.filter(c => !existingClientIds.has(c.id))

  if (missingClients.length > 0) {
    const defaultClasses = defaultClassesSetting ? parseInt(defaultClassesSetting.value) : 4
    const defaultPrice = defaultPriceSetting ? parseInt(defaultPriceSetting.value) : 5000

    // BOLT OPTIMIZATION: Use createMany for batch insertion instead of a loop of transactions
    // This reduces the database overhead significantly for large numbers of clients
    await db.subscription.createMany({
      data: missingClients.map(client => ({
        clientId: client.id,
        month,
        year,
        status: 'PENDIENTE',
        billingPeriod: 'FULL',
        classesTotal: defaultClasses,
        classesUsed: 0,
        amount: client.monthlyAmount || defaultPrice,
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
    const monthStr = searchParams.get('month') || ''
    const yearStr = searchParams.get('year') || ''

    const month = monthStr ? parseInt(monthStr) : getCurrentMonth()
    const year = yearStr ? parseInt(yearStr) : getCurrentYear()

    const params = {
      clientId,
      month: String(month),
      year: String(year),
    }

    // BOLT OPTIMIZATION: Use cachedFetch with 30s TTL to reduce repeated heavy queries
    const subscriptions = await cachedFetch(
      CacheKeys.subscriptions(params),
      async () => {
        await ensureSubscriptionsExist(month, year)

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
