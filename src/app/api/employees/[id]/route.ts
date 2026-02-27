import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth-utils'
import { EmployeeRole } from '@prisma/client'

// GET /api/employees/[id] - Get single employee
export async function GET(
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

    // Only EMPLEADORA can view employee details
    if (session.user.role !== 'EMPLEADORA') {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      )
    }

    const { id } = await params

    const employee = await db.user.findUnique({
      where: { id },
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
    })

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Empleado no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: employee,
    })
  } catch (error) {
    console.error('Error fetching employee:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener empleado' },
      { status: 500 }
    )
  }
}

// PUT /api/employees/[id] - Update employee
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

    // Only EMPLEADORA can update employees
    if (session.user.role !== 'EMPLEADORA') {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { name, email, password, employeeRole, hourlyRate, phone, active } = body

    // Check if employee exists
    const existingEmployee = await db.user.findUnique({
      where: { id },
    })

    if (!existingEmployee) {
      return NextResponse.json(
        { success: false, error: 'Empleado no encontrado' },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: any = {}

    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone || null
    if (active !== undefined) updateData.active = active
    if (hourlyRate !== undefined) updateData.hourlyRate = hourlyRate ? parseFloat(hourlyRate) : null
    
    if (employeeRole !== undefined) {
      const validRoles: EmployeeRole[] = ['ADMINISTRATIVO', 'PROFESOR', 'LIMPIEZA']
      if (!validRoles.includes(employeeRole)) {
        return NextResponse.json(
          { success: false, error: 'Rol de empleado inválido' },
          { status: 400 }
        )
      }
      updateData.employeeRole = employeeRole
    }

    if (email !== undefined && email !== existingEmployee.email) {
      // Check if email already exists
      const emailExists = await db.user.findUnique({
        where: { email: email.toLowerCase() },
      })
      if (emailExists) {
        return NextResponse.json(
          { success: false, error: 'Ya existe un usuario con este email' },
          { status: 400 }
        )
      }
      updateData.email = email.toLowerCase()
    }

    if (password) {
      updateData.password = await hashPassword(password)
    }

    // Update employee
    const employee = await db.user.update({
      where: { id },
      data: updateData,
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
    })
  } catch (error) {
    console.error('Error updating employee:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar empleado' },
      { status: 500 }
    )
  }
}

// DELETE /api/employees/[id] - Delete/deactivate employee
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

    // Only EMPLEADORA can delete employees
    if (session.user.role !== 'EMPLEADORA') {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Prevent deleting yourself
    if (id === session.user.id) {
      return NextResponse.json(
        { success: false, error: 'No puedes eliminar tu propia cuenta' },
        { status: 400 }
      )
    }

    // Soft delete (deactivate) instead of hard delete
    const employee = await db.user.update({
      where: { id },
      data: { active: false },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Empleado ${employee.name} desactivado correctamente`,
    })
  } catch (error) {
    console.error('Error deleting employee:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar empleado' },
      { status: 500 }
    )
  }
}
