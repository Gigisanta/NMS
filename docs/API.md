# API Documentation - NMS

> Documentación completa de los endpoints de la API del Natatory Management System

## Autenticación

Todos los endpoints (excepto los marcados como públicos) requieren autenticación mediante NextAuth con sesión JWT.

### Headers Requeridos

```http
Cookie: authjs.session-token=<jwt_token>
```

### Errores de Autenticación

```json
// 401 Unauthorized
{ "success": false, "error": "No autenticado" }

// 403 Forbidden
{ "success": false, "error": "Sin permisos" }
```

## Formato de Respuestas

### Respuesta Exitosa

```json
{ "success": true, "data": { ... } }
```

### Respuesta con Paginación

```json
{
  "success": true,
  "data": [...],
  "pagination": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}
```

### Respuesta de Error

```json
{ "success": false, "error": "Mensaje de error descriptivo" }
```

---

## Autenticación

### POST `/api/auth/register`

Registra un nuevo usuario en el sistema.

**Acceso:** Público

**Request Body:**
```json
{
  "name": "Juan Pérez",
  "email": "juan@ejemplo.com",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "name": "Juan Pérez",
    "email": "juan@ejemplo.com",
    "role": "EMPLEADO"
  }
}
```

---

### POST `/api/auth/[...nextauth]`

Endpoints de NextAuth para manejo de sesiones.

**Endpoints incluidos:**
- `POST /api/auth/signin` - Iniciar sesión
- `POST /api/auth/signout` - Cerrar sesión
- `GET /api/auth/session` - Obtener sesión actual
- `GET /api/auth/csrf` - Token CSRF

---

## Clientes

### GET `/api/clients`

Lista clientes con paginación y filtros.

**Acceso:** Autenticado (EMPLEADORA, EMPLEADO)

**Query Parameters:**
| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `page` | number | 1 | Número de página |
| `limit` | number | 20 | Items por página (max 50) |
| `search` | string | - | Búsqueda por nombre, apellido, teléfono, DNI |
| `grupoId` | string | - | Filtrar por grupo |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "nombre": "Juan",
      "apellido": "Pérez",
      "dni": "12345678",
      "telefono": "+5491112345678",
      "grupoId": "clx...",
      "grupo": { "id": "clx...", "name": "Grupo A", "color": "#06b6d4" },
      "preferredDays": "Lunes,Miércoles",
      "preferredTime": "10:00",
      "createdAt": "2026-02-26T10:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}
```

---

### POST `/api/clients`

Crea un nuevo cliente con su suscripción inicial.

**Acceso:** Autenticado (EMPLEADORA, EMPLEADO)

**Request Body:**
```json
{
  "nombre": "Juan",
  "apellido": "Pérez",
  "dni": "12345678",
  "telefono": "+5491112345678",
  "grupoId": "clx...",
  "preferredDays": "Lunes,Miércoles",
  "preferredTime": "10:00",
  "notes": "Notas opcionales"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "nombre": "Juan",
    "apellido": "Pérez",
    "telefono": "+5491112345678"
  }
}
```

---

### GET `/api/clients/[id]`

Obtiene un cliente específico con todos sus detalles.

**Acceso:** Autenticado (EMPLEADORA, EMPLEADO)

---

### PUT `/api/clients/[id]`

Actualiza los datos de un cliente.

**Acceso:** Autenticado (EMPLEADORA, EMPLEADO)

---

### DELETE `/api/clients/[id]`

Elimina un cliente y todos sus datos relacionados.

**Acceso:** Autenticado (EMPLEADORA)

---

## Grupos

### GET `/api/groups`

Lista todos los grupos con conteo de clientes.

**Acceso:** Autenticado (EMPLEADORA, EMPLEADO)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "name": "Grupo A",
      "color": "#06b6d4",
      "description": "Niños principiantes",
      "schedule": "Lunes y Miércoles 10:00",
      "active": true,
      "createdAt": "2026-02-26T10:00:00.000Z",
      "clientCount": 15
    }
  ]
}
```

---

### POST `/api/groups`

Crea un nuevo grupo.

**Acceso:** Autenticado (EMPLEADORA)

**Request Body:**
```json
{
  "name": "Grupo Nuevo",
  "color": "#8b5cf6",
  "description": "Descripción del grupo",
  "schedule": "Viernes 18:00"
}
```

---

### GET `/api/groups/[id]`

Obtiene un grupo específico.

**Acceso:** Autenticado (EMPLEADORA, EMPLEADO)

---

### PUT `/api/groups/[id]`

Actualiza un grupo existente.

**Acceso:** Autenticado (EMPLEADORA)

---

### DELETE `/api/groups/[id]`

Elimina un grupo (los clientes quedan sin grupo).

