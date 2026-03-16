import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/auth'

// GET /api/whatsapp/messages - Get WhatsApp messages
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: { status?: string } = {}
    if (status) where.status = status

    const messages = await db.whatsAppMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    // Fetch matched clients separately if needed
    const clientIds = messages
      .filter(m => m.matchedClientId)
      .map(m => m.matchedClientId)
      .filter((id): id is string => id !== null)

    const clients = clientIds.length > 0 
      ? await db.client.findMany({
          where: { id: { in: clientIds } },
          select: { id: true, nombre: true, apellido: true, telefono: true }
        })
      : []

    const clientMap = new Map(clients.map(c => [c.id, c]))

    // Attach client data to messages
    const messagesWithClients = messages.map(m => ({
      ...m,
      client: m.matchedClientId ? clientMap.get(m.matchedClientId) || null : null
    }))

    const total = await db.whatsAppMessage.count({ where })

    return NextResponse.json({
      success: true,
      data: messagesWithClients,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + messagesWithClients.length < total,
      },
    })
  } catch (error) {
    console.error('Error fetching WhatsApp messages:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener mensajes' },
      { status: 500 }
    )
  }
}

// PUT /api/whatsapp/messages - Update message (manual match)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'EMPLEADORA') {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { messageId, clientId, status } = body

    if (!messageId) {
      return NextResponse.json(
        { success: false, error: 'messageId requerido' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (clientId !== undefined) {
      updateData.matchedClientId = clientId
      updateData.matchedBy = 'manual'
    }
    if (status !== undefined) updateData.status = status

    const message = await db.whatsAppMessage.update({
      where: { id: messageId },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      data: message,
      message: 'Mensaje actualizado',
    })
  } catch (error) {
    console.error('Error updating WhatsApp message:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar mensaje' },
      { status: 500 }
    )
  }
}
