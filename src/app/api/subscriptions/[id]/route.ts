import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { invalidateCachePattern, invalidateClientCache } from '@/lib/api-utils'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

const updateSubscriptionSchema = z.object({
  status: z.enum(['AL_DIA', 'PENDIENTE', 'DEUDOR', 'SUSPENDIDO', 'CANCELADO']).optional(),
  classesTotal: z.number().int().min(0).optional(),
  classesUsed: z.number().int().min(0).optional(),
  amount: z.number().min(0).nullable().optional(),
  paymentMethod: z.string().optional(),
  isBilled: z.boolean().optional(),
  billingPeriod: z.enum(['FULL', 'HALF', 'QUARTER']).optional(),
})

// PUT /api/subscriptions/[id] - Update subscription
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validated = updateSubscriptionSchema.parse(body)

    const updateData: Record<string, unknown> = {}

    console.log('[Subscription PUT] id:', id, 'data:', validated)

    if (validated.status !== undefined) {
      console.log('[Subscription PUT] Updating status to:', validated.status)
      updateData.status = validated.status
    }
    if (validated.classesTotal !== undefined) updateData.classesTotal = validated.classesTotal
    if (validated.classesUsed !== undefined) updateData.classesUsed = validated.classesUsed
    if (validated.amount !== undefined) updateData.amount = validated.amount === null ? null : new Prisma.Decimal(validated.amount)
    if (validated.paymentMethod !== undefined) updateData.paymentMethod = validated.paymentMethod
    if (validated.isBilled !== undefined) updateData.isBilled = validated.isBilled
    if (validated.billingPeriod !== undefined) updateData.billingPeriod = validated.billingPeriod

    const subscription = await db.subscription.update({
      where: { id },
      data: updateData,
    })

    // BOLT: Invalidate client-related caches when subscription changes
    // (includes clients, dashboard, attendance, and subscriptions)
    invalidateClientCache()

    return NextResponse.json({
      success: true,
      data: subscription,
    })
  } catch (error) {
    if (error instanceof z.ZodError && error.issues.length > 0) {
      const firstError = error.issues[0]
      return NextResponse.json(
        { success: false, error: firstError?.message || 'Datos inválidos' },
        { status: 400 }
      )
    }
    console.error('Error updating subscription:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar suscripción' },
      { status: 500 }
    )
  }
}