**Acceso:** Autenticado (EMPLEADORA)

---

## Asignaciones Cliente-Grupo (ClientGroup)

### GET `/api/client-groups`

Lista todas las asignaciones de clientes a grupos.

**Acceso:** Autenticado (EMPLEADORA, EMPLEADO)

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `clientId` | string | Filtrar por cliente |
| `groupId` | string | Filtrar por grupo |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "clientId": "clx...",
      "groupId": "clx...",
      "schedule": "Lunes 10:00",
      "client": { "id": "clx...", "nombre": "Juan", "apellido": "Pérez" },
      "group": { "id": "clx...", "name": "Grupo A", "color": "#06b6d4" }
    }
  ]
}
```

---

### POST `/api/client-groups`

Asigna un cliente a un grupo.

**Acceso:** Autenticado (EMPLEADORA)

**Request Body:**
```json
{
  "clientId": "clx...",
  "groupId": "clx...",
  "schedule": "Lunes 10:00"
}
```

---

### DELETE `/api/client-groups/[id]`

Elimina una asignación cliente-grupo.

**Acceso:** Autenticado (EMPLEADORA)

---

## Suscripciones

### GET `/api/subscriptions`

Lista suscripciones con filtros.

**Acceso:** Autenticado (EMPLEADORA, EMPLEADO)

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `clientId` | string | Filtrar por cliente |
| `month` | number | Mes (1-12) |
| `year` | number | Año |
| `status` | string | AL_DIA, PENDIENTE, DEUDOR |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "clientId": "clx...",
      "month": 2,
      "year": 2026,
      "status": "AL_DIA",
      "classesTotal": 4,
      "classesUsed": 2,
      "amount": 5000,
      "client": {
        "id": "clx...",
        "nombre": "Juan",
        "apellido": "Pérez",
        "grupo": { "id": "clx...", "name": "Grupo A", "color": "#06b6d4" }
      }
    }
  ]
}
```

---

### POST `/api/subscriptions`

Crea una nueva suscripción.

**Acceso:** Autenticado (EMPLEADORA)

**Request Body:**
```json
{
  "clientId": "clx...",
  "month": 3,
  "year": 2026,
  "classesTotal": 4,
  "amount": 5000,
  "paymentMethod": "EFECTIVO",
  "notes": "Pago anticipado"
}
```

---

### GET `/api/subscriptions/[id]`

Obtiene una suscripción específica.

**Acceso:** Autenticado (EMPLEADORA, EMPLEADO)

---

### PUT `/api/subscriptions/[id]`

Actualiza una suscripción.

**Acceso:** Autenticado (EMPLEADORA)

---

## Asistencias

### GET `/api/attendance`

Lista y registra asistencias.

**Acceso:** Autenticado (EMPLEADORA, EMPLEADO)

**Query Parameters:**
| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `date` | string | hoy | Fecha (YYYY-MM-DD) |
| `clientId` | string | - | Filtrar por cliente |
| `grupoId` | string | - | Filtrar por grupo |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "clientId": "clx...",
      "date": "2026-02-26T10:00:00.000Z",
      "notes": null,
      "client": {
        "id": "clx...",
        "nombre": "Juan",
        "apellido": "Pérez",
        "grupo": { "id": "clx...", "name": "Grupo A", "color": "#06b6d4" }
      }
    }
  ]
}
```

---

### POST `/api/attendance`

Registra una nueva asistencia.

**Acceso:** Autenticado (EMPLEADORA, EMPLEADO)

**Request Body:**
```json
{
  "clientId": "clx...",
  "notes": "Llegó tarde"
}
```

**Nota:** Al registrar asistencia, se incrementa automáticamente `classesUsed` en la suscripción actual.

---

## Empleados

### GET `/api/employees`

Lista todos los empleados (usuarios con rol EMPLEADO).

**Acceso:** Autenticado (EMPLEADORA)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "name": "Tomás",
      "email": "tomas@nms.com",
      "role": "EMPLEADO",
      "employeeRole": "ADMINISTRATIVO",
      "hourlyRate": 1500.00,
      "phone": "+5491112345678",
      "active": true
    }
  ]
}
```

---

### POST `/api/employees`

Crea un nuevo empleado.

**Acceso:** Autenticado (EMPLEADORA)

**Request Body:**
```json
{
  "name": "Nuevo Empleado",
  "email": "nuevo@nms.com",
  "password": "password123",
  "employeeRole": "PROFESOR",
  "hourlyRate": 2000,
  "phone": "+5491112345679"
}
```

---

### GET `/api/employees/[id]`

Obtiene un empleado específico con sus fichajes.

**Acceso:** Autenticado (EMPLEADORA)

---

### PUT `/api/employees/[id]`

Actualiza un empleado.

