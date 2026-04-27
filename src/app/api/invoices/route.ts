import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/auth'
import { invalidateClientCache } from '@/lib/api-utils'
import { ratelimit } from '@/lib/rate-limit'

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

    const [invoices, total] = await Promise.all([
      db.invoice.findMany({
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
      }),
      db.invoice.count({ where })
    ])

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
    let session
    try {
      session = await auth()
    } catch (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { success: false, error: 'Error de autenticación', code: 'AUTH_ERROR' },
        { status: 401 }
      )
    }
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
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

    let formData: FormData
    try {
      formData = await request.formData()
    } catch (formDataError) {
      console.error('FormData parsing error:', formDataError)
      return NextResponse.json(
        { success: false, error: 'Error al procesar el formulario', code: 'FORMDATA_ERROR' },
        { status: 400 }
      )
    }
    const file = formData.get('file') as File | null
    let clientId = formData.get('clientId') as string
    const invoiceNumber = formData.get('invoiceNumber') as string | null
    const amount = formData.get('amount') as string | null
    const issueDate = formData.get('issueDate') as string | null
    const dueDate = formData.get('dueDate') as string | null
    const type = formData.get('type') as string | null
    const category = formData.get('category') as string | null
    const description = formData.get('description') as string | null
    const subscriptionId = formData.get('subscriptionId') as string | null

    // For RECEIPT type (expense receipts), clientId may be a placeholder
    const isReceiptType = type === 'RECEIPT'

    if (!clientId || clientId === 'SYSTEM') {
      if (!isReceiptType) {
        return NextResponse.json(
          { success: false, error: 'clientId es requerido' },
          { status: 400 }
        )
      }
      // Use placeholder ID for system receipts
      clientId = '00000000-0000-0000-0000-000000000000'
    }

    // Verify client exists (skip for RECEIPT type)
    if (!isReceiptType) {
      const client = await db.client.findUnique({
        where: { id: clientId },
      })

      if (!client) {
        return NextResponse.json(
          { success: false, error: 'Cliente no encontrado' },
          { status: 404 }
        )
      }
    }

    let fileName = 'unknown'
    let fileSize: number | null = null
    let mimeType = 'application/pdf'
    let fileData: Buffer | null = null
    let filePath = '/uploads/placeholder'

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

      fileName = file.name
      fileSize = file.size
      mimeType = file.type
      filePath = `/api/invoices/${clientId}/file`

      // Store file data directly in PostgreSQL
      const bytes = await file.arrayBuffer()
      fileData = Buffer.from(bytes)
    }

    // Only set uploadedBy if user exists in database
    let uploadedBy: string | null = null
    if (session.user.id) {
      const userExists = await db.user.findUnique({
        where: { id: session.user.id },
        select: { id: true },
      })
      if (userExists) {
        uploadedBy = session.user.id
      }
    }

    const invoice = await db.invoice.create({
      data: {
        clientId,
        fileName,
        filePath,
        fileSize,
        mimeType,
        fileData: fileData ? Uint8Array.from(fileData) : undefined,
        invoiceNumber: invoiceNumber || null,
        amount: amount ? parseFloat(amount) : null,
        issueDate: issueDate ? new Date(issueDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        type: type || 'PAYMENT',
        status: 'PENDING',
        category: category || null,
        description: description || null,
        externalRef: subscriptionId || null,
        source: 'MANUAL',
        uploadedBy,
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

    try {
      invalidateClientCache()
    } catch (cacheError) {
      console.error('Cache invalidation error:', cacheError)
      // Continue anyway - the invoice was created successfully
    }

    return NextResponse.json({
      success: true,
      data: invoice,
      message: 'Factura subida correctamente',
    })
  } catch (error) {
    console.error('Error uploading invoice:', error)
    let errorMessage = 'Unknown error'
    let errorCode = 'UNKNOWN'
    if (error instanceof Error) {
      errorMessage = error.message
      errorCode = 'code' in error ? String((error as Record<string, unknown>).code) : 'UNKNOWN'
    } else if (error !== null && typeof error === 'object') {
      errorMessage = JSON.stringify(error)
    } else {
      errorMessage = String(error)
    }
    console.error('Detailed error - message:', errorMessage, 'code:', errorCode)
    return NextResponse.json(
      { success: false, error: `Error al subir factura: ${errorMessage}`, code: errorCode },
      { status: 500 }
    )
  }
}