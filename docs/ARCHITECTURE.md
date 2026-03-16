# 🏛️ Arquitectura del Sistema NMS

> Documentación técnica de la arquitectura del Natatory Management System

## 📊 Visión General

NMS es una aplicación **Single Page Application (SPA)** construida sobre Next.js 16 con App Router, diseñada para gestionar natatorios y piscinas de manera integral.

### Principios de Diseño

| Principio | Descripción |
|-----------|-------------|
| **SPA-First** | Toda la navegación ocurre dentro de `page.tsx` sin rutas adicionales |
| **Mobile-First** | Diseño responsivo optimizado para dispositivos móviles |
| **Type Safety** | TypeScript estricto en todo el código |
| **Performance** | Lazy loading, memoización y caching implementados |
| **Security** | Autenticación obligatoria con roles y permisos |

## 🏗️ Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTE (Browser)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   React     │  │  Zustand    │  │   React Query Cache     │  │
│  │  Components │  │   Store     │  │   (Server State)        │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
└─────────┼────────────────┼─────────────────────┼────────────────┘
          │                │                     │
          │                │                     │
┌─────────┼────────────────┼─────────────────────┼────────────────┐
│         │                │                     │                 │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────────▼───────────┐     │
│  │   Layout    │  │   Session   │  │    API Client        │     │
│  │  Provider   │  │   Provider  │  │    (fetch)           │     │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬───────────┘     │
│         │                │                     │                 │
│         └────────────────┼─────────────────────┘                 │
│                          │                                       │
│                    NEXT.JS SERVER                                │
│  ┌───────────────────────┼───────────────────────────────────┐  │
│  │                       │                                   │  │
│  │  ┌────────────────────▼────────────────────────────┐     │  │
│  │  │              MIDDLEWARE (Auth)                   │     │  │
│  │  │  - Verifica sesión JWT                           │     │  │
│  │  │  - Redirige a login si no autenticado           │     │  │
│  │  │  - Protege rutas API y páginas                  │     │  │
│  │  └────────────────────┬────────────────────────────┘     │  │
│  │                       │                                   │  │
│  │  ┌────────────────────▼────────────────────────────┐     │  │
│  │  │              API ROUTES                         │     │  │
│  │  │  /api/clients    /api/groups                    │     │  │
│  │  │  /api/subscriptions  /api/attendance            │     │  │
│  │  │  /api/dashboard   /api/webhook/whatsapp         │     │  │
│  │  └────────────────────┬────────────────────────────┘     │  │
│  │                       │                                   │  │
│  │  ┌────────────────────▼────────────────────────────┐     │  │
│  │  │              CACHE LAYER                        │     │  │
│  │  │  - In-memory cache (TTL configurable)           │     │  │
│  │  │  - Cache invalidation on mutations              │     │  │
│  │  └────────────────────┬────────────────────────────┘     │  │
│  │                       │                                   │  │
│  │  ┌────────────────────▼────────────────────────────┐     │  │
│  │  │              PRISMA ORM                         │     │  │
│  │  │  - Type-safe database queries                   │     │  │
│  │  │  - Automatic migrations                         │     │  │
│  │  │  - Relations management                         │     │  │
│  │  └────────────────────┬────────────────────────────┘     │  │
│  │                       │                                   │  │
│  └───────────────────────┼───────────────────────────────────┘  │
│                          │                                       │
│                    SQLITE DATABASE                               │
│  ┌───────────────────────▼───────────────────────────────────┐  │
│  │  users | clients | groups | subscriptions | attendances   │  │
│  │  invoices | accounts | sessions | verification_tokens     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

## 📁 Estructura de Directorios Detallada

### `/src/app` - App Router

