import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/auth'
import { getCurrentMonth, getCurrentYear } from '@/lib/utils'
import { cachedFetch, CacheKeys } from '@/lib/api-utils'

/**
 * BOLT OPTIMIZATION: Refactored ensureSubscriptionsExist to use a single batch query
 * and createMany for O(1) database roundtrips instead of O(N).
 */
async function ensureSubscriptionsExist(month: number, year: number) {
  // Find clients that DON'T have a subscription for this month/year in a single query
  const missingClients = await db.client.findMany({
    where: {
      subscriptions: {
        none: {
          month,
          year,
        },
      },
    },
    select: {
      id: true,
      monthlyAmount: true,
    },
  })

  if (missingClients.length > 0) {
    // Fetch settings in parallel
    const [defaultClassesSetting, defaultPriceSetting] = await Promise.all([
      db.settings.findUnique({ where: { key: 'payment.defaultClasses' } }),
      db.settings.findUnique({ where: { key: 'payment.defaultPrice' } }),
    ])

    const defaultClasses = defaultClassesSetting ? parseInt(defaultClassesSetting.value) : 4
    const defaultPrice = defaultPriceSetting ? parseInt(defaultPriceSetting.value) : 5000

    // BOLT OPTIMIZATION: Use createMany for efficient bulk insertion
    await db.subscription.createMany({
      data: missingClients.map(client => ({
        clientId: client.id,
        month,
        year,
        status: 'PENDIENTE',
        billingPeriod: 'FULL',
        classesTotal: defaultClasses,
        classesUsed: 0,
        // Prioritize client's custom monthlyAmount, fallback to defaultPrice
        amount: client.monthlyAmount ?? defaultPrice,
      })),
      skipDuplicates: true,
    })
  }
}

// GET /api/subscriptions - Get subscriptions with filters
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const clientId = searchParams.get('clientId') || ''
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : getCurrentMonth()
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : getCurrentYear()

    // BOLT OPTIMIZATION: Use cachedFetch to reduce database load
    const cacheKey = CacheKeys.subscriptions({
      clientId,
      month: month.toString(),
      year: year.toString()
    })

    const subscriptions = await cachedFetch(
      cacheKey,
      async () => {
        // Ensure subscriptions exist inside the fetcher to only run once per cache period
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
      30 * 1000 // 30 seconds TTL
    )

    console.log('[Subscriptions GET] count:', subscriptions.length, 'month:', month, 'year:', year)

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
