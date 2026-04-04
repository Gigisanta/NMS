# NMS - Natatory Management System

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Gigisanta/nms)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-blue?style=flat-square&logo=postgresql)](https://neon.tech/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Private-red?style=flat-square)]()

**Live Production:** [https://oroazul.maat.work](https://oroazul.maat.work)

---

Sistema de gestión integral para natatorios y piscinas. Administra clientes, asistentes, pagos, facturación y WhatsApp en una única plataforma.

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 15.5 + React 19 (App Router) |
| **Language** | TypeScript 5 |
| **Database** | PostgreSQL via Neon (serverless) |
| **ORM** | Prisma 6 |
| **Auth** | NextAuth v4 (Credentials + JWT) |
| **UI** | shadcn/ui + Tailwind CSS 4 |
| **State** | Zustand + TanStack Query |
| **Forms** | React Hook Form + Zod |
| **Animation** | Framer Motion 12 |
| **Deployment** | Vercel |

## Features

| Module | Description |
|--------|-------------|
| **Dashboard** | Estadísticas en tiempo real, clientes recientes, pagos pendientes |
| **CRM Clientes** | Perfiles completos, grupos, historial de asistencia y pagos |
| **Asistencias** | Control diario con registro de entrada/salida por empleado |
| **Pagos** | Suscripciones mensuales, estados de pago, recordatorios |
| **Facturación** | Gestión de facturas con archivos adjuntos (almacenamiento en PostgreSQL) |
| **WhatsApp** | Integración webhook para automatizaciones |
| **Empleados** | Control de horario con reloj de punto |
| **Gastos** | Registro de gastos del negocio |
| **Calendario** | Eventos y programación de clases |

## Quick Start

```bash
# 1. Clonar y entrar al directorio
git clone https://github.com/Gigisanta/nms.git
cd nms

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 4. Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Environment Variables

Crea un archivo `.env` en la raíz del proyecto:

```env
# Base de datos (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# NextAuth
NEXTAUTH_SECRET="genera-32-caracteres-minimo"
NEXTAUTH_URL="http://localhost:3000"
```

### Obtener credenciales

1. **Neon:** [https://neon.tech](https://neon.tech) → New Project → copia el connection string
2. **NEXTAUTH_SECRET:** Genera con `openssl rand -base64 32`

## Scripts

```bash
# Desarrollo
npm run dev              # Servidor dev en puerto 3000
npm run lint             # Verificar código con ESLint

# Base de datos
npm run db:push          # Push schema (sin migración)
npm run db:generate      # Generar cliente Prisma
npm run db:migrate       # Crear migración (desarrollo)
npm run db:seed          # Poblar con datos de prueba

# Build
npm run build            # Build estándar Next.js
npm run build:standalone # Build standalone para Vercel
npm run start            # Iniciar producción
```

## Usuarios de Prueba (después de seed)

| Email | Password | Rol |
|-------|----------|-----|
| mariela@nms.com | mariela123 | EMPLEADORA (Admin) |
| tomas@nms.com | tomas123 | EMPLEADO |

## Documentation

| Doc | Description |
|-----|-------------|
| [CLAUDE.md](./CLAUDE.md) | Guía para agentes de código |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Arquitectura del sistema |
| [docs/API.md](./docs/API.md) | Endpoints REST |
| [docs/DATABASE.md](./docs/DATABASE.md) | Esquema de base de datos |
| [docs/VERCEL.md](./docs/VERCEL.md) | Deployment en Vercel |

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Login, register
│   ├── api/              # API routes (serverless)
│   ├── layout.tsx        # Layout raíz
│   └── page.tsx          # SPA entry point
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── modules/          # Vistas de negocio (lazy-loaded)
│   └── layout/            # Sidebar, header, etc.
├── lib/
│   ├── db.ts             # Cliente Prisma singleton
│   ├── auth.ts           # Configuración NextAuth
│   └── api-utils.ts      # Utilidades API
├── store/                # Estado Zustand
├── schemas/              # Esquemas Zod
└── types/                # Tipos TypeScript
```

## Deployment

El proyecto está configurado para deploy automático en Vercel:

1. Push a GitHub → Vercel detecta y despliega
2. Build command ejecuta: `npx prisma@6.11.1 migrate deploy` → `npx prisma@6.11.1 generate` → `next build`
3. Production URL: [https://oroazul.maat.work](https://oroazul.maat.work)

---

**Desarrollado con ❤️ para la gestión eficiente de natatorios**
