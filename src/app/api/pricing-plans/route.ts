import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/auth'

// GET /api/pricing-plans - Get all pricing plans
export async function GET() {
  try {
    const plans = await db.pricingPlan.findMany({
      where: { active: true },
      orderBy: [{ classes: 'asc' }, { price: 'asc' }],
    })

    return NextResponse.json({
      success: true,
      data: plans,
    })
  } catch (error) {
    console.error('Error fetching pricing plans:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener planes de precios' },
      { status: 500 }
    )
  }
}

// POST /api/pricing-plans - Create new pricing plan
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'EMPLEADORA') {
      return NextResponse.json(
        { success: false, error: 'No autorizado - Solo EMPLEADORA' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, classes, price, currency, description, isDefault } = body

    if (!name || !classes || price === undefined) {
      return NextResponse.json(
        { success: false, error: 'Nombre, clases y precio son requeridos' },
        { status: 400 }
      )
    }

    // If this is the default plan, unset other defaults
    if (isDefault) {
      await db.pricingPlan.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      })
    }

    const plan = await db.pricingPlan.create({
      data: {
        name,
        classes: parseInt(classes),
        price: parseFloat(price),
        currency: currency || 'ARS',
        description: description || null,
        isDefault: isDefault || false,
      },
    })

    return NextResponse.json({
      success: true,
      data: plan,
      message: 'Plan creado correctamente',
    })
  } catch (error) {
    console.error('Error creating pricing plan:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear plan' },
      { status: 500 }
    )
  }
}

// PUT /api/pricing-plans - Update pricing plan
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'EMPLEADORA') {
      return NextResponse.json(
        { success: false, error: 'No autorizado - Solo EMPLEADORA' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id, name, classes, price, currency, description, isDefault, active } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de plan requerido' },
        { status: 400 }
      )
    }

    // If this is being set as default, unset other defaults
    if (isDefault) {
      await db.pricingPlan.updateMany({
        where: { isDefault: true, NOT: { id } },
        data: { isDefault: false },
      })
    }

    const plan = await db.pricingPlan.update({
      where: { id },
      data: {
        name,
        classes: classes ? parseInt(classes) : undefined,
        price: price !== undefined ? parseFloat(price) : undefined,
        currency,
        description,
        isDefault,
        active,
      },
    })

    return NextResponse.json({
      success: true,
      data: plan,
      message: 'Plan actualizado correctamente',
    })
  } catch (error) {
    console.error('Error updating pricing plan:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar plan' },
      { status: 500 }
    )
  }
}

// DELETE /api/pricing-plans - Delete pricing plan
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'EMPLEADORA') {
      return NextResponse.json(
        { success: false, error: 'No autorizado - Solo EMPLEADORA' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de plan requerido' },
        { status: 400 }
      )
    }

    // Soft delete by setting active to false
    await db.pricingPlan.update({
      where: { id },
      data: { active: false },
    })

    return NextResponse.json({
      success: true,
      message: 'Plan eliminado correctamente',
    })
  } catch (error) {
    console.error('Error deleting pricing plan:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar plan' },
      { status: 500 }
    )
  }
}
