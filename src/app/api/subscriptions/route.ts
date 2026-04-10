import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/auth'
import { getCurrentMonth, getCurrentYear } from '@/lib/utils'
import { cachedFetch, CacheKeys } from '@/lib/api-utils'

async function ensureSubscriptionsExist(month: number, year: number) {
  // BOLT OPTIMIZATION: Find missing subscriptions in a single query using 'none' filter
  // This reduces O(N+M) database records fetched to only the missing O(K) records.
  const missingClients = await db.client.findMany({
    where: {
      subscriptions: {
        none: { month, year }
      }
    },
    select: { id: true }
  })

  if (missingClients.length > 0) {
    // BOLT OPTIMIZATION: Parallelize fetching default settings
    const [defaultClassesSetting, defaultPriceSetting] = await Promise.all([
      db.settings.findUnique({ where: { key: 'payment.defaultClasses' } }),
      db.settings.findUnique({ where: { key: 'payment.defaultPrice' } })
    ])

    const defaultClasses = defaultClassesSetting ? parseInt(defaultClassesSetting.value) : 4
    const defaultPrice = defaultPriceSetting ? parseInt(defaultPriceSetting.value) : 5000

    // BOLT OPTIMIZATION: Use createMany for bulk insertion.
    // Reduces database roundtrips from O(N) individual creates to a single O(1) batch operation.
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
      skipDuplicates: true
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
    const clientId = searchParams.get('clientId')
    const monthParam = searchParams.get('month')
    const yearParam = searchParams.get('year')
    const month = monthParam ? parseInt(monthParam) : getCurrentMonth()
    const year = yearParam ? parseInt(yearParam) : getCurrentYear()

    const params = {
      clientId: clientId || '',
      month: month.toString(),
      year: year.toString(),
    }

    // BOLT OPTIMIZATION: Wrap in cachedFetch (30s TTL) to reduce database load.
    // Subscription generation logic (ensureSubscriptionsExist) is now inside the
    // fetcher callback, meaning it only runs when the cache is cold.
    const subscriptions = await cachedFetch(
      CacheKeys.subscriptions(params),
      async () => {
        await ensureSubscriptionsExist(month, year)

        const whereClause: any = {}
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
