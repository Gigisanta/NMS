import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cachedFetch, CacheKeys, invalidateCache } from '@/lib/api-utils'

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

    return NextResponse.json({
      success: true,
      data: groups
    })
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
    const body = await request.json()
    const { name, color, description, schedule } = body

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    // Check if group with same name exists
    const existing = await db.group.findFirst({
      where: { name }
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un grupo con ese nombre' },
        { status: 400 }
      )
    }

    const group = await db.group.create({
      data: {
        name,
        color: color || '#06b6d4',
        description,
        schedule,
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
    console.error('Error creating group:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear grupo' },
      { status: 500 }
    )
  }
}
