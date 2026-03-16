# 🗄️ Database Documentation - NMS

> Documentación completa del esquema de base de datos y patrones de acceso a datos

## 📊 Visión General

NMS utiliza **Prisma ORM** con **SQLite** como base de datos. El esquema está diseñado para ser escalable y permite migrar fácilmente a PostgreSQL u otra base de datos relacional.

## 🔧 Configuración

### Variables de Entorno

```env
DATABASE_URL="file:./db/custom.db"
```

### Comandos Prisma

```bash
# Aplicar cambios al schema (sin migraciones)
bun run db:push

# Generar cliente Prisma
bun run db:generate

# Crear migración (para producción)
bun run db:migrate

# Resetear base de datos
bun run db:reset

# Ejecutar seed
bun run db:seed
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
│ password        │       │ description     │
│ role            │       │ schedule        │
│ active          │       │ active          │
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
  active       Boolean  @default(true)
  image        String?
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
  status         String   @default("PENDIENTE")
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
| `status` | String | AL_DIA, PENDIENTE, DEUDOR | Estado del pago |
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
```

### Índices Recomendados para Producción

Para mejor rendimiento con grandes volúmenes de datos:

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

## 🔄 Migración a PostgreSQL

Para migrar de SQLite a PostgreSQL:

### 1. Actualizar Schema

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 2. Actualizar Tipos

```prisma
// SQLite usa String para DateTime, PostgreSQL usa DateTime nativo
// Prisma maneja esto automáticamente

// Para IDs, considerar usar UUID en PostgreSQL
model Client {
  id String @id @default(uuid())
}
```

### 3. Comandos de Migración

```bash
# Crear migración
bunx prisma migrate dev --name init_postgres

# Aplicar migración a producción
bunx prisma migrate deploy
```

---

## 🧪 Seed Data

El archivo `prisma/seed.ts` genera datos de prueba:

### Usuarios Iniciales

| Usuario | Email | Password | Rol |
|---------|-------|----------|-----|
| Mariela | mariela@nms.com | mariela123 | EMPLEADORA |
| Tomás | tomas@nms.com | tomas123 | EMPLEADO |

### Datos de Prueba Generados

- **6 grupos** con diferentes horarios
- **20 clientes** con datos aleatorios
- **20 suscripciones** para el mes actual
- **~150 asistencias** de los últimos 30 días
- **16 facturas** verificadas

### Ejecutar Seed

```bash
bun run db:seed
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

**Última actualización:** 2026-02-26
**Versión:** 1.0.0
