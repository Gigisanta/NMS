import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentMonth, getCurrentYear } from '@/lib/utils'
import { cachedFetch, CacheKeys } from '@/lib/api-utils'

async function ensureSubscriptionsExist(month: number, year: number) {
  // BOLT OPTIMIZATION: Select monthlyAmount to avoid using default price when personalized one is available
  const [clients, existingSubs] = await Promise.all([
    db.client.findMany({ select: { id: true, monthlyAmount: true } }),
    db.subscription.findMany({
      where: { month, year },
      select: { clientId: true },
    })
  ])

  const existingClientIds = new Set(existingSubs.map(s => s.clientId))
  const missingClients = clients.filter(c => !existingClientIds.has(c.id))

  if (missingClients.length > 0) {
    // BOLT OPTIMIZATION: Fetch settings in parallel
    const [defaultClassesSetting, defaultPriceSetting] = await Promise.all([
      db.settings.findUnique({ where: { key: 'payment.defaultClasses' } }),
      db.settings.findUnique({ where: { key: 'payment.defaultPrice' } }),
    ])

    const defaultClasses = defaultClassesSetting ? parseInt(defaultClassesSetting.value) : 4
    const defaultPrice = defaultPriceSetting ? parseInt(defaultPriceSetting.value) : 5000

    // BOLT OPTIMIZATION: Use createMany for O(1) database roundtrip instead of O(N) transaction
    await db.subscription.createMany({
      data: missingClients.map(client => ({
        clientId: client.id,
        month,
        year,
        status: 'PENDIENTE',
        billingPeriod: 'FULL',
        classesTotal: defaultClasses,
        classesUsed: 0,
        amount: client.monthlyAmount ? Number(client.monthlyAmount) : defaultPrice,
      })),
      skipDuplicates: true
    })
  }
}

// GET /api/subscriptions - Get subscriptions with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const clientId = searchParams.get('clientId')
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : getCurrentMonth()
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : getCurrentYear()

    const params = {
      clientId: clientId || 'all',
      month: String(month),
      year: String(year)
    }

    // BOLT OPTIMIZATION: Use cached fetch for subscriptions list (30s TTL)
    const subscriptions = await cachedFetch(
      CacheKeys.subscriptions(params),
      async () => {
        // BOLT OPTIMIZATION: Move expensive generation logic inside cache callback
        // This ensures DB hits for 'ensureSubscriptionsExist' only happen on cache miss
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
