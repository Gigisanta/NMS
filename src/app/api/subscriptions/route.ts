import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/auth'
import { getCurrentMonth, getCurrentYear } from '@/lib/utils'

async function ensureSubscriptionsExist(month: number, year: number) {
  const clients = await db.client.findMany({ select: { id: true } })
  const existingSubs = await db.subscription.findMany({
    where: { month, year },
    select: { clientId: true },
  })
  const existingClientIds = new Set(existingSubs.map(s => s.clientId))
  const missingClients = clients.filter(c => !existingClientIds.has(c.id))

  if (missingClients.length > 0) {
    const defaultClassesSetting = await db.settings.findUnique({
      where: { key: 'payment.defaultClasses' },
    })
    const defaultClasses = defaultClassesSetting ? parseInt(defaultClassesSetting.value) : 4

    // Get previous month subscriptions to carry over amount and billingPeriod
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year

    const prevSubscriptions = await db.subscription.findMany({
      where: { month: prevMonth, year: prevYear },
      select: { clientId: true, amount: true, billingPeriod: true },
    })
    const prevSubMap = new Map(prevSubscriptions.map(s => [s.clientId, s]))

    await db.$transaction(
      missingClients.map(client => {
        const prevSub = prevSubMap.get(client.id)
        return db.subscription.create({
          data: {
            clientId: client.id,
            month,
            year,
            status: 'PENDIENTE',
            billingPeriod: prevSub?.billingPeriod || 'FULL',
            classesTotal: defaultClasses,
            classesUsed: 0,
            // Carry over amount from previous month if it exists
            amount: prevSub?.amount ?? null,
          },
        })
      })
    )
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
