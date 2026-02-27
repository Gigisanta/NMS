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

1. **Configurar entorno**: Ver [CONTRIBUTING.md](../CONTRIBUTING.md)
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
bun run dev          # Servidor de desarrollo
bun run lint         # Verificar código

# Base de datos
bun run db:push      # Aplicar schema
bun run db:seed      # Datos de prueba

# Testing
bun run test         # Tests unitarios
bun run test:e2e     # Tests E2E
```

### Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `src/app/page.tsx` | Página principal (SPA) |
| `src/store/index.ts` | Estado global Zustand |
| `src/auth.ts` | Configuración NextAuth |
| `prisma/schema.prisma` | Esquema de base de datos |

### Credenciales de Prueba

| Usuario | Email | Password | Rol |
|---------|-------|----------|-----|
| Mariela | mariela@nms.com | mariela123 | EMPLEADORA |
| Tomás | tomas@nms.com | tomas123 | EMPLEADO |

## 📝 Mantenimiento

Esta documentación debe actualizarse cuando:
- Se agregan nuevos endpoints de API
- Se modifican modelos de base de datos
- Se cambian patrones de arquitectura
- Se agregan nuevas funcionalidades importantes

---

**Última actualización:** 2026-02-26
**Versión:** 1.0.0
