import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cachedFetch, CacheKeys, invalidateCache } from '@/lib/api-utils'
import { z } from 'zod'
import { ratelimit } from '@/lib/rate-limit'

const createGroupSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(50, 'Máximo 50 caracteres'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido').default('#06b6d4'),
  description: z.string().max(200).optional().nullable(),
  schedule: z.string().max(100).optional().nullable(),
})

// GET /api/groups - List all groups with client counts
export async function GET() {
  try {
    // Use cache for groups (they don't change frequently)
    const groups = await cachedFetch(
      CacheKeys.groups(),
      async () => {
        const result = await db.group.findMany({
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

        return result.map(g => ({
          id: g.id,
          name: g.name,
          color: g.color,
          description: g.description,
          schedule: g.schedule,
          clientCount: g._count.clients
        }))
      },
      2 * 60 * 1000 // 2 minutes cache
    )

    return NextResponse.json(
      { success: true, data: groups },
      {
        headers: {
          'Cache-Control': 'private, max-age=120, stale-while-revalidate=60',
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

    // Invalidate groups cache
    invalidateCache(CacheKeys.groups())

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
