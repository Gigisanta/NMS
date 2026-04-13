import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/auth'
import { getCurrentMonth, getCurrentYear } from '@/lib/utils'
import { cachedFetch, CacheKeys } from '@/lib/api-utils'

async function ensureSubscriptionsExist(month: number, year: number) {
  // BOLT OPTIMIZATION: Find clients missing subscriptions for the current month/year in a single query
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
    // BOLT OPTIMIZATION: Parallelize settings fetches
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
        amount: client.monthlyAmount || defaultPrice,
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
    const clientId = searchParams.get('clientId')
    const monthStr = searchParams.get('month')
    const yearStr = searchParams.get('year')
    const month = monthStr ? parseInt(monthStr) : getCurrentMonth()
    const year = yearStr ? parseInt(yearStr) : getCurrentYear()

    // BOLT OPTIMIZATION: Use cachedFetch to reduce database load
    const cacheKey = CacheKeys.subscriptions({
      clientId: clientId || 'all',
      month,
      year
    })

    return await cachedFetch(cacheKey, async () => {
      await ensureSubscriptionsExist(month, year)

      const whereClause: {
        clientId?: string
        month?: number
        year?: number
      } = {}

      if (clientId) whereClause.clientId = clientId
      if (month) whereClause.month = month
      if (year) whereClause.year = year

      const subscriptions = await db.subscription.findMany({
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

      console.log('[Subscriptions GET] count:', subscriptions.length, 'month:', month, 'year:', year)

      return NextResponse.json({
        success: true,
        data: subscriptions,
      })
    }, 30 * 1000) // 30 seconds TTL
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener suscripciones' },
      { status: 500 }
    )
  }
}
