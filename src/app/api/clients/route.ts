import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentMonth, getCurrentYear } from '@/lib/utils'
import { cachedFetch, CacheKeys, invalidateCachePattern } from '@/lib/api-utils'

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

        // Build where clause efficiently
        const where = {
          AND: [
            search
              ? {
                  OR: [
                    { nombre: { contains: search } },
                    { apellido: { contains: search } },
                    { telefono: { contains: search } },
                    { dni: { contains: search } },
                  ],
                }
              : {},
            grupoId ? { grupoId } : {},
          ],
        }

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
            orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
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
    return NextResponse.json(
      { success: false, error: 'Error al obtener clientes' },
      { status: 500 }
    )
  }
}

// POST /api/clients - Create new client
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Extract data
    const {
      nombre,
      apellido,
      dni,
      telefono,
      grupoId,
      preferredDays,
      preferredTime,
      notes,
      classesTotal = 4,
      monthlyAmount,
      registrationFeePaid1 = false,
      registrationFeePaid2 = false,
    } = body

    // Validate required fields
    if (!nombre || !apellido || !telefono) {
      return NextResponse.json(
        { success: false, error: 'Nombre, apellido y teléfono son requeridos' },
        { status: 400 }
      )
    }

    // Check if phone already exists
    const existingClient = await db.client.findUnique({
      where: { telefono },
      select: { id: true }, // Only select id for performance
    })

    if (existingClient) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un cliente con este teléfono' },
        { status: 400 }
      )
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
          classesTotal: classesTotal,
          classesUsed: 0,
          amount: monthlyAmount || null,
        },
      })

      return newClient
    })

    // Invalidate relevant caches
    invalidateCachePattern('client')
    invalidateCachePattern('dashboard')
    invalidateCachePattern('groups')

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
