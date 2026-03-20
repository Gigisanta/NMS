# 🗄️ Database Documentation - NMS

> Documentación completa del esquema de base de datos y patrones de acceso a datos

## 📊 Visión General

NMS utiliza **Prisma ORM** con **PostgreSQL (Neon)** como base de datos en producción. El esquema está diseñado para ser escalable y permite migrar fácilmente a otras bases de datos relacionales.

**Nota:** El schema.prisma está configurado para PostgreSQL. En desarrollo local, puedes usar `DATABASE_URL` con una conexión local o de Neon.

## 🔧 Configuración

### Variables de Entorno

```env
# Producción (Neon)
DATABASE_URL="postgresql://user:password@ep-xxx-xxx-123456.us-east-2.aws.neon.tech/nms?sslmode=require"

# Desarrollo local (opcional)
# DATABASE_URL="postgresql://postgres:password@localhost:5432/nms"
```

### Comandos Prisma

```bash
# Aplicar cambios al schema (sin crear migración) - Útil para desarrollo rápido
npx prisma db push

# Generar cliente Prisma después de cambios en schema
npx prisma generate

# Crear migración (para desarrollo con control de versiones)
npx prisma migrate dev

# Aplicar migraciones en producción
npx prisma migrate deploy

# Resetear base de datos (⚠️ CUIDADO: Borra todos los datos)
npx prisma migrate reset

# Ejecutar seed (crea usuarios iniciales y configuraciones)
npx tsx prisma/seed.ts
```

---

## 📋 Diagrama Entidad-Relación

```
┌─────────────────┐       ┌─────────────────┐
│      User       │       │     Group       │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ name            │       │ name (UQ)       │
│ email (UQ)      │       │ color           │
│ password         │       │ description     │
│ role            │       │ schedule        │
│ active          │       │ active          │
│ employeeRole     │       │ createdAt       │
│ phone           │       │ updatedAt       │
└────────┬────────┘       └────────┬────────┘
         │                         │
         │ 1:N                     │ 1:N
         │                         │
         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐
│    Account      │       │     Client      │
│    Session      │       ├─────────────────┤
│ (NextAuth)      │       │ id (PK)         │
└─────────────────┘       │ nombre          │
                         │ apellido        │
                         │ dni             │
                         │ telefono (UQ)   │
                         │ grupoId (FK)───►│
                         └────────┬────────┘
                                  │
                ┌─────────────────┼─────────────────┐
                │ 1:N             │ 1:N             │ 1:N
                ▼                 ▼                 ▼
       ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
       │  Subscription   │ │    Invoice      │ │   Attendance    │
       ├─────────────────┤ ├─────────────────┤ ├─────────────────┤
       │ id (PK)         │ │ id (PK)         │ │ id (PK)         │
       │ clientId (FK)   │ │ clientId (FK)   │ │ clientId (FK)   │
       │ month           │ │ imageUrl        │ │ date            │
       │ year            │ │ verified        │ │ notes           │
       │ status          │ │ uploadedAt      │ │ createdAt       │
       │ classesTotal    │ └─────────────────┘ └─────────────────┘
       │ classesUsed     │
       │ amount          │
       └─────────────────┘

┌─────────────────┐
│  PricingPlan    │
├─────────────────┤
│ id (PK)         │
│ name (UQ)       │
│ classes         │
│ price           │
│ description     │
│ isDefault       │
└─────────────────┘

┌─────────────────┐
│   Settings      │
├─────────────────┤
│ id (PK)         │
│ key (UQ)        │
│ value           │
│ category        │
│ description     │
└─────────────────┘
```

---

## 📝 Modelos

### User (Usuarios)

Modelo para autenticación y gestión de usuarios del sistema.

```prisma
model User {
  id           String   @id @default(cuid())
  name         String?
  email        String   @unique
  password     String
  role         Role     @default(EMPLEADO)
  employeeRole String?  // Ej: "ADMINISTRATIVO", "PROFESOR"
  phone        String?
  active       Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  accounts     Account[]
  sessions     Session[]

  @@map("users")
}
```

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | String | PK, CUID | Identificador único |
| `name` | String? | Opcional | Nombre del usuario |
| `email` | String | Único | Email para login |
| `password` | String | - | Hash bcrypt (12 rounds) |
| `role` | Role | Default: EMPLEADO | Rol del usuario |
| `employeeRole` | String? | Opcional | Rol específico (ej: ADMINISTRATIVO) |
| `phone` | String? | Opcional | Teléfono de contacto |
| `active` | Boolean | Default: true | Usuario activo/inactivo |

