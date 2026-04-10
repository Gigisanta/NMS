import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { updateGroupSchema } from '@/schemas'
import { invalidateGroupsCache, CacheKeys } from '@/lib/api-utils'
import { auth } from '@/auth'

// GET /api/groups/[id] - Get single group
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    const isAdmin = session?.user?.role === 'EMPLEADORA'
    const userColor = session?.user?.groupColor

    const group = await db.group.findUnique({
      where: { id },
      include: {
        _count: {
          select: { clients: true },
        },
      },
    })

    if (!group) {
      return NextResponse.json(
        { success: false, error: 'Grupo no encontrado' },
        { status: 404 }
      )
    }

    // Filtrar por color si no es admin y tiene color asignado
    if (!isAdmin && userColor && group.color !== userColor) {
      return NextResponse.json(
        { success: false, error: 'Grupo no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...group,
        clientCount: group._count.clients,
      },
    })
  } catch (error) {
    console.error('Error fetching group:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener grupo' },
      { status: 500 }
    )
  }
}

// PUT /api/groups/[id] - Update group
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'EMPLEADORA') {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para actualizar grupos' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateGroupSchema.parse(body)

    // If name is being updated, check for duplicates
    if (validatedData.name) {
      const existingGroup = await db.group.findFirst({
        where: {
          name: validatedData.name,
          NOT: { id },
        },
      })

      if (existingGroup) {
        return NextResponse.json(
          { success: false, error: 'Ya existe un grupo con este nombre' },
          { status: 400 }
        )
      }
    }

    const group = await db.group.update({
      where: { id },
      data: validatedData,
      include: {
        _count: {
          select: { clients: true },
        },
      },
    })

    invalidateGroupsCache()

    return NextResponse.json({
      success: true,
      data: {
        ...group,
        clientCount: group._count.clients,
      },
    })
  } catch (error) {
    console.error('Error updating group:', error)
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return NextResponse.json(
        { success: false, error: firstError?.message || 'Datos inválidos' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Error al actualizar grupo' },
      { status: 500 }
    )
  }
}

// DELETE /api/groups/[id] - Delete group (soft delete by setting active=false)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'EMPLEADORA') {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para eliminar grupos' },
        { status: 403 }
      )
    }

    const { id } = await params

    const group = await db.group.findUnique({
      where: { id },
      include: {
        _count: {
          select: { clients: true },
        },
      },
    })

    if (!group) {
      return NextResponse.json(
        { success: false, error: 'Grupo no encontrado' },
        { status: 404 }
      )
    }

    // Soft delete - set active to false
    await db.group.update({
      where: { id },
      data: { active: false },
    })

    invalidateGroupsCache()

    // Remove group from all clients
    await db.client.updateMany({
      where: { grupoId: id },
      data: { grupoId: null },
    })

    return NextResponse.json({
      success: true,
      message: 'Grupo eliminado correctamente',
    })
  } catch (error) {
    console.error('Error deleting group:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar grupo' },
      { status: 500 }
    )
  }
}
