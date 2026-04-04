# Arquitectura del Sistema NMS

> Documentación técnica de la arquitectura del Natatory Management System

## Visión General

NMS es una aplicación **Single Page Application (SPA)** construida sobre Next.js 15.5 con React 19, usando **TanStack Query** para server state y **Zustand** para client state.

### Stack de Producción

| Componente | Tecnología | Servicio |
|------------|------------|----------|
| Frontend | Next.js 15.5, React 19 | Vercel (Edge Network) |
| API | Next.js API Routes | Vercel (Serverless Functions) |
| Database | PostgreSQL 16 | Neon (Serverless) |
| ORM | Prisma 6 | - |
| Auth | NextAuth v4 (JWT) | Cookies httpOnly |
| Server State | TanStack Query 5 | Client-side caching |
| Client State | Zustand 5 | Client-side storage |
| State Management | React Hook Form | Form state |
| Validation | Zod 4 | Schema validation |
| Rate Limiting | @upstash/ratelimit | Edge functions |
| Error Tracking | Sentry | - |
| Analytics | @vercel/analytics | - |
| Bundle Analysis | npm run analyze | - |

### Principios de Diseño

| Principio | Descripción |
|-----------|-------------|
| **SPA-First** | Toda la navegación ocurre dentro de `page.tsx` usando `window.history.pushState` |
| **TanStack Query** | Server state caching y sincronización |
| **Zustand** | Client state con persistencia en localStorage |
| **Mobile-First** | Diseño responsivo optimizado para dispositivos móviles |
| **Type Safety** | TypeScript estricto en todo el código |
| **Performance** | Lazy loading, memoización y caching |
| **Security** | Autenticación obligatoria con roles y permisos |

## Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTE (Browser)                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    React 19                              │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐ │    │
│  │  │   Zustand    │  │ TanStack     │  │  React Hook    │ │    │
│  │  │   Store      │  │ Query        │  │  Form          │ │    │
│  │  │  (Client     │  │ (Server      │  │  (Form         │ │    │
│  │  │   State)     │  │  State)      │  │   State)       │ │    │
│  │  └──────────────┘  └──────────────┘  └────────────────┘ │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
           │                   │                    │
           │                   │                    │
           ▼                   ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NEXT.JS SERVER (Vercel)                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   Middleware (Auth)                      │    │
