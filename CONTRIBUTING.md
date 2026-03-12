# 🤝 Guía de Contribución

Gracias por tu interés en contribuir al proyecto NMS. Este documento proporciona las pautas y estándares para contribuir de manera efectiva.

## 📋 Tabla de Contenidos

- [Código de Conducta](#código-de-conducta)
- [Cómo Contribuir](#cómo-contribuir)
- [Configuración del Entorno](#configuración-del-entorno)
- [Estándares de Código](#estándares-de-código)
- [Proceso de Pull Request](#proceso-de-pull-request)
- [Reportar Bugs](#reportar-bugs)
- [Sugerir Funcionalidades](#sugerir-funcionalidades)

---

## Código de Conducta

### Nuestros Compromisos

- Ser respetuoso e inclusivo
- Aceptar críticas constructivas
- Enfocarse en lo mejor para la comunidad
- Mostrar empatía hacia otros miembros

### Comportamiento Inaceptable

- Uso de lenguaje ofensivo
- Acoso o discriminación
- Publicar información privada sin permiso

---

## Cómo Contribuir

### Tipos de Contribuciones

| Tipo | Descripción |
|------|-------------|
| 🐛 **Bug fixes** | Corrección de errores |
| ✨ **Features** | Nuevas funcionalidades |
| 📝 **Documentación** | Mejoras en la documentación |
| 🎨 **UI/UX** | Mejoras visuales o de experiencia |
| ⚡ **Performance** | Optimizaciones de rendimiento |
| 🧪 **Tests** | Agregar o mejorar tests |

### Proceso General

```
1. Fork del repositorio
      ↓
2. Crear rama feature/fix
      ↓
3. Desarrollar cambios
      ↓
4. Escribir/escribir tests
      ↓
5. Verificar lint y tests
      ↓
6. Crear Pull Request
      ↓
7. Code Review
      ↓
8. Merge
```

---

## Configuración del Entorno

### Requisitos Previos

```bash
# Verificar versiones
node --version  # 18+
bun --version   # 1.x
```

### Instalación

```bash
# Clonar tu fork
git clone https://github.com/tu-usuario/nms.git
cd nms

# Agregar upstream
git remote add upstream https://github.com/original/nms.git

# Instalar dependencias
bun install

# Configurar base de datos
bun run db:push
bun run db:seed

# Iniciar desarrollo
bun run dev
```

### Mantener Sincronizado

```bash
# Obtener cambios del upstream
git fetch upstream

# Merge a tu rama main
git checkout main
git merge upstream/main

# Actualizar rama de feature
git checkout feature/mi-feature
git merge main
```

---

## Estándares de Código

### Convenciones de Nombres

```typescript
// ✅ Componentes: PascalCase
export function ClientCard() {}
export const DashboardView = () => {}

// ✅ Funciones/Variables: camelCase
const handleSubmit = () => {}
const isLoading = false

// ✅ Constantes: SCREAMING_SNAKE_CASE
const CACHE_TTL = 5 * 60 * 1000
const DEFAULT_PAGE_SIZE = 20

// ✅ Tipos/Interfaces: PascalCase
interface Client {}
type PaymentStatus = 'AL_DIA' | 'PENDIENTE'

// ✅ Archivos: kebab-case
// client-form.tsx, use-optimized.ts
```

### Estructura de Componentes

```typescript
'use client' // Solo si es necesario

// 1. Imports ordenados
import { useState, useCallback, memo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import type { Client } from '@/types'

// 2. Interfaces de props
interface ClientCardProps {
  client: Client
  onEdit?: (id: string) => void
}

// 3. Componente con memo
export const ClientCard = memo(function ClientCard({
  client,
  onEdit,
}: ClientCardProps) {
  // 4. Hooks
  const [isOpen, setIsOpen] = useState(false)
  
  // 5. Callbacks estables
  const handleEdit = useCallback(() => {
    onEdit?.(client.id)
  }, [client.id, onEdit])
  
  // 6. Early returns
  if (!client) return null
  
  // 7. JSX
  return (
    <Card>
      {/* ... */}
    </Card>
  )
})

// 8. Default export
export default ClientCard
```

### Estructura de API Routes

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { clientSchema } from '@/schemas/client'

// GET handler
export async function GET(request: NextRequest) {
  try {
    // 1. Autenticación
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      )
    }
    
    // 2. Lógica de negocio
    const data = await db.client.findMany()
    
    // 3. Respuesta
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    )
  }
}
```

### Reglas de TypeScript

```typescript
// ✅ Tipar explícitamente
function getClient(id: string): Promise<Client | null> {
  return db.client.findUnique({ where: { id } })
}

// ✅ Usar tipos existentes
import type { Client, Group } from '@/types'

// ❌ Evitar any
// const data: any = fetchData()

// ✅ Usar unknown con type guards
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null && 'id' in data) {
    // TypeScript sabe que data tiene id
  }
}
```

### Estilos y UI

```typescript
// ✅ Usar clases de Tailwind
<div className="flex items-center gap-4 p-4">

// ✅ Usar componentes shadcn/ui
import { Button, Card, Input } from '@/components/ui'

// ✅ Responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">

// ✅ Usar variables de tema
<div className="bg-background text-foreground">

// ❌ Evitar colores hardcodeados
// <div className="bg-blue-500">
```

---

## Proceso de Pull Request

### Antes de Crear PR

```bash
# 1. Verificar lint
bun run lint

# 2. Ejecutar tests
bun run test:all

# 3. Verificar build
bun run build

# 4. Verificar tipos
bunx tsc --noEmit
```

### Título del PR

Usar prefijos según el tipo:

```
feat: agregar exportación de reportes
fix: corregir error en búsqueda de clientes
docs: actualizar documentación de API
refactor: optimizar consultas de dashboard
test: agregar tests para componente ClientCard
```

### Template de PR

```markdown
## Descripción
Breve descripción de los cambios.

## Tipo de Cambio
- [ ] Bug fix
- [ ] Nueva funcionalidad
- [ ] Breaking change
- [ ] Documentación

## Checklist
- [ ] Código sigue las convenciones
- [ ] Tests agregados/actualizados
- [ ] Documentación actualizada
- [ ] Sin warnings de lint

## Screenshots
Si aplica, agregar capturas.

## Issues Relacionados
Closes #123
```

### Proceso de Review

1. **Automated Checks**: CI debe pasar
2. **Code Review**: Al menos 1 aprobación
3. **Testing**: Verificar en preview
4. **Merge**: Squash and merge

---

## Reportar Bugs

### Template de Bug Report

```markdown
## Descripción del Bug
Descripción clara de qué está mal.

## Pasos para Reproducir
1. Ir a '...'
2. Clic en '...'
3. Ver error

## Comportamiento Esperado
Qué debería pasar.

## Comportamiento Actual
Qué pasa actualmente.

## Screenshots
Si aplica.

## Ambiente
- OS: [e.g. macOS, Windows]
- Browser: [e.g. Chrome, Firefox]
- Versión: [e.g. 1.0.0]

## Información Adicional
Cualquier otro contexto.
```

---

## Sugerir Funcionalidades

### Template de Feature Request

```markdown
## Descripción de la Funcionalidad
Descripción clara de la funcionalidad deseada.

## Problema que Resuelve
Qué problema o necesidad aborda.

## Solución Propuesta
Cómo te imaginas la implementación.

## Alternativas Consideradas
Otras soluciones que hayas pensado.

## Contexto Adicional
Screenshots, mockups, referencias.
```

---

## Tests

### Tests Unitarios

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ClientCard } from './ClientCard'

describe('ClientCard', () => {
  const mockClient = {
    id: '1',
    nombre: 'Juan',
    apellido: 'Pérez',
    telefono: '+5491112345678',
  }

  it('should render client name', () => {
    render(<ClientCard client={mockClient} />)
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
  })
})
```

### Tests de Integración

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { POST } from '@/app/api/clients/route'

describe('POST /api/clients', () => {
  it('should create a new client', async () => {
    const request = new Request('http://localhost/api/clients', {
      method: 'POST',
      body: JSON.stringify({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '+5491112345678',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
  })
})
```

### Coverage Mínimo

| Tipo | Mínimo |
|------|--------|
| Statements | 70% |
| Branches | 60% |
| Functions | 70% |
| Lines | 70% |

---

## Contacto

- **Issues**: Usar GitHub Issues
- **Discusiones**: GitHub Discussions
- **Email**: equipo@nms.com

---

¡Gracias por contribuir! 🎉
