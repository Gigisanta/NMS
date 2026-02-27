import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/auth'
import fs from 'fs'
import path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads/invoices')

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

// GET /api/invoices - List all invoices or filter by client
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: {
      clientId?: string
      status?: string
    } = {}

    if (clientId) where.clientId = clientId
    if (status) where.status = status

    const invoices = await db.invoice.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            telefono: true,
          },
        },
      },
      orderBy: { uploadedAt: 'desc' },
      take: limit,
      skip: offset,
    })

    const total = await db.invoice.count({ where })

    return NextResponse.json({
      success: true,
      data: invoices,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + invoices.length < total,
      },
    })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener facturas' },
      { status: 500 }
    )
  }
}

// POST /api/invoices - Upload new invoice (manual)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const clientId = formData.get('clientId') as string
    const invoiceNumber = formData.get('invoiceNumber') as string | null
    const amount = formData.get('amount') as string | null
    const issueDate = formData.get('issueDate') as string | null
    const dueDate = formData.get('dueDate') as string | null
    const type = formData.get('type') as string | null
    const category = formData.get('category') as string | null
    const description = formData.get('description') as string | null

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'clientId es requerido' },
        { status: 400 }
      )
    }

    // Verify client exists
    const client = await db.client.findUnique({
      where: { id: clientId },
    })

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    let filePath = '/uploads/placeholder'
    let fileName = 'unknown'
    let fileSize: number | null = null
    let mimeType = 'application/pdf'

    // Handle file upload if provided
    if (file && file.size > 0) {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
      ]

      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { success: false, error: 'Tipo de archivo no permitido. Use PDF o imágenes.' },
          { status: 400 }
        )
      }

      // Generate unique filename
      const timestamp = Date.now()
      const randomSuffix = Math.random().toString(36).substring(2, 8)
      const ext = file.name.split('.').pop() || 'pdf'
      fileName = `${timestamp}-${randomSuffix}.${ext}`
      filePath = `/uploads/invoices/${fileName}`
      fileSize = file.size
      mimeType = file.type

      // Save file to disk
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const fullPath = path.join(UPLOAD_DIR, fileName)
      fs.writeFileSync(fullPath, buffer)
    }

    // Create invoice record
    const invoice = await db.invoice.create({
      data: {
        clientId,
        fileName,
        filePath,
        fileSize,
        mimeType,
        invoiceNumber: invoiceNumber || null,
        amount: amount ? parseFloat(amount) : null,
        issueDate: issueDate ? new Date(issueDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        type: type || 'PAYMENT',
        category: category || null,
        description: description || null,
        source: 'MANUAL',
        uploadedBy: session.user.id,
      },
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
      data: invoice,
      message: 'Factura subida correctamente',
    })
  } catch (error) {
    console.error('Error uploading invoice:', error)
    return NextResponse.json(
      { success: false, error: 'Error al subir factura' },
      { status: 500 }
    )
  }
}
