import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { invalidateCachePattern, invalidateClientCache } from '@/lib/api-utils'

// PUT /api/subscriptions/[id] - Update subscription
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, classesTotal, classesUsed, amount, paymentMethod, isBilled } = body

    const updateData: any = {}

    if (status) updateData.status = status
    if (typeof classesTotal === 'number') updateData.classesTotal = classesTotal
    if (typeof classesUsed === 'number') updateData.classesUsed = classesUsed
    if (typeof amount === 'number' || amount === null) updateData.amount = amount
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod
    if (typeof isBilled === 'boolean') updateData.isBilled = isBilled

    const subscription = await db.subscription.update({
      where: { id },
      data: updateData,
    })

    // BOLT: Invalidate clients and dashboard cache when subscription changes
    invalidateClientCache()
    invalidateCachePattern('dashboard')

    return NextResponse.json({
      success: true,
      data: subscription,
    })
  } catch (error) {
    console.error('Error updating subscription:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar suscripción' },
      { status: 500 }
    )
  }
}
