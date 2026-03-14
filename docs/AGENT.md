# 🤖 AGENT.md - Guía para Agentes de Código

> Este documento está diseñado para optimizar la interacción de agentes de IA con el repositorio NMS (Natatory Management System).

## 📋 Información del Proyecto

### Nombre del Proyecto
**NMS - Natatory Management System** (Sistema de Gestión de Piscinas)

### Descripción
Sistema de gestión integral para natatorios/piscinas que incluye:
- CRM de clientes
- Gestión de grupos y horarios
- Control de asistencia
- Gestión de pagos y suscripciones
- Webhook de WhatsApp para integración
- Sistema de autenticación con roles

### Stack Tecnológico Obligatorio
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Next.js | 16.x | Framework React con App Router |
| TypeScript | 5.x | Tipado estático |
| Prisma | 6.x | ORM para PostgreSQL (Prisma Postgres) |
| PostgreSQL | - | Base de datos (Prisma Postgres en Vercel) |
| Tailwind CSS | 4.x | Estilos utilitarios |
| shadcn/ui | New York | Componentes UI |
| NextAuth | 4.x | Autenticación |
| Zustand | 5.x | Estado global |
| Zod | 4.x | Validación de esquemas |
| Vitest | 4.x | Tests unitarios/integración |
| Playwright | 1.x | Tests E2E |

## 🏗️ Estructura del Proyecto

```
/home/z/my-project/
├── 📁 prisma/
│   ├── schema.prisma      # Esquema de base de datos
│   └── seed.ts            # Datos de prueba
├── 📁 src/
│   ├── 📁 app/            # Next.js App Router
│   │   ├── 📁 (auth)/     # Rutas de autenticación
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── 📁 api/        # API Routes
│   │   │   ├── 📁 auth/   # NextAuth routes
│   │   │   ├── 📁 clients/
│   │   │   ├── 📁 groups/
│   │   │   ├── 📁 subscriptions/
│   │   │   ├── 📁 attendance/
│   │   │   ├── 📁 dashboard/
│   │   │   └── 📁 webhook/
│   │   ├── layout.tsx     # Layout raíz
│   │   ├── page.tsx       # Página principal (SPA)
│   │   └── globals.css    # Estilos globales
│   ├── 📁 components/
│   │   ├── 📁 ui/         # Componentes shadcn/ui
│   │   ├── 📁 auth/       # Componentes de autenticación
│   │   ├── 📁 layout/     # Componentes de layout
│   │   ├── 📁 modules/    # Vistas de negocio
│   │   └── 📁 providers/  # Context providers
│   ├── 📁 hooks/          # Custom hooks
│   ├── 📁 lib/            # Utilidades y configuración
│   │   ├── db.ts          # Cliente Prisma
│   │   ├── auth.ts        # Configuración auth
│   │   ├── auth-utils.ts  # Utilidades de auth
│   │   ├── api-utils.ts   # Cache para API
│   │   └── utils.ts       # Utilidades generales
│   ├── 📁 schemas/        # Esquemas Zod
│   ├── 📁 store/          # Estado global Zustand
│   ├── 📁 types/          # Tipos TypeScript
│   └── middleware.ts      # Middleware de autenticación
├── 📁 tests/
│   ├── 📁 unit/           # Tests unitarios
│   ├── 📁 integration/    # Tests de integración
│   ├── 📁 e2e/            # Tests E2E
│   ├── 📁 fixtures/       # Fixtures de testing
│   └── setup.ts           # Configuración de tests
├── 📁 docs/               # Documentación
├── 📁 mini-services/      # Microservicios auxiliares
├── 📁 examples/           # Ejemplos de código
└── 📁 public/             # Archivos estáticos
```

## 🔑 Patrones de Código Obligatorios

### 1. Convenciones de Nombres

```typescript
// ✅ CORRECTO
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

### 2. Estructura de Componentes

```typescript
// Patrón obligatorio para componentes React
'use client' // Solo si necesita interactividad

import { useState, useCallback, memo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import type { Client } from '@/types'

// 1. Props interface al inicio
interface ClientCardProps {
  client: Client
  onEdit?: (id: string) => void
  className?: string
}

// 2. Componente con memo para optimización
export const ClientCard = memo(function ClientCard({
  client,
  onEdit,
  className,
}: ClientCardProps) {
  // 3. Hooks en orden específico
  const [isOpen, setIsOpen] = useState(false)
  const form = useForm({
    resolver: zodResolver(clientSchema),
  })
  
  // 4. Callbacks estables con useCallback
  const handleEdit = useCallback(() => {
    onEdit?.(client.id)
  }, [client.id, onEdit])
  
  // 5. Early returns para condiciones
  if (!client) return null
  
  // 6. JSX final
  return (
    <Card className={className}>
      {/* ... */}
    </Card>
  )
})

// 7. Default export al final
export default ClientCard
```

### 3. Estructura de API Routes

```typescript
// Patrón obligatorio para API routes
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { invalidateCache, CacheKeys } from '@/lib/api-utils'
import { clientSchema } from '@/schemas/client'
import type { NextRequest } from 'next/server'

// GET handler
export async function GET(request: NextRequest) {
  try {
    // 1. Verificar autenticación
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      )
    }
    
    // 2. Obtener parámetros
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    
    // 3. Lógica de negocio
    const clients = await db.client.findMany({
      // ...
    })
    
    // 4. Respuesta exitosa
    return NextResponse.json({ success: true, data: clients })
  } catch (error) {
    console.error('[API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    )
  }
}

