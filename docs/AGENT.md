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
| Next.js | 15.5.x | Framework React con App Router |
| TypeScript | 5.x | Tipado estático |
| Prisma | 6.x | ORM para PostgreSQL |
| PostgreSQL | 16 (Neon) | Base de datos serverless |
| Tailwind CSS | 4.x | Estilos utilitarios |
| shadcn/ui | New York | Componentes UI |
| NextAuth | 4.x | Autenticación |
| Zustand | 5.x | Estado global |
| Zod | 4.x | Validación de esquemas |

## 🏗️ Estructura del Proyecto

```
nms/
├── 📁 prisma/
│   ├── schema.prisma      # Esquema de base de datos
│   ├── seed.ts            # Datos iniciales (usuarios, planes, settings)
│   └── migrations/        # Migraciones Prisma
├── 📁 src/
│   ├── 📁 app/           # Next.js App Router
│   │   ├── 📁 (auth)/  # Rutas de autenticación
│   │   ├── 📁 api/      # API Routes
│   │   ├── layout.tsx   # Layout raíz
│   │   ├── page.tsx     # Página principal (SPA)
│   │   └── globals.css  # Estilos globales
│   ├── 📁 components/
│   │   ├── 📁 ui/       # Componentes shadcn/ui
│   │   ├── 📁 auth/     # Componentes de autenticación
│   │   ├── 📁 layout/   # Componentes de layout
│   │   ├── 📁 modules/  # Vistas de negocio
│   │   └── 📁 providers/# Context providers
│   ├── 📁 hooks/        # Custom hooks
│   ├── 📁 lib/          # Utilidades y configuración
│   │   ├── db.ts        # Cliente Prisma singleton
│   │   ├── auth.ts      # Configuración auth
│   │   └── api-utils.ts # Cache para API
│   ├── 📁 schemas/      # Esquemas Zod
│   ├── 📁 store/        # Estado global Zustand
│   ├── 📁 types/        # Tipos TypeScript
│   └── middleware.ts     # Middleware de autenticación
├── 📁 docs/              # Documentación
├── 📁 tests/             # Tests (README.md para detalles)
├── vercel.json          # Configuración de Vercel
└── package.json
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

### Credenciales de Prueba (Creadas por Seed)

```typescript
// EMPLEADORA (Admin)
email: 'mariela@nms.com'
password: 'mariela123'

// EMPLEADO (Staff)
email: 'tomas@nms.com'
password: 'tomas123'
// employeeRole: 'ADMINISTRATIVO'

email: 'camila@nms.com'
password: 'camila123'
// employeeRole: 'ADMINISTRATIVO'
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

### Modelo de Datos Principal (PostgreSQL via Neon)

```prisma
// Usuarios (autenticación)
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  password     String
  role         Role     @default(EMPLEADO)  // EMPLEADORA | EMPLEADO
  employeeRole String?  // "ADMINISTRATIVO", "PROFESOR"
  phone        String?
  active       Boolean  @default(true)
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
  classesTotal Int     @default(4)
  classesUsed  Int     @default(0)
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
# Aplicar cambios al schema (sin migración)
npx prisma db push

# Generar cliente Prisma
npx prisma generate

# Ejecutar seed (usuarios, planes, settings)
npx tsx prisma/seed.ts

# Resetear base de datos
npx prisma migrate reset
```

## 🌐 Deployment (Vercel)

### Build Command (vercel.json)

```json
{
  "buildCommand": "npx prisma@6.11.1 generate && npx prisma@6.11.1 db push --skip-generate --accept-data-loss && npx tsx prisma/seed.ts && npm run build:standalone"
}
```

### Variables de Entorno en Vercel

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Connection string de Neon PostgreSQL |
| `NEXTAUTH_SECRET` | Secret para JWT (generado automáticamente) |
| `NEXTAUTH_URL` | URL de producción (https://nms-giolivos-projects.vercel.app) |

### URL de Producción
**https://nms-giolivos-projects.vercel.app**

## 🚨 Reglas Importantes

### ❌ NUNCA Hacer

1. **No usar localStorage directamente** - Usar Zustand con persist
2. **No hardcodear credenciales** - Usar seed.ts para datos de prueba
3. **No ignorar errores de TypeScript** - Corregir antes de commit
4. **No usar `any` sin justificación** - Preferir tipos específicos
5. **No crear rutas nuevas** - La app es SPA, solo modificar /page.tsx
6. **No ejecutar Prisma migrate en producción** - Usar `db push` con `--accept-data-loss`

### ✅ SIEMPRE Hacer

1. **Verificar autenticación** en cada API route
2. **Validar input** con Zod antes de procesar
3. **Usar transacciones** para operaciones múltiples
4. **Invalidar cache** después de mutaciones
5. **Manejar errores** con try-catch y mensajes claros
6. **Usar componentes existentes** de shadcn/ui
7. **Mantener responsive** todos los componentes
8. **Escribir tests** para nueva funcionalidad

## 📝 Notas Adicionales

### Variables de Entorno (Desarrollo)

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/nms"
NEXTAUTH_SECRET="your-secret-key-at-least-32-characters"
NEXTAUTH_URL="http://localhost:3000"
```

### Comandos Útiles

```bash
# Desarrollo
npm run dev

# Verificar código
npm run lint

# Build standalone (para Vercel)
npm run build:standalone

# Build estándar
npm run build
```

### Contacto y Soporte

Este proyecto es mantenido por el equipo de desarrollo. Para consultas técnicas, revisar la documentación en `/docs` o consultar los tests existentes como referencia de implementación.

---

**Última actualización:** 2026-03-19
**Versión del documento:** 2.0.0
