# 📡 API Documentation - NMS

> Documentación completa de los endpoints de la API del Natatory Management System

## 🔒 Autenticación

Todos los endpoints (excepto los marcados como públicos) requieren autenticación mediante NextAuth con sesión JWT.

### Headers Requeridos

```http
Cookie: authjs.session-token=<jwt_token>
```

### Errores de Autenticación

```json
// 401 Unauthorized
{
  "success": false,
  "error": "No autenticado"
}

// 403 Forbidden
{
  "success": false,
  "error": "Sin permisos"
}
```

## 📋 Formato de Respuestas

### Respuesta Exitosa

```json
{
  "success": true,
  "data": { ... }
}
```

### Respuesta con Paginación

```json
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
```

### Respuesta de Error

```json
{
  "success": false,
  "error": "Mensaje de error descriptivo"
}
```

---

## 🔐 Autenticación

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

**Errores:**
- `400` - Datos inválidos o email ya registrado

---

### POST `/api/auth/[...nextauth]`

Endpoints de NextAuth para manejo de sesiones.

**Endpoints incluidos:**
- `POST /api/auth/signin` - Iniciar sesión
- `POST /api/auth/signout` - Cerrar sesión
- `GET /api/auth/session` - Obtener sesión actual
- `GET /api/auth/csrf` - Token CSRF

---

## 👥 Clientes

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
| `withSubscription` | boolean | false | Incluir suscripción actual |

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
      "grupo": {
        "id": "clx...",
        "name": "Grupo A",
        "color": "#06b6d4"
      },
      "preferredDays": "Lunes,Miércoles",
      "preferredTime": "10:00",
      "notes": null,
      "createdAt": "2026-02-26T10:00:00.000Z",
      "currentSubscription": {
        "id": "clx...",
        "status": "AL_DIA",
        "classesUsed": 2,
        "classesTotal": 4,
        "amount": 5000
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
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
  "notes": "Notas opcionales",
  "classesTotal": 4
}
```

**Campos Requeridos:**
- `nombre` (string, min 2 caracteres)
- `apellido` (string, min 2 caracteres)
- `telefono` (string, min 8 caracteres, único)

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "nombre": "Juan",
    "apellido": "Pérez",
    "dni": "12345678",
    "telefono": "+5491112345678",
    "grupoId": "clx...",
    "grupo": {
      "id": "clx...",
      "name": "Grupo A",
      "color": "#06b6d4"
    },
    "preferredDays": "Lunes,Miércoles",
    "preferredTime": "10:00",
    "notes": "Notas opcionales",
    "createdAt": "2026-02-26T10:00:00.000Z"
  }
}
```

**Errores:**
- `400` - Campos requeridos faltantes o teléfono duplicado
- `500` - Error interno del servidor

---

### GET `/api/clients/[id]`

Obtiene un cliente específico con todos sus detalles.

