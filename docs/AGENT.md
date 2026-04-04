# AGENT.md - Guía para Agentes de Código

> Este documento está diseñado para optimizar la interacción de agentes de IA con el repositorio NMS (Natatory Management System).

## Información del Proyecto

### Nombre del Proyecto
**NMS - Natatory Management System** (Sistema de Gestión de Piscinas)

### Descripción
Sistema de gestión integral para natatorios/piscinas que incluye:
- CRM de clientes con grupos (relación muchos a muchos)
- Control de asistencia y fichaje de empleados (TimeEntry)
- Gestión de pagos y suscripciones mensuales
- Control de gastos (expenses) con categorización
- Calendario de eventos
- Integración WhatsApp Business (webhook + mensajes)
- Facturas con almacenamiento binario en PostgreSQL (fileData)
- Sistema de autenticación con roles y permisos
- Notificaciones y logs de actividad

### Stack Tecnológico Obligatorio
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Next.js | 15.5.x | Framework React con App Router |
| React | 19.x | UI Library |
| TypeScript | 5.x | Tipado estático |
| Prisma | 6.x | ORM para PostgreSQL |
| PostgreSQL | 16 (Neon) | Base de datos serverless |
| TanStack Query | 5.x | Server state / API cache |
| Zustand | 5.x | Client state global |
| Tailwind CSS | 4.x | Estilos utilitarios |
| shadcn/ui | - | Componentes UI |
| NextAuth | 4.x | Autenticación (Credentials + JWT) |
| React Hook Form | 7.x | Formularios |
| Zod | 4.x | Validación de esquemas |
| Framer Motion | 11.x | Animaciones |
| @upstash/ratelimit | - | Rate limiting |
| Sentry | - | Error tracking |
| @vercel/analytics | - | Analytics |

## Estructura del Proyecto

```
nms/
├── prisma/
│   ├── schema.prisma      # Esquema de base de datos
│   ├── seed.ts            # Datos iniciales
│   └── migrations/        # Migraciones Prisma
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── (auth)/       # Rutas de autenticación
│   │   ├── api/          # API Routes (serverless)
│   │   ├── layout.tsx    # Layout raíz
│   │   ├── page.tsx     # Página principal (SPA)
│   │   └── globals.css  # Estilos globales
│   ├── components/
│   │   ├── ui/          # Componentes shadcn/ui
│   │   ├── auth/        # Componentes de autenticación
│   │   ├── layout/      # Componentes de layout (sidebar, header)
│   │   ├── modules/     # Vistas de negocio (lazy-loaded)
│   │   └── providers/   # Context providers
│   ├── hooks/           # Custom hooks
│   ├── lib/
│   │   ├── db.ts        # Cliente Prisma singleton
│   │   ├── auth.ts      # Configuración NextAuth
│   │   ├── queryClient.ts # TanStack Query config
│   │   └── utils.ts     # Utilidades (cn, format, etc.)
│   ├── schemas/         # Esquemas Zod
│   ├── store/           # Estado global Zustand
│   ├── types/           # Tipos TypeScript
│   └── middleware.ts    # Middleware de autenticación
├── docs/                 # Documentación
├── vercel.json          # Configuración de Vercel
└── package.json
```

## Patrones de Código Obligatorios

### 1. Convenciones de Nombres

```typescript
// Componentes: PascalCase
export function ClientCard() {}
export const DashboardView = () => {}

// Funciones/utilidades: camelCase
export async function getClients() {}
export const formatDate = () => {}

// Constantes: SCREAMING_SNAKE_CASE
const CACHE_TTL = 5 * 60 * 1000
export const DEFAULT_PAGE_SIZE = 20

// Tipos/Interfaces: PascalCase
export interface Client {}
export type PaymentStatus = 'AL_DIA' | 'PENDIENTE' | 'DEUDOR'

// Archivos: kebab-case para páginas, PascalCase para componentes
// clients-view.tsx, client-form.tsx
// ClientCard.tsx, DashboardView.tsx
```

### 2. SPA Routing Pattern

La app usa **client-side routing** con `window.history.pushState`. No crear nuevas rutas en `src/app/`.

```typescript
// src/app/page.tsx
const [currentView, setCurrentView] = useState('dashboard')
// Views: dashboard | clientes | asistentes | facturacion | calendario | configuracion | empleados | gastos
```

### 3. TanStack Query + Zustand Pattern

```typescript
// TanStack Query para server state (API data)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'

// Zustand para client state (UI state, preferences)
import { useAppStore } from '@/store'

// NO localStorage directo - usar persist de Zustand
```

