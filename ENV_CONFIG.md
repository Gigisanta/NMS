# Environment Configuration Guide

## 📦 Base de Datos

### Prisma Postgres (Producción)

La base de datos está alojada en **Prisma Postgres** (gestionado por Vercel Storage).

**Connection String:**
```
postgres://[USER]:[PASSWORD]@[HOST]/[DATABASE]?sslmode=require
```
_Get the actual connection string from Vercel Dashboard → Storage → nms → Quickstart_

## Development (.env)

For local development, create a `.env` file:

```bash
# Prisma Postgres (Vercel) - Get from Vercel Dashboard → Storage → nms
DATABASE_URL="postgres://[USER]:[PASSWORD]@[HOST]/[DATABASE]?sslmode=require"
NEXTAUTH_SECRET="dev-secret-key"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

## Production (Vercel)

The database is now hosted on **Prisma Postgres** (managed by Vercel).

Environment variables are automatically configured when you connect the database to your project in Vercel Storage.

### Manual Setup (if needed)

1. Go to Vercel Dashboard → Storage → nms (Prisma Postgres)
2. Copy the connection string from the Quickstart section
3. Set these variables in Vercel Dashboard → nms → Settings → Environment Variables

| Variable | Value |
|----------|-------|
| DATABASE_URL | From Storage → nms → Quickstart |
| NEXTAUTH_SECRET | Generate with: `openssl rand -base64 32` |
| NEXTAUTH_URL | `https://nms-two.vercel.app` |
| NODE_ENV | `production` |

## Commands

```bash
# Install dependencies
bun install

# Generate Prisma Client
bunx prisma generate

# Push schema to database (creates tables)
bunx prisma db push

# Seed database with test data
bun run db:seed

# Seed production database
DATABASE_URL="postgres://..." bun run db:seed

# Start development server
bun run dev
```

## Test Credentials

| Email | Password | Role |
|-------|----------|------|
| mariela@nms.com | mariela123 | Admin |
| tomas@nms.com | tomas123 | Staff |
| camila@nms.com | camila123 | Staff |

---

## 🐛 Solución de Problemas

### Login no funciona en producción

1. **Verificar que los usuarios existan:**
   ```bash
   DATABASE_URL="postgres://..." bun run db:seed
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
