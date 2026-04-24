# Configuración de Backup Automático - NMS

Este documento describe cómo se configura el backup automático de la base de datos.

## Arquitectura

```
GitHub Actions (00:00 UTC daily)
         │
         ▼
┌─────────────────┐
│   pg_dump       │
│   Neon DB       │
└────────┬────────┘
         │ (gzipped SQL)
         ▼
┌─────────────────┐
│  Vercel Blob    │
│  nms-backups    │
│  (private)       │
└─────────────────┘
```

## Configuración Requerida

### 1. Obtener Token de Vercel Blob

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto **NMS**
3. Ve a **Storage** → **nms-backups**
4. Click en **...** (más opciones)
5. Selecciona **Create Token**
6. Copia el token generado (solo se muestra una vez)

### 2. Agregar Secrets a GitHub

1. Ve a tu repositorio en GitHub
2. Settings → Secrets and variables → Actions
3. Agrega los siguientes secrets:

| Secret Name | Value |
|-------------|-------|
| `BLOB_READ_WRITE_TOKEN` | Token que copiaste del dashboard |
| `BLOB_STORE_ID` | `i20jdwu2bjntcybU` (ID del blob store) |
| `CRON_SECRET` | Una cadena random para autenticar el cron (genera con `openssl rand -base64 32`) |

### 3. Obtener BLOB_STORE_ID

El ID del blob store es: `i20jdwu2bjntcybU`

Puedes verificarlo ejecutando:
```bash
npx vercel blob list-stores --all
```

## Verificar el Setup

### Test Manual del Cron Job

1. Ve a GitHub → Actions
2. Selecciona "Daily Neon Database Backup"
3. Click "Run workflow"
4. Verifica que el backup se suba correctamente

### Verificar Backup en Vercel Blob

```bash
npx vercel blob list --rw-token TU_TOKEN
```

## Recuperación de un Backup

### Desde Vercel Blob:

1. Descarga el archivo `.sql.gz` del blob store
2. Descomprime: `gunzip nms-backup-YYYY-MM-DD@HH:MM:SS.sql.gz`
3. Restaura: `psql "$DATABASE_URL" < nms-backup-YYYY-MM-DD@HH:MM:SS.sql`

### Desde Point-in-Time Recovery (Neon):

1. Ve a [Neon Console](https://console.neon.tech)
2. Selecciona tu proyecto
3. Branches → Main branch
4. Actions → Restore to point in time

## Schedule

- **GitHub Actions**: Daily at 00:00 UTC (03:00 Argentina)
- **Vercel Cron**: También configurado para 00:00 UTC

## Retención

- **GitHub Actions**: Mantiene backups en Vercel Blob
- **Vercel Blob**: 5 GB gratis (suficiente para ~100 backups de ~50MB cada uno)
- **Recomendado**: 7 días de backups

## Troubleshooting

### "BLOB_READ_WRITE_TOKEN no está configurado"
Ve a GitHub → Settings → Secrets → Actions y agrega el secret.

### "No se pudo conectar a la base de datos"
Verifica que `Neon_DATABASE_URL_UNPOOLED` esté configurado correctamente en Vercel.

### Backup muy grande
Los invoices con `fileData` (bytea) ocupan espacio significativo. Considera архивировать solo datos recientes.

## Costo Estimado

| Recurso | Uso | Costo |
|---------|-----|-------|
| Vercel Blob Storage | ~350 MB (7 backups) | $0 (dentro del tier gratuito) |
| Operations | ~30/month | $0 (dentro del tier gratuito) |
| GitHub Actions | 30 min/month | $0 (tier gratuito) |

**Total: $0/month** mientras estés en el tier gratuito.
