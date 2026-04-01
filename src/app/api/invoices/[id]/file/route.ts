import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/invoices/[id]/file - Download invoice file from database
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const invoice = await db.invoice.findUnique({
      where: { id },
      select: {
        id: true,
        fileName: true,
        fileData: true,
        mimeType: true,
        fileSize: true,
      },
    })

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Factura no encontrada' },
        { status: 404 }
      )
    }

    if (!invoice.fileData) {
      return NextResponse.json(
        { success: false, error: 'Archivo no disponible' },
        { status: 404 }
      )
    }

    // Return file with appropriate headers
    // Convert Uint8Array (Prisma ByteA) to Buffer for NextResponse
    return new NextResponse(Buffer.from(invoice.fileData), {
      headers: {
        'Content-Type': invoice.mimeType,
        'Content-Disposition': `inline; filename="${invoice.fileName}"`,
        'Content-Length': String(invoice.fileSize || invoice.fileData.length),
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Error downloading invoice file:', error)
    return NextResponse.json(
      { success: false, error: 'Error al descargar archivo' },
      { status: 500 }
    )
  }
}