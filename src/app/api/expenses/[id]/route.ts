import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

// DELETE /api/expenses/[id] - Remove an expense
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
  { params }: { params: Promise<{ id: string }> }
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

    const expense = await db.expense.update({
      where: { id },
      data: {
        description,
        amount: amount ? parseFloat(amount.toString()) : 0,
        category,
        date: date ? new Date(date) : new Date(),
        month: month ? parseInt(month.toString()) : (new Date().getMonth() + 1),
        year: year ? parseInt(year.toString()) : new Date().getFullYear(),
        userId: userId || null,
        supplier: supplier || null,
        notes: notes || null,
      },
    })

    return NextResponse.json({
      success: true,
      data: { message: 'Gasto actualizado correctamente' }
    })

  } catch (error) {
    console.error('Error updating expense:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar el gasto' },
      { status: 500 }
    )
  }
}