```
src/app/
├── (auth)/                    # Route Group para autenticación
│   ├── layout.tsx             # Layout minimal para auth
│   ├── login/
│   │   └── page.tsx           # Página de login
│   └── register/
│       └── page.tsx           # Página de registro
│
├── api/                       # API Routes
│   ├── auth/
│   │   ├── [...nextauth]/     # NextAuth handler
│   │   │   └── route.ts
│   │   └── register/
│   │       └── route.ts       # Registro de usuarios
│   ├── clients/
│   │   ├── route.ts           # GET/POST clientes
│   │   └── [id]/
│   │       └── route.ts       # GET/PUT/DELETE cliente
│   ├── groups/
│   │   ├── route.ts           # GET/POST grupos
│   │   └── [id]/
│   │       └── route.ts       # GET/PUT/DELETE grupo
│   ├── subscriptions/
│   │   ├── route.ts           # GET/POST suscripciones
│   │   └── [id]/
│   │       └── route.ts       # GET/PUT/DELETE suscripción
│   ├── attendance/
│   │   └── route.ts           # GET/POST asistencias
│   ├── dashboard/
│   │   └── route.ts           # GET estadísticas
│   ├── webhook/
│   │   └── whatsapp/
│   │       └── route.ts       # Webhook WhatsApp
│   └── route.ts               # Health check
│
├── layout.tsx                 # Layout raíz con providers
├── page.tsx                   # Página principal (SPA)
└── globals.css                # Estilos globales + Tailwind
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
│   └── ...                    # +40 componentes
│
├── auth/                      # Componentes de autenticación
│   ├── login-form.tsx         # Formulario de login
│   ├── register-form.tsx      # Formulario de registro
│   └── user-menu.tsx          # Menú de usuario
│
├── layout/                    # Componentes de layout
│   └── app-layout.tsx         # Layout principal con sidebar
│
├── modules/                   # Vistas de negocio
│   ├── dashboard-view.tsx     # Dashboard con estadísticas
│   ├── clients-view.tsx       # Gestión de clientes
│   ├── client-form.tsx        # Formulario de cliente
│   ├── client-profile.tsx     # Perfil de cliente
│   ├── attendance-view.tsx    # Control de asistencia
│   ├── payments-view.tsx      # Gestión de pagos
│   ├── settings-view.tsx      # Configuración
│   ├── group-selector.tsx     # Selector de grupos
│   ├── group-badge.tsx        # Badge de grupo
│   └── schedule-selector.tsx  # Selector de horarios
│
└── providers/                 # Context providers
    └── session-provider.tsx   # Provider de NextAuth
```

### `/src/lib` - Utilidades y Configuración

```
src/lib/
├── db.ts                      # Cliente Prisma singleton
├── auth.ts                    # Helpers de autenticación
├── auth-utils.ts              # Utilidades de auth (hash, roles)
├── api-utils.ts               # Cache y utilidades de API
└── utils.ts                   # Utilidades generales (cn, etc.)
```

### `/src/hooks` - Custom Hooks

```
src/hooks/
├── use-optimized.ts           # Hooks de optimización
├── use-mobile.ts              # Detección de móvil
└── use-toast.ts               # Sistema de notificaciones
```

### `/src/store` - Estado Global

```
src/store/
└── index.ts                   # Store Zustand
                                # - Estado de UI
                                # - Cache de datos
                                # - Loading states
                                # - Optimistic updates
```

### `/src/schemas` - Validación Zod

```
src/schemas/
├── client.ts                  # Esquemas de cliente
└── index.ts                   # Exportaciones
```

### `/src/types` - Tipos TypeScript

```
src/types/
├── index.ts                   # Tipos de dominio
└── next-auth.d.ts             # Extensiones de NextAuth
```

## 🔄 Flujo de Datos

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
│  1. Verificar credenciales contra DB                    │
│  2. Generar JWT con claims (id, role, email)            │
│  3. Establecer cookie de sesión                         │
│  4. Devolver sesión al cliente                          │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Middleware │────▶│   Session   │────▶│   Layout    │
│  (Check)    │     │   Provider  │     │   Protegido │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Flujo de Request API

```
┌─────────────┐
│   Cliente   │
│  (fetch)    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│                    MIDDLEWARE                            │
│  - Verificar cookie de sesión                           │
│  - Si no existe: 401 (API) o redirect (página)          │
│  - Si existe: continuar                                 │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    API ROUTE                             │
│  1. auth() para obtener sesión                          │
│  2. Verificar permisos según rol                        │
│  3. Validar input con Zod                               │
│  4. Verificar cache (si aplica)                         │
│  5. Ejecutar query con Prisma                           │
│  6. Invalidar cache si mutación                         │
│  7. Devolver respuesta JSON                             │
└─────────────────────────────────────────────────────────┘
```

