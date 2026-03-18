import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

// DELETE /api/expenses/[id] - Remove an expense
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'EMPLEADORA') {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      )
    }

    const { id } = await params

    await db.$executeRawUnsafe(
      `DELETE FROM "expenses" WHERE id = $1`,
      id
    )

    return NextResponse.json({
      success: true,
      message: 'Gasto eliminado exitosamente'
    })
  } catch (error) {
    console.error('Error deleting expense:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar el gasto' },
      { status: 500 }
    )
  }
}

// PUT /api/expenses/[id] - Update an expense
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'EMPLEADORA') {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { 
      description, 
      amount, 
      category, 
      date, 
      month, 
      year, 
      userId, 
      supplier, 
      notes 
    } = body

    await db.$executeRawUnsafe(
      `UPDATE "expenses" SET 
        "description" = $1, 
        "amount" = $2, 
        "category" = $3, 
        "date" = $4, 
        "month" = $5, 
        "year" = $6, 
        "userId" = $7, 
        "supplier" = $8, 
        "notes" = $9,
        "updatedAt" = NOW()
       WHERE id = $10`,
      description,
      amount ? parseFloat(amount.toString()) : 0,
      category,
      date ? new Date(date) : new Date(),
      month ? parseInt(month.toString()) : (new Date().getMonth() + 1),
      year ? parseInt(year.toString()) : new Date().getFullYear(),
      userId || null,
      supplier || null,
      notes || null,
      id
    )

    return NextResponse.json({
      success: true,
      data: { message: 'Gasto actualizado correctamente (Raw Update)' }
    })

  } catch (error) {
    console.error('Error updating expense:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar el gasto' },
      { status: 500 }
    )
  }
}
