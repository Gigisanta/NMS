# 🏊 NMS - Natatory Management System

> Sistema de Gestión Integral para Natatorios y Piscinas

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
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
| 🔐 **Autenticación** | Sistema de roles (Admin/Staff) con NextAuth |

---

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+ o Bun
- Prisma Postgres (configurado automáticamente)
- Cuenta de WhatsApp Business (opcional, para webhook)

### Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd nms

# Instalar dependencias
bun install

# Configurar base de datos
bun run db:push
bun run db:seed

# Iniciar servidor de desarrollo
bun run dev
```

### Credenciales de Prueba

| Usuario | Email | Contraseña | Rol |
|---------|-------|------------|-----|
| Mariela | mariela@nms.com | mariela123 | EMPLEADORA (Admin) |
| Tomás | tomas@nms.com | tomas123 | EMPLEADO (Staff) |

---

## 🏗️ Stack Tecnológico

### Frontend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| [Next.js](https://nextjs.org/) | 16.x | Framework React con App Router |
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
| [PostgreSQL](https://www.postgresql.org/) | - | Base de datos (Prisma Postgres) |
| [NextAuth.js](https://next-auth.js.org/) | 4.x | Autenticación |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | - | Hash de contraseñas |

### Testing
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| [Vitest](https://vitest.dev/) | 4.x | Tests unitarios/integración |
| [Playwright](https://playwright.dev/) | 1.x | Tests E2E |
| [Testing Library](https://testing-library.com/) | 16.x | Testing de componentes |

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
│   └── seed.ts                # Datos de prueba
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
│   │   ├── 📁 auth/           # Componentes de auth
│   │   ├── 📁 layout/         # Layout components
│   │   └── 📁 modules/        # Vistas de negocio
│   │
│   ├── 📁 hooks/              # Custom hooks
│   ├── 📁 lib/                # Utilidades y configuración
│   ├── 📁 schemas/            # Esquemas Zod
│   ├── 📁 store/              # Estado Zustand
│   ├── 📁 types/              # Tipos TypeScript
│   └── middleware.ts          # Middleware de auth
│
├── 📁 tests/
│   ├── 📁 unit/               # Tests unitarios
│   ├── 📁 integration/        # Tests de integración
│   ├── 📁 e2e/                # Tests E2E
│   └── 📁 fixtures/           # Datos de prueba
│
└── 📁 public/                 # Archivos estáticos
```

---

## 🔧 Scripts Disponibles

### Desarrollo

```bash
bun run dev          # Servidor de desarrollo (puerto 3000)
bun run lint         # Verificar código con ESLint
```

### Base de Datos

```bash
bun run db:push      # Aplicar cambios al schema
bun run db:generate  # Generar cliente Prisma
bun run db:migrate   # Crear migración
bun run db:reset     # Resetear base de datos
bun run db:seed      # Cargar datos de prueba
```

### Testing

```bash
bun run test         # Tests unitarios/integración
bun run test:watch   # Tests en modo watch
bun run test:coverage # Tests con coverage
bun run test:e2e     # Tests E2E
bun run test:all     # Todos los tests
```

### Producción

```bash
bun run build        # Build de producción
bun run start        # Servidor de producción
```

---

## 📚 Documentación

| Documento | Descripción |
|-----------|-------------|
| [AGENT.md](docs/AGENT.md) | Guía completa para agentes de código trabajando en el repositorio |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Arquitectura del sistema, patrones y flujos de datos |
| [API.md](docs/API.md) | Documentación completa de endpoints REST |
| [DATABASE.md](docs/DATABASE.md) | Esquema de base de datos y patrones de consulta |

---

## 🔐 Sistema de Roles

### EMPLEADORA (Admin)
- ✅ Acceso completo al sistema
- ✅ Gestión de usuarios
- ✅ CRUD de clientes y grupos
- ✅ Gestión de pagos y configuración
- ✅ Eliminación de registros

### EMPLEADO (Staff)
- ✅ Ver y editar clientes
- ✅ Registrar asistencias
- ✅ Ver reportes
- ❌ Sin acceso a configuración
- ❌ Sin permisos de eliminación

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

### Flujo de Trabajo

1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -m 'feat: agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

### Convenciones de Commits

```
feat: nueva funcionalidad
fix: corrección de bug
docs: documentación
style: formato, puntos y coma, etc
refactor: refactorización de código
test: agregar/modificar tests
chore: tareas de mantenimiento
```

---

## 📝 Licencia

Este proyecto es privado y de uso interno. Todos los derechos reservados.

---

## 🆘 Soporte

Para soporte técnico o consultas:
- Revisar la [documentación](docs/)
- Crear un issue en el repositorio
- Contactar al equipo de desarrollo

---

**Desarrollado con ❤️ para la gestión eficiente de natatorios**
