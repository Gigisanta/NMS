import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/auth'
import type { Prisma } from '@prisma/client'

// Default settings configuration
const DEFAULT_SETTINGS: Record<string, { value: string; category: string; description: string }> = {
  // Business settings
  'business.name': { value: 'NMS - Natatory Management System', category: 'business', description: 'Nombre del negocio' },
  'business.address': { value: '', category: 'business', description: 'Dirección del negocio' },
  'business.phone': { value: '', category: 'business', description: 'Teléfono de contacto' },
  'business.email': { value: '', category: 'business', description: 'Email de contacto' },
  'business.currency': { value: 'ARS', category: 'business', description: 'Moneda principal' },
  'business.timezone': { value: 'America/Argentina/Cordoba', category: 'business', description: 'Zona horaria' },
  'business.logo': { value: '', category: 'business', description: 'URL del logo' },
  
  // Payment settings
  'payment.defaultClasses': { value: '4', category: 'payment', description: 'Clases por defecto por mes' },
  'payment.defaultPrice': { value: '0', category: 'payment', description: 'Precio por defecto mensual' },
  'payment.paymentMethods': { value: '["Efectivo","Transferencia","MercadoPago"]', category: 'payment', description: 'Métodos de pago aceptados' },
  'payment.dueDay': { value: '10', category: 'payment', description: 'Día de vencimiento mensual' },
  'payment.lateFee': { value: '0', category: 'payment', description: 'Recargo por mora (%)' },
  'payment.autoStatus': { value: 'true', category: 'payment', description: 'Cambio automático de estado' },
  
  // Notification settings
  'notifications.paymentReminder': { value: 'true', category: 'notifications', description: 'Recordatorio de pago' },
  'notifications.paymentReminderDays': { value: '3', category: 'notifications', description: 'Días antes del vencimiento' },
  'notifications.overdueNotification': { value: 'true', category: 'notifications', description: 'Notificación de mora' },
  'notifications.newClientAlert': { value: 'false', category: 'notifications', description: 'Alerta de nuevo cliente' },
  'notifications.classReminder': { value: 'false', category: 'notifications', description: 'Recordatorio de clase' },
  'notifications.emailEnabled': { value: 'false', category: 'notifications', description: 'Notificaciones por email' },
  'notifications.whatsappEnabled': { value: 'false', category: 'notifications', description: 'Notificaciones por WhatsApp' },
  
  // Attendance settings
  'attendance.maxAdvanceDays': { value: '30', category: 'attendance', description: 'Días máximos de anticipación' },
  'attendance.allowExtraClasses': { value: 'false', category: 'attendance', description: 'Permitir clases extra' },
  'attendance.trackTime': { value: 'true', category: 'attendance', description: 'Registrar hora de asistencia' },
  
  // Invoice settings
  'invoice.autoVerify': { value: 'false', category: 'invoice', description: 'Verificar facturas automáticamente' },
  'invoice.requireInvoice': { value: 'false', category: 'invoice', description: 'Requerir factura para pago' },
  
  // System settings
  'system.maintenanceMode': { value: 'false', category: 'system', description: 'Modo mantenimiento' },
  'system.debugMode': { value: 'false', category: 'system', description: 'Modo debug' },
}

// Initialize default settings if they don't exist
async function initializeDefaults() {
  const keys = Object.keys(DEFAULT_SETTINGS)

  // Fetch all existing settings for these keys in one go
  const existingSettings = await db.settings.findMany({
    where: { key: { in: keys } },
    select: { key: true }
  })

  const existingKeys = new Set(existingSettings.map(s => s.key))
  const missingKeys = keys.filter(key => !existingKeys.has(key))

  if (missingKeys.length > 0) {
    // Bulk create missing settings
    await db.settings.createMany({
      data: missingKeys.map(key => ({
        key,
        value: DEFAULT_SETTINGS[key].value,
        category: DEFAULT_SETTINGS[key].category,
        description: DEFAULT_SETTINGS[key].description,
      })),
      skipDuplicates: true
    })
  }
}

// GET /api/settings - Get all settings or by category
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    // Initialize defaults
    await initializeDefaults()

    const where = category ? { category } : {}
    const settings = await db.settings.findMany({ where })

    // Convert to object format
    const settingsMap: Record<string, { value: string; category: string; description: string | null }> = {}
    for (const setting of settings) {
      settingsMap[setting.key] = {
        value: setting.value,
        category: setting.category,
        description: setting.description,
      }
    }

    return NextResponse.json({
      success: true,
      data: settingsMap,
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener configuración' },
      { status: 500 }
    )
  }
}

// PUT /api/settings - Update multiple settings
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Only EMPLEADORA can change most settings
    const body = await request.json()
    const { settings } = body as { settings: Record<string, string> }

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Formato de configuración inválido' },
        { status: 400 }
      )
    }

    // Update settings in transaction
    const keysToUpdate = Object.keys(settings)

    // Fetch existing settings to know which ones to update vs create
    const existingSettings = await db.settings.findMany({
      where: { key: { in: keysToUpdate } },
      select: { key: true }
    })

    const existingKeys = new Set(existingSettings.map(s => s.key))

    const updates: Prisma.PrismaPromise<unknown>[] = []
    const toCreate: { key: string; value: string; category: string }[] = []

    for (const [key, value] of Object.entries(settings)) {
      if (existingKeys.has(key)) {
        updates.push(
          db.settings.update({
            where: { key },
            data: { value: String(value) },
          })
        )
      } else {
        toCreate.push({
          key,
          value: String(value),
          category: 'general',
        })
      }
    }

    // Combine createMany and individual updates in one transaction
    await db.$transaction([
      ...(toCreate.length > 0 ? [db.settings.createMany({ data: toCreate, skipDuplicates: true })] : []),
      ...updates
    ])

    // Log activity
    await db.activityLog.create({
      data: {
        action: 'update',
        entity: 'settings',
        userId: session.user.id,
        details: JSON.stringify({ updatedKeys: Object.keys(settings) }),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Configuración actualizada correctamente',
    })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar configuración' },
      { status: 500 }
    )
  }
}

// POST /api/settings - Reset to defaults
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'EMPLEADORA') {
      return NextResponse.json(
        { success: false, error: 'No autorizado - Solo EMPLEADORA' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action } = body

    if (action === 'reset') {
      // Reset all settings to defaults in a transaction
      const keys = Object.keys(DEFAULT_SETTINGS)

      await db.$transaction([
        // Delete only the settings that are in our default list
        db.settings.deleteMany({
          where: { key: { in: keys } }
        }),
        // Re-create them with default values
        db.settings.createMany({
          data: keys.map(key => ({
            key,
            value: DEFAULT_SETTINGS[key].value,
            category: DEFAULT_SETTINGS[key].category,
            description: DEFAULT_SETTINGS[key].description,
          }))
        })
      ])

      return NextResponse.json({
        success: true,
        message: 'Configuración restablecida a valores por defecto',
      })
    }

    return NextResponse.json(
      { success: false, error: 'Acción no válida' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error resetting settings:', error)
    return NextResponse.json(
      { success: false, error: 'Error al restablecer configuración' },
      { status: 500 }
    )
  }
}
