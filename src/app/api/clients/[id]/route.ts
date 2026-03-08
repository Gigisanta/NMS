import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cachedFetch, CacheKeys, invalidateClientCache } from '@/lib/api-utils'

// GET /api/clients/[id] - Get single client with all details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const client = await cachedFetch(
      CacheKeys.client(id),
      async () => {
        return db.client.findUnique({
          where: { id },
          include: {
            grupo: true,
            subscriptions: {
              orderBy: [{ year: 'desc' }, { month: 'desc' }],
              take: 12,
            },
            invoices: {
              orderBy: { uploadedAt: 'desc' },
              take: 10,
            },
            attendances: {
              orderBy: { date: 'desc' },
              take: 20,
            },
          },
        })
      },
      60 * 1000 // 1 minute cache
    )

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: client,
    })
  } catch (error) {
    console.error('Error fetching client:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener cliente' },
      { status: 500 }
    )
  }
}

// PUT /api/clients/[id] - Update client
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // Extract all possible fields
    const {
      nombre,
      apellido,
      dni,
      telefono,
      grupoId,
      preferredDays,
      preferredTime,
      notes,
    } = body

    // If telefono is being updated, check for duplicates
    if (telefono) {
      const existingClient = await db.client.findFirst({
        where: {
          telefono,
          NOT: { id },
        },
      })

      if (existingClient) {
        return NextResponse.json(
          { success: false, error: 'Ya existe un cliente con este teléfono' },
          { status: 400 }
        )
      }
    }

    // Build update data
    const updateData: {
      nombre?: string
      apellido?: string
      dni?: string | null
      telefono?: string
      grupoId?: string | null
      preferredDays?: string | null
      preferredTime?: string | null
      notes?: string | null
    } = {}

    if (nombre !== undefined) updateData.nombre = nombre
    if (apellido !== undefined) updateData.apellido = apellido
    if (dni !== undefined) updateData.dni = dni || null
    if (telefono !== undefined) updateData.telefono = telefono
    if (grupoId !== undefined) updateData.grupoId = grupoId || null
    if (preferredDays !== undefined) updateData.preferredDays = preferredDays || null
    if (preferredTime !== undefined) updateData.preferredTime = preferredTime || null
    if (notes !== undefined) updateData.notes = notes || null

    const client = await db.client.update({
      where: { id },
      data: updateData,
      include: {
        grupo: true,
      },
    })

    invalidateClientCache()

    return NextResponse.json({
      success: true,
      data: client,
    })
  } catch (error) {
    console.error('Error updating client:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar cliente' },
      { status: 500 }
    )
  }
}

// DELETE /api/clients/[id] - Delete client
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if client exists
    const client = await db.client.findUnique({
      where: { id },
    })

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    // Delete client (cascade will delete related records)
    await db.client.delete({
      where: { id },
    })

    invalidateClientCache()

    return NextResponse.json({
      success: true,
      message: 'Cliente eliminado correctamente',
    })
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar cliente' },
      { status: 500 }
    )
  }
}
