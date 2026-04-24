import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentMonth, getCurrentYear } from '@/lib/utils'
import { invalidateCache, invalidateCachePattern, invalidateClientCache } from '@/lib/api-utils'
import { createClientSchema } from '@/schemas/client'
import { ratelimit } from '@/lib/rate-limit'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

// GET /api/clients - List all clients with pagination and filters
// NOTE: In-memory cache removed - it doesn't work in serverless (Vercel) environments
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const isAdmin = session?.user?.role === 'EMPLEADORA'
    const userColor = session?.user?.groupColor

    const searchParams = request.nextUrl.searchParams
    const search = String(searchParams.get('search') || '')
    const grupoId = String(searchParams.get('grupoId') || '')
    const withSubscription = searchParams.get('withSubscription') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50) // Cap at 50
    const skip = (page - 1) * limit

    console.log(`[API CLIENTS] search: "${search}", grupoId: "${grupoId}", withSub: ${withSubscription}, page: ${page}`);

    const currentMonth = getCurrentMonth()
    const currentYear = getCurrentYear()

    // Build where clause safely
    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { apellido: { contains: search, mode: 'insensitive' } },
        { telefono: { contains: search, mode: 'insensitive' } },
        { dni: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (grupoId && grupoId !== '' && grupoId !== 'null' && grupoId !== 'undefined') {
      where.grupoId = grupoId
    }

    // Filter by group color for non-admin users
    // Admin sees all clients, employees only see clients in their group's color
    if (!isAdmin && userColor) {
      where.grupo = {
        color: userColor
      }
    }

    console.log(`[API CLIENTS] Query where:`, JSON.stringify(where));

    // Run count and findMany in parallel
    const [total, clients] = await Promise.all([
      db.client.count({ where }),
      db.client.findMany({
        where,
        select: {
          id: true,
          nombre: true,
          apellido: true,
          dni: true,
          telefono: true,
          grupoId: true,
          preferredDays: true,
          preferredTime: true,
          notes: true,
          monthlyAmount: true,
          registrationFeePaid1: true,
          registrationFeePaid2: true,
          createdAt: true,
          updatedAt: true,
          updatedByUser: {
            select: { name: true },
          },
          grupo: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
          // Only include subscription if requested
          ...(withSubscription && {
            subscriptions: {
              where: {
                month: currentMonth,
                year: currentYear,
              },
              select: {
                id: true,
                status: true,
                classesUsed: true,
                classesTotal: true,
                amount: true,
              },
              take: 1,
            },
          }),
        },
        orderBy: [
          { apellido: 'asc' },
          { nombre: 'asc' }
        ],
        skip,
        take: limit,
      }),
    ])

    // Transform data to include current subscription status
    const clientsWithStatus = clients.map((client) => {
      const subscriptions = (client as { subscriptions?: { status: string; classesUsed: number; classesTotal: number }[] }).subscriptions || []
      const currentSub = subscriptions[0]

      return {
        id: client.id,
        nombre: client.nombre,
        apellido: client.apellido,
        dni: client.dni,
        telefono: client.telefono,
        grupoId: client.grupoId,
        grupo: client.grupo,
        preferredDays: client.preferredDays,
        preferredTime: client.preferredTime,
        notes: client.notes,
        monthlyAmount: client.monthlyAmount,
        registrationFeePaid1: client.registrationFeePaid1,
        registrationFeePaid2: client.registrationFeePaid2,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
        updatedByUser: client.updatedByUser,
        currentSubscription: currentSub || null,
      }
    })

    const data = {
      clients: clientsWithStatus,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }

    return NextResponse.json({
      success: true,
      data: data.clients,
      pagination: data.pagination,
    })
  } catch (error) {
    console.error('Error fetching clients:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Error stack:', errorStack)
    return NextResponse.json(
      { success: false, error: `Error al obtener clientes: ${errorMessage}` },
      { status: 500 }
    )
  }
}

// POST /api/clients - Create new client
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'anonymous'
    const { success } = await ratelimit.limit(ip)
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Demasiadas solicitudes, intenta más tarde' },
        { status: 429 }
      )
    }

    const body = await request.json()

    // Validate request body with Zod schema
    const parsed = createClientSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const {
      nombre,
      apellido,
      dni,
      telefono: telefonoWithFormat,
      grupoId,
      preferredDays,
      preferredTime,
      notes,
      classesTotal = 4,
      monthlyAmount,
      billingPeriod = 'FULL',
      registrationFeePaid1 = false,
      registrationFeePaid2 = false,
    } = parsed.data

    // Clean phone number - remove spaces and dashes (only if provided)
    // NOTE: Multiple clients CAN have the same phone number - no duplicate check
    const telefono = telefonoWithFormat ? telefonoWithFormat.replace(/[\s\-]/g, '') : null

    // Create client with subscription in a transaction
    const currentMonth = getCurrentMonth()
    const currentYear = getCurrentYear()

    const client = await db.$transaction(async (tx) => {
      // Create client
      const newClient = await tx.client.create({
        data: {
          nombre,
          apellido,
          dni: dni || null,
          telefono,
          grupoId: grupoId || null,
          preferredDays: preferredDays || null,
          preferredTime: preferredTime || null,
          notes: notes || null,
          monthlyAmount: monthlyAmount || null,
          registrationFeePaid1,
          registrationFeePaid2,
        },
        select: {
          id: true,
          nombre: true,
          apellido: true,
          dni: true,
          telefono: true,
          grupoId: true,
          preferredDays: true,
          preferredTime: true,
          notes: true,
          monthlyAmount: true,
          registrationFeePaid1: true,
          registrationFeePaid2: true,
          createdAt: true,
              grupo: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      })

      // Create initial subscription
      await tx.subscription.create({
        data: {
          clientId: newClient.id,
          month: currentMonth,
          year: currentYear,
          status: 'PENDIENTE',
          billingPeriod: billingPeriod,
          classesTotal: classesTotal,
          classesUsed: 0,
          amount: monthlyAmount || null,
        },
      })

      return newClient
    })

    // Invalidate ALL client and group related caches
    invalidateClientCache()
    invalidateCache('groups:all')

    return NextResponse.json({
      success: true,
      data: client,
    })
  } catch (error) {
    console.error('Error creating client:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear cliente' },
      { status: 500 }
    )
  }
}