**Acceso:** Autenticado (EMPLEADORA, EMPLEADO)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "nombre": "Juan",
    "apellido": "Pérez",
    "dni": "12345678",
    "telefono": "+5491112345678",
    "grupoId": "clx...",
    "grupo": {
      "id": "clx...",
      "name": "Grupo A",
      "color": "#06b6d4",
      "description": "Niños principiantes",
      "schedule": "Lunes y Miércoles 10:00"
    },
    "preferredDays": "Lunes,Miércoles",
    "preferredTime": "10:00",
    "notes": null,
    "createdAt": "2026-02-26T10:00:00.000Z",
    "updatedAt": "2026-02-26T10:00:00.000Z",
    "subscriptions": [
      {
        "id": "clx...",
        "month": 2,
        "year": 2026,
        "status": "AL_DIA",
        "classesTotal": 4,
        "classesUsed": 2,
        "amount": 5000
      }
    ],
    "invoices": [
      {
        "id": "clx...",
        "imageUrl": "/receipt.jpg",
        "verified": true,
        "uploadedAt": "2026-02-26T10:00:00.000Z"
      }
    ],
    "attendances": [
      {
        "id": "clx...",
        "date": "2026-02-26T10:00:00.000Z",
        "notes": null
      }
    ]
  }
}
```

**Errores:**
- `404` - Cliente no encontrado
- `500` - Error interno del servidor

---

### PUT `/api/clients/[id]`

Actualiza los datos de un cliente.

**Acceso:** Autenticado (EMPLEADORA, EMPLEADO)

**Request Body (todos los campos opcionales):**
```json
{
  "nombre": "Juan Carlos",
  "apellido": "Pérez",
  "dni": "87654321",
  "telefono": "+5491198765432",
  "grupoId": "clx...",
  "preferredDays": "Martes,Jueves",
  "preferredTime": "16:00",
  "notes": "Actualizado"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "nombre": "Juan Carlos",
    "apellido": "Pérez",
    // ... otros campos actualizados
  }
}
```

**Errores:**
- `400` - Teléfono duplicado
- `404` - Cliente no encontrado
- `500` - Error interno del servidor

---

### DELETE `/api/clients/[id]`

Elimina un cliente y todos sus datos relacionados.

**Acceso:** Autenticado (EMPLEADORA)

**Response:**
```json
{
  "success": true,
  "message": "Cliente eliminado correctamente"
}
```

**Errores:**
- `404` - Cliente no encontrado
- `500` - Error interno del servidor

**Nota:** La eliminación es en cascada:
- Elimina suscripciones asociadas
- Elimina facturas asociadas
- Elimina asistencias asociadas

---

## 🏷️ Grupos

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

**Campos Requeridos:**
- `name` (string, único, max 50 caracteres)

**Campos Opcionales:**
- `color` (string, formato hex, default: "#06b6d4")
- `description` (string, max 200 caracteres)
- `schedule` (string, max 100 caracteres)

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "name": "Grupo Nuevo",
    "color": "#8b5cf6",
    "description": "Descripción del grupo",
    "schedule": "Viernes 18:00",
    "active": true,
    "createdAt": "2026-02-26T10:00:00.000Z",
    "updatedAt": "2026-02-26T10:00:00.000Z"
  }
}
```

---

### GET `/api/groups/[id]`

Obtiene un grupo específico.

**Acceso:** Autenticado (EMPLEADORA, EMPLEADO)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "name": "Grupo A",
    "color": "#06b6d4",
    "description": "Niños principiantes",
    "schedule": "Lunes y Miércoles 10:00",
    "active": true,
    "createdAt": "2026-02-26T10:00:00.000Z",
    "updatedAt": "2026-02-26T10:00:00.000Z"
  }
}
```

---

### PUT `/api/groups/[id]`

Actualiza un grupo existente.

**Acceso:** Autenticado (EMPLEADORA)

**Request Body (todos los campos opcionales):**
```json
{
  "name": "Grupo Actualizado",
  "color": "#10b981",
  "description": "Nueva descripción",
  "schedule": "Nuevo horario",
  "active": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    // ... campos actualizados
  }
}
```

---

### DELETE `/api/groups/[id]`

Elimina un grupo (los clientes quedan sin grupo).

**Acceso:** Autenticado (EMPLEADORA)

**Response:**
```json
{
  "success": true,
  "message": "Grupo eliminado correctamente"
}
```

---

## 💳 Suscripciones

### GET `/api/subscriptions`

Lista suscripciones con filtros.

**Acceso:** Autenticado (EMPLEADORA, EMPLEADO)

**Query Parameters:**
| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `clientId` | string | - | Filtrar por cliente |
| `month` | number | mes actual | Mes (1-12) |
| `year` | number | año actual | Año |
| `status` | string | - | AL_DIA, PENDIENTE, DEUDOR |

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
      "notes": null,
      "createdAt": "2026-02-26T10:00:00.000Z",
      "client": {
        "id": "clx...",
        "nombre": "Juan",
        "apellido": "Pérez",
        "telefono": "+5491112345678",
        "grupo": {
          "id": "clx...",
          "name": "Grupo A",
          "color": "#06b6d4"
        }
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
  "notes": "Pago anticipado"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "clientId": "clx...",
    "month": 3,
    "year": 2026,
    "status": "PENDIENTE",
    "classesTotal": 4,
    "classesUsed": 0,
    "amount": 5000,
    "notes": "Pago anticipado"
  }
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

**Request Body:**
```json
{
  "status": "AL_DIA",
  "classesUsed": 3,
  "amount": 5000,
  "notes": "Pagado el 15/02"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    // ... campos actualizados
  }
}
```

---

## ✅ Asistencias

### GET `/api/attendance`

Lista asistencias con filtros.

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
        "telefono": "+5491112345678",
        "grupo": {
          "id": "clx...",
          "name": "Grupo A",
          "color": "#06b6d4"
        }
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

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "clientId": "clx...",
    "date": "2026-02-26T10:00:00.000Z",
    "notes": "Llegó tarde"
  }
}
```

