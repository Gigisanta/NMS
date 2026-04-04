import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentMonth, getCurrentYear } from '@/lib/utils'
import { cachedFetch, CacheKeys } from '@/lib/api-utils'

async function ensureSubscriptionsExist(month: number, year: number) {
  // BOLT OPTIMIZATION: Single-pass query to find clients missing subscriptions for the period
  const missingClients = await db.client.findMany({
    where: {
      subscriptions: {
        none: { month, year }
      }
    },
    select: { id: true, monthlyAmount: true }
  })

  if (missingClients.length > 0) {
    // BOLT OPTIMIZATION: Parallel settings fetch
    const [defaultClassesSetting, defaultPriceSetting] = await Promise.all([
      db.settings.findUnique({ where: { key: 'payment.defaultClasses' } }),
      db.settings.findUnique({ where: { key: 'payment.defaultPrice' } }),
    ])

    const defaultClasses = defaultClassesSetting ? parseInt(defaultClassesSetting.value) : 4
    const defaultPrice = defaultPriceSetting ? parseInt(defaultPriceSetting.value) : 5000

    // BOLT OPTIMIZATION: Use createMany for O(1) database roundtrip instead of individual transactions
    await db.subscription.createMany({
      data: missingClients.map(client => ({
        clientId: client.id,
        month,
        year,
        status: 'PENDIENTE',
        billingPeriod: 'FULL',
        classesTotal: defaultClasses,
        classesUsed: 0,
        // Prioritize client-specific monthlyAmount over global default
        amount: client.monthlyAmount ? Number(client.monthlyAmount) : defaultPrice,
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

    // BOLT OPTIMIZATION: Call ensureSubscriptionsExist before cachedFetch
    // to ensure missing records are created even if the list is cached
    await ensureSubscriptionsExist(month, year)

    const params = {
      clientId,
      month: String(month),
      year: String(year)
    }

    // BOLT OPTIMIZATION: Use cached fetch for high-traffic subscriptions route (30s cache)
    const data = await cachedFetch(
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
      data,
    })
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener suscripciones' },
      { status: 500 }
    )
  }
}
