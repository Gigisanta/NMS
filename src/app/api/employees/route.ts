import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth-utils'
import { Role } from '@prisma/client'

// GET /api/employees - List all employees
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Only EMPLEADORA can view all employees
    if (session.user.role !== 'EMPLEADORA') {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const role = searchParams.get('role')
    const active = searchParams.get('active')

    const where: any = {}
    
    if (role) {
      where.employeeRole = role
    }
    if (active !== null) {
      where.active = active === 'true'
    }

    const employees = await db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        employeeRole: true,
        hourlyRate: true,
        phone: true,
        active: true,
        image: true,
        createdAt: true,
        _count: {
          select: {
            timeEntries: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: employees,
    })
  } catch (error) {
    console.error('Error fetching employees:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener empleados' },
      { status: 500 }
    )
  }
}

// POST /api/employees - Create new employee
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Only EMPLEADORA can create employees
    if (session.user.role !== 'EMPLEADORA') {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, email, password, employeeRole, hourlyRate, phone } = body

    // Validate required fields
    if (!name || !email || !password || !employeeRole) {
      return NextResponse.json(
        { success: false, error: 'Nombre, email, contraseña y rol son requeridos' },
        { status: 400 }
      )
    }


    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un usuario con este email' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create employee
    const employee = await db.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: Role.EMPLEADO,
        employeeRole,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        phone: phone || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        employeeRole: true,
        hourlyRate: true,
        phone: true,
        active: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: employee,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating employee:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear empleado' },
      { status: 500 }
    )
  }
}