│  │  - Verifica sesión JWT                                   │    │
│  │  - Redirige a login si no autenticado                   │    │
│  │  - Rate limiting con @upstash/ratelimit                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                            │                                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   API Routes (Serverless)                 │    │
│  │  /api/clients  /api/groups  /api/subscriptions           │    │
│  │  /api/attendance  /api/invoices  /api/employees          │    │
│  │  /api/expenses  /api/time-entries  /api/calendar          │    │
│  │  /api/dashboard  /api/settings  /api/billing             │    │
│  │  /api/webhook/whatsapp  /api/whatsapp/*                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                            │                                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   PRISMA ORM                              │    │
│  │  - Type-safe database queries                            │    │
│  │  - Connection pooling via Neon                           │    │
│  │  - Binary data (bytea) for invoices                     │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    POSTGRESQL (Neon)                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ users | clients | groups | subscriptions | attendances   │  │
│  │ invoices | accounts | sessions | time_entries            │  │
│  │ expenses | calendar_events | whatsapp_messages            │  │
│  │ pricing_plans | settings | notifications | activity_logs  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Flujo de Datos

### Flujo de Autenticación

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Usuario   │────▶│  Login Form │────▶│  API Auth   │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌──────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│                    NEXTAUTH FLOW                         │
│  1. Verificar credenciales contra DB (bcrypt)           │
│  2. Generar JWT con claims (id, role, email)            │
│  3. Establecer cookie httpOnly (30 días TTL)            │
│  4. Devolver sesión al cliente                          │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Middleware │────▶│   Session   │────▶│   Layout    │
│  (Check)    │     │   Provider  │     │   Protegido │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Flujo de TanStack Query

```
┌─────────────┐
│   Componente│
│   useQuery  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│           TanStack Query                │
│  ┌───────────────────────────────────┐  │
│  │ Query Cache                       │  │
│  │ - Stale-while-revalidate          │  │
│  │ - Background refetching           │  │
│  │ - Query invalidation              │  │
│  └───────────────────────────────────┘  │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│           API Route (Serverless)         │
│  1. auth() para obtener sesión          │
│  2. Validar input con Zod              │
│  3. Ejecutar query con Prisma           │
│  4. Devolver respuesta JSON             │
└─────────────────────────────────────────┘
```

### Flujo de Client State (Zustand)

```
┌─────────────────────────────────────────┐
│           Zustand Store                  │
│  ┌───────────────────────────────────┐  │
│  │ persist (localStorage)           │  │
│  │ - currentView                    │  │
│  │ - sidebarCollapsed               │  │
│  │ - user preferences               │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                    ▲
                    │
              setState()
                    │
                    ▼
┌─────────────────────────────────────────┐
│           React Components               │
│  useAppStore((s) => s.currentView)       │
└─────────────────────────────────────────┘
```

## Estructura de Directorios Detallada

### `/src/app` - App Router

```
src/app/
├── (auth)/                    # Route Group para autenticación
│   ├── layout.tsx            # Layout minimal para auth
│   ├── login/
│   │   └── page.tsx         # Página de login
│   └── register/
│       └── page.tsx         # Página de registro
│
├── api/                       # API Routes (Serverless)
│   ├── auth/
│   │   ├── [...nextauth]/   # NextAuth handler
│   │   └── register/        # Registro de usuarios
│   ├── clients/             # CRUD clientes
│   ├── groups/              # CRUD grupos
│   ├── client-groups/       # Asignaciones muchos-a-muchos
│   ├── subscriptions/       # Suscripciones mensuales
│   ├── attendance/          # Control de asistencia
│   ├── employees/           # Gestión de empleados
│   ├── time-entries/        # Fichaje entrada/salida
│   ├── expenses/            # Control de gastos
│   ├── invoices/            # Facturas (con fileData)
│   │   └── [id]/file/       # Descarga de archivos
│   ├── calendar/            # Eventos del calendario
│   ├── dashboard/           # Estadísticas
│   ├── settings/            # Configuraciones
│   ├── billing/             # ARCA billing
│   ├── pricing-plans/       # Planes de precios
│   ├── webhook/whatsapp/    # Webhook WhatsApp
│   ├── whatsapp/            # Mensajes y config
│   └── route.ts             # Health check
│
├── layout.tsx                 # Layout raíz con providers
├── page.tsx                   # Página principal (SPA entry)
└── globals.css               # Estilos globales + Tailwind
```

### `/src/components` - Componentes React

```
src/components/
├── ui/                        # shadcn/ui (NO MODIFICAR)
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── form.tsx
│   ├── input.tsx
│   ├── table.tsx
│   └── ... (40+ componentes)
│
├── auth/                      # Componentes de autenticación
│   ├── login-form.tsx
│   ├── register-form.tsx
│   └── user-menu.tsx
│
├── layout/                    # Componentes de layout
│   └── app-layout.tsx        # Layout principal con sidebar
│
├── modules/                   # Vistas de negocio (lazy-loaded)
│   ├── dashboard-view.tsx
│   ├── clients-view.tsx
│   ├── client-form.tsx
│   ├── client-profile.tsx
│   ├── attendance-view.tsx
│   ├── payments-view.tsx
│   ├── group-selector.tsx
│   └── schedule-selector.tsx
│
└── providers/                 # Context providers
    └── session-provider.tsx
```

### `/src/lib` - Utilidades y Configuración

```
src/lib/
├── db.ts                      # Cliente Prisma singleton
├── auth.ts                    # Configuración NextAuth
├── queryClient.ts            # TanStack Query config
├── utils.ts                  # Utilidades (cn, format, etc.)
└── ratelimit.ts              # Rate limiting config
```

### `/src/store` - Estado Global

```
src/store/
└── index.ts                   # Zustand store con persistencia
```

### `/src/hooks` - Custom Hooks

```
src/hooks/
├── use-optimized.ts           # useDebounce, useThrottle, etc.
└── use-mobile.ts              # Detección de dispositivo móvil
```

## Sistema de Autenticación

### Arquitectura de Autenticación

```
┌─────────────────────────────────────────────────────────┐
│                 NEXTAUTH CONFIGURATION                   │
│                                                          │
│  Providers:                                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Credentials Provider                           │   │
│  │  - Email + Password                              │   │
│  │  - Verificación con bcrypt (12 rounds)          │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  Session Strategy: JWT                                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  - Almacenado en cookie httpOnly                 │   │
│  │  - TTL: 30 días                                  │   │
│  │  - Claims: id, name, email, role                 │   │
│  └─────────────────────────────────────────────────┘   │
```

### Roles y Permisos

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| **EMPLEADORA** | Admin | Acceso completo: usuarios, clientes, grupos, pagos, configuración, empleados, gastos |
| **EMPLEADO** | Staff | Ver clientes, registrar asistencia, fichar, ver reportes, dashboard |

### Middleware de Protección

```typescript
// src/middleware.ts
// Protege automáticamente todas las rutas excepto:
// - /login
// - /register
// - /api/auth/*
// - /api/webhook/whatsapp
// - Static files

// Rate limiting con @upstash/ratelimit
```

## Capa de Datos

### Neon PostgreSQL

El proyecto usa **Neon** como base de datos PostgreSQL serverless:

- **Connection String**: Configurado como `DATABASE_URL` en Vercel
- **SSL**: `sslmode=require` para conexiones seguras
- **Pooling**: Neon maneja connection pooling automáticamente
- **Binary Data**: Invoice.fileData (bytea) almacena archivos en PostgreSQL
- **Branching**: Soporta ramas de base de datos para desarrollo

### Invoice File Storage

Los archivos de facturas se almacenan como **bytea** (binary) directamente en PostgreSQL:

```prisma
model Invoice {
  id         String  @id @default(cuid())
  clientId   String
  fileData   Bytes?  @db.ByteA  // Archivo binario
  fileName   String
  fileSize   Int?
  mimeType   String
  // ...
}
```

### Patrones de Acceso a Datos

```typescript
// TanStack Query para server state
const { data, isLoading } = useQuery({
  queryKey: ['clients', { page, search }],
  queryFn: () => fetchClients({ page, search }),
  staleTime: 5 * 60 * 1000, // 5 minutos
})

// Mutación con invalidación
const mutation = useMutation({
  mutationFn: createClient,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['clients'] })
  },
})

// Transacciones Prisma
await db.$transaction([
  db.subscription.create({ data: subData }),
  db.attendance.create({ data: attendanceData }),
])
```

## Arquitectura de UI

### SPA Routing Pattern

```
App (page.tsx)
│
├── SessionProvider (next-auth)
│   │
│   └── AppLayout
│       │
│       ├── Sidebar (navegación con window.history.pushState)
│       │   ├── Logo
│       │   ├── NavItems (dashboard | clientes | asistencia | ...)
│       │   └── UserMenu
│       │
│       └── MainContent
│           │
│           ├── Header (título, acciones)
│           │
│           └── ViewContainer (Suspense + Lazy)
│               │
│               ├── DashboardView
│               ├── ClientsView
│               ├── AttendanceView
│               ├── PaymentsView
│               ├── CalendarView
│               ├── EmployeesView
│               ├── ExpensesView
│               └── SettingsView
```

### Responsive Design Strategy

```
┌─────────────────────────────────────────────────────────┐
│                    BREAKPOINTS                           │
│                                                          │
│  Mobile:  < 640px (sm)                                 │
│  - Sidebar oculto, hamburger menu                       │
│  - Cards en columna única                                │
│  - Tablas con scroll horizontal                         │
│                                                          │
│  Tablet: 640px - 1024px (md)                           │
│  - Sidebar colapsado                                    │
│  - Grid 2 columnas                                     │
│                                                          │
│  Desktop: > 1024px (lg)                                │
│  - Sidebar expandido                                    │
│  - Grid 4 columnas                                     │
│  - Tablas completas                                     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Deployment en Vercel

### Arquitectura de Deployment

```
GitHub Push → Vercel CI/CD → Build → Deploy

Build Process:
1. npm install
2. npx prisma@6.11.1 migrate deploy
3. npx prisma@6.11.1 generate
4. next build
```

### Environments

| Environment | Trigger | URL Pattern |
|-------------|---------|-------------|
| Production | Push a main | oroazul.maat.work |
| Preview | Pull Request | nms-giolivos-projects-git-*.vercel.app |

### Integraciones Vercel

| Integración | Propósito |
|-------------|----------|
| Sentry | Error tracking y monitoring |
| @vercel/analytics | Analytics de uso |
| Bundle Analyzer | npm run analyze |

## Escalabilidad y Extensibilidad

### Decisiones Arquitectónicas

1. **Prisma ORM**: Permite migrar fácilmente a cualquier base de datos relacional
2. **Neon PostgreSQL**: Serverless con branching y auto-scaling
3. **TanStack Query**: Caching inteligente y sincronización de estado del servidor
4. **Zustand**: Estado del cliente ligero y predecible
5. **Vercel Edge Network**: CDN global con low latency

### Extension Points

```
┌─────────────────────────────────────────────────────────┐
│                    EXTENSION POINTS                     │
│                                                          │
│  1. Nuevos módulos de negocio                           │
│     - Agregar vista en /components/modules/             │
│     - Agregar API routes correspondientes                │
│     - Actualizar estado en Zustand store                │
│                                                          │
│  2. Nuevos proveedores de autenticación                 │
│     - Agregar provider en auth.ts                       │
│     - Configurar callback URL                            │
│                                                          │
│  3. Integraciones externas                               │
│     - Webhooks en /api/webhook/                         │
│     - APIs externas vía fetch                           │
│                                                          │
│  4. Nuevos tipos de entidades                           │
│     - Actualizar schema.prisma                          │
│     - Crear tipos en /types                             │
│     - Crear esquemas en /schemas                        │
│     - Crear API routes                                  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

**Última actualización:** 2026-04-01
**Versión:** 3.0.0