### 4. Estructura de API Routes

```typescript
// Patrón obligatorio para API routes
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { clientSchema } from '@/schemas/client'
import type { NextRequest } from 'next/server'

// Rate limiting
import { ratelimit } from '@/lib/ratelimit'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }

    const clients = await db.client.findMany({ ... })
    return NextResponse.json({ success: true, data: clients })
  } catch (error) {
    console.error('[API] Error:', error)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}
```

### 5. Uso de Zustand Store

```typescript
// Store en src/store/index.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  currentView: string
  setCurrentView: (view: string) => void
  // ... más estado
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentView: 'dashboard',
      setCurrentView: (view) => set({ currentView: view }),
    }),
    { name: 'nms-storage' }
  )
)

// Selectores específicos para evitar re-renders
const currentView = useAppStore((state) => state.currentView)
```

### 6. Validación con Zod

```typescript
// Esquemas en src/schemas/
import { z } from 'zod'

export const clientSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  telefono: z.string().min(8, 'Teléfono inválido'),
})
```

## Sistema de Autenticación

### Roles y Permisos

```typescript
type Role = 'EMPLEADORA' | 'EMPLEADO'

// EMPLEADORA (Admin): Acceso completo
// - Gestión de usuarios y empleados
// - Gestión de clientes (CRUD completo)
// - Gestión de grupos y asignaciones
// - Gestión de suscripciones y facturas
// - Control de gastos y empleados
// - Configuración del sistema

// EMPLEADO (Staff): Acceso limitado
// - Ver clientes (solo lectura)
// - Marcar asistencia
// - Fichar entrada/salida
// - Ver reportes y dashboard
// - Sin acceso a configuración avanzada
```

### Credenciales de Prueba (Creadas por Seed)

```typescript
// EMPLEADORA (Admin)
email: 'mariela@nms.com'
password: 'mariela123'

// EMPLEADO (Staff)
email: 'tomas@nms.com'
password: 'tomas123'
employeeRole: 'ADMINISTRATIVO'
```

## API Endpoints

### Formato de Respuestas

```typescript
// Respuesta exitosa
{ "success": true, "data": { ... } }

// Respuesta con paginación
{
  "success": true,
  "data": [...],
  "pagination": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}

// Error
{ "success": false, "error": "Mensaje de error" }
```

### Endpoints Disponibles

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/register | Registrar usuario | Público |
| POST | /api/auth/signin | Iniciar sesión | Público |
| GET | /api/clients | Listar clientes | Requerida |
| POST | /api/clients | Crear cliente | Requerida |
| GET | /api/clients/:id | Obtener cliente | Requerida |
| PUT | /api/clients/:id | Actualizar cliente | Requerida |
| DELETE | /api/clients/:id | Eliminar cliente | EMPLEADORA |
| GET | /api/groups | Listar grupos | Requerida |
| POST | /api/groups | Crear grupo | EMPLEADORA |
| GET | /api/client-groups | Listar asignaciones | Requerida |
| POST | /api/client-groups | Asignar cliente a grupo | EMPLEADORA |
| GET | /api/subscriptions | Listar suscripciones | Requerida |
| POST | /api/subscriptions | Crear suscripción | EMPLEADORA |
| GET | /api/attendance | Listar/registrar asistencia | Requerida |
| GET | /api/employees | Listar empleados | EMPLEADORA |
| POST | /api/employees | Crear empleado | EMPLEADORA |
| GET | /api/time-entries | Listar fichajes | Requerida |
| POST | /api/time-entries | Registrar fichaje | Requerida |
| GET | /api/expenses | Listar gastos | EMPLEADORA |
| POST | /api/expenses | Crear gasto | EMPLEADORA |
| GET | /api/invoices | Listar facturas | Requerida |
| POST | /api/invoices | Crear factura | Requerida |
| GET | /api/invoices/:id/file | Descargar archivo | Requerida |
| GET | /api/calendar | Listar eventos | Requerida |
| POST | /api/calendar | Crear evento | Requerida |
| GET | /api/dashboard | Estadísticas | Requerida |
| GET | /api/settings | Configuraciones | EMPLEADORA |
| POST | /api/settings | Actualizar setting | EMPLEADORA |
| GET | /api/billing | ARCA billing | EMPLEADORA |
| POST | /api/webhook/whatsapp | Webhook WhatsApp | Público |
| GET | /api/whatsapp/config | Config WhatsApp | EMPLEADORA |
| POST | /api/whatsapp/config | Guardar config | EMPLEADORA |
| GET | /api/pricing-plans | Planes de precios | Requerida |

