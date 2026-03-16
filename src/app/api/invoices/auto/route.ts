import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

// Validation schema for automated invoice upload
const AutoInvoiceSchema = z.object({
  // API Key for authentication
  apiKey: z.string().min(1, 'API Key es requerida'),

  // Client identification (at least one required)
  clientId: z.string().optional(),
  clientPhone: z.string().optional(),
  clientDni: z.string().optional(),

  // File information (URL or base64)
  fileUrl: z.string().url().optional(),
  fileBase64: z.string().optional(),
  fileName: z.string().optional(),
  mimeType: z.string().optional(),

  // Invoice metadata
  invoiceNumber: z.string().optional(),
  amount: z.number().positive().optional(),
  currency: z.string().default('ARS'),
  issueDate: z.string().optional(),
  dueDate: z.string().optional(),
  type: z.enum(['PAYMENT', 'RECEIPT', 'INVOICE', 'OTHER']).default('PAYMENT'),
  category: z.string().optional(),
  description: z.string().optional(),

  // External reference for tracking
  externalRef: z.string().optional(),
  source: z.enum(['API', 'WEBHOOK', 'WHATSAPP']).default('API'),
})

// POST /api/invoices/auto - Automated invoice upload via API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validationResult = AutoInvoiceSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datos inválidos',
          details: validationResult.error.issues,
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Validate API Key (simple implementation - could be enhanced with database lookup)
    const validApiKey = process.env.INVOICE_API_KEY
    if (!validApiKey || data.apiKey !== validApiKey) {
      return NextResponse.json(
        { success: false, error: 'API Key inválida' },
        { status: 401 }
      )
    }

    // Find client by ID, phone, or DNI
    let client: { id: string } | null = null
    if (data.clientId) {
      client = await db.client.findUnique({
        where: { id: data.clientId },
      })
    } else if (data.clientPhone) {
      client = await db.client.findFirst({
        where: { telefono: data.clientPhone },
      })
    } else if (data.clientDni) {
      client = await db.client.findFirst({
        where: { dni: data.clientDni },
      })
    }

    if (!client) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cliente no encontrado. Proporcione clientId, clientPhone o clientDni válido.',
        },
        { status: 404 }
      )
    }

    // Handle file - either download from URL or use base64
    let filePath = '/uploads/placeholder'
    let fileName = data.fileName || 'unknown'
    let fileSize: number | null = null
    let mimeType = data.mimeType || 'application/pdf'

    if (data.fileUrl) {
      // Download file from URL
      try {
        const response = await fetch(data.fileUrl)
        if (!response.ok) {
          throw new Error('Failed to download file')
        }

        const contentType = response.headers.get('content-type')
        if (contentType) {
          mimeType = contentType.split(';')[0]
        }

        const buffer = Buffer.from(await response.arrayBuffer())
        fileSize = buffer.length

        // Generate filename from URL or use provided
        if (!data.fileName) {
          const urlPath = new URL(data.fileUrl).pathname
          fileName = urlPath.split('/').pop() || `invoice-${Date.now()}.pdf`
        }

        // Save file
        const timestamp = Date.now()
        const randomSuffix = Math.random().toString(36).substring(2, 8)
        const ext = fileName.split('.').pop() || 'pdf'
        const savedFileName = `${timestamp}-${randomSuffix}.${ext}`
        filePath = `/uploads/invoices/${savedFileName}`

        const fs = await import('fs')
        const path = await import('path')
        const uploadDir = path.join(process.cwd(), 'public/uploads/invoices')

        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true })
        }

        fs.writeFileSync(path.join(uploadDir, savedFileName), buffer)
      } catch (error) {
        console.error('Error downloading file:', error)
        // Continue without file - just save the metadata
      }
    } else if (data.fileBase64) {
      // Decode base64 file
      try {
        const buffer = Buffer.from(data.fileBase64, 'base64')
        fileSize = buffer.length

        const timestamp = Date.now()
        const randomSuffix = Math.random().toString(36).substring(2, 8)
        const ext = fileName.split('.').pop() || 'pdf'
        const savedFileName = `${timestamp}-${randomSuffix}.${ext}`
        filePath = `/uploads/invoices/${savedFileName}`

        const fs = await import('fs')
        const path = await import('path')
        const uploadDir = path.join(process.cwd(), 'public/uploads/invoices')

        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true })
        }

        fs.writeFileSync(path.join(uploadDir, savedFileName), buffer)
      } catch (error) {
        console.error('Error saving base64 file:', error)
      }
    }

    // Create invoice record
    const invoice = await db.invoice.create({
      data: {
        clientId: client.id,
        fileName,
        filePath,
        fileSize,
        mimeType,
        invoiceNumber: data.invoiceNumber || null,
        amount: data.amount || null,
        currency: data.currency,
        issueDate: data.issueDate ? new Date(data.issueDate) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        type: data.type,
        category: data.category || null,
        description: data.description || null,
        source: data.source,
        externalRef: data.externalRef || null,
      },
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
    })

    return NextResponse.json({
      success: true,
      data: invoice,
      message: 'Factura procesada correctamente',
    })
  } catch (error) {
    console.error('Error in auto invoice upload:', error)
    return NextResponse.json(
      { success: false, error: 'Error al procesar factura' },
      { status: 500 }
    )
  }
}

// GET /api/invoices/auto - API documentation
export async function GET() {
  return NextResponse.json({
    success: true,
    documentation: {
      endpoint: '/api/invoices/auto',
      method: 'POST',
      description: 'Automated invoice upload via API',
      authentication: 'API Key required in request body (apiKey field)',
      body: {
        apiKey: 'string (required) - API Key for authentication',
        clientId: 'string (optional) - Client ID',
        clientPhone: 'string (optional) - Client phone number',
        clientDni: 'string (optional) - Client DNI',
        fileUrl: 'string (optional) - URL to download file from',
        fileBase64: 'string (optional) - Base64 encoded file content',
        fileName: 'string (optional) - Original file name',
        mimeType: 'string (optional) - File MIME type',
        invoiceNumber: 'string (optional) - Invoice/comprobante number',
        amount: 'number (optional) - Invoice amount',
        currency: 'string (default: ARS) - Currency code',
        issueDate: 'string (optional) - ISO date string',
        dueDate: 'string (optional) - ISO date string',
        type: 'PAYMENT | RECEIPT | INVOICE | OTHER (default: PAYMENT)',
        category: 'string (optional) - Additional category',
        description: 'string (optional) - Notes or description',
        externalRef: 'string (optional) - External reference for tracking',
        source: 'API | WEBHOOK | WHATSAPP (default: API)',
      },
      note: 'At least one of clientId, clientPhone, or clientDni is required to identify the client.',
    },
  })
}
