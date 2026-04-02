# Environment Configuration Guide

## Database

### Neon PostgreSQL (Producción)

La base de datos está alojada en **Neon PostgreSQL** (serverless).

**Connection String:**
```
postgres://[USER]:[PASSWORD]@[HOST]/[DATABASE]?sslmode=require
```
_Get the actual connection string from Neon Console → Project → Connection Details_

### Development (.env)

For local development, create a `.env` file:

```bash
# Neon PostgreSQL - Get from Neon Console → Project → Connection Details
DATABASE_URL="postgres://[USER]:[PASSWORD]@[HOST]/[DATABASE]?sslmode=require"
NEXTAUTH_SECRET="dev-secret-key"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

### Production (Vercel)

The database is hosted on **Neon PostgreSQL**.

Environment variables are configured in Vercel Dashboard → Project → Settings → Environment Variables.

| Variable | Value |
|----------|-------|
| DATABASE_URL | From Neon Console → Connection Details |
| NEXTAUTH_SECRET | Generate with: `openssl rand -base64 32` |
| NEXTAUTH_URL | `https://nms-giolivos-projects.vercel.app` |
| NODE_ENV | `production` |

## Authentication

### NextAuth Configuration

- **Provider**: Credentials (email/password)
- **Session**: JWT with 30-day TTL
- **Cookie**: httpOnly, secure in production

### Test Credentials

| Email | Password | Role |
|-------|----------|------|
| mariela@nms.com | mariela123 | Admin (EMPLEADORA) |
| tomas@nms.com | tomas123 | Staff (EMPLEADO) |

## Sentry Error Tracking

Configurar para monitoreo de errores en producción:

```bash
# Client-side DSN (public)
NEXT_PUBLIC_SENTRY_DSN="https://[key]@o[sentry-org].ingest.sentry.io/[project]"

# Server-side DSN
SENTRY_DSN="https://[key]@o[sentry-org].ingest.sentry.io/[project]"
```

## Rate Limiting

Using Upstash Redis for API rate limiting:

```bash
# Upstash Redis REST API
UPSTASH_REDIS_REST_URL="https://[region].upstash.io"
UPSTASH_REDIS_REST_TOKEN="[your-token]"
```

## Invoice Storage

Invoice files are stored as `bytea` in PostgreSQL via `Invoice.fileData` field.

```bash
# Vercel Blob Storage (optional - for large file handling)
BLOB_READ_WRITE_TOKEN=""
```

## WhatsApp Business API (optional)

```bash
WHATSAPP_BUSINESS_TOKEN=""
WHATSAPP_PHONE_NUMBER_ID=""
```

## Commands

```bash
# Install dependencies
npm install

# Generate Prisma Client
npm run db:generate

# Push schema to database (creates tables)
npm run db:push

# Run migrations
npm run db:migrate

# Seed database with test data (DEV ONLY)
npm run db:seed

# Start development server
npm run dev
```

---

## Troubleshooting

### Login no funciona en producción

1. **Verificar que los usuarios existan:**
   ```bash
   DATABASE_URL="postgres://..." npm run db:seed
   ```

2. **Verificar variables de entorno en Vercel:**
   - DATABASE_URL
   - NEXTAUTH_SECRET
   - NEXTAUTH_URL
   - NODE_ENV=production

3. **Verificar cookies del middleware:**
   El middleware acepta cookies seguras de NextAuth:
   - `next-auth.token`
   - `next-auth.session-token`
   - `__Secure-next-auth.token`
   - `__Secure-next-auth.session-token`

### Rate limiting no funciona

1. Verificar `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`
2. Verificar que Redis esté activo en Upstash Console

### Errores de Sentry

1. Verificar `SENTRY_DSN` y `NEXT_PUBLIC_SENTRY_DSN`
2. Verificar que el proyecto exista en Sentry Dashboard
