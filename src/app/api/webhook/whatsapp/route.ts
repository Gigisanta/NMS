import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentMonth, getCurrentYear } from '@/lib/utils'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads/whatsapp')

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

// GET - Webhook verification
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  // Get configured verify token
  const config = await db.whatsAppConfig.findFirst()
  const verifyToken = config?.verifyToken || process.env.WHATSAPP_VERIFY_TOKEN || 'nms_verify_token_2024'

  console.log('[WhatsApp] Webhook verification attempt:', { mode, token: token?.substring(0, 10) + '...' })

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[WhatsApp] Webhook verified successfully')
    return new NextResponse(challenge, { status: 200 })
  }

  console.log('[WhatsApp] Webhook verification failed')
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
}

// POST - Handle incoming messages
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('[WhatsApp] Received webhook:', JSON.stringify(body, null, 2).substring(0, 500))

    // Extract message data
    const entry = body.entry?.[0]
    const change = entry?.changes?.[0]
    const message = change?.value?.messages?.[0]
    const contact = change?.value?.contacts?.[0]
    const metadata = change?.value?.metadata

    if (!message) {
      return NextResponse.json({ success: true, message: 'No message to process' })
    }

    const from = message.from // Phone number
    const messageId = message.id
    const messageType = message.type
    const contactName = contact?.profile?.name || 'Usuario'
    const timestamp = message.timestamp ? new Date(parseInt(message.timestamp) * 1000) : new Date()

    console.log(`[WhatsApp] Message from ${from} (${contactName}), type: ${messageType}`)

    // Get WhatsApp configuration
    const config = await db.whatsAppConfig.findFirst()
    
    if (!config?.isActive && config?.accessToken) {
      console.log('[WhatsApp] Integration not active')
      return NextResponse.json({ success: true, message: 'Integration not active' })
    }

    // Check if message already processed
    const existingMessage = await db.whatsAppMessage.findUnique({
      where: { messageId },
    })

    if (existingMessage) {
      console.log('[WhatsApp] Message already processed:', messageId)
      return NextResponse.json({ success: true, message: 'Message already processed' })
    }

    // Create initial message record
    let messageRecord = await db.whatsAppMessage.create({
      data: {
        messageId,
        fromPhone: from,
        fromName: contactName,
        messageType,
        status: 'received',
      },
    })

    // Extract content based on message type
    let content = ''
    let mediaId = ''
    let mimeType = ''
    let filename = ''

    switch (messageType) {
      case 'text':
        content = message.text?.body || ''
        break
      case 'image':
        content = message.image?.caption || ''
        mediaId = message.image?.id || ''
        mimeType = message.image?.mime_type || 'image/jpeg'
        break
      case 'document':
        content = message.document?.caption || ''
        mediaId = message.document?.id || ''
        mimeType = message.document?.mime_type || 'application/pdf'
        filename = message.document?.filename || 'document.pdf'
        break
      case 'audio':
        mediaId = message.audio?.id || ''
        mimeType = message.audio?.mime_type || 'audio/ogg'
        break
      case 'video':
        mediaId = message.video?.id || ''
        mimeType = message.video?.mime_type || 'video/mp4'
        break
    }

    // Update message with content
    await db.whatsAppMessage.update({
      where: { id: messageRecord.id },
      data: {
        content,
        mediaId,
        mediaMimeType: mimeType,
        mediaFilename: filename,
      },
    })

    // Try to match client
    const matchResult = await matchClient(from, contactName, config?.autoMatchClients || false)
    
    if (matchResult) {
      await db.whatsAppMessage.update({
        where: { id: messageRecord.id },
        data: {
          matchedClientId: matchResult.client.id,
          matchedBy: matchResult.matchedBy,
        },
      })
    }

    // Process message based on type
    if ((messageType === 'image' || messageType === 'document') && mediaId) {
      // Download media if auto-download is enabled
      if (config?.autoDownloadMedia) {
        const downloadResult = await downloadMedia(mediaId, config?.accessToken || undefined)
        
        if (downloadResult.success) {
          await db.whatsAppMessage.update({
            where: { id: messageRecord.id },
            data: {
              mediaUrl: downloadResult.url,
              localFilePath: downloadResult.localPath,
            },
          })

          // If client matched and auto-update payment is enabled
          if (matchResult && config?.autoUpdatePayment) {
            const processResult = await processPaymentDocument(
              messageRecord.id,
              matchResult.client.id,
              downloadResult.localPath || downloadResult.url || '',
              filename || `comprobante_${Date.now()}`,
              mimeType,
              config
            )

            if (processResult.success) {
              await db.whatsAppMessage.update({
                where: { id: messageRecord.id },
                data: {
                  status: 'processed',
                  invoiceId: processResult.invoiceId,
                  subscriptionId: processResult.subscriptionId,
                  processedAt: new Date(),
                  responseSent: true,
                },
              })

              // Send success message
              if (config?.autoReplyEnabled) {
                await sendWhatsAppMessage(
                  from,
                  config?.successMessage || DEFAULT_MESSAGES.success,
                  {
                    clientName: `${matchResult.client.nombre} ${matchResult.client.apellido}`,
                    date: new Date().toLocaleDateString('es-AR'),
                  },
                  config?.accessToken || undefined,
                  metadata?.phone_number_id
                )
              }

              return NextResponse.json({
                success: true,
                message: `Comprobante procesado para ${matchResult.client.nombre} ${matchResult.client.apellido}`,
              })
            }
          }
        }
      }

      // Acknowledge receipt
      if (config?.autoReplyEnabled) {
        await sendWhatsAppMessage(
          from,
          `¡Gracias ${contactName}! 📱\n\nHemos recibido tu comprobante. Te confirmaremos cuando sea procesado.`,
          {},
          config?.accessToken || undefined,
          metadata?.phone_number_id
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Comprobante recibido, pendiente de procesamiento',
      })
    }

    // Handle text messages
    if (messageType === 'text') {
      // Check if it's a registration request
      const registrationResult = await handleTextMessage(
        from,
        contactName,
        content,
        config
      )

      if (config?.autoReplyEnabled) {
        if (matchResult) {
          await sendWhatsAppMessage(
            from,
            config?.welcomeMessage || DEFAULT_MESSAGES.welcome,
            {
              businessName: 'NMS',
              clientName: `${matchResult.client.nombre}`,
            },
            config?.accessToken || undefined,
            metadata?.phone_number_id
          )
        } else {
          await sendWhatsAppMessage(
            from,
            config?.notFoundMessage || DEFAULT_MESSAGES.notFound,
            { contactName },
            config?.accessToken || undefined,
            metadata?.phone_number_id
          )
        }
      }

      await db.whatsAppMessage.update({
        where: { id: messageRecord.id },
        data: {
          status: 'processed',
          processedAt: new Date(),
          responseSent: config?.autoReplyEnabled,
        },
      })

      return NextResponse.json({ success: true })
    }

    // Mark as processed
    await db.whatsAppMessage.update({
      where: { id: messageRecord.id },
      data: {
        status: 'processed',
        processedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[WhatsApp] Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Match client by phone or name
async function matchClient(
  phone: string,
  name: string,
  autoMatch: boolean = true
): Promise<{ client: any; matchedBy: string } | null> {
  if (!autoMatch) return null

  // Clean phone number for matching
  const cleanPhone = cleanPhoneNumber(phone)

  // Try to match by phone
  const phoneVariations = generatePhoneVariations(phone)
  
  const clientByPhone = await db.client.findFirst({
    where: {
      OR: phoneVariations.map(p => ({ telefono: p })),
    },
  })

  if (clientByPhone) {
    return { client: clientByPhone, matchedBy: 'phone' }
  }

  // Try to match by name (fuzzy match)
  const nameParts = name.toLowerCase().split(' ')
  if (nameParts.length > 0) {
    const clientByName = await db.client.findFirst({
      where: {
        OR: [
          { nombre: { contains: nameParts[0] } },
          { apellido: { contains: nameParts[nameParts.length - 1] } },
        ],
      },
    })

    if (clientByName) {
      return { client: clientByName, matchedBy: 'name' }
    }
  }

  // Check WhatsApp client mappings
  const waClient = await db.whatsAppClient.findUnique({
    where: { phone: cleanPhone },
    })

  if (waClient?.clientId) {
    return { client: waClient.clientId, matchedBy: 'mapped' }
  }

  return null
}

// Clean phone number
function cleanPhoneNumber(phone: string): string {
  return phone.replace(/[^0-9]/g, '')
}

// Generate phone number variations for matching
function generatePhoneVariations(phone: string): string[] {
  const cleaned = cleanPhoneNumber(phone)
  const variations = new Set<string>()
  
  variations.add(phone)
  variations.add(cleaned)
  variations.add('+' + cleaned)
  
  // Argentina specific
  if (cleaned.startsWith('54')) {
    variations.add(cleaned.slice(2))
    variations.add('+' + cleaned)
    variations.add('0' + cleaned.slice(4))
  }
  if (cleaned.startsWith('549')) {
    variations.add(cleaned.slice(3))
    variations.add('9' + cleaned.slice(3))
  }
  
  return Array.from(variations)
}

// Download media from WhatsApp
async function downloadMedia(
  mediaId: string,
  accessToken?: string
): Promise<{ success: boolean; url?: string; localPath?: string; error?: string }> {
  const token = accessToken || process.env.WHATSAPP_TOKEN

  if (!token) {
    console.log('[WhatsApp] No access token, skipping download')
    return { success: false, error: 'No access token' }
  }

  try {
    // Get media URL
    const mediaResponse = await fetch(
      `https://graph.facebook.com/v18.0/${mediaId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    )

    const mediaData = await mediaResponse.json()
    
    if (!mediaResponse.ok) {
      console.error('[WhatsApp] Error getting media URL:', mediaData)
      return { success: false, error: mediaData.error?.message || 'Failed to get media URL' }
    }

    const mediaUrl = mediaData.url

    // Download the actual file
    const fileResponse = await fetch(mediaUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!fileResponse.ok) {
      return { success: false, error: 'Failed to download file' }
    }

    // Save file locally
    const buffer = Buffer.from(await fileResponse.arrayBuffer())
    const ext = mediaData.mime_type?.split('/')[1] || 'jpg'
    const filename = `${mediaId}_${Date.now()}.${ext}`
    const localPath = path.join(UPLOAD_DIR, filename)

    fs.writeFileSync(localPath, buffer)

    console.log('[WhatsApp] Media downloaded:', localPath)

    return {
      success: true,
      url: mediaUrl,
      localPath: `/uploads/whatsapp/${filename}`,
    }
  } catch (error) {
    console.error('[WhatsApp] Error downloading media:', error)
    return { success: false, error: 'Download failed' }
  }
}

// Process payment document
async function processPaymentDocument(
  messageId: string,
  clientId: string,
  filePath: string,
  filename: string,
  mimeType: string,
  config: any
): Promise<{ success: boolean; invoiceId?: string; subscriptionId?: string; error?: string }> {
  try {
    // Create invoice record
    const invoice = await db.invoice.create({
      data: {
        clientId,
        fileName: filename,
        filePath: filePath,
        mimeType: mimeType,
        source: 'WHATSAPP',
        externalRef: messageId,
        status: config?.autoVerify ? 'VERIFIED' : 'PENDING',
        verified: config?.autoVerify || false,
      },
    })

    // Get or create current month subscription
    const currentMonth = getCurrentMonth()
    const currentYear = getCurrentYear()

    let subscription = await db.subscription.findFirst({
      where: {
        clientId,
        month: currentMonth,
        year: currentYear,
      },
    })

    if (subscription) {
      // Update subscription status to AL_DIA
      subscription = await db.subscription.update({
        where: { id: subscription.id },
        data: { status: 'AL_DIA' },
      })
    } else {
      // Create new subscription
      const defaultClasses = await db.settings.findUnique({
        where: { key: 'payment.defaultClasses' },
      })
      const defaultPrice = await db.settings.findUnique({
        where: { key: 'payment.defaultPrice' },
      })

      subscription = await db.subscription.create({
        data: {
          clientId,
          month: currentMonth,
          year: currentYear,
          status: 'AL_DIA',
          classesTotal: parseInt(defaultClasses?.value || '4'),
          classesUsed: 0,
          amount: parseFloat(defaultPrice?.value || '0'),
        },
      })
    }

    console.log('[WhatsApp] Payment processed:', { invoiceId: invoice.id, subscriptionId: subscription.id })

    return {
      success: true,
      invoiceId: invoice.id,
      subscriptionId: subscription.id,
    }
  } catch (error) {
    console.error('[WhatsApp] Error processing payment:', error)
    return { success: false, error: 'Processing failed' }
  }
}

// Handle text messages
async function handleTextMessage(
  from: string,
  name: string,
  content: string,
  config: any
): Promise<{ registered?: boolean }> {
  // Check if this looks like a registration request
  const dniMatch = content.match(/\d{7,8}/)
  const hasNameWords = content.split(' ').length >= 2

  if (dniMatch && hasNameWords) {
    // This might be a registration attempt
    const dni = dniMatch[0]
    
    // Check if there's an existing client with this DNI
    const existingClient = await db.client.findFirst({
      where: { dni },
    })

    if (existingClient) {
      // Link WhatsApp to existing client
      await db.whatsAppClient.upsert({
        where: { phone: from },
        create: {
          phone: from,
          name,
          clientId: existingClient.id,
          autoMatched: true,
        },
        update: {
          name,
          clientId: existingClient.id,
          autoMatched: true,
        },
      })

      return { registered: true }
    }
  }

  return {}
}

// Send WhatsApp message
async function sendWhatsAppMessage(
  to: string,
  template: string,
  variables: Record<string, string> = {},
  accessToken?: string,
  phoneNumberId?: string
) {
  const token = accessToken || process.env.WHATSAPP_TOKEN
  const phoneId = phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID

  if (!token || !phoneId) {
    console.log('[WhatsApp] Not configured. Message would be:', template)
    return
  }

  // Replace variables in template
  let message = template
  for (const [key, value] of Object.entries(variables)) {
    message = message.replace(new RegExp(`{${key}}`, 'g'), value)
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: { body: message },
        }),
      }
    )

    const data = await response.json()
    console.log('[WhatsApp] Message sent:', data)
    return data
  } catch (error) {
    console.error('[WhatsApp] Error sending message:', error)
  }
}

// Default messages
const DEFAULT_MESSAGES = {
  welcome: `¡Hola! 👋\n\nSoy el asistente virtual de {businessName}.\n\nPara enviar tu comprobante de pago:\n1. Envía una foto clara del comprobante\n2. O un documento PDF\n\n¡Te confirmaremos cuando lo procesemos! 📱`,
  success: `¡Gracias {clientName}! ✅\n\nTu comprobante de pago ha sido recibido y procesado correctamente.\n\nEstado: ✅ Pago registrado\nFecha: {date}\n\n¡Nos vemos en la pileta! 🏊‍♂️`,
  notFound: `¡Hola {contactName}! 👋\n\nNo encontramos tu número en nuestra base de datos.\n\nPara registrarte, por favor:\n1. Envía tu nombre completo\n2. Envía tu DNI\n\nO contacta directamente con la administración 📞`,
  error: `¡Ups! 😅\n\nHubo un problema al procesar tu mensaje. Por favor, intenta nuevamente en unos momentos.\n\nSi el problema persiste, contacta a la administración.`,
}
