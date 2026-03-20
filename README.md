# 🏊 NMS - Natatory Management System

> Sistema de Gestión Integral para Natatorios y Piscinas

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-Private-red?style=flat-square)](LICENSE)

## 📋 Descripción

**NMS (Natatory Management System)** es una aplicación web completa diseñada para la gestión integral de natatorios, piscinas y centros acuáticos. Ofrece herramientas para la administración de clientes, control de asistencia, gestión de pagos y mucho más.

### ✨ Características Principales

| Módulo | Descripción |
|--------|-------------|
| 🏠 **Dashboard** | Vista general con estadísticas y métricas en tiempo real |
| 👥 **CRM Clientes** | Gestión completa de clientes con perfiles detallados |
| 🏷️ **Grupos** | Organización de clientes por grupos con colores y horarios |
| ✅ **Asistencias** | Control de asistencia diario con historial |
| 💳 **Pagos** | Gestión de suscripciones y control de pagos |
| 📱 **WhatsApp** | Integración con webhook para automatizaciones |
| 🔐 **Autenticación** | Sistema de roles (Admin/Staff) con NextAuth v4 |

---

## 🚀 Despliegue en Producción (Vercel)

### URL de Producción
**https://nms-giolivos-projects.vercel.app**

### Configuración de Build

El proyecto usa `vercel.json` con comandos específicos para Prisma y seed:

```json
{
  "buildCommand": "npx prisma@6.11.1 generate && npx prisma@6.11.1 db push --skip-generate --accept-data-loss && npx tsx prisma/seed.ts && npm run build:standalone",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

### Variables de Entorno Requeridas

| Variable | Descripción | Generada por |
|---------|-------------|-------------|
| `DATABASE_URL` | Connection string de PostgreSQL (Neon) | Dashboard de Neon |
| `NEXTAUTH_SECRET` | Secret para JWT (32+ caracteres) | Generado automáticamente |
| `NEXTAUTH_URL` | URL de la app (produccion) | Vercel (automático) |

---

## 🏗️ Stack Tecnológico

### Frontend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| [Next.js](https://nextjs.org/) | 15.5.x | Framework React con App Router |
| [TypeScript](https://www.typescriptlang.org/) | 5.x | Tipado estático |
| [Tailwind CSS](https://tailwindcss.com/) | 4.x | Estilos utilitarios |
| [shadcn/ui](https://ui.shadcn.com/) | New York | Componentes UI |
| [Framer Motion](https://www.framer.com/motion/) | 12.x | Animaciones |
| [Zustand](https://zustand-demo.pmnd.rs/) | 5.x | Estado global |
| [React Hook Form](https://react-hook-form.com/) | 7.x | Manejo de formularios |
| [Zod](https://zod.dev/) | 4.x | Validación de esquemas |

### Backend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| [Prisma](https://www.prisma.io/) | 6.x | ORM para PostgreSQL |
| [PostgreSQL](https://www.postgresql.org/) | 16 (Neon) | Base de datos |
| [NextAuth.js](https://next-auth.js.org/) | 4.x | Autenticación |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | - | Hash de contraseñas |

### Deployment
| Tecnología | Servicio | Propósito |
|------------|---------|-----------|
| [Vercel](https://vercel.com/) | Cloud | Hosting y CD/CI |
| [Neon](https://neon.tech/) | PostgreSQL | Base de datos serverless |

---

## 📁 Estructura del Proyecto

```
nms/
├── 📁 docs/                    # Documentación
│   ├── AGENT.md               # Guía para agentes de código
│   ├── ARCHITECTURE.md        # Arquitectura del sistema
│   ├── API.md                 # Documentación de API
│   └── DATABASE.md            # Esquema de base de datos
│
├── 📁 prisma/
│   ├── schema.prisma          # Esquema de base de datos
│   ├── seed.ts                # Datos de prueba (usuarios, planes, settings)
│   └── migrations/             # Migraciones de Prisma
│
├── 📁 src/
│   ├── 📁 app/                # Next.js App Router
│   │   ├── 📁 (auth)/         # Rutas de autenticación
│   │   ├── 📁 api/            # API Routes
│   │   ├── layout.tsx         # Layout raíz
│   │   └── page.tsx           # Página principal (SPA)
│   │
│   ├── 📁 components/
│   │   ├── 📁 ui/             # Componentes shadcn/ui
│   │   ├── 📁 auth/            # Componentes de auth
│   │   ├── 📁 layout/          # Layout components
│   │   └── 📁 modules/         # Vistas de negocio
│   │
│   ├── 📁 hooks/               # Custom hooks
│   ├── 📁 lib/                 # Utilidades y configuración
│   │   ├── db.ts               # Cliente Prisma singleton
│   │   ├── auth.ts             # Configuración NextAuth
│   │   └── api-utils.ts        # Cache para API
│   ├── 📁 schemas/             # Esquemas Zod
│   ├── 📁 store/               # Estado Zustand
│   ├── 📁 types/               # Tipos TypeScript
│   └── middleware.ts           # Middleware de auth
│
├── 📁 tests/
│   └── README.md              # Documentación de tests
│
├── vercel.json                 # Configuración de Vercel
├── package.json
└── tsconfig.json
```

---

## 🔧 Scripts Disponibles

### Desarrollo Local

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev

# Verificar código con ESLint
npm run lint
```

