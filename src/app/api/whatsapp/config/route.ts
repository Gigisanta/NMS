import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/auth'
import { z } from 'zod'
import type { WhatsAppConfig } from '@prisma/client'

const whatsappConfigSchema = z.object({
  accessToken: z.string().optional(),
  phoneNumberId: z.string().optional(),
  verifyToken: z.string().optional(),
  businessAccountId: z.string().optional(),
  isActive: z.boolean().optional(),
  autoReplyEnabled: z.boolean().optional(),
  autoDownloadMedia: z.boolean().optional(),
  autoMatchClients: z.boolean().optional(),
  autoUpdatePayment: z.boolean().optional(),
  welcomeMessage: z.string().optional(),
  successMessage: z.string().optional(),
  notFoundMessage: z.string().optional(),
  errorMessage: z.string().optional(),
})

const whatsappActionSchema = z.object({
  action: z.enum(['generateToken', 'testConnection']),
})

// Default WhatsApp messages
const DEFAULT_MESSAGES = {
  welcome: `¡Hola! 👋

Soy el asistente virtual de {businessName}.

Para enviar tu comprobante de pago:
1. Envía una foto clara del comprobante
2. O un documento PDF

¡Te confirmaremos cuando lo procesemos! 📱`,

  success: `¡Gracias {clientName}! ✅

Tu comprobante de pago ha sido recibido y procesado correctamente.

Estado: ✅ Pago registrado
Fecha: {date}

¡Nos vemos en la pileta! 🏊‍♂️`,

  notFound: `¡Hola {contactName}! 👋

No encontramos tu número en nuestra base de datos.

Para registrarte, por favor:
1. Envía tu nombre completo
2. Envía tu DNI

O contacta directamente con la administración 📞`,

  error: `¡Ups! 😅

Hubo un problema al procesar tu mensaje. Por favor, intenta nuevamente en unos momentos.

Si el problema persiste, contacta a la administración.`,
}

// GET /api/whatsapp/config - Get WhatsApp configuration
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'EMPLEADORA') {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Get or create config
    let config = await db.whatsAppConfig.findFirst()

    if (!config) {
      // Create default config
      const businessSettings = await db.settings.findUnique({
        where: { key: 'business.name' },
      })

      config = await db.whatsAppConfig.create({
        data: {
          verifyToken: `nms_verify_${Date.now()}`,
          welcomeMessage: DEFAULT_MESSAGES.welcome.replace('{businessName}', businessSettings?.value || 'NMS'),
          successMessage: DEFAULT_MESSAGES.success,
          notFoundMessage: DEFAULT_MESSAGES.notFound,
          errorMessage: DEFAULT_MESSAGES.error,
        },
      })
    }

    // Mask sensitive data
    const safeConfig = {
      ...config,
      accessToken: config.accessToken ? '••••••••' + (config.accessToken?.slice(-4) || '') : null,
    }

    return NextResponse.json({
      success: true,
      data: safeConfig,
    })
  } catch (error) {
    console.error('Error fetching WhatsApp config:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener configuración' },
      { status: 500 }
    )
  }
}