**Acceso:** Autenticado (EMPLEADORA)

---

## Fichajes (TimeEntries)

### GET `/api/time-entries`

Lista fichajes de empleados.

**Acceso:** Autenticado (EMPLEADORA, EMPLEADO - solo propios)

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `userId` | string | Filtrar por empleado |
| `date` | string | Fecha (YYYY-MM-DD) |
| `month` | number | Mes |
| `year` | number | Año |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "userId": "clx...",
      "clockIn": "2026-02-26T08:00:00.000Z",
      "clockOut": "2026-02-26T16:00:00.000Z",
      "notes": null,
      "user": {
        "id": "clx...",
        "name": "Tomás",
        "email": "tomas@nms.com"
      }
    }
  ]
}
```

---

### POST `/api/time-entries`

Registra fichaje de entrada o salida.

**Acceso:** Autenticado (EMPLEADORA, EMPLEADO - propios)

**Request Body:**
```json
{
  "userId": "clx...",
  "clockIn": "2026-02-26T08:00:00.000Z",
  "clockOut": "2026-02-26T16:00:00.000Z",
  "notes": "Salió temprano"
}
```

---

## Gastos (Expenses)

### GET `/api/expenses`

Lista gastos con filtros.

**Acceso:** Autenticado (EMPLEADORA)

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `category` | string | FIJO, VARIABLE, SUELDO, PROVEEDOR, OTROS |
| `month` | number | Mes |
| `year` | number | Año |
| `userId` | string | Filtrar por empleado (sueldos) |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "description": "Alquiler piscina",
      "amount": 150000,
      "category": "FIJO",
      "date": "2026-02-26T10:00:00.000Z",
      "month": 2,
      "year": 2026,
      "supplier": "Inmobiliaria ABC",
      "notes": null
    }
  ]
}
```

---

### POST `/api/expenses`

Crea un nuevo gasto.

**Acceso:** Autenticado (EMPLEADORA)

**Request Body:**
```json
{
  "description": "Compra de insumos",
  "amount": 5000,
  "category": "VARIABLE",
  "date": "2026-02-26T10:00:00.000Z",
  "month": 2,
  "year": 2026,
  "supplier": "Limpieza SA",
  "notes": "Cloro y фильтры"
}
```

---

### GET `/api/expenses/[id]`

Obtiene un gasto específico.

**Acceso:** Autenticado (EMPLEADORA)

---

### PUT `/api/expenses/[id]`

Actualiza un gasto.

**Acceso:** Autenticado (EMPLEADORA)

---

### DELETE `/api/expenses/[id]`

Elimina un gasto.

**Acceso:** Autenticado (EMPLEADORA)

---

## Facturas (Invoices)

### GET `/api/invoices`

Lista facturas con filtros.

**Acceso:** Autenticado (EMPLEADORA, EMPLEADO)

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `clientId` | string | Filtrar por cliente |
| `status` | string | PENDING, VERIFIED, REJECTED |
| `month` | number | Mes |
| `year` | number | Año |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "clientId": "clx...",
      "fileName": "comprobante_feb2026.jpg",
      "fileSize": 102400,
      "mimeType": "image/jpeg",
      "verified": true,
      "status": "VERIFIED",
      "amount": 5000,
      "issueDate": "2026-02-15T00:00:00.000Z",
      "uploadedAt": "2026-02-26T10:00:00.000Z",
      "client": {
        "id": "clx...",
        "nombre": "Juan",
        "apellido": "Pérez"
      }
    }
  ]
}
```

---

### POST `/api/invoices`

Crea una factura (con archivo).

**Acceso:** Autenticado (EMPLEADORA, EMPLEADO)

**Request Body (multipart/form-data):**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `clientId` | string | ID del cliente |
| `file` | File | Archivo del comprobante |
| `invoiceNumber` | string | Número de factura |
| `amount` | number | Monto |
| `issueDate` | string | Fecha de emisión |

---

### GET `/api/invoices/[id]`

Obtiene una factura específica.

**Acceso:** Autenticado (EMPLEADORA, EMPLEADO)

---

### PUT `/api/invoices/[id]`

Actualiza una factura (verificación, estado).

**Acceso:** Autenticado (EMPLEADORA)

---

### DELETE `/api/invoices/[id]`

Elimina una factura.

**Acceso:** Autenticado (EMPLEADORA)

---

### GET `/api/invoices/[id]/file`

Descarga el archivo binario de la factura.

**Acceso:** Autenticado (EMPLEADORA, EMPLEADO)

**Response:** Binary file data with appropriate Content-Type header.

---

### POST `/api/invoices/auto`

Procesa automáticamente facturas de WhatsApp.

**Acceso:** Autenticado (EMPLEADORA)

---

## Calendario

### GET `/api/calendar`

Lista eventos del calendario.

**Acceso:** Autenticado (EMPLEADORA, EMPLEADO)

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `start` | string | Fecha inicio (ISO) |
| `end` | string | Fecha fin (ISO) |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "title": "Clase de natacion",
      "description": "Grupo principiantes",
      "start": "2026-02-26T10:00:00.000Z",
      "end": "2026-02-26T11:00:00.000Z",
      "allDay": false,
      "color": "#3b82f6"
    }
  ]
}
```

