# 🚀 Vercel Deployment Guide - NMS

> Documentación específica para el deployment en Vercel del Natatory Management System

## 🌐 URL de Producción

**https://nms-giolivos-projects.vercel.app**

---

## ⚙️ Configuración

### vercel.json

```json
{
  "buildCommand": "npx prisma@6.11.1 generate && npx prisma@6.11.1 db push --skip-generate --accept-data-loss && npx tsx prisma/seed.ts && npm run build:standalone",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

### Build Command Explicado

1. `npx prisma@6.11.1 generate` - Genera el cliente Prisma
2. `npx prisma@6.11.1 db push --skip-generate --accept-data-loss` - Sincroniza el schema con la base de datos Neon
3. `npx tsx prisma/seed.ts` - Ejecuta el seed para crear usuarios iniciales
4. `npm run build:standalone` - Construye la aplicación

---

## 🔐 Variables de Entorno

### Variables Automáticas (Vercel)

| Variable | Descripción | Configurado por |
|----------|-------------|----------------|
| `VERCEL` | Indica que está en Vercel | Vercel |
| `VERCEL_URL` | URL del deployment | Vercel |
| `VERCEL_GIT_COMMIT_SHA` | SHA del commit | Vercel |

### Variables Manuales (Dashboard de Vercel)

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `DATABASE_URL` | Connection string de Neon | PostgreSQL |
| `NEXTAUTH_SECRET` | Secret para JWT | >=32 caracteres |
| `NEXTAUTH_URL` | https://nms-giolivos-projects.vercel.app | URL producción |

### Configurar Variables

1. Ir a [Vercel Dashboard](https://vercel.com/dashboard)
2. Seleccionar proyecto NMS
3. Ir a Settings → Environment Variables
4. Agregar cada variable

---

## 🗄️ Base de Datos (Neon)

### Connection String

El proyecto usa **Neon PostgreSQL** como base de datos serverless.

```
postgresql://username:password@ep-xxx-xxx-xxx.us-east-2.aws.neon.tech/nms?sslmode=require
```

### Beneficios de Neon

- **Serverless**: Escala automáticamente
- **Branching**: Ramas de base de datos como Git
- **Auto-suspend**: Se suspende cuando no hay tráfico
- **100% PostgreSQL**: Compatible con Prisma

### Configurar Neon

1. Crear cuenta en [Neon](https://neon.tech)
2. Crear nuevo proyecto (NMS)
3. Obtener connection string de Dashboard
4. Configurar en Vercel como `DATABASE_URL`

---

## 🔐 NEXTAUTH_SECRET

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

## 🔄 Flujo de Deployment

### Deployment Automático (Git)

```mermaid
graph LR
    A[Push a GitHub] --> B[Vercel CI]
    B --> C[Install deps]
    C --> D[Prisma generate]
    D --> E[Prisma db push]
    E --> F[Seed execution]
    F --> G[Build]
    G --> H[Deploy]
```

### Pasos del Build

1. **Install**: `npm install`
2. **Generate**: `prisma generate`
3. **Push**: `prisma db push --accept-data-loss`
4. **Seed**: `tsx prisma/seed.ts`
5. **Build**: `npm run build:standalone`

---

## 🐛 Troubleshooting

### Error: P3005 - Database schema is not empty

**Problema**: La base de datos ya tiene tablas.

**Solución**: El flag `--accept-data-loss` está incluido en el build command.

### Error: 401 - Auth Callback Failed

**Problema**: NEXTAUTH_SECRET no está configurado o NEXTAUTH_URL es incorrecto.

**Solución**:
1. Verificar NEXTAUTH_SECRET en Vercel
2. Verificar NEXTAUTH_URL = https://nms-giolivos-projects.vercel.app

### Error: Login Always Fails

**Problema**: El seed no se ejecutó o los usuarios no existen.

**Solución**:
1. Verificar en Vercel Functions logs
2. El seed crea usuarios por defecto

### Error: Module not found

**Problema**: Prisma client no se generó correctamente.

**Solución**:
1. Hacer re-deploy Clear Cache
2. Verificar que `prisma generate` corrió sin errores

---

## 📊 Monitoreo

### Vercel Dashboard

- **Deployments**: Historial de deployments
- **Functions**: Logs de serverless functions
- **Analytics**: Métricas de uso

### Ver Logs

```bash
# Usando Vercel CLI
vercel logs nms-giolivos-projects

# Logs de una función específica
vercel logs nms-giolivos-projects --follow
```

---

## 🔄 Environments

### Preview (Pull Requests)

Cada PR crea un deployment preview con:
- URL única: `nms-giolivos-projects-git-feature-xxx.vercel.app`
- Variables de Production

### Production (Main Branch)

Push a main = deployment automático a:
- **https://nms-giolivos-projects.vercel.app**

---

## 📱 Dominio Personalizado

Para agregar dominio personalizado:

1. **Dashboard** → Settings → Domains
2. **Agregar** dominio (ej: nms.midominio.com)
3. **Configurar DNS** según instrucciones de Vercel
4. **Esperar** verificación

---

## 🛡️ Seguridad

### Buenas Prácticas

1. **NEXTAUTH_SECRET**: Mínimo 32 caracteres, único por ambiente
2. **DATABASE_URL**: SSLmode=require para producción
3. **No exponer** secrets en logs
4. **Usar** Environments correctamente (Production vs Preview vs Development)

### Rate Limiting

Vercel incluye rate limiting automático en Edge Network.

---

## 📈 Escalabilidad

### Límites Gratuito

- 100GB bandwidth/mes
- 100 hours Serverless Functions
- 100 deployments

### Límites Pro

- 1TB bandwidth/mes
- 1000 hours Serverless Functions
- Unlimited deployments

---

## 🔧 Comandos Útiles

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

**Última actualización:** 2026-03-19
**Versión:** 2.0.0