// POST handler
export async function POST(request: NextRequest) {
  try {
    // 1. Autenticación
    const session = await auth()
    if (!session) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
    }
    
    // 2. Validación de permisos
    if (session.user.role !== 'EMPLEADORA') {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 })
    }
    
    // 3. Parse y validación del body
    const body = await request.json()
    const validated = clientSchema.parse(body)
    
    // 4. Crear en base de datos
    const client = await db.client.create({
      data: validated,
    })
    
    // 5. Invalidar cache
    invalidateCache(CacheKeys.clients({}))
    
    // 6. Respuesta
    return NextResponse.json({ success: true, data: client }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('[API] Error:', error)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}
```

### 4. Uso del Store Zustand

```typescript
// Patrón para usar el store
import { useAppStore, useClients, useShouldFetchClients } from '@/store'

function MyComponent() {
  // ✅ Usar selectores específicos para evitar re-renders
  const clients = useClients()
  const setClients = useAppStore((state) => state.setClients)
  const shouldFetch = useShouldFetchClients()
  
  // ✅ Verificar cache antes de fetch
  useEffect(() => {
    if (shouldFetch) {
      fetchClients()
    }
  }, [shouldFetch])
  
  // ❌ EVITAR: Suscribirse a todo el store
  // const store = useAppStore()
}
```

### 5. Validación con Zod

```typescript
// Esquemas en src/schemas/
import { z } from 'zod'

// Esquema base
export const clientSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  telefono: z.string().min(8, 'Teléfono inválido'),
})

// Esquema de creación
export const createClientSchema = clientSchema.extend({
  classesTotal: z.number().int().min(1).max(30).default(4),
})

// Esquema de actualización
export const updateClientSchema = clientSchema.partial()

// Tipos derivados
export type ClientInput = z.infer<typeof clientSchema>
export type CreateClientInput = z.infer<typeof createClientSchema>
```

## 🔐 Sistema de Autenticación

### Roles y Permisos

```typescript
// Roles disponibles
type Role = 'EMPLEADORA' | 'EMPLEADO'

// EMPLEADORA (Admin): Acceso completo
// - Gestión de usuarios
// - Gestión de clientes (CRUD completo)
// - Gestión de grupos
// - Gestión de pagos
// - Configuración
// - Reportes

// EMPLEADO (Staff): Acceso limitado
// - Ver clientes (solo lectura)
// - Marcar asistencia
// - Ver reportes
// - Sin acceso a configuración
```

### Credenciales de Prueba

```typescript
// EMPLEADORA (Admin)
email: 'mariela@nms.com'
password: 'mariela123'

// EMPLEADO (Staff)
email: 'tomas@nms.com'
password: 'tomas123'
```

### Protección de Rutas

```typescript
// Middleware protege automáticamente todas las rutas
// Excepciones: /login, /register, /api/auth

// En API routes, usar:
import { auth, requireAuth, requireRole } from '@/auth'

// Verificar autenticación
const session = await auth()

// Requerir autenticación (lanza error si no)
const user = await requireAuth()

// Requerir rol específico
const admin = await requireRole('EMPLEADORA')
```

## 📡 API Endpoints

### Estructura de Respuestas

```typescript
// Respuesta exitosa
{
  "success": true,
  "data": { ... }
}

// Respuesta con paginación
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}

// Error
{
  "success": false,
  "error": "Mensaje de error"
}
```

### Endpoints Disponibles

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/register | Registrar usuario | Público |
| GET | /api/clients | Listar clientes | Requerida |
| POST | /api/clients | Crear cliente | Requerida |
| GET | /api/clients/:id | Obtener cliente | Requerida |
| PUT | /api/clients/:id | Actualizar cliente | Requerida |
| DELETE | /api/clients/:id | Eliminar cliente | EMPLEADORA |
| GET | /api/groups | Listar grupos | Requerida |
| POST | /api/groups | Crear grupo | EMPLEADORA |
| GET | /api/subscriptions | Listar suscripciones | Requerida |
| POST | /api/attendance | Registrar asistencia | Requerida |
| GET | /api/dashboard | Estadísticas | Requerida |
| POST | /api/webhook/whatsapp | Webhook WhatsApp | Público |

## 🗄️ Base de Datos

### Configuración de Prisma Postgres

```env
# Prisma Postgres (Vercel Storage)
DATABASE_URL="postgres://username:password@db.prisma.io:5432/postgres?sslmode=require"
```

### Modelos Principales

```prisma
// Usuarios (autenticación)
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  role      Role     @default(EMPLEADO)  // EMPLEADORA | EMPLEADO
  active    Boolean  @default(true)
}

