import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/auth'
import { getCurrentMonth, getCurrentYear } from '@/lib/utils'
import { cachedFetch, CacheKeys } from '@/lib/api-utils'

/**
 * Ensures all clients have a subscription record for the given month/year.
 * BOLT OPTIMIZATION: Uses a single 'none' filter query to find missing records and createMany for bulk insert.
 */
async function ensureSubscriptionsExist(month: number, year: number) {
  // BOLT OPTIMIZATION: Identify missing records in one query using 'none' filter
  // Also parallelize fetching settings and missing clients
  const [missingClients, defaultClassesSetting, defaultPriceSetting] = await Promise.all([
    db.client.findMany({
      where: {
        subscriptions: {
          none: { month, year }
        }
      },
      select: { id: true, monthlyAmount: true }
    }),
    db.settings.findUnique({ where: { key: 'payment.defaultClasses' } }),
    db.settings.findUnique({ where: { key: 'payment.defaultPrice' } }),
  ])

  if (missingClients.length > 0) {
    const defaultClasses = defaultClassesSetting ? parseInt(defaultClassesSetting.value) : 4
    const defaultPrice = defaultPriceSetting ? parseInt(defaultPriceSetting.value) : 5000

    // BOLT OPTIMIZATION: Use createMany for efficient bulk insert
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
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : getCurrentMonth()
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : getCurrentYear()

    // BOLT OPTIMIZATION: Use cachedFetch for subscriptions list (30s cache)
    const params = {
      clientId: clientId || 'all',
      month: month.toString(),
      year: year.toString(),
    }

    const subscriptions = await cachedFetch(
      CacheKeys.subscriptions(params),
      async () => {
        // Only sync if cache missed to reduce DB load
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
      30 * 1000
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
