# Environment Configuration Guide

## Development (.env)

For local development, create a `.env` file:

```bash
# Prisma Postgres (Vercel)
DATABASE_URL="postgres://9850fa571566b432b2d5486a1f230745dafa941f83aaa0880eb5b541b67a61d9:sk_4Uausia5JafVxcMAxg-YS@db.prisma.io:5432/postgres?sslmode=require"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
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

# Start development server
bun run dev
```

## Test Credentials

| Email | Password | Role |
|-------|----------|------|
| mariela@nms.com | mariela123 | Admin |
| tomas@nms.com | tomas123 | Staff |
| camila@nms.com | camila123 | Staff |