### Flujo de Estado (Zustand + Server State)

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENTE                               │
│                                                          │
│  ┌─────────────────┐    ┌─────────────────────────┐     │
│  │   ZUSTAND       │    │   REACT QUERY           │     │
│  │   (Local State) │    │   (Server State)        │     │
│  │                 │    │                         │     │
│  │  - currentView  │    │  - clients data         │     │
│  │  - sidebarOpen  │    │  - groups data          │     │
│  │  - UI settings  │    │  - dashboard stats      │     │
│  │                 │    │  - auto-refetch         │     │
│  │  - clients[]    │    │  - cache invalidation   │     │
│  │  - groups[]     │    │                         │     │
│  │  (cached data)  │    │                         │     │
│  └────────┬────────┘    └───────────┬─────────────┘     │
│           │                         │                    │
│           └──────────┬──────────────┘                    │
│                      │                                   │
│                      ▼                                   │
│           ┌─────────────────────┐                        │
│           │   COMPONENTS        │                        │
│           │   (React)           │                        │
│           │                     │                        │
│           │  - Selectors para   │                        │
│           │    evitar re-renders│                        │
│           │  - Memo para        │                        │
│           │    componentes      │                        │
│           │    pesados          │                        │
│           └─────────────────────┘                        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## 🔐 Sistema de Autenticación

### Arquitectura de Autenticación

```
┌─────────────────────────────────────────────────────────┐
│                 NEXTAUTH CONFIGURATION                   │
│                                                          │
│  Providers:                                              │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Credentials Provider                            │    │
│  │  - Email + Password                              │    │
│  │  - Verificación con bcrypt                       │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  Session Strategy: JWT                                   │
│  ┌─────────────────────────────────────────────────┐    │
│  │  - Almacenado en cookie httpOnly                 │    │
│  │  - TTL: 30 días                                  │    │
│  │  - Claims: id, name, email, role                 │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  Adapters:                                               │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Prisma Adapter                                  │    │
│  │  - Persistencia de sesiones                      │    │
│  │  - Gestión de accounts                           │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Roles y Permisos

```typescript
// Definición de permisos por rol
const rolePermissions = {
  EMPLEADORA: {
    canManageUsers: true,      // CRUD usuarios
    canManageClients: true,    // CRUD clientes
    canManageGroups: true,     // CRUD grupos
    canManagePayments: true,   // Gestión de pagos
    canViewReports: true,      // Ver reportes
    canViewSettings: true,     // Acceso a configuración
    canDeleteClients: true,    // Eliminar clientes
    canCreateEmployees: true,  // Crear empleados
  },
  EMPLEADO: {
    canManageUsers: false,
    canManageClients: true,    // Solo lectura y edición básica
    canManageGroups: false,
    canManagePayments: false,
    canViewReports: true,
    canViewSettings: false,
    canDeleteClients: false,
    canCreateEmployees: false,
  },
}
```

### Middleware de Protección

```typescript
// src/middleware.ts
// Protege automáticamente todas las rutas excepto:
// - /login
// - /register
// - /api/auth/*
// - Static files

// Para API routes devuelve 401 si no autenticado
// Para páginas redirige a /login con callbackUrl
```

## 💾 Capa de Datos

### Patrones de Acceso a Datos

```typescript
// Patrón Repository implícito en API routes

// 1. Read con cache
export async function GET(request: NextRequest) {
  const data = await cachedFetch(
    CacheKeys.clients(params),
    () => db.client.findMany({ include: { grupo: true } }),
    60 * 1000
  )
  return NextResponse.json({ success: true, data })
}

// 2. Write con invalidación de cache
export async function POST(request: NextRequest) {
  const client = await db.client.create({ data: validatedData })
  invalidateCache('clients')
  return NextResponse.json({ success: true, data: client })
}

