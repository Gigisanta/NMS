import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/auth'
import { getCurrentMonth, getCurrentYear } from '@/lib/utils'

/**
 * BOLT OPTIMIZATION: Refactored to eliminate O(N) bottlenecks
 * 1. Uses Prisma 'none' filter to find missing subscriptions in 1 query instead of 2 + in-memory filter
 * 2. Parallelizes settings fetching
 * 3. Uses createMany for bulk insertion (O(1) roundtrip instead of O(N))
 * 4. Added clientId support for targeted generation
 */
async function ensureSubscriptionsExist(month: number, year: number, clientId?: string) {
  // Find clients that don't have a subscription for this month/year
  // Using 'none' filter is much more efficient than fetching all and filtering in JS
  const missingClients = await db.client.findMany({
    where: {
      ...(clientId ? { id: clientId } : {}),
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
    // Fetch settings in parallel
    const [defaultClassesSetting, defaultPriceSetting] = await Promise.all([
      db.settings.findUnique({ where: { key: 'payment.defaultClasses' } }),
      db.settings.findUnique({ where: { key: 'payment.defaultPrice' } }),
    ])

    const defaultClasses = defaultClassesSetting ? parseInt(defaultClassesSetting.value) : 4
    const defaultPrice = defaultPriceSetting ? parseInt(defaultPriceSetting.value) : 5000

    // Use createMany for efficient bulk insertion
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
      skipDuplicates: true, // Safety measure
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
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Only auto-create subscriptions for the current month (performance optimization)
    const now = new Date()
    const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear()

    if (isCurrentMonth) {
      await ensureSubscriptionsExist(month, year, clientId)
    }

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
      take: limit,
      skip: offset,
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