### Base de Datos (Desarrollo Local)

```bash
# Aplicar cambios al schema (no crea migración)
npx prisma db push

# Generar cliente Prisma
npx prisma generate

# Crear migración (para desarrollo)
npx prisma migrate dev

# Resetear base de datos
npx prisma migrate reset

# Ejecutar seed
npx tsx prisma/seed.ts
```

### Construcción

```bash
# Build standalone (para Vercel)
npm run build:standalone

# Build estándar
npm run build
```

### Production

```bash
# Servidor de producción (después de build)
npm run start
```

---

## 🔐 Sistema de Autenticación

### Roles

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| **EMPLEADORA** | Administrador | Acceso completo al sistema |
| **EMPLEADO** | Staff | Lectura y registro de asistencia |

### Usuarios Creadas por Seed

| Usuario | Email | Contraseña | Rol | employeeRole |
|---------|-------|------------|-----|--------------|
| Mariela | mariela@nms.com | mariela123 | EMPLEADORA | - |
| Tomás | tomas@nms.com | tomas123 | EMPLEADO | ADMINISTRATIVO |
| Camila | camila@nms.com | camila123 | EMPLEADO | ADMINISTRATIVO |

### Plan de Precios Creados por Seed

| Plan | Clases | Precio | Descripción |
|------|--------|--------|-------------|
| Mensual 4 clases | 4 | $5,000 | Plan básico |
| Mensual 8 clases | 8 | $8,500 | Plan estándar |
| Mensual 12 clases | 12 | $11,000 | Plan intensivo |
| Clase individual | 1 | $1,500 | Una clase |

### Configuraciones Creadas por Seed

- `business.name`: NMS - Natatory Management System
- `business.currency`: ARS
- `business.timezone`: America/Argentina/Cordoba
- `payment.defaultClasses`: 4
- `payment.defaultPrice`: 5000
- `payment.dueDay`: 10
- `payment.autoStatus`: true
- `notifications.paymentReminder`: true
- `notifications.paymentReminderDays`: 3
- `notifications.overdueNotification`: true

---

## 🌐 Deployment en Vercel

### URL de Producción
**https://nms-giolivos-projects.vercel.app**

### Flujo de Deployment

1. Push a GitHub triggers build automático en Vercel
2. Vercel ejecuta el build command configurado en `vercel.json`
3. Prisma genera el cliente y hace `db push` a Neon
4. Se ejecuta el seed para asegurar datos iniciales
5. La app se despliega automáticamente

### Configuración de Dominio

El proyecto está configurado con el dominio de Vercel. Para dominio personalizado:
1. Ir a Settings → Domains en el dashboard de Vercel
2. Agregar el dominio personalizado
3. Configurar DNS según las instrucciones

---

## 📚 Documentación

| Documento | Descripción |
|-----------|-------------|
| [AGENT.md](docs/AGENT.md) | Guía completa para agentes de código |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Arquitectura del sistema |
| [API.md](docs/API.md) | Documentación de endpoints REST |
| [DATABASE.md](docs/DATABASE.md) | Esquema de base de datos |
| [VERCEL.md](docs/VERCEL.md) | Guía de deployment en Vercel |

---

## 🎨 Capturas de Pantalla

### Dashboard
Vista principal con estadísticas del negocio, clientes recientes y pagos pendientes.

### Clientes
Gestión completa de clientes con búsqueda, filtros y perfiles detallados.

### Asistencias
Control diario de asistencia con historial y estadísticas.

### Pagos
Gestión de suscripciones mensuales con estados de pago.

---

## 🤝 Contribuir

Ver [CONTRIBUTING.md](CONTRIBUTING.md) para guías de contribución.

---

## 📝 Licencia

Este proyecto es privado y de uso interno. Todos los derechos reservados.

---

**Desarrollado con ❤️ para la gestión eficiente de natatorios**
