# Database Documentation - NMS

> Documentación completa del esquema de base de datos y patrones de acceso a datos

## Visión General

NMS utiliza **Prisma ORM** con **PostgreSQL (Neon)** como base de datos en producción. El esquema soporta archivos binarios (bytea) para facturas y relaciones muchos-a-muchos entre clientes y grupos.

**Nota:** El schema.prisma está configurado para PostgreSQL. En desarrollo local, usa `DATABASE_URL` con conexión a Neon o PostgreSQL local.

## Configuración

### Variables de Entorno

```env
# Producción (Neon)
DATABASE_URL="postgresql://user:password@ep-xxx-xxx-123456.us-east-2.aws.neon.tech/nms?sslmode=require"

# Desarrollo local (opcional)
# DATABASE_URL="postgresql://postgres:password@localhost:5432/nms"
```

### Comandos Prisma

```bash
# Aplicar migraciones en producción (SEGURO)
npm run db:migrate

# Generar cliente Prisma después de cambios en schema
npm run db:generate

# Push schema sin crear migración (solo desarrollo)
npx prisma db push

# Crear migración (para desarrollo con control de versiones)
npm run db:migrate

# Resetear base de datos (CUIDADO: Borra todos los datos)
npx prisma migrate reset

# Ejecutar seed (crea usuarios iniciales y configuraciones)
bun run prisma/seed.ts
```

---

## Diagrama Entidad-Relación

```
┌─────────────────┐       ┌─────────────────┐
│      User       │       │     Group       │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ email (UQ)      │       │ name (UQ)       │
│ password        │       │ color           │
│ role            │       │ description     │
│ employeeRole    │       │ schedule        │
│ hourlyRate      │       │ active          │
│ active          │       └────────┬────────┘
└────────┬────────┘                │
         │ 1:N                     │ N:M
         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐
│   TimeEntry     │       │  ClientGroup    │
│   (fichaje)     │       │ (junction)     │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ userId (FK)     │       │ clientId (FK)  │
│ clockIn         │       │ groupId (FK)   │
│ clockOut         │       │ schedule        │
└─────────────────┘       └────────┬────────┘
                                    │
         ┌───────────────────────────�┘
         │ N:1                     │ N:1
         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐
│    Client       │       │     Group       │
├─────────────────┤       └─────────────────┘
│ id (PK)         │
│ nombre          │
│ telefono (UQ)   │
│ grupoId (FK)    │
│ monthlyAmount   │
│ registrationFee │
└────────┬────────┘
         │
         │ 1:N             │ 1:N             │ 1:N
         ▼                 ▼                 ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Subscription   │ │    Invoice      │ │   Attendance    │
├─────────────────┤ ├─────────────────┤ ├─────────────────┤
│ id (PK)         │ │ id (PK)         │ │ id (PK)         │
│ clientId (FK)   │ │ clientId (FK)   │ │ clientId (FK)   │
│ month            │ │ fileData (bytea)│ │ date            │
│ year            │ │ fileName        │ └─────────────────┘
│ status          │ │ fileSize        │
│ classesTotal    │ │ mimeType        │
│ classesUsed     │ │ verified        │
└─────────────────┘ │ status          │
                    └─────────────────┘

┌─────────────────┐
│  WhatsAppMessage│
├─────────────────┤
│ id (PK)         │
│ fromPhone       │
│ matchedClientId │
│ status          │
└─────────────────┘

┌─────────────────┐
│    Expense      │
├─────────────────┤
│ id (PK)         │
│ description     │
│ amount          │
│ category        │
│ date            │
│ userId (FK)     │
└─────────────────┘

┌─────────────────┐
│  CalendarEvent  │
├─────────────────┤
│ id (PK)         │
│ title           │
│ start           │
│ end             │
│ allDay          │
│ color           │
└─────────────────┘
```

---

## Modelos

### User (Usuarios/Empleados)

