import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/auth'
import { getCurrentMonth, getCurrentYear } from '@/lib/utils'

/**
 * BOLT OPTIMIZATION: Refactored to eliminate O(N) client/subscription comparison.
 * Uses Prisma's 'none' relation filter to find missing records in one query.
 */
async function ensureSubscriptionsExist(month: number, year: number) {
  // BOLT: Find only clients that don't have a subscription for this month/year
  // This reduces data transfer and avoids in-memory O(N) filtering
  const missingClients = await db.client.findMany({
    where: {
      subscriptions: {
        none: { month, year }
      }
    },
    select: { id: true }
  })

  if (missingClients.length > 0) {
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year

    // BOLT: Run settings and previous subscriptions query in parallel
    const [defaultClassesSetting, prevSubscriptions] = await Promise.all([
      db.settings.findUnique({
        where: { key: 'payment.defaultClasses' },
      }),
      db.subscription.findMany({
        where: { month: prevMonth, year: prevYear },
        select: { clientId: true, amount: true, billingPeriod: true },
      })
    ])

    const defaultClasses = defaultClassesSetting ? parseInt(defaultClassesSetting.value) : 4
    const prevSubMap = new Map(prevSubscriptions.map(s => [s.clientId, s]))

    // BOLT: Use createMany for a single bulk insert instead of O(N) transaction
    // This significantly reduces database roundtrips
    const subscriptionData = missingClients.map(client => {
      const prevSub = prevSubMap.get(client.id)
      return {
        clientId: client.id,
        month,
        year,
        status: 'PENDIENTE',
        billingPeriod: prevSub?.billingPeriod || 'FULL',
        classesTotal: defaultClasses,
        classesUsed: 0,
        amount: prevSub?.amount ?? null,
      }
    })

    await db.subscription.createMany({
      data: subscriptionData
    })

    console.log(`[BOLT] Generated ${subscriptionData.length} missing subscriptions for ${month}/${year}`)
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
    const limit = parseInt(searchParams.get('limit') || '500')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Only auto-create subscriptions for the current month (performance optimization)
    const now = new Date()
    const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear()

    if (isCurrentMonth) {
      await ensureSubscriptionsExist(month, year)
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