**Enum Role:**
```prisma
enum Role {
  EMPLEADORA  // Admin - Acceso completo
  EMPLEADO    // Staff - Acceso limitado
}
```

---

### Group (Grupos)

Etiquetas/categorías reutilizables para organizar clientes.

```prisma
model Group {
  id          String   @id @default(cuid())
  name        String   @unique
  color       String   @default("#06b6d4")
  description String?
  schedule    String?
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  clients     Client[]

  @@map("groups")
}
```

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | String | PK, CUID | Identificador único |
| `name` | String | Único, max 50 chars | Nombre del grupo |
| `color` | String | Default: #06b6d4 | Color hex para UI |
| `description` | String? | Opcional, max 200 chars | Descripción |
| `schedule` | String? | Opcional, max 100 chars | Horario del grupo |
| `active` | Boolean | Default: true | Grupo activo/inactivo |

---

### Client (Clientes)

Clientes del natatorio con información personal y preferencias.

```prisma
model Client {
  id             String   @id @default(cuid())
  nombre         String
  apellido       String
  dni            String?
  telefono       String   @unique
  grupoId        String?
  preferredDays  String?
  preferredTime  String?
  notes          String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  grupo          Group?          @relation(fields: [grupoId], references: [id], onDelete: SetNull)
  subscriptions  Subscription[]
  invoices       Invoice[]
  attendances    Attendance[]

  @@index([grupoId])
  @@map("clients")
}
```

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | String | PK, CUID | Identificador único |
| `nombre` | String | Requerido, min 2 chars | Nombre del cliente |
| `apellido` | String | Requerido, min 2 chars | Apellido del cliente |
| `dni` | String? | Opcional | Documento de identidad |
| `telefono` | String | Único, min 8 chars | Teléfono (usado para WhatsApp) |
| `grupoId` | String? | FK → Group.id | Grupo asignado |
| `preferredDays` | String? | Opcional | Días preferidos (comma-separated) |
| `preferredTime` | String? | Opcional | Hora preferida |
| `notes` | String? | Opcional | Notas adicionales |

**Relaciones:**
- `grupo` → Group (N:1, onDelete: SetNull)
- `subscriptions` → Subscription[] (1:N)
- `invoices` → Invoice[] (1:N)
- `attendances` → Attendance[] (1:N)

---

### Subscription (Suscripciones)

Control de pagos y clases por mes.

```prisma
model Subscription {
  id             String   @id @default(cuid())
  clientId       String
  month          Int
  year           Int
  status         SubscriptionStatus @default(PENDIENTE)
  classesTotal   Int      @default(4)
  classesUsed    Int      @default(0)
  amount         Float?
  notes          String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  client         Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)

  @@unique([clientId, month, year])
  @@map("subscriptions")
}
```

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | String | PK, CUID | Identificador único |
| `clientId` | String | FK → Client.id | Cliente asociado |
| `month` | Int | 1-12 | Mes de la suscripción |
| `year` | Int | 2020-2100 | Año de la suscripción |
| `status` | SubscriptionStatus | PENDIENTE | Estado del pago |
| `classesTotal` | Int | Default: 4 | Total de clases del mes |
| `classesUsed` | Int | Default: 0 | Clases utilizadas |
| `amount` | Float? | Opcional | Monto abonado |

**Restricción Única:** Un cliente solo puede tener una suscripción por mes/año.

**Estados de Status:**
| Estado | Descripción |
|--------|-------------|
| `AL_DIA` | Pago al día |
| `PENDIENTE` | Pago pendiente |
| `DEUDOR` | Pago atrasado |

---

### Attendance (Asistencias)

Registro de asistencia de clientes.

```prisma
model Attendance {
  id          String   @id @default(cuid())
  clientId    String
  date        DateTime @default(now())
  notes       String?
  createdAt   DateTime @default(now())

  client      Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)

  @@map("attendances")
}
```

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | String | PK, CUID | Identificador único |
| `clientId` | String | FK → Client.id | Cliente asociado |
| `date` | DateTime | Default: now() | Fecha y hora de asistencia |
| `notes` | String? | Opcional | Notas sobre la asistencia |

---

### Invoice (Facturas/Comprobantes)

Comprobantes de pago subidos por clientes.