```prisma
model User {
  id           String       @id @default(cuid())
  name         String?
  email        String       @unique
  password     String
  role         Role         @default(EMPLEADO)
  employeeRole String?      // "ADMINISTRATIVO", "PROFESOR"
  hourlyRate   Decimal?     @db.Decimal(10, 2)
  phone        String?
  active       Boolean      @default(true)
  image        String?
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  accounts     Account[]
  sessions     Session[]
  timeEntries  TimeEntry[]
  expenses     Expense[]
  clientsUpdated Client[] @relation("ClientUpdates")

  @@map("users")
}
```

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | String | PK, CUID | Identificador único |
| `email` | String | Único | Email para login |
| `password` | String | - | Hash bcrypt (12 rounds) |
| `role` | Role | Default: EMPLEADO | Rol del usuario |
| `employeeRole` | String? | Opcional | Rol específico (ej: ADMINISTRATIVO, PROFESOR) |
| `hourlyRate` | Decimal? | Opcional | Salario por hora para empleados |
| `active` | Boolean | Default: true | Usuario activo/inactivo |

---

### Group (Grupos)

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
  clientGroups ClientGroup[]

  @@map("groups")
}
```

---

### ClientGroup (Relación Muchos-a-Muchos)

```prisma
model ClientGroup {
  id        String   @id @default(cuid())
  clientId  String
  groupId   String
  schedule  String?  // Override del schedule del grupo para este cliente
  createdAt DateTime @default(now())

  client    Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  group     Group    @relation(fields: [groupId], references: [id], onDelete: Cascade)

  @@unique([clientId, groupId])
  @@index([clientId])
  @@index([groupId])
  @@map("client_groups")
}
```

**Importante:** La relación entre Client y Group es **muchos-a-muchos** a través de esta tabla de unión.

---

### Client (Clientes)

```prisma
model Client {
  id              String   @id @default(cuid())
  nombre          String
  apellido        String
  dni             String?
  telefono        String?
  grupoId         String?
  preferredDays   String?
  preferredTime   String?
  notes           String?
  monthlyAmount   Decimal?  @db.Decimal(10, 2)
  registrationFeePaid1 Boolean @default(false)
  registrationFeePaid2 Boolean @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  updatedByUserId String?

  grupo          Group?          @relation(fields: [grupoId], references: [id], onDelete: SetNull)
  updatedByUser  User?    @relation("ClientUpdates", fields: [updatedByUserId])
  subscriptions  Subscription[]
  invoices       Invoice[]
  attendances    Attendance[]
  clientGroups   ClientGroup[]

  @@index([grupoId])
  @@index([apellido, nombre])
  @@map("clients")
}
```

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | String | PK, CUID | Identificador único |
| `nombre` | String | Requerido | Nombre del cliente |
| `telefono` | String? | Opcional | Teléfono (usado para WhatsApp) |
| `grupoId` | String? | FK → Group.id | Grupo principal (deprecated, usar ClientGroup) |
| `monthlyAmount` | Decimal? | Opcional | Monto mensual personalizado |
| `registrationFeePaid1` | Boolean | Default: false | Primera cuota de inscripción pagada |
| `registrationFeePaid2` | Boolean | Default: false | Segunda cuota de inscripción pagada |

---

### Subscription (Suscripciones)

```prisma
model Subscription {
  id             String   @id @default(cuid())
  clientId       String
  month          Int
  year           Int
  status         String   @default("PENDIENTE")
  paymentMethod  String?  // EFECTIVO, TRANSFERENCIA, MERCADO_PAGO
  billingPeriod  String   @default("FULL") // FULL or HALF
  isBilled       Boolean  @default(false)
  classesTotal   Int      @default(4)
  classesUsed    Int      @default(0)
  amount         Decimal?  @db.Decimal(10, 2)
  notes          String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  invoices       Invoice[]
  client         Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)

  @@unique([clientId, month, year, billingPeriod])
  @@index([status])
  @@index([clientId, status])
  @@index([month, year])
  @@map("subscriptions")
}
```

**Índices:**
- `[clientId, status]` - Para filtrar clientes morosos
- `[month, year]` - Para reportes mensuales

**Billing Period:** Permite suscripciones de mes completo (FULL) o media quota (HALF) para altas a mitad de mes.

---

### Invoice (Facturas con FileData)

```prisma
model Invoice {
  id           String   @id @default(cuid())
  clientId     String
  subscriptionId String?

  // File information
  fileName     String   @default("unknown")
  filePath     String   @default("/uploads/placeholder")
  fileSize     Int?
  mimeType     String   @default("application/pdf")

  // File data stored directly in PostgreSQL (bytea)
  fileData     Bytes?   @db.ByteA

  // Legacy field (deprecated)
  imageUrl     String?

  // Invoice metadata
  invoiceNumber String?
  amount       Decimal?  @db.Decimal(10, 2)
  currency     String   @default("ARS")
  issueDate    DateTime?
  dueDate      DateTime?

  // Categorization
  type         String   @default("PAYMENT")
  category     String?
  description  String?

  // Status
  verified     Boolean  @default(false)
  status       String   @default("PENDING")

  // Source tracking
  source       String   @default("MANUAL")
  externalRef  String?

  // Relations
  client       Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  subscription Subscription? @relation(fields: [subscriptionId], references: [id], onDelete: SetNull)

  uploadedAt   DateTime @default(now())
  updatedAt    DateTime @default(now())
  uploadedBy   String?

  @@index([subscriptionId])
  @@index([clientId])
  @@index([issueDate])
  @@index([status])
  @@map("invoices")
}
```

**Almacenamiento de Archivos:**
- Los archivos se almacenan como `bytea` (binary) directamente en PostgreSQL
- `fileData` contiene los bytes del archivo
- `fileSize` y `mimeType` para metadata
- Descarga via `/api/invoices/[id]/file`

---

### Attendance (Asistencias)

```prisma
model Attendance {
  id          String   @id @default(cuid())
  clientId    String
  date        DateTime @default(now())
  notes       String?
  createdAt   DateTime @default(now())

  client      Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)

  @@index([clientId])
  @@index([date])
  @@index([clientId, date])
  @@map("attendances")
}
```

**Índices:**
- `[clientId, date]` - Para historial de cliente y reportes diarios

---

### TimeEntry (Fichaje de Empleados)

```prisma
model TimeEntry {
  id         String   @id @default(cuid())
  userId     String
  clockIn    DateTime
  clockOut   DateTime?
  notes      String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([clockIn])
  @@index([userId, clockIn])
  @@map("time_entries")
}
```

**Índices:**
- `[userId, clockIn]` - Para reportes de fichaje por empleado y rango de fechas

---

### Expense (Gastos)

```prisma
model Expense {
  id          String   @id @default(cuid())
  description String
  amount      Decimal    @db.Decimal(10, 2)
  category    ExpenseCategory
  date        DateTime @default(now())
  month       Int?
  year        Int?
  userId      String?
  supplier    String?
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([category])
  @@index([date])
  @@index([userId])
  @@map("expenses")
}
```

**Categorías:**
```prisma
enum ExpenseCategory {
  FIJO      // Alquiler, Luz, Impuestos
  VARIABLE  // Insumos, Reparaciones
  SUELDO    // Pago de sueldos
  PROVEEDOR // Pagos a proveedores
  OTROS     // Otros gastos
}
```

---

### CalendarEvent (Eventos del Calendario)

```prisma
model CalendarEvent {
  id          String   @id @default(cuid())
  title       String
  description String?
  start       DateTime
  end         DateTime?
  allDay      Boolean  @default(false)
  color       String?  @default("#3b82f6")
  userId      String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([start])
  @@index([end])
  @@index([userId])
  @@map("calendar_events")
}
```

---

### WhatsAppMessage (Mensajes de WhatsApp)

```prisma
model WhatsAppMessage {
  id              String   @id @default(cuid())
  messageId       String   @unique
  fromPhone       String
  fromName        String?
  messageType     String
  content         String?
  mediaId         String?
  mediaUrl        String?
  matchedClientId String?
  matchedBy       String?
  invoiceId       String?
  subscriptionId  String?
  status          String   @default("received")
  responseSent    Boolean  @default(false)
  errorMessage    String?
  processedAt     DateTime?
  createdAt       DateTime @default(now())

  @@index([fromPhone])
  @@index([status])
  @@index([createdAt])
  @@index([fromPhone, createdAt])
  @@index([matchedClientId])
  @@map("whatsapp_messages")
}
```

**Índices:**
- `[matchedClientId]` - Para buscar mensajes por cliente matcheado
- `[fromPhone, createdAt]` - Para historial por número de teléfono

---

### Modelos de NextAuth

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

## Índices

### Índices Definidos en el Schema

```prisma
// TimeEntry (fichaje empleados)
@@index([userId])
@@index([clockIn])
@@index([userId, clockIn])

