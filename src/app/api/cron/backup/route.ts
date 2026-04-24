import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { invalidateCache } from '@/lib/api-utils'
import { auth } from '@/auth'

/**
 * POST /api/cron/backup
 *
 * Este endpoint se ejecuta diariamente via GitHub Actions para crear
 * un backup de la base de datos Neon y subirlo a Vercel Blob.
 *
 * NO requiere autenticación porque se ejecuta via cron job de GitHub Actions
 * con CRON_SECRET como verificación.
 *
 * Para probar manualmente: curl -X POST http://localhost:3000/api/cron/backup
 */
export async function POST(request: Request) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupFileName = `nms-backup-${timestamp}.sql.gz`

  try {
    // Verificar CRON_SECRET para autenticación
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      return NextResponse.json(
        { success: false, error: 'CRON_SECRET no configurado' },
        { status: 500 }
      )
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    console.log(`[BACKUP] Iniciando backup: ${backupFileName}`)

    // Obtener todas las tablas de la base de datos
    // Usamos la conexión directa de Neon via las variables de entorno
    const databaseUrl = process.env.Neon_DATABASE_URL || process.env.DATABASE_URL

    if (!databaseUrl) {
      throw new Error('DATABASE_URL no disponible')
    }

    // Verificar que la base de datos está accesible
    try {
      await db.$queryRaw`SELECT 1`
      console.log('[BACKUP] Conexión a BD verificada')
    } catch (dbError) {
      console.error('[BACKUP] Error de conexión a BD:', dbError)
      throw new Error('No se pudo conectar a la base de datos')
    }

    // Log de información del backup (para auditoría)
    const backupInfo = {
      timestamp: new Date().toISOString(),
      fileName: backupFileName,
      database: 'Neon PostgreSQL',
      project: 'NMS (oroazul)',
    }

    console.log('[BACKUP] Información del backup:', JSON.stringify(backupInfo))

    // En este punto, el backup real se hace via GitHub Actions usando pg_dump
    // porque pg_dump no funciona bien desde serverless functions de Vercel
    //
    // Este endpoint solo registra que el cron job se ejecutó
    // y valida que la conexión a la BD está activa

    return NextResponse.json({
      success: true,
      message: 'Backup endpoint OK - el backup real se ejecuta via GitHub Actions',
      data: backupInfo,
    })

  } catch (error) {
    console.error('[BACKUP] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/cron/backup
 *
 * Verifica el estado del endpoint de backup.
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Endpoint de backup activo',
    timestamp: new Date().toISOString(),
    note: 'Usa POST para ejecutar el backup'
  })
}
