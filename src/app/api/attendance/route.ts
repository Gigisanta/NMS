import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cachedFetch, CacheKeys, invalidateCachePattern, invalidateClientCache } from '@/lib/api-utils'

// GET /api/attendance - Get attendance records
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const today = searchParams.get('today') === 'true'
    const clientId = searchParams.get('clientId')

    if (today) {
      // Get today's attendance with cache
      const attendance = await cachedFetch(
        CacheKeys.attendanceToday(),
        async () => {
          const now = new Date()
          // BOLT OPTIMIZATION: Avoid mutating the 'now' date object to prevent side effects
          const startOfDay = new Date(now)
          startOfDay.setHours(0, 0, 0, 0)
          const endOfDay = new Date(now)
          endOfDay.setHours(23, 59, 59, 999)

          return db.attendance.findMany({
            where: {
              date: {
                gte: startOfDay,
                lt: endOfDay,
              },
            },
            select: {
              id: true,
              clientId: true,
              date: true,
              client: {
                select: {
                  nombre: true,
                  apellido: true,
                  grupo: {
                    select: {
                      id: true,
                      name: true,
                      color: true,
                    },
                  },
                },
              },
            },
            orderBy: { date: 'desc' },
          })
        },
        30 * 1000 // 30 seconds cache for today's attendance
      )

      return NextResponse.json({
        success: true,
        data: attendance,
      })
    }

    if (clientId) {
      const attendance = await db.attendance.findMany({
        where: { clientId },
        select: {
          id: true,
          date: true,
        },
        orderBy: { date: 'desc' },
        take: 30,
      })

      return NextResponse.json({
        success: true,
        data: attendance,
      })
    }

    // Get all attendance (last 100)
    const attendance = await db.attendance.findMany({
      select: {
        id: true,
        clientId: true,
        date: true,
        client: {
          select: {
            nombre: true,
            apellido: true,
            grupo: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
      take: 100,
    })

    return NextResponse.json({
      success: true,
      data: attendance,
    })
  } catch (error) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener asistencias' },
      { status: 500 }
    )
  }
}

// POST /api/attendance - Register attendance
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientId } = body

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'clientId es requerido' },
        { status: 400 }
      )
    }

    // Get client with current subscription in a single query
    const client = await db.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        telefono: true,
        grupo: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        subscriptions: {
          where: {
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
          },
          select: {
            id: true,
            status: true,
            classesUsed: true,
            classesTotal: true,
          },
          take: 1,
        },
      },
    })

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    const currentSub = client.subscriptions[0]

    if (!currentSub) {
      return NextResponse.json(
        { success: false, error: 'El cliente no tiene una suscripción activa' },
        { status: 400 }
      )
    }

    if (currentSub.classesUsed >= currentSub.classesTotal) {
      return NextResponse.json(
        { success: false, error: 'El cliente ha alcanzado el límite de clases' },
        { status: 400 }
      )
    }

    // Create attendance and update subscription in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create attendance record
      const attendance = await tx.attendance.create({
        data: {
          clientId,
        },
        select: {
          id: true,
          date: true,
        },
      })

      // Update subscription
      await tx.subscription.update({
        where: { id: currentSub.id },
        data: {
          classesUsed: currentSub.classesUsed + 1,
        },
      })

      return attendance
    })

    // Invalidate caches
    invalidateCachePattern('attendance')
    invalidateCachePattern('dashboard')
    invalidateClientCache()

    return NextResponse.json({
      success: true,
      data: {
        attendance: result,
        client: {
          nombre: client.nombre,
          apellido: client.apellido,
        },
      },
    })
  } catch (error) {
    console.error('Error registering attendance:', error)
    return NextResponse.json(
      { success: false, error: 'Error al registrar asistencia' },
      { status: 500 }
    )
  }
}

// DELETE /api/attendance - Remove attendance
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const attendanceId = searchParams.get('id')

    if (!attendanceId) {
      return NextResponse.json(
        { success: false, error: 'ID de asistencia es requerido' },
        { status: 400 }
      )
    }

    // Get attendance record first to find the client and subscription
    const attendanceRecord = await db.attendance.findUnique({
      where: { id: attendanceId },
      select: {
        clientId: true,
        date: true,
      },
    })

    if (!attendanceRecord) {
      return NextResponse.json(
        { success: false, error: 'Asistencia no encontrada' },
        { status: 404 }
      )
    }

    // Find the subscription for the month of the attendance
    const attendanceDate = new Date(attendanceRecord.date)
    const subscription = await db.subscription.findFirst({
      where: {
        clientId: attendanceRecord.clientId,
        month: attendanceDate.getMonth() + 1,
        year: attendanceDate.getFullYear(),
      },
      select: {
        id: true,
        classesUsed: true,
      },
    })

    // Delete attendance and decrement classesUsed in a transaction
    await db.$transaction(async (tx) => {
      await tx.attendance.delete({
        where: { id: attendanceId },
      })

      if (subscription && subscription.classesUsed > 0) {
        await tx.subscription.update({
          where: { id: subscription.id },
          data: {
            classesUsed: subscription.classesUsed - 1,
          },
        })
      }
    })

    // Invalidate caches
    invalidateCachePattern('attendance')
    invalidateCachePattern('dashboard')
    invalidateClientCache()

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    })
  } catch (error) {
    console.error('Error removing attendance:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar asistencia' },
      { status: 500 }
    )
  }
}
