import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { updateGroupSchema } from '@/schemas'
import { invalidateCache, CacheKeys } from '@/lib/api-utils'

// GET /api/groups/[id] - Get single group
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
    })

    invalidateCache(CacheKeys.groups())

    return NextResponse.json({
      success: true,
      data: group,
    })
  } catch (error) {
    console.error('Error updating group:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos' },
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

    invalidateCache(CacheKeys.groups())

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
