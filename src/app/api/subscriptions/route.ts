import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/auth'
import { getCurrentMonth, getCurrentYear } from '@/lib/utils'
import { cachedFetch, CacheKeys } from '@/lib/api-utils'

/**
 * BOLT OPTIMIZATION: Refactored to O(1) database roundtrip pattern.
 * Uses Prisma's 'none' filter to find missing records and createMany for bulk insertion.
 */
async function ensureSubscriptionsExist(month: number, year: number) {
  // Find clients that don't have a subscription for the given month/year
  const missingClients = await db.client.findMany({
    where: {
      subscriptions: {
        none: {
          month,
          year,
        },
      },
    },
    select: { id: true },
  })

  if (missingClients.length > 0) {
    // Parallelize settings fetch
    const [defaultClassesSetting, defaultPriceSetting] = await Promise.all([
      db.settings.findUnique({ where: { key: 'payment.defaultClasses' } }),
      db.settings.findUnique({ where: { key: 'payment.defaultPrice' } }),
    ])

    const defaultClasses = defaultClassesSetting ? parseInt(defaultClassesSetting.value) : 4
    const defaultPrice = defaultPriceSetting ? parseInt(defaultPriceSetting.value) : 5000

    // BOLT OPTIMIZATION: Use createMany for O(1) bulk insert instead of O(N) individual creates
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
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const clientId = searchParams.get('clientId') || undefined
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : getCurrentMonth()
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : getCurrentYear()

    // BOLT OPTIMIZATION: Implement cachedFetch for subscriptions
    const cacheKey = CacheKeys.subscriptions({
      clientId: clientId || 'all',
      month,
      year
    })

    const subscriptions = await cachedFetch(cacheKey, async () => {
      // Ensure missing subscriptions are generated before fetching
      // Putting this inside cachedFetch prevents redundant DB checks on cache hits
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
    })

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