## Base de Datos (Prisma Schema)

### Modelos Principales

```prisma
// Users (autenticación + empleados)
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  password     String
  role         Role     @default(EMPLEADO)
  employeeRole String?
  timeEntries  TimeEntry[]
  expenses     Expense[]
}

// Groups (etiquetas/categorías)
model Group {
  id          String   @id @default(cuid())
  name        String   @unique
  color       String   @default("#06b6d4")
  clients     Client[]
  clientGroups ClientGroup[]
}

// ClientGroup (many-to-many)
model ClientGroup {
  id        String @id @default(cuid())
  clientId  String
  groupId   String
  client    Client @relation(...)
  group     Group  @relation(...)

  @@unique([clientId, groupId])
}

// Clientes
model Client {
  id            String   @id @default(cuid())
  nombre        String
  telefono      String?
  subscriptions Subscription[]
  invoices      Invoice[]
  attendances   Attendance[]
  clientGroups  ClientGroup[]
}

// Suscripciones
model Subscription {
  id           String @id @default(cuid())
  clientId     String
  month        Int
  year         Int
  status       String @default("PENDIENTE")

  @@index([clientId, status])
}

// Asistencias
model Attendance {
  id        String   @id @default(cuid())
  clientId  String
  date      DateTime @default(now())

  @@index([clientId, date])
}

// TimeEntry (fichaje empleados)
model TimeEntry {
  id       String   @id @default(cuid())
  userId   String
  clockIn  DateTime
  clockOut DateTime?

  @@index([userId, clockIn])
}

// Expenses (gastos)
model Expense {
  id       String   @id @default(cuid())
  amount   Decimal
  category ExpenseCategory

  @@index([category])
  @@index([date])
}

// Invoice (archivos en PostgreSQL bytea)
model Invoice {
  id         String @id @default(cuid())
  clientId   String
  fileData   Bytes? @db.ByteA  // Archivo binario almacenado en PG
  verified   Boolean @default(false)
}

// WhatsAppMessage
model WhatsAppMessage {
  id              String @id @default(cuid())
  matchedClientId String?

  @@index([matchedClientId])
}
```

### Índices Definidos

```prisma
TimeEntry[userId, clockIn]
Subscription[clientId, status]
Attendance[clientId, date]
WhatsAppMessage[matchedClientId]
ClientGroup[clientId]
ClientGroup[groupId]
Expense[category]
Expense[date]
```

## Deployment (Vercel)

### Build Command

```json
{
  "buildCommand": "npx prisma@6.11.1 migrate deploy && npx prisma@6.11.1 generate && next build"
}
```

### Variables de Entorno en Vercel

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Connection string de Neon PostgreSQL |
| `NEXTAUTH_SECRET` | Secret para JWT (generado automáticamente) |
| `NEXTAUTH_URL` | URL de producción |

### URL de Producción
**https://nms-giolivos-projects.vercel.app**

## Reglas Importantes

### NUNCA Hacer

1. **No usar localStorage directamente** - Usar Zustand con persist
2. **No hardcodear credenciales** - Usar seed.ts para datos de prueba
3. **No ignorar errores de TypeScript** - Corregir antes de commit
4. **No usar `any` sin justificación** - Preferir tipos específicos
5. **No crear rutas nuevas en src/app** - La app es SPA, solo modificar page.tsx
6. **No ejecutar Prisma migrate en producción** - Usar `migrate deploy`
7. **No usar `db push --accept-data-loss` en producción**

### SIEMPRE Hacer

1. **Verificar autenticación** en cada API route
2. **Validar input** con Zod antes de procesar
3. **Usar transacciones** para operaciones múltiples
4. **Invalidar TanStack Query cache** después de mutaciones
5. **Manejar errores** con try-catch y mensajes claros
6. **Usar componentes existentes** de shadcn/ui
7. **Mantener responsive** todos los componentes
8. **Escribir tests** para nueva funcionalidad
9. **Usar rate limiting** en endpoints públicos

## Variables de Entorno (Desarrollo)

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/nms"
NEXTAUTH_SECRET="your-secret-key-at-least-32-characters"
NEXTAUTH_URL="http://localhost:3000"
```

## Comandos Útiles

```bash
# Desarrollo
npm run dev

# Verificar código
npm run lint

# Build standalone (para Vercel)
npm run build:standalone

# Bundle analyzer
npm run analyze

# Database
npm run db:push
npm run db:generate
npm run db:migrate
npm run db:seed

# Testing
npm run test
npm run test:e2e
```

---

**Última actualización:** 2026-04-01
**Versión del documento:** 3.0.0
