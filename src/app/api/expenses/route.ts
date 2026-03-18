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

    const searchParams = request.nextUrl.searchParams
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

    // Parche de emergencia: usamos $queryRaw ante el error de generación del cliente de Prisma
    let query = `SELECT e.*, u.name as "employeeName" FROM "expenses" e LEFT JOIN "User" u ON e."userId" = u.id`
    const conditions: string[] = []
    const values: any[] = []

    if (month) {
      conditions.push(`e.month = $${values.length + 1}`)
      values.push(parseInt(month))
    }
    if (year) {
      conditions.push(`e.year = $${values.length + 1}`)
      values.push(parseInt(year))
    }
    if (category) {
      conditions.push(`e.category = $${values.length + 1}`)
      values.push(category)
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ')
    }
    query += ` ORDER BY e.date DESC`

    const expenses = await db.$queryRawUnsafe(query, ...values)


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
      notes 
    } = body

    if (!description || !amount || !category) {
      return NextResponse.json(
        { success: false, error: 'Descripción, monto y categoría son requeridos' },
        { status: 400 }
      )
    }

    const m = month ? parseInt(month.toString()) : (new Date().getMonth() + 1)
    const y = year ? parseInt(year.toString()) : new Date().getFullYear()

    // Usamos $executeRaw como parche de emergencia ante el error de generación del cliente de Prisma en Windows
    const result_raw = await db.$executeRawUnsafe(
      `INSERT INTO "expenses" ("id", "description", "amount", "category", "date", "month", "year", "userId", "supplier", "notes", "updatedAt") 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
      `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      description,
      parseFloat(amount),
      category,
      date ? new Date(date) : new Date(),
      m,
      y,
      userId || null,
      supplier || null,
      notes || null
    )

    return NextResponse.json({
      success: true,
      data: { message: 'Gasto registrado correctamente (Raw Insert)' },
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear el gasto' },
      { status: 500 }
    )
  }
}
