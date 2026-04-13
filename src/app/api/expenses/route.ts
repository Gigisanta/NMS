import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

// GET /api/expenses - List all expenses with filters
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Only EMPLEADORA can view expenses (financial data)
    if (session.user.role !== 'EMPLEADORA') {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      )
    }

    const searchParams = await request.nextUrl.searchParams
    const category = searchParams.get('category')
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const supplier = searchParams.get('supplier')

    const where: any = {}

    if (category) {
      where.category = category
    }
    if (month) {
      where.month = parseInt(month)
    }
    if (year) {
      where.year = parseInt(year)
    }
    if (supplier) {
      where.supplier = { contains: supplier, mode: 'insensitive' }
    }

    const expenses = await db.expense.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        user: {
          select: { name: true }
        },
        receipt: true,
      }
    })

    return NextResponse.json({
      success: true,
      data: expenses,
    })
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener gastos' },
      { status: 500 }
    )
  }
}

// POST /api/expenses - Create new expense
export async function POST(request: NextRequest) {
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
      notes,
      receiptId,
      receiptStatus,
    } = body

    if (!description || !amount || !category) {
      return NextResponse.json(
        { success: false, error: 'Descripción, monto y categoría son requeridos' },
        { status: 400 }
      )
    }

    const m = month ? parseInt(month.toString()) : (new Date().getMonth() + 1)
    const y = year ? parseInt(year.toString()) : new Date().getFullYear()

    // Validar que category sea un valor válido del enum
    const validCategories = ['FIJO', 'VARIABLE', 'SUELDO', 'PROVEEDOR', 'OTROS']
    const normalizedCategory = validCategories.includes(category) ? category : 'OTROS'

    const expense = await db.expense.create({
      data: {
        description,
        amount: parseFloat(amount),
        category: normalizedCategory,
        date: date ? new Date(date) : new Date(),
        month: m,
        year: y,
        userId: userId || null,
        supplier: supplier || null,
        notes: notes || null,
        receiptId: receiptId || null,
        receiptStatus: receiptStatus || 'PENDING',
      },
    })

    return NextResponse.json({
      success: true,
      data: expense,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating expense:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { success: false, error: 'Error al crear el gasto', details: errorMessage },
      { status: 500 }
    )
  }
}

// PATCH /api/expenses - Update expense receipt status
export async function PATCH(request: NextRequest) {
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

    const body = await request.json()
    const { id, receiptId, receiptStatus } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de gasto requerido' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (receiptId !== undefined) updateData.receiptId = receiptId
    if (receiptStatus !== undefined) updateData.receiptStatus = receiptStatus

    const expense = await db.expense.update({
      where: { id },
      data: updateData,
      include: { receipt: true },
    })

    return NextResponse.json({ success: true, data: expense })
  } catch (error) {
    console.error('Error updating expense:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar el gasto' },
      { status: 500 }
    )
  }
}
