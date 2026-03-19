# 🏛️ Arquitectura del Sistema NMS

> Documentación técnica de la arquitectura del Natatory Management System

## 📊 Visión General

NMS es una aplicación **Single Page Application (SPA)** construida sobre Next.js 15.5 con App Router, diseñada para gestionar natatorios y piscinas de manera integral.

### Stack de Producción

| Componente | Tecnología | Servicio |
|------------|------------|----------|
| Frontend | Next.js 15.5, React 19 | Vercel (Edge Network) |
| API | Next.js API Routes | Vercel (Serverless Functions) |
| Database | PostgreSQL 16 | Neon (Serverless) |
| ORM | Prisma 6 | - |
| Auth | NextAuth v4 (JWT) | Cookies httpOnly |
| State | Zustand 5 | Client-side |

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
│  │  │              PRISMA ORM                         │     │  │
│  │  │  - Type-safe database queries                   │     │  │
│  │  │  - Connection pooling via Neon                   │     │  │
│  │  └────────────────────┬────────────────────────────┘     │  │
│  │                       │                                   │  │
│  └───────────────────────┼───────────────────────────────────┘  │
│                          │                                       │
│                    POSTGRESQL (Neon)                             │
│  ┌───────────────────────▼───────────────────────────────────┐  │
│  │  users | clients | groups | subscriptions | attendances   │  │
│  │  invoices | accounts | sessions | verification_tokens     │  │
│  │  pricing_plans | settings                              │  │
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
│   │   └── page.tsx          # Página de login
│   └── register/
│       └── page.tsx          # Página de registro
│
├── api/                       # API Routes
│   ├── auth/
│   │   ├── [...nextauth]/    # NextAuth handler
│   │   │   └── route.ts
│   │   └── register/
│   │       └── route.ts       # Registro de usuarios
│   ├── clients/
│   │   ├── route.ts          # GET/POST clientes
│   │   └── [id]/
│   │       └── route.ts       # GET/PUT/DELETE cliente
│   ├── groups/
│   │   ├── route.ts          # GET/POST grupos
│   │   └── [id]/
│   │       └── route.ts       # GET/PUT/DELETE grupo
│   ├── subscriptions/
│   │   ├── route.ts          # GET/POST suscripciones
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
│   ├── register-form.tsx       # Formulario de registro
│   └── user-menu.tsx          # Menú de usuario
│
├── layout/                    # Componentes de layout
│   └── app-layout.tsx         # Layout principal con sidebar
│
├── modules/                   # Vistas de negocio
│   ├── dashboard-view.tsx      # Dashboard con estadísticas
│   ├── clients-view.tsx       # Gestión de clientes
│   ├── client-form.tsx        # Formulario de cliente
│   ├── client-profile.tsx      # Perfil de cliente
│   ├── attendance-view.tsx     # Control de asistencia
│   ├── payments-view.tsx       # Gestión de pagos
│   ├── settings-view.tsx       # Configuración
│   ├── group-selector.tsx      # Selector de grupos
│   ├── group-badge.tsx         # Badge de grupo
│   └── schedule-selector.tsx    # Selector de horarios
│
└── providers/                 # Context providers
    └── session-provider.tsx    # Provider de NextAuth
```

### `/src/lib` - Utilidades y Configuración

```
src/lib/
├── db.ts                      # Cliente Prisma singleton
├── auth.ts                    # Configuración NextAuth
├── auth-utils.ts             # Utilidades de auth (hash, roles)
├── api-utils.ts               # Cache y utilidades de API
└── utils.ts                   # Utilidades generales (cn, etc.)
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
│  - Si no existe: 401 (API) o redirect (página)         │
│  - Si existe: continuar                                 │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    API ROUTE                             │
│  1. auth() para obtener sesión                          │
│  2. Verificar permisos según rol                        │
│  3. Validar input con Zod                               │
│  4. Ejecutar query con Prisma                           │
│  5. Devolver respuesta JSON                             │
└─────────────────────────────────────────────────────────┘
```

## 🔐 Sistema de Autenticación

### Arquitectura de Autenticación

```
┌─────────────────────────────────────────────────────────┐
│                 NEXTAUTH CONFIGURATION                   │
│                                                          │
│  Providers:                                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Credentials Provider                             │   │
│  │  - Email + Password                              │   │
│  │  - Verificación con bcrypt (12 rounds)           │   │
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
| **EMPLEADORA** | Admin | Acceso completo: usuarios, clientes, grupos, pagos, configuración |
| **EMPLEADO** | Staff | Ver clientes, registrar asistencia, ver reportes |

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