---

### POST `/api/calendar`

Crea un nuevo evento.

**Acceso:** Autenticado (EMPLEADORA)

**Request Body:**
```json
{
  "title": "Nuevo Evento",
  "description": "Descripción",
  "start": "2026-02-26T10:00:00.000Z",
  "end": "2026-02-26T11:00:00.000Z",
  "allDay": false,
  "color": "#3b82f6"
}
```

---

## Dashboard

### GET `/api/dashboard`

Obtiene estadísticas generales del sistema.

**Acceso:** Autenticado (EMPLEADORA, EMPLEADO)

**Cache:** 1 minuto (TanStack Query)

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalClients": 100,
      "activeClients": 85,
      "pendingPayments": 10,
      "overduePayments": 5,
      "todayAttendances": 15,
      "monthRevenue": 425000
    },
    "recentClients": [...],
    "pendingClients": [...],
    "currentMonth": 2,
    "currentYear": 2026
  }
}
```

---

## Configuración

### GET `/api/settings`

Lista configuraciones del sistema.

**Acceso:** Autenticado (EMPLEADORA)

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `category` | string | general, payment, notifications, business |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "key": "business_name",
      "value": "Natatorio Los Andes",
      "category": "business"
    }
  ]
}
```

---

### POST `/api/settings`

Crea o actualiza una configuración.

**Acceso:** Autenticado (EMPLEADORA)

**Request Body:**
```json
{
  "key": "business_name",
  "value": "Natatorio Los Andes",
  "category": "business",
  "description": "Nombre del negocio"
}
```

---

## Facturación ARCA

### GET `/api/billing`

Obtiene datos de facturación ARCA.

**Acceso:** Autenticado (EMPLEADORA)

---

## WhatsApp

### POST `/api/webhook/whatsapp`

Recibe mensajes de WhatsApp Business API.

**Acceso:** Público (verificación de firma)

**Request Body (WhatsApp Business API format):**
```json
{
  "entry": [{
    "id": "phone_number_id",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": { "phone_number_id": "clx..." },
        "contacts": [{ "profile": { "name": "Juan" }, "wa_id": "5491112345678" }],
        "messages": [{
          "from": "5491112345678",
          "id": "wamid.xxx",
          "timestamp": "1708963200",
          "type": "text",
          "text": { "body": "Hola" }
        }]
      }
    }]
  }]
}
```

---

### GET `/api/whatsapp/config`

Obtiene configuración de WhatsApp.

**Acceso:** Autenticado (EMPLEADORA)

---

### POST `/api/whatsapp/config`

Guarda configuración de WhatsApp.

**Acceso:** Autenticado (EMPLEADORA)

---

### GET `/api/whatsapp/messages`

Lista mensajes de WhatsApp recibidos.

**Acceso:** Autenticado (EMPLEADORA)

---

## Planes de Precios

### GET `/api/pricing-plans`

Lista planes de precios disponibles.

**Acceso:** Autenticado (EMPLEADORA, EMPLEADO)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "name": "Mensual 4 clases",
      "classes": 4,
      "price": 5000,
      "description": "4 clases mensuales",
      "isDefault": true
    }
  ]
}
```

---

## Health Check

### GET `/api`

Verifica que la API está funcionando.

**Acceso:** Público

**Response:**
```json
{
  "success": true,
  "message": "NMS API is running",
  "version": "1.0.0",
  "timestamp": "2026-04-01T00:00:00.000Z"
}
```

---

## Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| `200` | OK - Solicitud exitosa |
| `201` | Created - Recurso creado exitosamente |
| `400` | Bad Request - Datos inválidos o faltantes |
| `401` | Unauthorized - No autenticado |
| `403` | Forbidden - Sin permisos |
| `404` | Not Found - Recurso no encontrado |
| `429` | Too Many Requests - Rate limit excedido |
| `500` | Internal Server Error - Error del servidor |

---

## Rate Limiting

Algunos endpoints públicos están protegidos con rate limiting usando @upstash/ratelimit:

| Endpoint | Límite |
|----------|--------|
| `/api/auth/register` | 5 requests / minuto |
| `/api/webhook/whatsapp` | 60 requests / minuto |

---

**Última actualización:** 2026-04-01
**Versión:** 2.0.0
