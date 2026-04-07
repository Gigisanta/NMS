import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentMonth, getCurrentYear } from '@/lib/utils'
import { cachedFetch, CacheKeys, invalidateCachePattern, invalidateGroupsCache } from '@/lib/api-utils'
import { createClientSchema } from '@/schemas/client'
import { ratelimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

// GET /api/clients - List all clients with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = String(searchParams.get('search') || '')
    const grupoId = String(searchParams.get('grupoId') || '')
    const withSubscription = searchParams.get('withSubscription') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50) // Cap at 50
    const skip = (page - 1) * limit

    console.log(`[API CLIENTS] search: "${search}", grupoId: "${grupoId}", withSub: ${withSubscription}, page: ${page}`);


    const params = {
      search,
      grupoId,
      withSubscription: String(withSubscription),
      page: String(page),
      limit: String(limit)
    }

    // Use cached fetch for high-traffic list route (30s cache)
    const data = await cachedFetch(
      CacheKeys.clients(params),
      async () => {
        const currentMonth = getCurrentMonth()
        const currentYear = getCurrentYear()

        // Build where clause safely
        const where: any = {}
        
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

        return {
          clients: clientsWithStatus,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        }
      },
      30 * 1000 // 30 seconds cache
    )

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
    const telefono = telefonoWithFormat ? telefonoWithFormat.replace(/[\s\-]/g, '') : null

    // Check if phone already exists (only if telefono is provided)
    if (telefono) {
      const existingClient = await db.client.findFirst({
        where: { telefono },
        select: { id: true }, // Only select id for performance
      })

      if (existingClient) {
        return NextResponse.json(
          { success: false, error: 'Ya existe un cliente con este teléfono' },
          { status: 400 }
        )
      }
    }

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
    invalidateGroupsCache()

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