**Nota:** Al registrar asistencia, se incrementa automáticamente `classesUsed` en la suscripción actual.

---

## 📊 Dashboard

### GET `/api/dashboard`

Obtiene estadísticas generales del sistema.

**Acceso:** Autenticado (EMPLEADORA, EMPLEADO)

**Cache:** 1 minuto

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
    "recentClients": [
      {
        "id": "clx...",
        "nombre": "Juan",
        "apellido": "Pérez",
        "telefono": "+5491112345678",
        "createdAt": "2026-02-26T10:00:00.000Z",
        "grupo": {
          "id": "clx...",
          "name": "Grupo A",
          "color": "#06b6d4"
        }
      }
    ],
    "pendingClients": [
      {
        "status": "PENDIENTE",
        "client": {
          "id": "clx...",
          "nombre": "María",
          "apellido": "García",
          "telefono": "+5491112345679",
          "grupo": {
            "id": "clx...",
            "name": "Grupo B",
            "color": "#8b5cf6"
          }
        }
      }
    ],
    "currentMonth": 2,
    "currentYear": 2026
  }
}
```

---

## 📱 Webhook WhatsApp

### POST `/api/webhook/whatsapp`

Recibe mensajes de WhatsApp Business API.

**Acceso:** Público (verificación de firma recomendada)

**Request Body (WhatsApp Business API format):**
```json
{
  "entry": [
    {
      "id": "phone_number_id",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "+5491112345678",
              "phone_number_id": "clx..."
            },
            "contacts": [
              {
                "profile": {
                  "name": "Juan Pérez"
                },
                "wa_id": "5491112345678"
              }
            ],
            "messages": [
              {
                "from": "5491112345678",
                "id": "wamid.xxx",
                "timestamp": "1708963200",
                "type": "text",
                "text": {
                  "body": "Hola, quiero información"
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

**Tipos de mensajes soportados:**
- `text` - Mensaje de texto
- `image` - Imagen (para comprobantes de pago)
- `document` - Documento

**Response (200):**
```json
{
  "success": true,
  "message": "Webhook procesado"
}
```

**Comportamiento:**
1. Busca cliente por número de teléfono
2. Si existe, registra interacción
3. Si es imagen, puede crear factura pendiente de verificación
4. Log de actividad para seguimiento

---

## 🔧 Health Check

### GET `/api`

Verifica que la API está funcionando.

**Acceso:** Público

**Response:**
```json
{
  "success": true,
  "message": "NMS API is running",
  "version": "1.0.0",
  "timestamp": "2026-02-26T10:00:00.000Z"
}
```

---

## 📝 Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| `200` | OK - Solicitud exitosa |
| `201` | Created - Recurso creado exitosamente |
| `400` | Bad Request - Datos inválidos o faltantes |
| `401` | Unauthorized - No autenticado |
| `403` | Forbidden - Sin permisos |
| `404` | Not Found - Recurso no encontrado |
| `500` | Internal Server Error - Error del servidor |

---

## 🔄 Cache y Invalidación

### Endpoints con Cache

| Endpoint | TTL | Cache Key Pattern |
|----------|-----|-------------------|
| `/api/dashboard` | 1 min | `dashboard:stats` |
| `/api/groups` | 5 min | `groups:all` |
| `/api/clients` | 1 min | `clients:{params}` |

### Invalidación Automática

El cache se invalida automáticamente cuando:
- Se crea/actualiza/elimina un cliente → Invalida `clients:*`, `dashboard:*`
- Se crea/actualiza un grupo → Invalida `groups:*`
- Se registra asistencia → Invalida `dashboard:*`, `attendance:*`
- Se actualiza suscripción → Invalida `clients:*`, `dashboard:*`

---

**Última actualización:** 2026-02-26
**Versión:** 1.0.0
