# Vercel Deployment Guide - NMS

> Documentación específica para el deployment en Vercel del Natatory Management System

## URLs

| Ambiente | URL |
|----------|-----|
| Producción | https://nms-giolivos-projects.vercel.app |
| Preview | nms-giolivos-projects-git-*.vercel.app |

---

## Configuración

### vercel.json

```json
{
  "buildCommand": "prisma migrate deploy && prisma generate && npm run build:standalone",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

### Build Command Explicado

1. `prisma migrate deploy` - Aplica migraciones pendientes en Neon
2. `prisma generate` - Genera el cliente Prisma
3. `npm run build:standalone` - Construye la aplicación standalone

**Nota:** No usa `db push --accept-data-loss` en producción. Usa `migrate deploy` para seguridad de datos.

---

## Variables de Entorno

### Variables Automáticas (Vercel)

| Variable | Descripción | Configurado por |
|----------|-------------|----------------|
| `VERCEL` | Indica que está en Vercel | Vercel |
| `VERCEL_URL` | URL del deployment | Vercel |
| `VERCEL_GIT_COMMIT_SHA` | SHA del commit | Vercel |

### Variables Manuales (Dashboard de Vercel)

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Connection string de Neon PostgreSQL |
| `NEXTAUTH_SECRET` | Secret para JWT (mínimo 32 caracteres) |
| `NEXTAUTH_URL` | https://nms-giolivos-projects.vercel.app |

### Configurar Variables

1. Ir a [Vercel Dashboard](https://vercel.com/dashboard)
2. Seleccionar proyecto NMS
3. Ir a Settings → Environment Variables
4. Agregar cada variable con los tres environments (Production, Preview, Development)

---

## Base de Datos (Neon)

### Connection String

```
postgresql://username:password@ep-xxx-xxx-xxx.us-east-1.aws.neon.tech/nms?sslmode=require
```

### Beneficios de Neon

- **Serverless**: Escala automáticamente
- **Branching**: Ramas de base de datos como Git
- **Auto-suspend**: Se suspende cuando no hay tráfico (ahorra créditos)
- **100% PostgreSQL**: Compatible con Prisma
- **Binary Data**: Soporte completo para bytea (invoice fileData)

### Configurar Neon

1. Crear cuenta en [Neon](https://neon.tech)
2. Crear nuevo proyecto (NMS)
3. Obtener connection string del Dashboard
4. Configurar en Vercel como `DATABASE_URL`

---

## NEXTAUTH_SECRET

### Generar Secret

```bash
# OpenSSL
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Agregar en Vercel

1. Dashboard → Settings → Environment Variables
2. Nombre: `NEXTAUTH_SECRET`
3. Valor: El secret generado
4. Environments: Production, Preview, Development

---

## Flujo de Deployment

### Deployment Automático (Git)

```
Push a GitHub → Vercel CI → Build → Deploy
```

### Pasos del Build

1. **Install**: `npm install`
2. **Migrate**: `prisma migrate deploy`
3. **Generate**: `prisma generate`
4. **Build**: `npm run build:standalone`

---

## Dominio Personalizado

Para agregar dominio personalizado:

1. **Dashboard** → Settings → Domains
2. **Agregar** dominio (ej: nms.midominio.com)
3. **Configurar DNS** según instrucciones de Vercel
4. **Esperar** verificación

---

## Troubleshooting

### Error: P3005 - Database schema is not empty

**Problema**: La base de datos ya tiene tablas pero no migraciones.

**Solución**: El build usa `migrate deploy` que solo aplica migraciones pendientes. Si necesitas crear migraciones desde cero:

```bash
# Desarrollo: crear migración
prisma migrate dev

# Producción: el migration deploy debería funcionar
```

### Error: 401 - Auth Callback Failed

**Problema**: NEXTAUTH_SECRET no está configurado o NEXTAUTH_URL es incorrecto.

**Solución**:
1. Verificar NEXTAUTH_SECRET en Vercel
2. Verificar NEXTAUTH_URL = https://nms-giolivos-projects.vercel.app

### Error: Login Always Fails

**Problema**: Los usuarios del seed no existen.

**Solución**:
1. Verificar en Vercel Functions logs
2. El seed debería ejecutarse automáticamente

### Error: Module not found

**Problema**: Prisma client no se generó correctamente.

**Solución**:
1. Hacer re-deploy con Clear Cache
2. Verificar que `prisma generate` corrió sin errores

### Error: Prisma Client ByteA / Binary Data Issues

**Problema**: Problemas con archivos binarios de facturas.

**Solución**:
1. Verificar que el schema usa `@db.ByteA` para el campo fileData
2. Verificar `binaryTargets` en generator para linux-arm64-openssl

---

## Monitoreo

### Vercel Dashboard

- **Deployments**: Historial de deployments
- **Functions**: Logs de serverless functions
- **Analytics**: Métricas de uso
- **Runtime Logs**: Application output (console.log, errors)

### Ver Logs

```bash
# Usando Vercel CLI
vercel logs nms-giolivos-projects

# Logs de una función específica
vercel logs nms-giolivos-projects --follow

# Runtime logs (últimas 24h)
vercel logs nms-giolivos-projects --cursor=<cursor>
```

### Runtime Logs Tool

También puedes usar la herramienta MCP de Vercel para ver runtime logs:

```javascript
mcp__claude_ai_Vercel__get_runtime_logs({
  projectId: "tu-project-id",
  teamId: "tu-team-id",
  limit: 50
})
```

---

## Environments

### Preview (Pull Requests)

Cada PR crea un deployment preview con:
- URL única: `nms-giolivos-projects-git-feature-xxx.vercel.app`
- Variables de Production

### Production (Main Branch)

Push a main = deployment automático a:
- **https://nms-giolivos-projects.vercel.app**

---

## Seguridad

### Buenas Prácticas

1. **NEXTAUTH_SECRET**: Mínimo 32 caracteres, único por ambiente
2. **DATABASE_URL**: sslmode=require para producción
3. **No exponer** secrets en logs
4. **Usar** Environments correctamente (Production vs Preview vs Development)

### Rate Limiting

El proyecto usa `@upstash/ratelimit` para rate limiting en endpoints públicos:

- `/api/auth/register`: 5 requests / minuto
- `/api/webhook/whatsapp`: 60 requests / minuto

---

## Integraciones

### Sentry (Error Tracking)

Sentry está configurado para捕获 errores en producción:

```typescript
// Configuración en next.config.ts
// Sentry OAuth credentials en Vercel Environment Variables
```

### Bundle Analyzer

Para analizar el bundle:

```bash
npm run analyze
```

Esto genera un reporte visual del tamaño del bundle.

---

## Comandos Útiles

```bash
# Deploy manual
vercel --prod

# Ver estado
vercel ls

# Logs
vercel logs nms-giolivos-projects

# Alias (asignar URL a deployment)
vercel alias set <deployment-url> <alias>
```

---

**Última actualización:** 2026-04-01
**Versión:** 2.0.0
