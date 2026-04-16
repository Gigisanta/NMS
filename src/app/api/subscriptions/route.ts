import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/auth'
import { getCurrentMonth, getCurrentYear } from '@/lib/utils'
import { cachedFetch, CacheKeys } from '@/lib/api-utils'

async function ensureSubscriptionsExist(month: number, year: number) {
  // Parallelize client and existing subscription fetching
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
    // BOLT OPTIMIZATION: Parallelize settings fetching and use createMany for bulk insertion
    const [defaultClassesSetting, defaultPriceSetting] = await Promise.all([
      db.settings.findUnique({ where: { key: 'payment.defaultClasses' } }),
      db.settings.findUnique({ where: { key: 'payment.defaultPrice' } })
    ])

    const defaultClasses = defaultClassesSetting ? parseInt(defaultClassesSetting.value) : 4
    const defaultPrice = defaultPriceSetting ? parseInt(defaultPriceSetting.value) : 5000

    await db.subscription.createMany({
      data: missingClients.map(client => ({
        clientId: client.id,
        month,
        year,
        status: 'PENDIENTE',
        billingPeriod: 'FULL',
        classesTotal: defaultClasses,
        classesUsed: 0,
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
    const clientId = searchParams.get('clientId')
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : getCurrentMonth()
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : getCurrentYear()

    // Cache parameters for the key
    const cacheParams = {
      clientId,
      month,
      year
    }

    // BOLT OPTIMIZATION: Use cachedFetch to reduce database load
    const subscriptions = await cachedFetch(
      CacheKeys.subscriptions(cacheParams),
      async () => {
        // Run ensureSubscriptionsExist inside the fetcher to keep cache consistent
        await ensureSubscriptionsExist(month, year)

        const whereClause: {
          clientId?: string
          month?: number
          year?: number
        } = {}

        if (clientId) whereClause.clientId = clientId
        if (month) whereClause.month = month
        if (year) whereClause.year = year

        const subs = await db.subscription.findMany({
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

        return subs
      },
      30 * 1000 // 30 seconds TTL for subscriptions
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