// PUT /api/whatsapp/config - Update WhatsApp configuration
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'EMPLEADORA') {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validated = whatsappConfigSchema.parse(body)

    // Get existing config
    let config = await db.whatsAppConfig.findFirst()

    const updateData: Record<string, unknown> = {}

    // Only update token if it's not masked
    if (validated.accessToken && !validated.accessToken.includes('•')) {
      updateData.accessToken = validated.accessToken
    }
    if (validated.phoneNumberId !== undefined) updateData.phoneNumberId = validated.phoneNumberId
    if (validated.verifyToken !== undefined) updateData.verifyToken = validated.verifyToken
    if (validated.businessAccountId !== undefined) updateData.businessAccountId = validated.businessAccountId
    if (validated.isActive !== undefined) updateData.isActive = validated.isActive
    if (validated.autoReplyEnabled !== undefined) updateData.autoReplyEnabled = validated.autoReplyEnabled
    if (validated.autoDownloadMedia !== undefined) updateData.autoDownloadMedia = validated.autoDownloadMedia
    if (validated.autoMatchClients !== undefined) updateData.autoMatchClients = validated.autoMatchClients
    if (validated.autoUpdatePayment !== undefined) updateData.autoUpdatePayment = validated.autoUpdatePayment
    if (validated.welcomeMessage !== undefined) updateData.welcomeMessage = validated.welcomeMessage
    if (validated.successMessage !== undefined) updateData.successMessage = validated.successMessage
    if (validated.notFoundMessage !== undefined) updateData.notFoundMessage = validated.notFoundMessage
    if (validated.errorMessage !== undefined) updateData.errorMessage = validated.errorMessage

    if (config) {
      config = await db.whatsAppConfig.update({
        where: { id: config.id },
        data: updateData,
      })
    } else {
      config = await db.whatsAppConfig.create({
        data: {
          ...updateData,
          verifyToken: validated.verifyToken || `nms_verify_${Date.now()}`,
        } as Partial<WhatsAppConfig>,
      })
    }

    // Log activity (only if user exists)
    let userId: string | null = null
    if (session.user.id) {
      const userExists = await db.user.findUnique({ where: { id: session.user.id }, select: { id: true } })
      if (userExists) userId = session.user.id
    }
    await db.activityLog.create({
      data: {
        action: 'update',
        entity: 'whatsapp_config',
        userId,
        details: JSON.stringify({ updatedFields: Object.keys(updateData) }),
      },
    })

    // Return masked config
    const safeConfig = {
      ...config,
      accessToken: config.accessToken ? '••••••••' + (config.accessToken?.slice(-4) || '') : null,
    }

    return NextResponse.json({
      success: true,
      data: safeConfig,
      message: 'Configuración actualizada correctamente',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error updating WhatsApp config:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar configuración' },
      { status: 500 }
    )
  }
}

// POST /api/whatsapp/config - Generate new verify token or test connection
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'EMPLEADORA') {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validated = whatsappActionSchema.parse(body)
    const { action } = validated

    if (action === 'generateToken') {
      const newToken = `nms_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`

      let config = await db.whatsAppConfig.findFirst()

      if (config) {
        config = await db.whatsAppConfig.update({
          where: { id: config.id },
          data: { verifyToken: newToken },
        })
      } else {
        config = await db.whatsAppConfig.create({
          data: { verifyToken: newToken },
        })
      }

      return NextResponse.json({
        success: true,
        data: { verifyToken: newToken },
        message: 'Token generado correctamente',
      })
    }

    if (action === 'testConnection') {
      // Test WhatsApp API connection
      const config = await db.whatsAppConfig.findFirst()

      if (!config?.accessToken || !config?.phoneNumberId) {
        return NextResponse.json({
          success: false,
          error: 'Configura el token y número de teléfono primero',
        })
      }

      try {
        const response = await fetch(
          `https://graph.facebook.com/v18.0/${config.phoneNumberId}`,
          {
            headers: {
              'Authorization': `Bearer ${config.accessToken}`,
            },
          }
        )

        const data = await response.json()

        if (response.ok) {
          return NextResponse.json({
            success: true,
            data: {
              phoneNumber: data.display_phone_number,
              verified: data.verified,
              qualityRating: data.quality_rating,
            },
            message: 'Conexión exitosa con WhatsApp Business API',
          })
        } else {
          return NextResponse.json({
            success: false,
            error: data.error?.message || 'Error al conectar con WhatsApp',
          })
        }
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: 'Error de conexión',
        })
      }
    }

    return NextResponse.json(
      { success: false, error: 'Acción no válida' },
      { status: 400 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error in WhatsApp config action:', error)
    return NextResponse.json(
      { success: false, error: 'Error al procesar solicitud' },
      { status: 500 }
    )
  }
}
