import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/auth'
import fs from 'fs'
import path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads/invoices')

// GET /api/invoices/[id] - Get single invoice
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            telefono: true,
            grupo: true,
          },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Factura no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: invoice,
    })
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener factura' },
      { status: 500 }
    )
  }
}

// PUT /api/invoices/[id] - Update invoice
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const invoice = await db.invoice.findUnique({
      where: { id },
    })

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Factura no encontrada' },
        { status: 404 }
      )
    }

    const {
      invoiceNumber,
      amount,
      issueDate,
      dueDate,
      type,
      category,
      description,
      status,
      verified,
    } = body

    const updateData: {
      invoiceNumber?: string | null
      amount?: number | null
      issueDate?: Date | null
      dueDate?: Date | null
      type?: string
      category?: string | null
      description?: string | null
      status?: string
      verified?: boolean
    } = {}

    if (invoiceNumber !== undefined) updateData.invoiceNumber = invoiceNumber || null
    if (amount !== undefined) updateData.amount = amount ? parseFloat(amount) : null
    if (issueDate !== undefined) updateData.issueDate = issueDate ? new Date(issueDate) : null
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
    if (type !== undefined) updateData.type = type
    if (category !== undefined) updateData.category = category || null
    if (description !== undefined) updateData.description = description || null
    if (status !== undefined) updateData.status = status
    if (verified !== undefined) updateData.verified = verified

    const updatedInvoice = await db.invoice.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedInvoice,
      message: 'Factura actualizada correctamente',
    })
  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar factura' },
      { status: 500 }
    )
  }
}

// DELETE /api/invoices/[id] - Delete invoice
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params

    const invoice = await db.invoice.findUnique({
      where: { id },
    })

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Factura no encontrada' },
        { status: 404 }
      )
    }

    // Delete file from disk if it exists
    if (invoice.filePath && invoice.filePath !== '/uploads/placeholder') {
      const fullPath = path.join(process.cwd(), 'public', invoice.filePath)
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath)
      }
    }

    // Delete from database
    await db.invoice.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Factura eliminada correctamente',
    })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar factura' },
      { status: 500 }
    )
  }
}
