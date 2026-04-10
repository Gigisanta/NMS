import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { invalidateGroupsCache } from '@/lib/api-utils'
import { z } from 'zod'
import { ratelimit } from '@/lib/rate-limit'
import { auth } from '@/auth'

const createGroupSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(50, 'Máximo 50 caracteres'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido').default('#06b6d4'),
  description: z.string().max(200).optional().nullable(),
  schedule: z.string().max(100).optional().nullable(),
})

// GET /api/groups - List all groups with client counts
export async function GET() {
  try {
    const session = await auth()
    const isAdmin = session?.user?.role === 'EMPLEADORA'
    const userColor = session?.user?.groupColor

    // Always fetch directly from DB - client-side caching (5-min guard + force refresh)
    // handles stale prevention. Invalidate via invalidateGroupsCache() on mutations.
    const result = isAdmin || !userColor
      ? await db.group.findMany({
          where: { active: true },
          select: {
            id: true,
            name: true,
            color: true,
            description: true,
            schedule: true,
            _count: {
              select: { clients: true }
            }
          },
          orderBy: { name: 'asc' }
        })
      : await db.group.findMany({
          where: { active: true, color: userColor },
          select: {
            id: true,
            name: true,
            color: true,
            description: true,
            schedule: true,
            _count: {
              select: { clients: true }
            }
          },
          orderBy: { name: 'asc' }
        })

    const groups = result.map(g => ({
      id: g.id,
      name: g.name,
      color: g.color,
      description: g.description,
      schedule: g.schedule,
      clientCount: g._count.clients,
    }))

    return NextResponse.json(
      { success: true, data: groups },
      {
        headers: {
          'Cache-Control': 'private, no-cache, must-revalidate',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching groups:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener grupos' },
      { status: 500 }
    )
  }
}

// POST /api/groups - Create new group
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para crear grupos' },
        { status: 403 }
      )
    }

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
    const validated = createGroupSchema.parse(body)

    // Check if group with same name exists
    const existing = await db.group.findFirst({
      where: { name: validated.name }
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un grupo con ese nombre' },
        { status: 400 }
      )
    }

    const group = await db.group.create({
      data: {
        name: validated.name,
        color: validated.color ?? '#06b6d4',
        ...(validated.description !== undefined && { description: validated.description ?? null }),
        ...(validated.schedule !== undefined && { schedule: validated.schedule ?? null }),
      },
      select: {
        id: true,
        name: true,
        color: true,
        description: true,
        schedule: true,
        active: true,
        createdAt: true,
      }
    })

    // Invalidate groups cache and related caches (clients include group data)
    invalidateGroupsCache()

    return NextResponse.json({
      success: true,
      data: {
        ...group,
        clientCount: 0
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return NextResponse.json(
        { success: false, error: firstError?.message || 'Datos inválidos' },
        { status: 400 }
      )
    }
    console.error('Error creating group:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear grupo' },
      { status: 500 }
    )
  }
}
