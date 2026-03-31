import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { invalidateCachePattern } from '@/lib/api-utils'

// DELETE /api/client-groups/[id] - Delete a client-group assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }

    const { id } = await params

    // Check if the assignment exists
    const clientGroup = await db.clientGroup.findUnique({
      where: { id },
    })

    if (!clientGroup) {
      return NextResponse.json(
        { success: false, error: 'Asignación no encontrada' },
        { status: 404 }
      )
    }

    // Delete the assignment
    await db.clientGroup.delete({
      where: { id },
    })

    // Invalidate caches
    invalidateCachePattern('client')
    invalidateCachePattern('groups')

    return NextResponse.json({
      success: true,
      message: 'Asignación eliminada correctamente',
    })
  } catch (error) {
    console.error('Error deleting client group:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar asignación de grupo' },
      { status: 500 }
    )
  }
}