// Grupos (etiquetas)
model Group {
  id          String   @id @default(cuid())
  name        String   @unique
  color       String   @default("#06b6d4")
  schedule    String?
  clients     Client[]
}

// Clientes
model Client {
  id            String   @id @default(cuid())
  nombre        String
  apellido      String
  dni           String?
  telefono      String   @unique
  grupoId       String?
  subscriptions Subscription[]
  attendances   Attendance[]
  invoices      Invoice[]
}

// Suscripciones
model Subscription {
  id           String   @id @default(cuid())
  clientId     String
  month        Int      // 1-12
  year         Int      // 2020-2100
  status       String   // AL_DIA | PENDIENTE | DEUDOR
  classesTotal Int      @default(4)
  classesUsed  Int      @default(0)
}

// Asistencias
model Attendance {
  id       String   @id @default(cuid())
  clientId String
  date     DateTime @default(now())
}
```

### Comandos de Base de Datos

```bash
# Aplicar cambios al schema
bun run db:push

# Generar cliente Prisma
bun run db:generate

# Ejecutar seed
bun run db:seed

# Resetear base de datos
bun run db:reset
```

## 🧪 Testing

### Estructura de Tests

```
tests/
├── unit/              # Tests unitarios
│   ├── store.test.ts
│   ├── schemas.test.ts
│   ├── utils.test.ts
│   └── components/
├── integration/       # Tests de integración
│   ├── api-clients.test.ts
│   └── api-dashboard-attendance.test.ts
├── e2e/              # Tests E2E
│   └── app.spec.ts
├── fixtures/         # Datos de prueba
│   ├── test-data.ts
│   └── db-fixtures.ts
└── setup.ts          # Configuración
```

### Comandos de Testing

```bash
# Todos los tests unitarios/integración
bun run test

# Tests en modo watch
bun run test:watch

# Tests con coverage
bun run test:coverage

# Solo tests unitarios
bun run test:unit

# Solo tests de integración
bun run test:integration

# Tests E2E
bun run test:e2e

# Tests E2E con UI
bun run test:e2e:ui

# Todos los tests
bun run test:all
```

### Patrón para Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ClientCard } from '@/components/modules/client-card'

describe('ClientCard', () => {
  const mockClient = {
    id: '1',
    nombre: 'Juan',
    apellido: 'Pérez',
    telefono: '+5491112345678',
  }

  it('should render client name correctly', () => {
    render(<ClientCard client={mockClient} />)
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
  })

  it('should call onEdit when edit button clicked', async () => {
    const onEdit = vi.fn()
    render(<ClientCard client={mockClient} onEdit={onEdit} />)
    
    await userEvent.click(screen.getByRole('button', { name: /editar/i }))
    expect(onEdit).toHaveBeenCalledWith('1')
  })
})
```

## ⚡ Optimización y Performance

### Cache Implementado

```typescript
// Cache en memoria para API routes (src/lib/api-utils.ts)
import { cachedFetch, CacheKeys, invalidateCache } from '@/lib/api-utils'

// Usar cache
const data = await cachedFetch(
  CacheKeys.clients({ status: 'active' }),
  () => db.client.findMany({ ... }),
  60 * 1000 // TTL: 1 minuto
)

// Invalidar cache
invalidateCache('clients')
```

### Lazy Loading

```typescript
// Componentes lazy-loaded en page.tsx
const DashboardView = lazy(() => 
  import('@/components/modules/dashboard-view').then(m => ({ 
    default: m.DashboardView 
  }))
)
```

### Memoización

```typescript
// Usar memo para componentes pesados
export const ClientList = memo(function ClientList({ clients }: Props) {
  return (
    <VirtualList items={clients}>
      {/* ... */}
    </VirtualList>
  )
})

// Usar useMemo para cálculos costosos
const sortedClients = useMemo(() => 
  clients.sort((a, b) => a.nombre.localeCompare(b.nombre)),
  [clients]
)

// Usar useCallback para callbacks
const handleSubmit = useCallback((data: FormData) => {
  // ...
}, [dependency1, dependency2])
```

## 🚨 Reglas Importantes

