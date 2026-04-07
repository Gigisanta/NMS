import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentMonth, getCurrentYear } from '@/lib/utils'
import { cachedFetch, CacheKeys } from '@/lib/api-utils'

/**
 * Ensures all clients have a subscription record for the given month and year.
 * BOLT OPTIMIZATION: Refactored to use efficient queries and bulk operations.
 */
async function ensureSubscriptionsExist(month: number, year: number, clientId?: string) {
  // BOLT OPTIMIZATION: Use a single query with 'none' filter to find missing clients
  // This is much faster than fetching all clients and filtering in memory.
  const where: any = {
    subscriptions: {
      none: {
        month,
        year,
      },
    },
  }

  // If a clientId is provided, only check for that client
  if (clientId) {
    where.id = clientId
  }

  const missingClients = await db.client.findMany({
    where,
    select: {
      id: true,
      monthlyAmount: true
    },
  })

  if (missingClients.length > 0) {
    // BOLT OPTIMIZATION: Parallelize settings fetching
    const [defaultClassesSetting, defaultPriceSetting] = await Promise.all([
      db.settings.findUnique({ where: { key: 'payment.defaultClasses' } }),
      db.settings.findUnique({ where: { key: 'payment.defaultPrice' } }),
    ])

    const defaultClasses = defaultClassesSetting ? parseInt(defaultClassesSetting.value) : 4
    const defaultPrice = defaultPriceSetting ? parseInt(defaultPriceSetting.value) : 5000

    // BOLT OPTIMIZATION: Use createMany for high-performance bulk insertion
    await db.subscription.createMany({
      data: missingClients.map(client => ({
        clientId: client.id,
        month,
        year,
        status: 'PENDIENTE',
        billingPeriod: 'FULL',
        classesTotal: defaultClasses,
        classesUsed: 0,
        amount: client.monthlyAmount || defaultPrice, // Prioritize client's personal amount
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

    const params = {
      clientId,
      month: String(month),
      year: String(year),
    }

    // BOLT OPTIMIZATION: Wrap in cachedFetch to reduce database load for repeated requests (30s cache)
    const subscriptions = await cachedFetch(
      CacheKeys.subscriptions(params),
      async () => {
        // Ensure subscriptions exist only when cache is cold
        // BOLT OPTIMIZATION: Pass clientId if present to avoid checking all clients unnecessarily
        await ensureSubscriptionsExist(month, year, clientId || undefined)

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
