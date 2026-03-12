import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/auth'

// GET /api/user/profile - Get current user profile
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        employeeRole: true,
        phone: true,
        image: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: user,
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener perfil' },
      { status: 500 }
    )
  }
}

// PUT /api/user/profile - Update current user profile
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, phone, image } = body

    const updateData: {
      name?: string
      phone?: string | null
      image?: string | null
    } = {}

    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone || null
    if (image !== undefined) updateData.image = image || null

    const user = await db.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        employeeRole: true,
        phone: true,
        image: true,
      },
    })

    // Log activity
    await db.activityLog.create({
      data: {
        action: 'update',
        entity: 'user',
        entityId: session.user.id,
        userId: session.user.id,
        details: JSON.stringify({ updatedFields: Object.keys(updateData) }),
      },
    })

    return NextResponse.json({
      success: true,
      data: user,
      message: 'Perfil actualizado correctamente',
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar perfil' },
      { status: 500 }
    )
  }
}