### ❌ NUNCA Hacer

1. **No usar localStorage directamente** - Usar Zustand con persist
2. **No hardcodear credenciales** - Usar seed.ts para datos de prueba
3. **No ignorar errores de TypeScript** - Corregir antes de commit
4. **No usar `any` sin justificación** - Preferir tipos específicos
5. **No crear rutas nuevas** - La app es SPA, solo modificar /page.tsx
6. **No usar z-ai-web-dev-sdk en cliente** - Solo en backend
7. **No ejecutar `bun run dev`** - El servidor se ejecuta automáticamente
8. **No usar puerto diferente a 3000**

### ✅ SIEMPRE Hacer

1. **Verificar autenticación** en cada API route
2. **Validar input** con Zod antes de procesar
3. **Usar transacciones** para operaciones múltiples
4. **Invalidar cache** después de mutaciones
5. **Manejar errores** con try-catch y mensajes claros
6. **Usar componentes existentes** de shadcn/ui
7. **Mantener responsive** todos los componentes
8. **Escribir tests** para nueva funcionalidad

## 🔄 Flujo de Trabajo Recomendado

### Para Agregar Nueva Funcionalidad

1. **Definir tipos** en `src/types/index.ts`
2. **Crear esquemas** en `src/schemas/`
3. **Actualizar Prisma schema** si es necesario
4. **Ejecutar `bun run db:push`**
5. **Crear API route** en `src/app/api/`
6. **Crear componente** en `src/components/modules/`
7. **Integrar en vista** existente
8. **Escribir tests**
9. **Verificar con `bun run lint`**
10. **Verificar logs en dev.log**

### Para Modificar Funcionalidad Existente

1. **Leer código existente** completamente
2. **Identificar dependencias**
3. **Modificar con cuidado** manteniendo compatibilidad
4. **Actualizar tests afectados**
5. **Verificar con `bun run lint`**

## 🐛 Casos de Debugging Documentados

### Caso 1: Login en Producción con NextAuth (Cookies Seguras)

**Fecha:** 2026-03-14  
**Problema:** El login funcionaba localmente pero en producción (Vercel) redirigía de vuelta al login después de autenticar correctamente.

**Síntomas:**
- Login retorna 200 en `/api/auth/callback/credentials`
- Sesión se crea correctamente (verificado en `/api/auth/session`)
- Middleware redirige al login aunque el usuario está autenticado

**Diagnóstico:**
1. ✅ Base de datos funcionando (usuarios existen)
2. ✅ Variables de entorno configuradas en Vercel
3. ✅ Función `authorize` funciona correctamente
4. ❌ Middleware verificaba cookie incorrecta

**Causa Raíz:**
El middleware verificaba `next-auth.session-token` pero NextAuth con HTTPS usa cookies seguras con prefijo `__Secure-next-auth.session-token`.

**Solución:**
```typescript
// ANTES (incorrecto)
const hasSessionCookie = request.cookies.has('next-auth.session-token')

// DESPUÉS (correcto)
const hasSessionCookie = 
  request.cookies.has('next-auth.token') || 
  request.cookies.has('next-auth.session-token') ||
  request.cookies.has('__Secure-next-auth.session-token') ||
  request.cookies.has('__Secure-next-auth.token')
```

**Lecciones Aprendidas:**
1. NextAuth usa cookies diferentes según el entorno (HTTP vs HTTPS)
2. Always check browser network requests para ver qué cookies se establecen
3. Verificar la sesión con `/api/auth/session` endpoint
4. El middleware debe ser conservador con las cookies que acepta

---

## 📝 Notas Adicionales

### Variables de Entorno

```env
# Desarrollo local (Prisma Postgres)
DATABASE_URL="postgres://username:password@db.prisma.io:5432/postgres?sslmode=require"
NEXTAUTH_SECRET="dev-secret-key"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"

# Producción (Vercel)
DATABASE_URL="postgres://username:password@db.prisma.io:5432/postgres?sslmode=require"
NEXTAUTH_SECRET="nms-production-secret-key-2024"
NEXTAUTH_URL="https://nms-two.vercel.app"
NODE_ENV="production"
```

### Seed de Producción

Para ejecutar seed en producción (necesario después de cambios de schema):
```bash
DATABASE_URL="postgres://..." bun run db:seed
```

### Comandos Útiles

```bash
# Verificar calidad de código
bun run lint

# Ver logs del servidor de desarrollo
# Leer /home/z/my-project/dev.log

# Verificar build
bun run build
```

### Contacto y Soporte

Este proyecto es mantenido por el equipo de desarrollo. Para consultas técnicas, revisar la documentación en `/docs` o consultar los tests existentes como referencia de implementación.

---

**Última actualización:** 2026-02-26
**Versión del documento:** 1.0.0
