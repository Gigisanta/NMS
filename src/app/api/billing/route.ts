import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import { invalidateClientCache } from '@/lib/api-utils'

const billingSchema = z.object({
  subscriptionIds: z.array(z.string()).min(1, 'Selecciona al menos una suscripción'),
})

// POST /api/billing - Process billing for multiple subscriptions
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validated = billingSchema.parse(body)
    const { subscriptionIds } = validated

    // Simulate ARCA / Mercado Pago processing delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Update subscriptions to isBilled = true
    const updated = await db.subscription.updateMany({
      where: {
        id: { in: subscriptionIds },
      },
      data: {
        isBilled: true,
      },
    })

    // Log the action (only if user exists)
    let userId: string | null = null
    if (session.user.id) {
      const userExists = await db.user.findUnique({
        where: { id: session.user.id },
        select: { id: true },
      })
      if (userExists) {
        userId = session.user.id
      }
    }

    await db.activityLog.create({
      data: {
        action: 'billing_process',
        entity: 'subscription',
        userId,
        details: JSON.stringify({
          count: updated.count,
          ids: subscriptionIds,
          timestamp: new Date().toISOString(),
          provider: 'ARCA/MercadoPago'
        }),
      },
    })

    // Invalidate relevant caches (dashboard and subscriptions are under ClientCache)
    invalidateClientCache()

    return NextResponse.json({
      success: true,
      message: `${updated.count} facturas procesadas correctamente`,
      data: { count: updated.count },
    })
  } catch (error) {
    console.error('Error processing billing:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0]?.message || 'Datos invalidos' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Error al procesar facturación' },
      { status: 500 }
    )
  }
}

// GET /api/billing/stats - Get billing stats (simulated)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Get stats from database
    const billedCount = await db.subscription.count({ where: { isBilled: true } })
    const pendingCount = await db.subscription.count({
      where: {
        isBilled: false,
        status: 'AL_DIA'
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        billedCount,
        pendingCount,
        arcaStatus: 'connected',
        mercadoPagoStatus: 'connected',
      },
    })
  } catch (error) {
    console.error('Error fetching billing stats:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener estadísticas de facturación' },
      { status: 500 }
    )
  }
}