// Subscription
@@index([status])
@@index([clientId, status])
@@index([month, year])

// Attendance
@@index([clientId])
@@index([date])
@@index([clientId, date])

// WhatsAppMessage
@@index([fromPhone])
@@index([status])
@@index([createdAt])
@@index([fromPhone, createdAt])
@@index([matchedClientId])

// Expense
@@index([category])
@@index([date])
@@index([userId])

// ClientGroup
@@index([clientId])
@@index([groupId])

// Client
@@index([grupoId])
@@index([apellido, nombre])

// CalendarEvent
@@index([start])
@@index([end])
@@index([userId])

// Invoice
@@index([subscriptionId])
@@index([clientId])
@@index([issueDate])
@@index([status])
```

### Resumen de Índices

| Modelo | Índice | Propósito |
|--------|--------|-----------|
| TimeEntry | `[userId, clockIn]` | Reportes de fichaje por empleado y rango |
| Subscription | `[clientId, status]` | Filtrar clientes morosos |
| Attendance | `[clientId, date]` | Historial de cliente |
| WhatsAppMessage | `[matchedClientId]` | Buscar por cliente matcheado |
| Expense | `[category]` | Reportes por categoría |

---

## Patrones de Consulta

### TanStack Query Usage

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'

// Consulta con cache
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
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  },
})
```