### Neon PostgreSQL

El proyecto usa **Neon** como base de datos PostgreSQL serverless:

- **Connection String**: Configurado como `DATABASE_URL` en Vercel
- **SSL**: `sslmode=require` para conexiones seguras
- **Pooling**: Neon maneja connection pooling automáticamente
- **Branching**: Soporta ramas de base de datos para desarrollo

### Patrones de Acceso a Datos

```typescript
// Patrón Repository implícito en API routes

// 1. Read
export async function GET(request: NextRequest) {
  const clients = await db.client.findMany({
    include: { grupo: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ success: true, data: clients })
}

// 2. Write con invalidación de cache
export async function POST(request: NextRequest) {
  const client = await db.client.create({ data: validatedData })
  return NextResponse.json({ success: true, data: client })
}

// 3. Transacciones para operaciones complejas
await db.$transaction([
  db.subscription.create({ data: subData }),
  db.attendance.create({ data: attendanceData }),
])
```

## 🎨 Arquitectura de UI

### Component Hierarchy

```
App (page.tsx)
│
├── SessionProvider (next-auth)
│   │
│   └── AppLayout
│       │
│       ├── Sidebar (navegación)
│       │   ├── Logo
│       │   ├── NavItems
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
│  Tablet: 640px - 1024px (md)                            │
│  - Sidebar colapsado                                    │
│  - Grid 2 columnas                                     │
│                                                          │
│  Desktop: > 1024px (lg)                                 │
│  - Sidebar expandido                                    │
│  - Grid 4 columnas                                     │
│  - Tablas completas                                     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## 🌐 Deployment en Vercel

### Arquitectura de Deployment

```
GitHub Push → Vercel CI/CD → Build → Deploy

Build Process:
1. npm install
2. prisma generate
3. prisma db push --accept-data-loss (Neon)
4. tsx prisma/seed.ts
5. npm run build:standalone
```

### Environments

| Environment | Trigger | URL Pattern |
|-------------|---------|-------------|
| Production | Push a main | nms-giolivos-projects.vercel.app |
| Preview | Pull Request | nms-giolivos-projects-git-*.vercel.app |

## 📈 Escalabilidad y Future-Proofing

### Decisiones Arquitectónicas para Escalabilidad

1. **Prisma ORM**: Permite migrar fácilmente a cualquier base de datos relacional
2. **Neon PostgreSQL**: Serverless con branching y auto-scaling
3. **Vercel Edge Network**: CDN global con low latency
4. **Monolito → Microservicios**: La separación de API routes facilita extracción

### Extensibilidad

```
┌─────────────────────────────────────────────────────────┐
│                    EXTENSION POINTS                    │
│                                                          │
│  1. Nuevos módulos de negocio                           │
│     - Agregar vista en /components/modules/             │
│     - Agregar API routes correspondientes                │
│     - Actualizar navegación en AppLayout                │
│                                                          │
│  2. Nuevos proveedores de autenticación                 │
│     - Agregar provider en auth.ts                       │
│     - Configurar callback URL                            │
│                                                          │
│  3. Integraciones externas                               │
│     - Webhooks en /api/webhook/                         │
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

**Última actualización:** 2026-03-19
**Versión:** 2.0.0
