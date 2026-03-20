# 📚 Documentación - NMS

> Índice de documentación del Natatory Management System

## 📋 Documentos Disponibles

| Documento | Descripción | Audiencia |
|-----------|-------------|-----------|
| [AGENT.md](AGENT.md) | Guía para agentes de código trabajando en el repositorio | Desarrolladores, Agentes de IA |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Arquitectura del sistema, patrones y flujos de datos | Arquitectos, Desarrolladores Senior |
| [API.md](API.md) | Documentación completa de endpoints REST | Desarrolladores Frontend/Backend |
| [DATABASE.md](DATABASE.md) | Esquema de base de datos y patrones de consulta | Desarrolladores Backend, DBAs |

## 🚀 Inicio Rápido

### Para Desarrolladores

1. **Configurar entorno**: Ver package.json para scripts disponibles
2. **Entender la arquitectura**: Leer [ARCHITECTURE.md](ARCHITECTURE.md)
3. **Revisar API**: Consultar [API.md](API.md) para endpoints
4. **Consultar base de datos**: Ver [DATABASE.md](DATABASE.md) para modelos

### Para Agentes de IA

1. **Leer AGENT.md**: Guía completa con patrones de código
2. **Revisar convenciones**: Nombres, estructuras, patrones
3. **Consultar según necesidad**: API o Database docs

## 📁 Estructura de Documentación

```
docs/
├── README.md           # Este archivo (índice)
├── AGENT.md            # Guía para agentes de código
├── ARCHITECTURE.md     # Arquitectura del sistema
├── API.md              # Documentación de API REST
└── DATABASE.md         # Esquema de base de datos
```

## 🔍 Referencias Rápidas

### Comandos Comunes

```bash
# Desarrollo
npm run dev          # Servidor de desarrollo

# Base de datos
npx prisma db push   # Aplicar schema
npx tsx prisma/seed.ts  # Datos de prueba

# Build
npm run build:standalone  # Build para Vercel
```

### Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `src/app/page.tsx` | Página principal (SPA) |
| `src/store/index.ts` | Estado global Zustand |
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

### URL de Producción

**https://nms-giolivos-projects.vercel.app**

## 🌐 Deployment en Vercel

El proyecto está configurado para deployment automático en Vercel:

```json
// vercel.json
{
  "buildCommand": "npx prisma@6.11.1 generate && npx prisma@6.11.1 db push --skip-generate --accept-data-loss && npx tsx prisma/seed.ts && npm run build:standalone",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

### Flujo de Deployment

1. Push a GitHub → Build automático en Vercel
2. Prisma genera cliente y ejecuta `db push` a Neon
3. Seed crea usuarios y configuraciones iniciales
4. App disponible en producción

## 📝 Mantenimiento

Esta documentación debe actualizarse cuando:
- Se agregan nuevos endpoints de API
- Se modifican modelos de base de datos
- Se cambian patrones de arquitectura
- Se agregan nuevas funcionalidades importantes
- Se actualiza el stack tecnológico
- Se cambia la configuración de deployment

---

**Última actualización:** 2026-03-19
**Versión:** 2.0.0
