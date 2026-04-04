# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NMS (Natatory Management System) es un sistema de gestión de natatorio (piscinas) construido como SPA con Next.js 15. Proporciona CRM para clientes, seguimiento de asistencia, gestión de pagos, reloj de punto para empleados, y facturación ARCA para un negocio de natatoria.

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.5 | Framework React con App Router |
| React | 19 | UI library |
| TypeScript | 5.x | Type safety |
| PostgreSQL | 15+ | Database (Neon serverless) |
| Prisma | 6.x | ORM |
| NextAuth | v4 | Authentication (Credentials + JWT) |
| Tailwind CSS | 4.x | Styling |
| shadcn/ui | latest | Component library |
| Zustand | 5.x | Client state management |
| TanStack Query | 5.x | Server state / data fetching |
| React Hook Form | 7.x | Form handling |
| Zod | 3.x | Schema validation |
| Framer Motion | 11.x | Animations |
| bcrypt | 5.x | Password hashing |
| Vitest | 2.x | Unit/integration testing |
| Playwright | 1.x | E2E testing |

## Common Commands

```bash
# Development
npm run dev              # Start dev server (port 3000)
npm run lint             # ESLint check
npm run lint:fix         # ESLint auto-fix

# Database
npm run db:push          # Push schema (dev only - destructive!)
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Create migration (dev)
npm run db:studio        # Open Prisma Studio
npm run db:seed          # Run seed script (bun run prisma/seed.ts)

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

The app uses a **single-page application** pattern. All navigation happens within `src/app/page.tsx` using React state (`currentView`) with URL sync via `window.history.pushState`.

```typescript
// src/app/page.tsx - Main entry point
const [currentView, setCurrentView] = useState('dashboard')
// Views: dashboard | clientes | asignaciones | facturacion | calendario | configuracion | empleados | gastos

// URL sync pattern
const navigateTo = (view: string) => {
  setCurrentView(view)
  window.history.pushState({}, '', `/${view === 'dashboard' ? '' : view}`)
}
```

### Key Directories

| Directory | Purpose |
|-----------|---------|
| `src/app/page.tsx` | SPA entry - client-side routing |
| `src/app/api/` | API routes (serverless functions) |
| `src/auth.ts` | NextAuth config with Prisma singleton |
| `src/components/modules/` | Business views (lazy-loaded) |
| `src/components/ui/` | shadcn/ui components |
| `src/components/layout/` | Layout components (Sidebar, Header) |
| `src/stores/` | Zustand stores |
| `src/hooks/` | Custom React hooks |
| `prisma/schema.prisma` | Database schema |

### API Route Pattern

API routes follow this pattern for data operations:

```typescript
// src/app/api/[resource]/route.ts
import { auth } from '@/auth'
import { z } from 'zod'
import { NextResponse } from 'next/server'

// GET - List items
export async GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // ... Zod validation, Prisma query, return NextResponse.json({ success, data })
}

