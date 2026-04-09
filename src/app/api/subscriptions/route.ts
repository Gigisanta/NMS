import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/auth'
import { getCurrentMonth, getCurrentYear } from '@/lib/utils'
import { cachedFetch, CacheKeys } from '@/lib/api-utils'

/**
 * Ensures all active clients have a subscription record for the given month/year.
 * BOLT OPTIMIZATION:
 * 1. Uses a single query with 'none' filter to find missing records (O(1) roundtrips vs O(N)).
 * 2. Parallelizes settings retrieval.
 * 3. Uses createMany for efficient bulk insertion.
 */
async function ensureSubscriptionsExist(month: number, year: number) {
  // Find clients that DON'T have a subscription for this month/year
  // This is much more efficient than fetching all and filtering in JS
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

    // Use createMany for high-performance bulk insert
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

    console.log(`[Subscriptions] Auto-generated ${missingClients.length} missing subscriptions for ${month}/${year}`)
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
    const clientId = searchParams.get('clientId')
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : getCurrentMonth()
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : getCurrentYear()

    const params = {
      clientId: clientId || 'all',
      month,
      year,
    }

    // BOLT OPTIMIZATION: Use cached fetch (30s) to reduce DB load on frequent dashboard/list refreshes
    const subscriptions = await cachedFetch(
      CacheKeys.subscriptions(params),
      async () => {
        // Run sync logic INSIDE the cache fetcher so it only runs when cache is cold
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