### Prisma Queries

```typescript
import { db } from '@/lib/db'

// Cliente con relaciones
const client = await db.client.findUnique({
  where: { id: 'clx...' },
  include: {
    grupo: true,
    clientGroups: { include: { group: true } },
    subscriptions: { orderBy: { createdAt: 'desc' }, take: 5 }
  }
})

// Clientes con suscripciones pendientes
const pendingClients = await db.subscription.findMany({
  where: { status: { in: ['PENDIENTE', 'DEUDOR'] } },
  include: { client: { include: { grupo: true } } }
})

// Transacción para crear cliente con grupo
const result = await db.$transaction(async (tx) => {
  const client = await tx.client.create({ data: { nombre, telefono } })
  await tx.clientGroup.create({
    data: { clientId: client.id, groupId }
  })
  return client
})
```

---

## Seed Data

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

---

## Buenas Prácticas

### 1. Usar Transacciones

```typescript
// Correcto - Operaciones atómicas
await db.$transaction([
  db.subscription.update({ where: { id }, data: { classesUsed: { increment: 1 } } }),
  db.attendance.create({ data: { clientId, date: new Date() } })
])
```

### 2. Seleccionar Solo Campos Necesarios

```typescript
// Correcto
const client = await db.client.findUnique({
  where: { id },
  select: { id: true, nombre: true, telefono: true }
})
```

### 3. Usar Índices

```typescript
// Consultas que usan índices definidos
const attendances = await db.attendance.findMany({
  where: { clientId, date: { gte: startDate, lte: endDate } }
})
```

### 4. Consultas Paralelas

```typescript
// Paralelo - Correcto
const [clients, stats] = await Promise.all([
  db.client.findMany(),
  db.subscription.count()
])
```

---

## Neon (PostgreSQL Serverless)

El proyecto usa [Neon](https://neon.tech/) como base de datos PostgreSQL serverless.

### Beneficios

- **Serverless**: Escala automáticamente
- **Branching**: Ramas de base de datos como Git
- **Auto-suspend**: Se suspende cuando no hay tráfico
- **Binary Support**: Soporte completo para bytea
- **100% PostgreSQL**: Compatible con Prisma

---

**Última actualización:** 2026-04-01
**Versión:** 3.0.0