// 3. Transacciones para operaciones complejas
await db.$transaction([
  db.subscription.create({ data: subData }),
  db.invoice.create({ data: invoiceData }),
])
```

### Cache Strategy

```
┌─────────────────────────────────────────────────────────┐
│                    CACHE LAYER                           │
│                                                          │
│  ┌─────────────────┐    ┌─────────────────────────┐     │
│  │  IN-MEMORY      │    │  TTL CONFIGURABLE       │     │
│  │  MAP            │    │                         │     │
│  │                 │    │  - clients: 1 min       │     │
│  │  Key: string    │    │  - groups: 5 min        │     │
│  │  Value: {       │    │  - dashboard: 1 min     │     │
│  │    data: T,     │    │                         │     │
│  │    timestamp,   │    │                         │     │
│  │    ttl          │    │                         │     │
│  │  }              │    │                         │     │
│  └─────────────────┘    └─────────────────────────┘     │
│                                                          │
│  Invalidación:                                           │
│  - Manual: invalidateCache(key)                          │
│  - Por patrón: invalidateCachePattern('clients')         │
│  - Total: clearCache()                                   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## 🎨 Arquitectura de UI

### Component Hierarchy

```
App (page.tsx)
│
├── SessionProvider (next-auth)
│   │
│   └── ThemeProvider (next-themes)
│       │
│       └── AppLayout
│           │
│           ├── Sidebar (navegación)
│           │   ├── Logo
│           │   ├── NavItems
│           │   └── UserMenu
│           │
│           └── MainContent
│               │
│               ├── Header (título, acciones)
│               │
│               └── ViewContainer (Suspense + Lazy)
│                   │
│                   ├── DashboardView
│                   ├── ClientsView
│                   ├── AttendanceView
│                   ├── PaymentsView
│                   └── SettingsView
```

### Responsive Design Strategy

```
┌─────────────────────────────────────────────────────────┐
│                    BREAKPOINTS                           │
│                                                          │
│  Mobile:  < 640px (sm)                                   │
│  - Sidebar oculto, hamburger menu                        │
│  - Cards en columna única                                │
│  - Tablas con scroll horizontal                          │
│                                                          │
│  Tablet: 640px - 1024px (md)                             │
│  - Sidebar colapsado                                     │
│  - Grid 2 columnas                                       │
│                                                          │
│  Desktop: > 1024px (lg)                                  │
│  - Sidebar expandido                                     │
│  - Grid 4 columnas                                       │
│  - Tablas completas                                      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## 🧪 Testing Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    TESTING PYRAMID                       │
│                                                          │
│                    ┌─────────┐                           │
│                    │   E2E   │  Playwright               │
│                    │ (Pocos) │  - Flujos críticos        │
│                    └────┬────┘  - Login, CRUD principal  │
│                         │                                │
│               ┌─────────▼─────────┐                      │
│               │   INTEGRATION     │  Vitest + MSW        │
│               │   (Moderados)     │  - API routes        │
│               └─────────┬─────────┘  - DB interactions   │
│                         │                                │
│         ┌───────────────▼───────────────┐                │
│         │          UNIT TESTS           │  Vitest        │
│         │          (Muchos)             │  - Components  │
│         │                               │  - Hooks       │
│         │                               │  - Utils       │
│         │                               │  - Schemas     │
│         └───────────────────────────────┘                │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## 📈 Escalabilidad y Future-Proofing

### Decisiones Arquitectónicas para Escalabilidad

1. **SQLite → PostgreSQL**: El uso de Prisma permite migrar fácilmente a PostgreSQL
2. **In-Memory Cache → Redis**: La interfaz de cache permite intercambiar implementación
3. **Monolito → Microservicios**: La separación de API routes facilita extracción
4. **SPA → Multi-page**: Next.js App Router soporta ambas arquitecturas

### Extensibilidad

```
┌─────────────────────────────────────────────────────────┐
│                    EXTENSION POINTS                      │
│                                                          │
│  1. Nuevos módulos de negocio                            │
│     - Agregar vista en /components/modules/              │
│     - Agregar API routes correspondientes                │
│     - Actualizar navegación en AppLayout                 │
│                                                          │
│  2. Nuevos proveedores de autenticación                  │
│     - Agregar provider en auth.ts                        │
│     - Configurar callback URL                            │
│                                                          │
│  3. Integraciones externas                               │
│     - Webhooks en /api/webhook/                          │
│     - Usar z-ai-web-dev-sdk en backend                   │
│                                                          │
│  4. Nuevos tipos de entidades                            │
│     - Actualizar schema.prisma                           │
│     - Crear tipos en /types                              │
│     - Crear esquemas en /schemas                         │
│     - Crear API routes                                   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

**Última actualización:** 2026-02-26
**Versión:** 1.0.0
