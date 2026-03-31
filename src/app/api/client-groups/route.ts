import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { invalidateCachePattern } from '@/lib/api-utils'

// GET /api/client-groups - Get client group assignments (by clientId or groupId)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const clientId = searchParams.get('clientId')
    const groupId = searchParams.get('groupId')

    const where: { clientId?: string; groupId?: string } = {}
    if (clientId) where.clientId = clientId
    if (groupId) where.groupId = groupId

    const clientGroups = await db.clientGroup.findMany({
      where,
      include: {
        group: {
          select: {
            id: true,
            name: true,
            color: true,
            schedule: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: clientGroups,
    })
  } catch (error) {
    console.error('Error fetching client groups:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener asignaciones de grupos' },
      { status: 500 }
    )
  }
}

// POST /api/client-groups - Create a new client-group assignment
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { clientId, groupId, schedule } = body

    // Validate required fields
    if (!clientId || !groupId) {
      return NextResponse.json(
        { success: false, error: 'clientId y groupId son requeridos' },
        { status: 400 }
      )
    }

    // Check if client exists
    const client = await db.client.findUnique({
      where: { id: clientId },
      select: { id: true },
    })

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    // Check if group exists
    const group = await db.group.findUnique({
      where: { id: groupId },
      select: { id: true },
    })

    if (!group) {
      return NextResponse.json(
        { success: false, error: 'Grupo no encontrado' },
        { status: 404 }
      )
    }

    // Check for duplicate assignment
    const existing = await db.clientGroup.findUnique({
      where: {
        clientId_groupId: {
          clientId,
          groupId,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'El cliente ya pertenece a este grupo' },
        { status: 400 }
      )
    }

    // Create the assignment
    const clientGroup = await db.clientGroup.create({
      data: {
        clientId,
        groupId,
        schedule: schedule || null,
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            color: true,
            schedule: true,
          },
        },
      },
    })

    // Invalidate caches
    invalidateCachePattern('client')
    invalidateCachePattern('groups')

    return NextResponse.json({
      success: true,
      data: clientGroup,
    })
  } catch (error) {
    console.error('Error creating client group:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear asignación de grupo' },
      { status: 500 }
    )
  }
}