// POST - Create item
export async POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  // ... Zod validation, Prisma create, return NextResponse.json({ success, data })
}
```

### API Routes

| Route | Purpose |
|-------|---------|
| `/api/clients` | Client CRUD operations |
| `/api/client-groups` | Client-group assignments (many-to-many) |
| `/api/subscriptions` | Monthly subscription/payment tracking |
| `/api/invoices` | Invoice management with file upload |
| `/api/invoices/[id]/file` | File download/upload for invoices |
| `/api/billing` | ARCA billing/subscription sync |
| `/api/dashboard` | Dashboard statistics |
| `/api/groups` | Group/label management |
| `/api/whatsapp/config` | WhatsApp Business integration |
| `/api/employees` | Employee management |
| `/api/attendance` | Attendance tracking |
| `/api/expenses` | Expense management |
| `/api/calendar` | Calendar events |
| `/api/settings` | Business settings |
| `/api/pricing-plans` | Pricing plan management |

### Authentication

- **Strategy**: NextAuth v4 with Credentials provider + bcrypt
- **Roles**: `EMPLEADORA` (admin), `EMPLEADO` (staff)
- **Session**: JWT stored in httpOnly cookie (30-day TTL)
- **Auth Protection**: API routes use `auth()` from `@/src/auth.ts` for authentication checks
- **Note**: `src/middleware.ts` is disabled (TypeScript error in serverless). Auth is enforced at API route level.

### Prisma Singleton Pattern

In serverless environments (Vercel), Prisma connections must be singleton to avoid connection pool exhaustion:

```typescript
// src/auth.ts or src/lib/db.ts
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }
function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({ log: ['error'] })
  }
  return globalForPrisma.prisma
}
```

### Critical: outputFileTracingRoot

**NEVER add `outputFileTracingRoot` to `next.config.ts`** - it must point to a local path and will cause all serverless functions to fail in production (500 errors). The build system handles tracing automatically.

## Database Schema (Prisma)

### Core Models

- **User** - Authentication users (EMPLEADORA, EMPLEADO roles)
- **Client** - Customer profiles with contact info, notes, active status
- **Group** - Labels/categories for clients (many-to-many with Client)
- **Subscription** - Monthly plans linking clients to pricing plans
- **Invoice** - Billing records with ARCA integration, fileData for PDF storage
- **Attendance** - Swimming class attendance records
- **TimeEntry** - Employee clock-in/out for time tracking
- **Expense** - Business expense records
- **Settings** - Business configuration (currency, timezone, etc.)
- **WhatsAppConfig** - WhatsApp Business API configuration
- **WhatsAppMessage** - Message history and templates
- **CalendarEvent** - Scheduled events and class times
- **PricingPlan** - Service plans (4/8/12 classes per month, individual)
- **Notification** - System notifications
- **ActivityLog** - Audit trail for important actions

### Invoice File Storage

Invoice files are stored as `bytea` (binary) directly in PostgreSQL via `Invoice.fileData`. The `Invoice.filePath` field is deprecated. This approach is serverless-compatible since there is no persistent filesystem on Vercel.

## Environment Variables

### CRITICAL: Database Safety

**NEVER run these commands against a production database:**
- `npm run db:seed` - Overwrites all data with seed data
- `prisma db push --accept-data-loss` - Overwrites schema AND data
- `npm run db:reset` - Drops and recreates database

### Required Environment Variables

```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@ep-xxx.ep-lively-breeze-a4lvgwtw-pooler.us-east-1.aws.neon.tech:5432/neondb?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"  # Development
NEXTAUTH_SECRET="your-secret-here"   # Generate with: openssl rand -base64 32

# WhatsApp Business API (optional)
WHATSAPP_BUSINESS_ACCOUNT_ID=""
WHATSAPP_ACCESS_TOKEN=""
WHATSAPP_PHONE_NUMBER_ID=""

# ARCA Billing (Argentina)
ARCA_CUIT=""
ARCA_SIGN_CERT=""
ARCA_SIGN_KEY=""
```

### Environment Files

| File | Purpose | Safe for Production? |
|------|---------|---------------------|
| `.env` | Local development | NO - used for dev only |
| `.env.local` | Vercel pulled env vars | YES - production values |
| `.env.production` | Production reference | YES - but don't run seed! |

### Database URLs

- **Development**: Use a separate Neon project or local PostgreSQL
- **Production**: `ep-lively-breeze-a4lvgwtw-pooler.us-east-1.aws.neon.tech`

## Vercel Deployment

The `vercel.json` build command runs:
```
npx prisma@6.11.1 generate → npx prisma@6.11.1 migrate deploy → next build
```

**Important**: Production builds use `migrate deploy` (safe) NOT `db push` (destructive).

Production URL: https://oroazul.maat.work

### Data Recovery

If data is lost:
1. Go to https://console.neon.tech
2. Select your project → **Branches**
3. Look for **Restore to a point in time** or **Create a branch from a backup**
4. Restore to a timestamp before the data loss
5. Export data from the restored branch

**Prevention**: Always use separate development and production databases!

## Schema Changes in Production

1. Make schema changes locally first
2. Create migration: `npm run db:migrate`
3. Test in development
4. Deploy to Vercel - migrations run automatically via `migrate deploy`

## Seed Data

The seed script creates:
- 2 users: mariela@nms.com (EMPLEADORA, password: mariela123), tomas@nms.com (EMPLEADO, password: tomas123)
- 4 pricing plans (Mensual 4/8/12 clases, individual)
- Business settings (currency: ARS, timezone: America/Argentina/Cordoba)

**⚠️ WARNING: `npm run db:seed` overwrites all existing data. Only use on development databases!**

## File Locations

| File | Location |
|------|----------|
| NextAuth config | `src/auth.ts` (NOT `src/lib/auth.ts`) |
| Prisma schema | `prisma/schema.prisma` |
| Prisma seed | `bun run prisma/seed.ts` |
| Migration folder | `prisma/migrations/` |
| Production DB | Neon (`ep-lively-breeze-a4lvgwtw-pooler.us-east-1.aws.neon.tech`) |