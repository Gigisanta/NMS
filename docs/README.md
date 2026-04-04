# Documentación - NMS

> Índice de documentación del Natatory Management System

## Documentos Disponibles

| Documento | Descripción | Audiencia |
|-----------|-------------|-----------|
| [AGENT.md](AGENT.md) | Guía para agentes de código trabajando en el repositorio | Desarrolladores, Agentes de IA |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Arquitectura del sistema, patrones y flujos de datos | Arquitectos, Desarrolladores Senior |
| [API.md](API.md) | Documentación completa de endpoints REST | Desarrolladores Frontend/Backend |
| [DATABASE.md](DATABASE.md) | Esquema de base de datos y patrones de consulta | Desarrolladores Backend, DBAs |
| [VERCEL.md](VERCEL.md) | Guía de deployment y configuración en Vercel | DevOps, Desarrolladores |
| [optimization-report.md](optimization-report.md) | Reporte de optimizaciones de rendimiento | Todos |

## Inicio Rápido

### Para Desarrolladores

1. **Configurar entorno**: Ver `package.json` para scripts disponibles
2. **Entender la arquitectura**: Leer [ARCHITECTURE.md](ARCHITECTURE.md)
3. **Revisar API**: Consultar [API.md](API.md) para endpoints
4. **Consultar base de datos**: Ver [DATABASE.md](DATABASE.md) para modelos

### Para Agentes de IA

1. **Leer AGENT.md**: Guía completa con patrones de código
2. **Revisar convenciones**: Nombres, estructuras, patrones
3. **Consultar según necesidad**: API o Database docs

## Estructura de Documentación

```
docs/
├── README.md              # Este archivo (índice)
├── AGENT.md               # Guía para agentes de código
├── ARCHITECTURE.md        # Arquitectura del sistema
├── API.md                 # Documentación de API REST
├── DATABASE.md            # Esquema de base de datos
├── VERCEL.md              # Guía de deployment en Vercel
└── optimization-report.md # Reporte de optimizaciones
```

## Referencias Rápidas

### Comandos Comunes

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo (puerto 3000)
npm run lint             # ESLint check

# Base de datos
npm run db:push          # Push schema sin migración
npm run db:generate      # Generar cliente Prisma
npm run db:migrate       # Crear migración (dev)
npm run db:seed          # Ejecutar seed (bun run prisma/seed.ts)

# Build & Production
npm run build            # Build estándar Next.js
npm run build:standalone # Build standalone para Vercel
npm run start            # Iniciar servidor de producción
npm run analyze          # Bundle analyzer

# Testing
npm run test             # Run all tests (vitest)
npm run test:e2e         # Playwright e2e tests
```

### Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `src/app/page.tsx` | Página principal (SPA entry - client-side routing) |
| `src/store/index.ts` | Estado global Zustand |
| `src/lib/queryClient.ts` | Configuración TanStack Query |
| `src/lib/auth.ts` | Configuración NextAuth |
| `src/lib/db.ts` | Cliente Prisma singleton |
| `prisma/schema.prisma` | Esquema de base de datos |
| `prisma/seed.ts` | Datos iniciales (usuarios, planes, settings) |
| `vercel.json` | Configuración de deployment Vercel |

### Credenciales de Prueba (Creadas por Seed)

| Usuario | Email | Password | Rol |
|---------|-------|----------|-----|
| Mariela | mariela@nms.com | mariela123 | EMPLEADORA (Admin) |
| Tomás | tomas@nms.com | tomas123 | EMPLEADO (ADMINISTRATIVO) |
| Camila | camila@nms.com | camila123 | EMPLEADO (ADMINISTRATIVO) |

### URLs

| Ambiente | URL |
|----------|-----|
| Producción | https://oroazul.maat.work |
| Preview | nms-giolivos-projects-git-*.vercel.app |

## Stack Tecnológico

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Next.js | 15.5.x | Framework React con App Router |
| React | 19.x | UI Library |
| TypeScript | 5.x | Tipado estático |
| Prisma | 6.x | ORM para PostgreSQL |
| PostgreSQL | 16 (Neon) | Base de datos serverless |
| TanStack Query | 5.x | Server state management |
| Zustand | 5.x | Client state management |
| Tailwind CSS | 4.x | Estilos utilitarios |
| shadcn/ui | - | Componentes UI |
| NextAuth | 4.x | Autenticación |
| Zod | 4.x | Validación de esquemas |
| React Hook Form | 7.x | Formularios |

## Deployment en Vercel

El proyecto está configurado para deployment automático en Vercel:

```json
// vercel.json
{
  "buildCommand": "npx prisma@6.11.1 migrate deploy && npx prisma@6.11.1 generate && next build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

### Flujo de Deployment

1. Push a GitHub → Build automático en Vercel
2. Prisma ejecuta migraciones pendientes en Neon
3. Genera cliente Prisma
4. Build standalone
5. App disponible en producción

## Mantenimiento

Esta documentación debe actualizarse cuando:
- Se agregan nuevos endpoints de API
- Se modifican modelos de base de datos
- Se cambian patrones de arquitectura
- Se agregan nuevas funcionalidades importantes
- Se actualiza el stack tecnológico
- Se cambia la configuración de deployment

---

**Última actualización:** 2026-04-01
**Versión:** 3.0.0
