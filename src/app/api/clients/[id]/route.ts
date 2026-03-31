import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { cachedFetch, CacheKeys, invalidateCachePattern } from '@/lib/api-utils'
import { updateClientSchema } from '@/schemas/client'
import { getCurrentMonth, getCurrentYear } from '@/lib/utils'

// GET /api/clients/[id] - Get single client with all details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Use cached fetch for high-traffic detail route (60s cache)
    const client = await cachedFetch(
      CacheKeys.client(id),
      async () => {
        return db.client.findUnique({
          where: { id },
          include: {
            grupo: true,
            clientGroups: {
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
            },
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
    const session = await auth()
    if (!session) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()

    // Validate request body with Zod schema
    const parsed = updateClientSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // Extract all possible fields
    const {
      nombre,
      apellido,
      dni,
      telefono: telefonoWithFormat,
      grupoId,
      preferredDays,
      preferredTime,
      notes,
      monthlyAmount,
      registrationFeePaid1,
      registrationFeePaid2,
    } = parsed.data

    // Clean phone number - remove spaces and dashes
    const telefono = telefonoWithFormat ? telefonoWithFormat.replace(/[\s\-]/g, '') : undefined

    // Get current client phone to check if phone is actually being changed
    const currentClient = await db.client.findUnique({
      where: { id },
      select: { telefono: true },
    })

    // Only check for duplicates if phone is actually being changed to a different value
    if (telefono && telefono !== currentClient?.telefono) {
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
      telefono?: string | null
      grupoId?: string | null
      preferredDays?: string | null
      preferredTime?: string | null
      notes?: string | null
      monthlyAmount?: Prisma.Decimal | null
      registrationFeePaid1?: boolean
      registrationFeePaid2?: boolean
      updatedByUserId?: string
    } = {}

    if (nombre !== undefined) updateData.nombre = nombre
    if (apellido !== undefined) updateData.apellido = apellido
    if (dni !== undefined) updateData.dni = dni || null
    if (telefono !== undefined) updateData.telefono = telefono
    if (grupoId !== undefined) updateData.grupoId = grupoId || null
    if (preferredDays !== undefined) updateData.preferredDays = preferredDays || null
    if (preferredTime !== undefined) updateData.preferredTime = preferredTime || null
    if (notes !== undefined) updateData.notes = notes || null
    if (monthlyAmount !== undefined) updateData.monthlyAmount = monthlyAmount ? new Prisma.Decimal(monthlyAmount) : null
    if (registrationFeePaid1 !== undefined) updateData.registrationFeePaid1 = registrationFeePaid1
    if (registrationFeePaid2 !== undefined) updateData.registrationFeePaid2 = registrationFeePaid2
    updateData.updatedByUserId = session.user.id

    const client = await db.client.update({
      where: { id },
      data: updateData as Parameters<typeof db.client.update>[0]['data'],
      include: {
        grupo: true,
        updatedByUser: { select: { name: true } },
      },
    })

    // Update active subscription if monthlyAmount or classesTotal changed
    if (monthlyAmount !== undefined || body.classesTotal !== undefined) {
      const currentMonth = getCurrentMonth()
      const currentYear = getCurrentYear()

      const updateData: Record<string, number | null> = {}
      if (monthlyAmount !== undefined) {
        updateData.amount = monthlyAmount ?? 0
      }
      if (body.classesTotal !== undefined) {
        updateData.classesTotal = body.classesTotal
      }

      await db.subscription.updateMany({
        where: {
          clientId: id,
          month: currentMonth,
          year: currentYear,
        },
        data: updateData,
      })
    }

    // Invalidate caches
    invalidateCachePattern('client')
    invalidateCachePattern('dashboard')

    return NextResponse.json({
      success: true,
      data: client,
    })
  } catch (error) {
    console.error('Error updating client:', error)
    // Check for Prisma unique constraint error (P2002)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Ya existe un cliente con este teléfono' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Error al actualizar cliente' },
      { status: 500 }
    )
  }
}

// PATCH /api/clients/[id] - Partial update client
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()

    // Validate request body with Zod schema
    const parsed = updateClientSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // Build update data to prevent mass assignment
    const updateData: {
      nombre?: string
      apellido?: string
      dni?: string | null
      telefono?: string | null
      grupoId?: string | null
      preferredDays?: string | null
      preferredTime?: string | null
      notes?: string | null
      monthlyAmount?: Prisma.Decimal | null
      registrationFeePaid1?: boolean
      registrationFeePaid2?: boolean
      updatedByUserId?: string
    } = {}

    if (parsed.data.nombre !== undefined) updateData.nombre = parsed.data.nombre
    if (parsed.data.apellido !== undefined) updateData.apellido = parsed.data.apellido
    if (parsed.data.dni !== undefined) updateData.dni = parsed.data.dni
    if (parsed.data.telefono !== undefined) {
      updateData.telefono = parsed.data.telefono ? parsed.data.telefono.replace(/[\s\-]/g, '') : null
    }
    if (parsed.data.grupoId !== undefined) updateData.grupoId = parsed.data.grupoId
    if (parsed.data.preferredDays !== undefined) updateData.preferredDays = parsed.data.preferredDays
    if (parsed.data.preferredTime !== undefined) updateData.preferredTime = parsed.data.preferredTime
    if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes
    if (parsed.data.monthlyAmount !== undefined) updateData.monthlyAmount = parsed.data.monthlyAmount ? new Prisma.Decimal(parsed.data.monthlyAmount) : null
    if (parsed.data.registrationFeePaid1 !== undefined) updateData.registrationFeePaid1 = parsed.data.registrationFeePaid1
    if (parsed.data.registrationFeePaid2 !== undefined) updateData.registrationFeePaid2 = parsed.data.registrationFeePaid2
    updateData.updatedByUserId = session.user.id

    // Get current client phone to check if phone is actually being changed
    const currentClient = await db.client.findUnique({
      where: { id },
      select: { telefono: true },
    })

    // Only check for duplicates if phone is being changed to a non-null value
    if (updateData.telefono && updateData.telefono !== currentClient?.telefono) {
      const existingClient = await db.client.findFirst({
        where: {
          telefono: updateData.telefono,
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

    const client = await db.client.update({
      where: { id },
      data: updateData as Parameters<typeof db.client.update>[0]['data'],
      include: {
        grupo: true,
        updatedByUser: { select: { name: true } },
      },
    })

    // Invalidate caches
    invalidateCachePattern('client')
    invalidateCachePattern('dashboard')

    return NextResponse.json({
      success: true,
      data: client,
    })
  } catch (error) {
    console.error('Error partially updating client:', error)
    // Check for Prisma unique constraint error (P2002)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Ya existe un cliente con este teléfono' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Error al actualizar parcialmente el cliente' },
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

    // Auth check
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

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

    // Invalidate caches
    invalidateCachePattern('client')
    invalidateCachePattern('dashboard')

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