```prisma
model Invoice {
  id         String   @id @default(cuid())
  clientId   String
  imageUrl   String
  verified   Boolean  @default(false)
  uploadedAt DateTime @default(now())

  client     Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)

  @@map("invoices")
}
```

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | String | PK, CUID | Identificador único |
| `clientId` | String | FK → Client.id | Cliente asociado |
| `imageUrl` | String | Requerido | URL de la imagen |
| `verified` | Boolean | Default: false | Si fue verificado por admin |
| `uploadedAt` | DateTime | Default: now() | Fecha de subida |

---

### PricingPlan (Planes de Precios)

Planes de suscripción disponibles.

```prisma
model PricingPlan {
  id          String   @id @default(cuid())
  name        String   @unique
  classes     Int
  price       Float
  description String?
  isDefault   Boolean  @default(false)
  createdAt   DateTime @default(now())

  @@map("pricing_plans")
}
```

---

### Settings (Configuraciones)

Configuraciones del sistema almacenadas como clave-valor.

```prisma
model Settings {
  id          String   @id @default(cuid())
  key         String   @unique
  value       String
  category    String?
  description String?

  @@map("settings")
}
```

**Categorías:**
- `business` - Configuraciones del negocio
- `payment` - Configuraciones de pago
- `notifications` - Configuraciones de notificaciones

---

### Modelos de NextAuth

Modelos requeridos por NextAuth para persistencia de sesiones.

```prisma
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}
```

---

## 🔍 Patrones de Consulta

### Consultas Básicas

```typescript
import { db } from '@/lib/db'

// Obtener todos los clientes
const clients = await db.client.findMany()

// Obtener cliente por ID
const client = await db.client.findUnique({
  where: { id: 'clx...' }
})

// Obtener cliente con relaciones
const clientWithRelations = await db.client.findUnique({
  where: { id: 'clx...' },
  include: {
    grupo: true,
    subscriptions: {
      orderBy: { createdAt: 'desc' },
      take: 5
    }
  }
})
```

### Consultas con Filtros

```typescript
// Buscar clientes por nombre
const clients = await db.client.findMany({
  where: {
    OR: [
      { nombre: { contains: 'Juan' } },
      { apellido: { contains: 'Juan' } }
    ]
  }
})

// Clientes con pagos pendientes
const pendingClients = await db.subscription.findMany({
  where: {
    month: currentMonth,
    year: currentYear,
    status: { in: ['PENDIENTE', 'DEUDOR'] }
  },
  include: {
    client: {
      include: { grupo: true }
    }
  }
})
```

### Consultas Optimizadas

```typescript
// Seleccionar solo campos necesarios
const clients = await db.client.findMany({
  select: {
    id: true,
    nombre: true,
    apellido: true,
    telefono: true,
    grupo: {
      select: {
        id: true,
        name: true,
        color: true
      }
    }
  }
})

// Ejecutar consultas en paralelo
const [total, clients] = await Promise.all([
  db.client.count(),
  db.client.findMany({ take: 20 })
])
```

### Transacciones

```typescript
// Crear cliente con suscripción inicial
const result = await db.$transaction(async (tx) => {
  const client = await tx.client.create({
    data: { nombre, apellido, telefono }
  })

  await tx.subscription.create({
    data: {
      clientId: client.id,
      month: currentMonth,
      year: currentYear,
      status: 'PENDIENTE'
    }
  })

  return client
})
```

### Agregaciones

```typescript
// Contar clientes por grupo
const clientsByGroup = await db.client.groupBy({
  by: ['grupoId'],
  _count: { id: true }
})

// Sumar ingresos del mes
const revenue = await db.subscription.aggregate({
  where: {
    month: currentMonth,
    year: currentYear,
    status: 'AL_DIA'
  },
  _sum: { amount: true }
})
```

---

## 📈 Índices

### Índices Definidos

```prisma
model Client {
  // ...
  @@index([grupoId])
}

model Subscription {
  // ...
  @@unique([clientId, month, year])
}
```

### Índices Recomendados para Producción

```prisma
model Client {
  @@index([telefono])    // Búsqueda por teléfono (ya es único)
  @@index([nombre])      // Búsqueda por nombre
  @@index([apellido])    // Búsqueda por apellido
}

model Subscription {
  @@index([clientId, month, year])  // Búsqueda de suscripción actual
  @@index([status])                 // Filtros por estado
}

model Attendance {
  @@index([clientId])   // Historial por cliente
  @@index([date])       // Asistencias por fecha
}
```

---

## 🔄 Migración desde SQLite

Si estás migrando desde una base de datos SQLite existente:

### 1. Exportar datos de SQLite

```bash
# Usar sqlite3 para exportar
sqlite3 database.db ".dump" > backup.sql
```

