# Environment Configuration Guide

## Development (.env)

For local development, create a `.env` file:

```bash
# Local PostgreSQL (or use SQLite)
DATABASE_URL="postgresql://user:password@localhost:5432/nms_dev"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

## Production (Vercel)

Set these environment variables in Vercel Dashboard:

1. Go to Vercel Dashboard → nms-two → Settings → Environment Variables
2. Add these variables for Production:

| Variable | Value |
|----------|-------|
| DATABASE_URL | `postgresql://neondb_owner:YOUR_PASSWORD@ep-sparkling-band-achzyg6y-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require` |
| NEXTAUTH_SECRET | Generate with: `openssl rand -base64 32` |
| NEXTAUTH_URL | `https://nms-two.vercel.app` |

## Commands

```bash
# Local development
bun install
bunx prisma generate
bunx prisma db push
bun run db:seed
bun run dev
```

## Test Credentials

| Email | Password | Role |
|-------|----------|------|
| mariela@nms.com | mariela123 | Admin |
| tomas@nms.com | tomas123 | Staff |
| camila@nms.com | camila123 | Staff |
