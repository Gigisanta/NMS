import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

// GET /api/time-entries - Get time entries
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const active = searchParams.get('active')
    const userId = searchParams.get('userId')
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const summary = searchParams.get('summary') === 'true'

    // Optimization: Summary mode for the TimeClockWidget
    if (summary) {
      // For summary mode, we ALWAYS need a specific user (defaults to current session user)
      const targetUserId = (session.user.role === 'EMPLEADORA' && userId)
        ? userId
        : session.user.id

      const now = new Date()
      const currentMonth = now.getMonth() + 1
      const currentYear = now.getFullYear()
      const todayStart = new Date(now)
      todayStart.setHours(0, 0, 0, 0)

      const monthStart = new Date(currentYear, currentMonth - 1, 1)
      const monthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59)

      // Fetch active entry and current month entries in parallel
      const [activeEntry, monthEntries] = await Promise.all([
        db.timeEntry.findFirst({
          where: { userId: targetUserId, clockOut: null },
          orderBy: { clockIn: 'desc' }
        }),
        db.timeEntry.findMany({
          where: {
            userId: targetUserId,
            clockIn: { gte: monthStart, lte: monthEnd }
          },
          orderBy: { clockIn: 'desc' }
        })
      ])

      // Calculate stats from month entries
      let monthHours = 0
      let todayHours = 0
      const todayEntries = []

      for (const entry of monthEntries) {
        const isTodayEntry = entry.clockIn >= todayStart
        if (isTodayEntry) todayEntries.push(entry)

        if (entry.clockOut) {
          const hours = (entry.clockOut.getTime() - entry.clockIn.getTime()) / (1000 * 60 * 60)
          monthHours += hours
          if (isTodayEntry) todayHours += hours
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          activeEntry,
          todayEntries,
          todayHours: Math.round(todayHours * 100) / 100,
          monthHours: Math.round(monthHours * 100) / 100,
        }
      })
    }

    // Standard list mode
    const where: any = {}

    // EMPLEADORA can see all entries, EMPLEADO only their own
    if (session.user.role === 'EMPLEADORA' && userId) {
      where.userId = userId
    } else if (session.user.role !== 'EMPLEADORA') {
      where.userId = session.user.id
    }

    // Filter by active (currently working - no clock out)
    if (active === 'true') {
      where.clockOut = null
    }

    // Filter by specific month/year if provided
    if (month && year) {
      const m = parseInt(month)
      const y = parseInt(year)
      const startDate = new Date(y, m - 1, 1)
      const endDate = new Date(y, m, 0, 23, 59, 59)
      
      where.clockIn = {
        gte: startDate,
        lte: endDate,
      }
    }

    const entries = await db.timeEntry.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeRole: true,
            image: true,
          },
        },
      },
      orderBy: { clockIn: 'desc' },
      take: 100,
    })

    // Calculate total hours for the period
    let totalHours = 0
    entries.forEach((entry) => {
      if (entry.clockOut) {
        const hours = (entry.clockOut.getTime() - entry.clockIn.getTime()) / (1000 * 60 * 60)
        totalHours += hours
      }
    })

    return NextResponse.json({
      success: true,
      data: entries,
      stats: {
        totalEntries: entries.length,
        totalHours: Math.round(totalHours * 100) / 100,
        currentlyWorking: entries.filter((e) => !e.clockOut).length,
      },
    })
  } catch (error) {
    console.error('Error fetching time entries:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener fichajes' },
      { status: 500 }
    )
  }
}

// POST /api/time-entries - Clock in or out
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
    const { action, notes } = body

    if (action === 'clock-in') {
      // Check if user already has an active entry
      const activeEntry = await db.timeEntry.findFirst({
        where: {
          userId: session.user.id,
          clockOut: null,
        },
      })

      if (activeEntry) {
        return NextResponse.json(
          { success: false, error: 'Ya tienes un fichaje activo. Debes fichar salida primero.' },
          { status: 400 }
        )
      }

      // Create new time entry
      const entry = await db.timeEntry.create({
        data: {
          userId: session.user.id,
          clockIn: new Date(),
          notes: notes || null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              employeeRole: true,
            },
          },
        },
      })

      return NextResponse.json({
        success: true,
        data: entry,
        message: `Fichaje de entrada registrado a las ${new Date().toLocaleTimeString('es-AR')}`,
      })
    }

    if (action === 'clock-out') {
      // Find active entry
      const activeEntry = await db.timeEntry.findFirst({
        where: {
          userId: session.user.id,
          clockOut: null,
        },
      })

      if (!activeEntry) {
        return NextResponse.json(
          { success: false, error: 'No tienes un fichaje activo para cerrar.' },
          { status: 400 }
        )
      }

      // Update entry with clock out time
      const entry = await db.timeEntry.update({
        where: { id: activeEntry.id },
        data: {
          clockOut: new Date(),
          notes: notes || activeEntry.notes,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              employeeRole: true,
            },
          },
        },
      })

      // Calculate hours worked
      const hours = (entry.clockOut!.getTime() - entry.clockIn.getTime()) / (1000 * 60 * 60)
      const hoursFormatted = Math.round(hours * 100) / 100

      return NextResponse.json({
        success: true,
        data: entry,
        message: `Fichaje de salida registrado. Horas trabajadas: ${hoursFormatted.toFixed(2)}h`,
      })
    }

    return NextResponse.json(
      { success: false, error: 'Acción inválida. Use clock-in o clock-out.' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error managing time entry:', error)
    return NextResponse.json(
      { success: false, error: 'Error al gestionar fichaje' },
      { status: 500 }
    )
  }
}

// PUT /api/time-entries - Update time entry (admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Only EMPLEADORA can update entries
    if (session.user.role !== 'EMPLEADORA') {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id, clockIn, clockOut, notes } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de fichaje requerido' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (clockIn) updateData.clockIn = new Date(clockIn)
    if (clockOut) updateData.clockOut = new Date(clockOut)
    if (notes !== undefined) updateData.notes = notes

    const entry = await db.timeEntry.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            employeeRole: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: entry,
    })
  } catch (error) {
    console.error('Error updating time entry:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar fichaje' },
      { status: 500 }
    )
  }
}

// DELETE /api/time-entries - Delete time entry (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Only EMPLEADORA can delete entries
    if (session.user.role !== 'EMPLEADORA') {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de fichaje requerido' },
        { status: 400 }
      )
    }

    await db.timeEntry.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Fichaje eliminado correctamente',
    })
  } catch (error) {
    console.error('Error deleting time entry:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar fichaje' },
      { status: 500 }
    )
  }
}