### 2. Actualizar connection string

```env
# Antigua (SQLite)
DATABASE_URL="file:./db/custom.db"

# Nueva (PostgreSQL/Neon)
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
```

### 3. Ejecutar db push con Prisma 6

```bash
npx prisma db push --accept-data-loss
```

**Nota:** `--accept-data-loss` es necesario cuando ya tienes datos en la base de datos PostgreSQL y el schema difiere.

---

## 🧪 Seed Data

El archivo `prisma/seed.ts` genera datos iniciales idempotentes:

### Usuarios Iniciales

| Usuario | Email | Password | Rol | employeeRole |
|---------|-------|----------|-----|--------------|
| Mariela | mariela@nms.com | mariela123 | EMPLEADORA | - |
| Tomás | tomas@nms.com | tomas123 | EMPLEADO | ADMINISTRATIVO |
| Camila | camila@nms.com | camila123 | EMPLEADO | ADMINISTRATIVO |

### Planes de Precios

| Plan | Clases | Precio |
|------|--------|--------|
| Mensual 4 clases | 4 | $5,000 |
| Mensual 8 clases | 8 | $8,500 |
| Mensual 12 clases | 12 | $11,000 |
| Clase individual | 1 | $1,500 |

### Configuraciones

10 configuraciones iniciales para negocio, pagos y notificaciones.

### Ejecutar Seed

```bash
# En desarrollo
npx tsx prisma/seed.ts

# En producción (automático via vercel.json)
# El build command incluye el seed
```

### Skipping Seed en Producción

Para evitar re-ejecutar seed en cada deployment:

```env
SKIP_SEED=true
NODE_ENV=production
```

---

## 🛡️ Buenas Prácticas

### 1. Usar Transacciones

```typescript
// ✅ Correcto - Operaciones atómicas
await db.$transaction([
  db.subscription.update({ where: { id }, data: { classesUsed: { increment: 1 } } }),
  db.attendance.create({ data: { clientId, date: new Date() } })
])

// ❌ Incorrecto - Operaciones separadas
await db.subscription.update(...)
await db.attendance.create(...)
```

### 2. Seleccionar Solo Campos Necesarios

```typescript
// ✅ Correcto
const client = await db.client.findUnique({
  where: { id },
  select: { id: true, nombre: true, apellido: true }
})

// ❌ Ineficiente para listas largas
const client = await db.client.findUnique({
  where: { id },
  include: { subscriptions: true, invoices: true, attendances: true }
})
```

### 3. Usar Paginación

```typescript
// ✅ Correcto
const clients = await db.client.findMany({
  skip: (page - 1) * limit,
  take: limit
})

// ❌ Cargar todo en memoria
const allClients = await db.client.findMany()
```

### 4. Consultas Paralelas

```typescript
// ✅ Correcto - Paralelo
const [clients, groups, stats] = await Promise.all([
  db.client.findMany(),
  db.group.findMany(),
  db.subscription.count()
])

// ❌ Secuencial
const clients = await db.client.findMany()
const groups = await db.group.findMany()
const stats = await db.subscription.count()
```

---

## 🔧 Troubleshooting

### Error: "Unique constraint failed"

```typescript
// Verificar antes de crear
const existing = await db.client.findUnique({
  where: { telefono }
})
if (existing) {
  throw new Error('Teléfono ya registrado')
}
```

### Error: "Foreign key constraint failed"

```typescript
// Verificar que la entidad relacionada existe
const group = await db.group.findUnique({
  where: { id: grupoId }
})
if (!group) {
  throw new Error('Grupo no encontrado')
}
```

### Error: "Transaction timeout"

```typescript
// Aumentar timeout en transacciones largas
await db.$transaction(
  async (tx) => { /* ... */ },
  { timeout: 10000 } // 10 segundos
)
```

---

## 🌐 Neon (PostgreSQL Serverless)

El proyecto usa [Neon](https://neon.tech/) como base de datos PostgreSQL serverless.

### Beneficios de Neon

- **Serverless**: Escala automáticamente
- **Branching**: Ramas de base de datos como Git
- **Auto-suspend**: Se suspende cuando no hay tráfico (ahorra créditos)
- **Compatible**: 100% PostgreSQL compatible

### Connection String

```
postgresql://user:password@ep-xxx-xxx-123456.us-east-2.aws.neon.tech/nms?sslmode=require
```

### Configuración de Neon con Prisma

```prisma
// schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

---

**Última actualización:** 2026-03-19
**Versión:** 2.0.0
