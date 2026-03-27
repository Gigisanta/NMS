# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NMS (Natatory Management System) is a Next.js 15 SPA for managing swimming pools. It provides CRM, attendance tracking, payment management, employee timeClock, and WhatsApp integration for a natatorium business.

## Tech Stack

- **Framework**: Next.js 15.5 with App Router (SPA pattern)
- **Database**: PostgreSQL via Neon (serverless)
- **ORM**: Prisma 6
- **Auth**: NextAuth v4 (Credentials provider, JWT sessions)
- **UI**: shadcn/ui, Tailwind CSS 4, Framer Motion, Zustand
- **Forms**: React Hook Form + Zod
- **Testing**: Vitest (unit/integration), Playwright (e2e)
- **Deployment**: Vercel

## Common Commands

```bash
# Development
npm run dev              # Start dev server (port 3000)
npm run lint             # ESLint check

# Database
npm run db:push          # Push schema without migration
npm run db:generate       # Generate Prisma client
npm run db:migrate        # Create migration (dev)
npm run db:seed           # Run seed script (bun run prisma/seed.ts)

# Build & Production
npm run build            # Standard Next.js build
npm run build:standalone  # Standalone build for Vercel
npm run start             # Start production server

# Testing
npm run test              # Run all tests (vitest)
npm run test:run          # Run tests once
npm run test:unit         # Unit tests only
npm run test:e2e          # Playwright e2e tests
npm run test:e2e:ui        # Playwright with UI
```

## Architecture

### SPA Routing Pattern
The app uses a **single-page application** pattern. All navigation happens within `src/app/page.tsx` using React state (`currentView`). API routes serve data, but UI routing is entirely client-side.

```typescript
// src/app/page.tsx - Main entry point
const [currentView, setCurrentView] = useState('dashboard')
// Views: dashboard | clientes | asignaciones | facturacion | calendario | configuracion | empleados | gastos
```

### Key Directories

| Directory | Purpose |
|-----------|---------|
| `src/app/page.tsx` | SPA entry - client-side routing |
| `src/app/api/` | API routes (serverless functions) |
| `src/components/modules/` | Business views (lazy-loaded) |
| `src/components/ui/` | shadcn/ui components |
| `src/lib/` | Auth config, Prisma client, utilities |
| `prisma/schema.prisma` | Database schema |

### API Route Pattern

API routes follow this pattern for data operations:

```typescript
// src/app/api/[resource]/route.ts
// - auth() from NextAuth to get session
// - Zod for input validation
// - Prisma for DB operations
// - return NextResponse.json({ success, data })
```

### Authentication

- **Strategy**: NextAuth v4 with Credentials provider + bcrypt
- **Roles**: `EMPLEADORA` (admin), `EMPLEADO` (staff)
- **Session**: JWT stored in httpOnly cookie (30-day TTL)
- **Middleware**: Protects all routes except `/login`, `/register`, `/api/auth/*`

### Database Schema (Prisma)

Key models: `User`, `Client`, `Group`, `Subscription`, `Invoice`, `Attendance`, `TimeEntry`, `Expense`, `Settings`, `WhatsAppConfig`, `WhatsAppMessage`, `CalendarEvent`, `PricingPlan`, `Notification`, `ActivityLog`

## Environment Variables

### CRITICAL: Database Safety

**NEVER run these commands against a production database:**
- `npm run db:seed` - Overwrites all data with seed data
- `prisma db push --accept-data-loss` - Overwrites schema AND data
- `npm run db:reset` - Drops and recreates database

### Environment Files

| File | Purpose | Safe for Production? |
|------|---------|---------------------|
| `.env` | Local development | NO - used for dev only |
| `.env.local` | Vercel pulled env vars | YES - production values |
| `.env.production` | Production reference | YES - but don't run seed! |

### Database URLs

- **Development**: Use a separate Neon project or local PostgreSQL
- **Production**: `ep-lively-breeze-a4lvgwtw-pooler.us-east-1.aws.neon.tech`

### Vercel Deployment

The `vercel.json` build command runs:
```
prisma generate → prisma migrate deploy → next build
```

**Important**: Production builds use `migrate deploy` (safe) NOT `db push` (destructive).

Production URL: https://nms-giolivos-projects.vercel.app

### Schema Changes in Production

1. Make schema changes locally first
2. Create migration: `npm run db:migrate`
3. Test in development
4. Deploy to Vercel - migrations run automatically via `migrate deploy`

### Data Recovery

If data is lost:
1. Go to https://console.neon.tech
2. Select your project → **Branches**
3. Look for **Restore to a point in time** or **Create a branch from a backup**
4. Restore to a timestamp before the data loss
5. Export data from the restored branch

**Prevention**: Always use separate development and production databases!

## Seed Data

The seed script creates:
- 2 users: mariela@nms.com (EMPLEADORA), tomas@nms.com (EMPLEADO)
- 4 pricing plans (Mensual 4/8/12 clases, individual)
- Business settings (currency: ARS, timezone: America/Argentina/Cordoba)

**⚠️ WARNING: `npm run db:seed` overwrites all existing data. Only use on development databases!**
