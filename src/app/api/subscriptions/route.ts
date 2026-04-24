import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/auth'
import { getCurrentMonth, getCurrentYear } from '@/lib/utils'

async function ensureSubscriptionsExist(month: number, year: number) {
  // BOLT OPTIMIZATION: Use 'none' filter to find clients without subscriptions in a single query
  // This reduces database roundtrips and avoids fetching all clients + all subscriptions separately.
  const missingClients = await db.client.findMany({
    where: {
      subscriptions: {
        none: { month, year }
      }
    },
    select: { id: true }
  })

  if (missingClients.length > 0) {
    // BOLT OPTIMIZATION: Parallelize settings fetching
    const [defaultClassesSetting, defaultPriceSetting] = await Promise.all([
      db.settings.findUnique({ where: { key: 'payment.defaultClasses' } }),
      db.settings.findUnique({ where: { key: 'payment.defaultPrice' } }),
    ])

    const defaultClasses = defaultClassesSetting ? parseInt(defaultClassesSetting.value) : 4
    const defaultPrice = defaultPriceSetting ? parseInt(defaultPriceSetting.value) : 5000

    // BOLT OPTIMIZATION: Use createMany for bulk insertion instead of multiple individual creates in a transaction.
    // This reduces database roundtrips from O(N) to O(1).
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
    const clientId = searchParams.get('clientId')
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : getCurrentMonth()
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : getCurrentYear()

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
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener suscripciones' },
      { status: 500 }
    )
  }
}
