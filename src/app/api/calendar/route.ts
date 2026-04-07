import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

// GET /api/calendar - List events in a date range
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
    const start = searchParams.get('start')
    const end = searchParams.get('end')
    const id = searchParams.get('id')

    if (id) {
        const event = await db.calendarEvent.findUnique({ where: { id } })
        if (!event) {
          return NextResponse.json(
            { success: false, error: 'Evento no encontrado' },
            { status: 404 }
          )
        }
        return NextResponse.json({ success: true, data: event })
    }

    const where: any = {}
    if (start && end) {
      where.start = {
        gte: new Date(start),
        lte: new Date(end),
      }
    }

    const events = await db.calendarEvent.findMany({
      where,
      orderBy: { start: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: events,
    })
  } catch (error) {
    console.error('Error fetching calendar events:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener eventos' },
      { status: 500 }
    )
  }
}

// POST /api/calendar - Create new event
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
    const { title, description, start, end, allDay, color, userId } = body

    if (!title || !start) {
      return NextResponse.json(
        { success: false, error: 'Título y fecha de inicio son requeridos' },
        { status: 400 }
      )
    }

    const event = await db.calendarEvent.create({
      data: {
        title,
        description,
        start: new Date(start),
        end: end ? new Date(end) : null,
        allDay: allDay ?? true,
        color: color || '#3b82f6',
        userId: userId || session.user.id,
      },
    })

    return NextResponse.json({
      success: true,
      data: event,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear evento' },
      { status: 500 }
    )
  }
}

// DELETE /api/calendar - Delete event
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de evento requerido' },
        { status: 400 }
      )
    }

    await db.calendarEvent.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    })
  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar evento' },
      { status: 500 }
    )
  }
}
