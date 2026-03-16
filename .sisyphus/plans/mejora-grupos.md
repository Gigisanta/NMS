# Plan: Mejora de Gestión de Grupos

## TL;DR

> **Resumen**: Agregar funcionalidad de edición de grupos existentes, crear sistema de subgrupos anidados y nueva página de configuración para gestión avanzada de grupos.

> **Entregables**:
> - Página dedicada "Gestión de Grupos" en Configuración
> - Sistema de jerarquía padre-hijo (subgrupos)
> - CRUD completo de grupos desde UI (crear, editar, eliminar)
> - Asignación de horarios a cada grupo (texto libre)
> - Selector de grupos con visualización jerárquica

> **Esfuerzo Estimado**: Medium
> **Ejecución Paralela**: YES - 3 waves
> **Ruta Crítica**: Migración DB → API grupos → UI gestión → Selector actualizado

---

## Contexto

### Solicitud Original
El usuario quiere mejorar la gestión de grupos en la interfaz de clientes:
1. Modificar nombres de grupos existentes
2. Crear subgrupos anidados (jerarquía padre→hijo)
3. Asignar horarios a cada grupo
4. Gestión desde página dedicada en Configuración

### Resumen de Investigación

**Estado Actual del Sistema**:
| Componente | Estado |
|------------|--------|
| API Groups (CRUD) | ✅ Existe |
| Campo schedule | ✅ Existe en modelo |
| Campo parentId | ❌ No existe (sin jerarquía) |
| UI de edición | ❌ No existe |
| Página Configuración | ✅ Existe |

**Archivos Clave Identificados**:
- `prisma/schema.prisma`: Modelo Group (líneas 104-117)
- `src/schemas/client.ts`: Schemas Zod
- `src/app/api/groups/route.ts`: API REST de grupos
- `src/components/modules/group-selector.tsx`: Selector de grupos
- `src/components/modules/clients-view.tsx`: Vista de clientes

---

## Objetivos de Trabajo

### Objetivo Principal
Permitir gestión avanzada de grupos con jerarquía y horarios desde una página dedicada.

### Entregables Concretos
- [ ] Nueva página `/settings/groups` (o similar)
- [ ] Componente `GroupManager` con árbol jerárquico
- [ ] Formulario de edición de grupo (nombre, color, horario, descripción)
- [ ] CRUD completo de subgrupos desde UI
- [ ] Actualización de `GroupSelector` para soportar jerarquía
- [ ] Migración de Prisma para agregar `parentId`

### Definición de Completado
- [ ] Usuario puede editar nombre de cualquier grupo existente
- [ ] Usuario puede crear subgrupos dentro de cualquier grupo
- [ ] Usuario puede asignar horario (texto libre) a cada grupo
- [ ] Página de configuración accesible y funcional
- [ ] Selector de grupos en vista clientes muestra jerarquía

### Debe Tener
-jerarquía padre→hijo (al menos 2 niveles)
- Edición de nombre, color, descripción, horario
- UI intuitiva para crear/editar/eliminar grupos
- Integración con selector existente

### No Debe Tener (Guardrails)
- No modificar la estructura de clientes existente
- No romper compatibilidad con API existente (actualizar, no reemplazar)
- No eliminar datos existentes (soft delete solo)

---

## Estrategia de Verificación

### Decisión de Tests
- **Infraestructura existe**: SÍ (Vitest, Playwright)
- **Tests automatizados**: Tests después de implementación
- **Framework**: vitest + Playwright

### Política QA
Cada tarea debe incluir escenarios de QA ejecutados por agente (sin intervención humana):
- **UI**: Playwright — navegar, interactuar,断言 DOM, screenshots
- **API**: curl — enviar requests,断言 status + response

---

## Estrategia de Ejecución

### Ondas de Ejecución Paralela

```
Wave 1 (Inicio inmediato — base de datos + API):
├── Tarea 1: Agregar campo parentId al schema de Prisma [quick]
├── Tarea 2: Crear migración de base de datos [quick]
├── Tarea 3: Actualizar tipos TypeScript para jerarquía [quick]
└── Tarea 4: Actualizar schemas Zod [quick]

Wave 2 (Después de Wave 1 — API + componentes core):
├── Tarea 5: Actualizar API GET /groups para devolver jerarquía [unspecified-high]
├── Tarea 6: Actualizar API POST /groups para aceptar parentId [unspecified-high]
├── Tarea 7: Actualizar API PUT /groups/[id] para aceptar parentId [unspecified-high]
├── Tarea 8: Crear componente GroupTree para UI jerárquica [visual-engineering]
└── Tarea 9: Crear formulario de edición de grupo [visual-engineering]

Wave 3 (Después de Wave 2 — integración + página):
├── Tarea 10: Crear página de Gestión de Grupos en Configuración [visual-engineering]
├── Tarea 11: Actualizar GroupSelector para mostrar jerarquía [visual-engineering]
├── Tarea 12: Integrar página con API existente [unspecified-high]
└── Tarea 13: Testing de extremo a extremo [deep]

Wave FINAL (Después de todas las tareas — verificación):
├── Tarea F1: Plan Compliance Audit [oracle]
├── Tarea F2: Code Quality Review [unspecified-high]
├── Tarea F3: Real Manual QA [unspecified-high]
└── Tarea F4: Scope Fidelity Check [deep]
```

### Matriz de Dependencias

- **Tareas 1-4**: — — Inician inmediatamente
- **Tarea 5**: 1, 2 — 6, 7, 8
- **Tarea 6**: 1, 2 — 7, 10
- **Tarea 7**: 1, 2 — 8, 10
- **Tarea 8**: 3, 5 — 10, 11
- **Tarea 9**: 3, 4, 7 — 10
- **Tarea 10**: 5, 6, 7, 8, 9 — 11, 12
- **Tarea 11**: 8, 10 — 13
- **Tarea 12**: 5, 6, 10 — 13
- **Tarea 13**: 10, 11, 12 — F1-F4

---

## TODOs

> Cada tarea debe incluir: Agente recomendado + Info de paralelización + Escenarios QA.
> Una tarea SIN escenarios QA es INCOMPLETA.

- [ ] 1. **Agregar campo parentId al schema de Prisma**

  **Qué hacer**:
  - Agregar campo `parentId: String?` al modelo `Group` en `prisma/schema.prisma`
  - Agregar self-relation: `parent Group? @relation("GroupHierarchy", fields: [parentId], references: [id])`
  - Agregar inverse relation: `children Group[] @relation("GroupHierarchy")`
  - Agregar índice: `@@index([parentId])`

  **No debe hacer**:
  - No eliminar campos existentes
  - No modificar el modelo Client

  **Agente Recomendado**:
  - **Categoría**: quick
  - **Razón**: Cambio simple de schema
  - **Skills**: Ninguno necesario

  **Paralelización**:
  - **Puede ejecutarse en paralelo**: SÍ
  - **Grupo**: Wave 1 (con Tareas 2, 3, 4)
  - **Bloquea**: Tareas 5, 6, 7
  - **Bloqueado por**: Ninguno

  **Referencias**:
  - `prisma/schema.prisma:104-117` — Modelo Group actual para referencia de estructura

  **Criterios de Aceptación**:
  - [ ] Schema de Prisma actualizado con parentId
  - [ ] Self-relation configurada correctamente
  - [ ] Índice agregado para parentId

  **Escenarios QA**:
  ```
  Escenario: Verificar schema de Prisma actualizado
    Herramienta: Bash
    Precondiciones: Ninguna
    Pasos:
      1. Leer prisma/schema.prisma líneas 104-120
      2. Verificar presencia de campo parentId
      3. Verificar self-relation configurada
    Resultado Esperado: Schema contiene parentId y relación padre-hijo
    Evidencia: .sisyphus/evidence/task-1-schema-verify.txt
  ```

  **Commit**: SÍ (grupo con wave)
  - Mensaje: `feat(db): agregar parentId a modelo Group para jerarquía`
  - Archivos: `prisma/schema.prisma`

---

- [ ] 2. **Crear migración de base de datos**

  **Qué hacer**:
  - Ejecutar `bun run db:generate` para generar cliente Prisma
  - Ejecutar `bun run db:push` para aplicar cambios al schema
  - Verificar que la migración fue exitosa

  **No debe hacer**:
  - No eliminar datos existentes
  - No modificar tablas de clientes

  **Agente Recomendado**:
  - **Categoría**: quick
  - **Razón**: Comandos simples de base de datos
  - **Skills**: Ninguno necesario

  **Paralelización**:
  - **Puede ejecutarse en paralelo**: SÍ
  - **Grupo**: Wave 1 (con Tareas 1, 3, 4)
  - **Bloquea**: Tareas 5, 6, 7
  - **Bloqueado por**: Tarea 1

  **Referencias**:
  - `package.json` — Scripts disponibles: db:generate, db:push

  **Criterios de Aceptación**:
  - [ ] `bun run db:generate` completado sin errores
  - [ ] `bun run db:push` completado sin errores
  - [ ] Nueva columna parentId visible en DB

  **Escenarios QA**:
  ```
  Escenario: Verificar migración exitosa
    Herramienta: Bash
    Precondiciones: Migration ejecutada
    Pasos:
      1. Ejecutar bun run db:generate
      2. Verificar output sin errores
      3. Ejecutar bun run db:push
      4. Verificar output sin errores
    Resultado Esperado: Ambos comandos completados exitosamente
    Evidencia: .sisyphus/evidence/task-2-migration-success.txt
  ```

  **Commit**: SÍ (grupo con wave)
  - Mensaje: `chore(db): migración para parentId en grupos`
  - Archivos: Generated files

---

- [ ] 3. **Actualizar tipos TypeScript para jerarquía**

  **Qué hacer**:
  - Agregar `parentId?: string` al tipo `Group` en `src/types/index.ts`
  - Agregar `parent?: Group | null` y `children?: Group[]` para relaciones

  **No debe hacer**:
  - No eliminar tipos existentes
  - No modificar tipos de Client

  **Agente Recomendado**:
  - **Categoría**: quick
  - **Razón**: Cambio simple de tipos
  - **Skills**: Ninguno necesario

  **Paralelización**:
  - **Puede ejecutarse en paralelo**: SÍ
  - **Grupo**: Wave 1 (con Tareas 1, 2, 4)
  - **Bloquea**: Tareas 5, 8
  - **Bloqueado por**: Ninguno

  **Referencias**:
  - `src/types/index.ts` — Tipos actuales de Group

  **Criterios de Aceptación**:
  - [ ] Tipo Group actualizado con parentId
  - [ ] Tipos GroupWithCount actualizado
  - [ ] Sin errores de TypeScript

  **Escenarios QA**:
  ```
  Escenario: Verificar tipos TypeScript
    Herramienta: Bash
    Precondiciones: Tipos actualizados
    Pasos:
      1. Ejecutar npx tsc --noEmit
      2. Verificar que no hay errores de tipos
    Resultado Esperado: tsc completes sin errores
    Evidencia: .sisyphus/evidence/task-3-types-verify.txt
  ```

  **Commit**: SÍ (grupo con wave)
  - Mensaje: `feat(types): agregar parentId a tipos Group`
  - Archivos: `src/types/index.ts`

---

- [ ] 4. **Actualizar schemas Zod**

  **Qué hacer**:
  - Actualizar `groupSchema` en `src/schemas/client.ts` para incluir `parentId`
  - Verificar que `createGroupSchema` y `updateGroupSchema` funcionen

  **No debe hacer**:
  - No eliminar validaciones existentes
  - No romper compatibilidad con API

  **Agente Recomendado**:
  - **Categoría**: quick
  - **Razón**: Cambio simple de schema
  - **Skills**: Ninguno necesario

  **Paralelización**:
  - **Puede ejecutarse en paralelo**: SÍ
  - **Grupo**: Wave 1 (con Tareas 1, 2, 3)
  - **Bloquea**: Tareas 6, 7
  - **Bloqueado por**: Ninguno

  **Referencias**:
  - `src/schemas/client.ts:8-20` — Schemas actuales de grupo

  **Criterios de Aceptación**:
  - [ ] groupSchema incluye parentId opcional
  - [ ] createGroupSchema funciona con parentId
  - [ ] updateGroupSchema funciona con parentId

  **Escenarios QA**:
  ```
  Escenario: Verificar schemas Zod
    Herramienta: Bash
    Pasos:
      1. Ejecutar npx tsc --noEmit
      2. Verificar que schemas son válidos
    Resultado Esperado: Sin errores de compilación
    Evidencia: .sisyphus/evidence/task-4-schemas-verify.txt
  ```

  **Commit**: SÍ (grupo con wave)
  - Mensaje: `feat(schemas): agregar parentId a grupoSchema`
  - Archivos: `src/schemas/client.ts`

---

- [ ] 5. **Actualizar API GET /groups para devolver jerarquía**

  **Qué hacer**:
  - Modificar endpoint GET en `src/app/api/groups/route.ts`
  - Agregar include para incluir `parent` y `children` en la query
  - Devolver estructura jerárquica o aplanada con nivel

  **No debe hacer**:
  - No cambiar签名 de API (mantener compatibilidad)
  - No eliminar campos existentes

  **Agente Recomendado**:
  - **Categoría**: unspecified-high
  - **Razón**: Lógica de negocio para transformar datos
  - **Skills**: Ninguno necesario

  **Paralelización**:
  - **Puede ejecutarse en paralelo**: NO (secuencial después de wave 1)
  - **Grupo**: Wave 2
  - **Bloquea**: Tareas 8, 10
  - **Bloqueado por**: Tareas 1, 2

  **Referencias**:
  - `src/app/api/groups/route.ts:1-52` — Endpoint GET actual

  **Criterios de Aceptación**:
  - [ ] GET /api/groups devuelve parentId
  - [ ] GET /api/groups incluye datos de padre si existe
  - [ ] GET /api/groups incluye hijos si existen

  **Escenarios QA**:
  ```
  Escenario: Verificar GET groups con jerarquía
    Herramienta: Bash
    Precondiciones: API corriendo, DB con datos
    Pasos:
      1. curl -X GET http://localhost:3000/api/groups
      2. Verificar JSON respuesta tiene parentId
    Resultado Esperado: 200 OK con datos de jerarquía
    Evidencia: .sisyphus/evidence/task-5-get-groups.json
  ```

  **Commit**: SÍ (grupo con wave)
  - Mensaje: `feat(api): agregar jerarquía a GET /groups`
  - Archivos: `src/app/api/groups/route.ts`

---

- [ ] 6. **Actualizar API POST /groups para aceptar parentId**

  **Qué hacer**:
  - Modificar endpoint POST en `src/app/api/groups/route.ts`
  - Aceptar `parentId` en el body de la request
  - Validar que el parent existe si se proporciona

  **No debe hacer**:
  - No permitir crear círculos en la jerarquía
  - No romper validación existente

  **Agente Recomendado**:
  - **Categoría**: unspecified-high
  - **Razón**: Lógica de validación adicional
  - **Skills**: Ninguno necesario

  **Paralelización**:
  - ** Puede ejecutarse en paralelo**: NO
  - **Grupo**: Wave 2
  - **Bloquea**: Tarea 10
  - **Bloqueado por**: Tareas 1, 2

  **Referencias**:
  - `src/app/api/groups/route.ts:54-114` — Endpoint POST actual

  **Criterios de Aceptación**:
  - [ ] POST /api/groups acepta parentId en body
  - [ ] Crea grupo con parentId correcto
  - [ ] Valida que parent existe

  **Escenarios QA**:
  ```
  Escenario: Crear subgrupo vía API
    Herramienta: Bash
    Precondiciones: Grupo padre existe
    Pasos:
      1. curl -X POST http://localhost:3000/api/groups -H "Content-Type: application/json" -d '{"name":"Subgrupo1","parentId":"id-del-padre"}'
      2. Verificar respuesta exitosa
      3. Verificar parentId en DB
    Resultado Esperado: 201 Created con grupo creado
    Evidencia: .sisyphus/evidence/task-6-post-subgroup.json
  ```

  **Commit**: SÍ (grupo con wave)
  - Mensaje: `feat(api): aceptar parentId en POST /groups`
  - Archivos: `src/app/api/groups/route.ts`

---

- [ ] 7. **Actualizar API PUT /groups/[id] para aceptar parentId**

  **Qué hacer**:
  - Modificar endpoint PUT en `src/app/api/groups/[id]/route.ts`
  - Aceptar cambio de parentId (mover subgrupo)
  - Validar que no hay ciclos en la jerarquía

  **No debe hacer**:
  - No permitir que un grupo sea su propio padre
  - No permitir ciclos (A padre de B, B padre de A)

  **Agente Recomendado**:
  - **Categoría**: unspecified-high
  - **Razón**: Lógica de validación de ciclos
  - **Skills**: Ninguno necesario

  **Paralelización**:
  - **Puede ejecutarse en paralelo**: NO
  - **Grupo**: Wave 2
  - **Bloquea**: Tareas 8, 10
  - **Bloqueado por**: Tareas 1, 2

  **Referencias**:
  - `src/app/api/groups/[id]/route.ts:46-95` — Endpoint PUT actual

  **Criterios de Aceptación**:
  - [ ] PUT /api/groups/[id] acepta parentId
  - [ ] Previene ciclos en jerarquía
  - [ ] Actualiza correctamente en DB

  **Escenarios QA**:
  ```
  Escenario: Mover subgrupo a otro padre
    Herramienta: Bash
    Precondiciones: Dos grupos padre, un subgrupo
    Pasos:
      1. curl -X PUT http://localhost:3000/api/groups/[subgrupo-id] -H "Content-Type: application/json" -d '{"parentId":"nuevo-padre-id"}'
      2. Verificar respuesta exitosa
    Resultado Esperado: 200 OK con parentId actualizado
    Evidencia: .sisyphus/evidence/task-7-put-move.json
  ```

  **Commit**: SÍ (grupo con wave)
  - Mensaje: `feat(api): aceptar parentId en PUT /groups/[id]`
  - Archivos: `src/app/api/groups/[id]/route.ts`

---

- [ ] 8. **Crear componente GroupTree para UI jerárquica**

  **Qué hacer**:
  - Crear nuevo componente `src/components/modules/group-tree.tsx`
  - Mostrar grupos en estructura de árbol expandible
  - Soportar seleccionar, crear subgrupo, editar, eliminar
  - Usar el diseño de shadcn/ui existente

  **No debe hacer**:
  - No modificar componentes existentes
  - No duplicar lógica de API

  **Agente Recomendado**:
  - **Categoría**: visual-engineering
  - **Razón**: Componente UI con diseño
  - **Skills**: Ninguno necesario

  **Paralelización**:
  - **Puede ejecutarse en paralelo**: NO
  - **Grupo**: Wave 2
  - **Bloquea**: Tareas 10, 11
  - **Bloqueado por**: Tareas 3, 5

  **Referencias**:
  - `src/components/modules/group-tabs.tsx` — Estilo de tabs existente
  - `src/components/modules/group-badge.tsx` — Badge de grupo
  - shadcn/ui — Componentes: Accordion, Tree (si existe), Card

  **Criterios de Aceptación**:
  - [ ] Component renderiza árbol de grupos
  - [ ] Puede expandir/colapsar nodos
  - [ ] Muestra niños correctamente
  - [ ] Estilos consistentes con app

  **Escenarios QA**:
  ```
  Escenario: Renderizar árbol con subgrupos
    Herramienta: Playwright
    Precondiciones: Grupos con jerarquía en DB
    Pasos:
      1. Navegar a página de prueba
      2. Verificar que grupo padre muestra niños
      3. Click en expandir y verificar visibilidad
    Resultado Esperado: Árbol renderiza correctamente
    Evidencia: .sisyphus/evidence/task-8-tree-render.png
  ```

  **Commit**: SÍ (grupo con wave)
  - Mensaje: `feat(ui): crear componente GroupTree`
  - Archivos: `src/components/modules/group-tree.tsx`

---

- [ ] 9. **Crear formulario de edición de grupo**

  **Qué hacer**:
  - Crear componente `GroupForm` para crear/editar grupos
  - Campos: nombre, color (selector), descripción, horario (texto libre)
  - Selector de padre (solo para subgrupos)
  - Validación con Zod

  **No debe hacer**:
  - No duplicar validación del servidor
  - No usar estilos que rompan consistencia

  **Agente Recomendado**:
  - **Categoría**: visual-engineering
  - **Razón**: Formulario con validación
  - **Skills**: Ninguno necesario

  **Paralelización**:
  - **Puede ejecutarse en paralelo**: NO
  - **Grupo**: Wave 2
  - **Bloquea**: Tarea 10
  - **Bloqueado por**: Tareas 3, 4, 7

  **Referencias**:
  - `src/components/modules/client-form.tsx` — Ejemplo de formulario
  - `src/components/modules/group-selector.tsx:19-31` — Colores predefinidos

  **Criterios de Aceptación**:
  - [ ] Formulario con todos los campos
  - [ ] Validación funciona correctamente
  - [ ] Selector de color funciona

  **Escenarios QA**:
  ```
  Escenario: Editar grupo existente
    Herramienta: Playwright
    Precondiciones: Grupo existe
    Pasos:
      1. Abrir formulario de edición
      2. Cambiar nombre
      3. Guardar
      4. Verificar cambio en UI
    Resultado Esperado: Cambio reflejado correctamente
    Evidencia: .sisyphus/evidence/task-9-edit-form.png
  ```

  **Commit**: SÍ (grupo con wave)
  - Mensaje: `feat(ui): crear formulario GroupForm`
  - Archivos: `src/components/modules/group-form.tsx`

---

- [ ] 10. **Crear página de Gestión de Grupos en Configuración**

  **Qué hacer**:
  - Crear nueva página en `src/app/(dashboard)/settings/groups/page.tsx`
  - Usar GroupTree + GroupForm
  - Agregar botón para crear grupo raíz
  - Persistir cambios via API

  **No debe hacer**:
  - No modificar estructura de rutas existente
  - No romper navegación de settings

  **Agente Recomendado**:
  - **Categoría**: visual-engineering
  - **Razón**: Nueva página completa
  - **Skills**: Ninguno necesario

  **Paralelización**:
  - **Puede ejecutarse en paralelo**: NO
  - **Grupo**: Wave 3
  - **Bloquea**: Tareas 11, 12
  - **Bloqueado por**: Tareas 5, 6, 7, 8, 9

  **Referencias**:
  - `src/app/(dashboard)/settings/page.tsx` — Estructura de settings
  - `src/components/modules/clients-view.tsx` — Ejemplo de vista

  **Criterios de Aceptación**:
  - [ ] Página accesible en /settings/groups
  - [ ] Muestra todos los grupos en árbol
  - [ ] CRUD completo funciona
  - [ ] Estilos consistentes

  **Escenarios QA**:
  ```
  Escenario: Página de gestión de grupos
    Herramienta: Playwright
    Precondiciones: Ninguna
    Pasos:
      1. Navegar a /settings/groups
      2. Verificar título "Gestión de Grupos"
      3. Crear nuevo grupo raíz
      4. Crear subgrupo
      5. Editar nombre
      6. Eliminar subgrupo
    Resultado Esperado: Todas las operaciones funcionan
    Evidencia: .sisyphus/evidence/task-10-groups-page.png
  ```

  **Commit**: SÍ (grupo con wave)
  - Mensaje: `feat(ui): crear página de Gestión de Grupos`
  - Archivos: `src/app/(dashboard)/settings/groups/page.tsx`

---

- [ ] 11. **Actualizar GroupSelector para mostrar jerarquía**

  **Qué hacer**:
  - Modificar `src/components/modules/group-selector.tsx`
  - Mostrar grupos organizados por padre (dropdown anidado o similar)
  - Indicar visualmente la jerarquía

  **No debe romper**:
  - Funcionalidad existente de selección
  - API de props

  **Agente Recomendado**:
  - **Categoría**: visual-engineering
  - **Razón**: Actualización de componente existente
  - **Skills**: Ninguno necesario

  **Paralelización**:
  - **Puede ejecutarse en paralelo**: NO
  - **Grupo**: Wave 3
  - **Bloquea**: Tarea 13
  - **Bloqueado por**: Tareas 8, 10

  **Referencias**:
  - `src/components/modules/group-selector.tsx` — Componente actual
  - `src/components/modules/group-tabs.tsx` — UI de tabs

  **Criterios de Aceptación**:
  - [ ] Selector muestra jerarquía
  - [ ] Puede seleccionar cualquier grupo
  - [ ] Funciona en vista de clientes

  **Escenarios QA**:
  ```
  Escenario: Selector con jerarquía en vista clientes
    Herramienta: Playwright
    Precondiciones: Grupos con subgrupos
    Pasos:
      1. Ir a vista de clientes
      2. Click en selector de grupo
      3. Verificar que muestra estructura de árbol
      4. Seleccionar subgrupo
    Resultado Esperado: Subgrupo seleccionado correctamente
    Evidencia: .sisyphus/evidence/task-11-selector-hierarchy.png
  ```

  **Commit**: SÍ (grupo con wave)
  - Mensaje: `feat(ui): mostrar jerarquía en GroupSelector`
  - Archivos: `src/components/modules/group-selector.tsx`

---

- [ ] 12. **Integrar página con API existente**

  **Qué hacer**:
  - Conectar página de grupos con endpoints API
  - Manejar errores gracefully
  - Agregar estados de carga

  **No debe hacer**:
  - No duplicar lógica de API
  - No crear nuevos endpoints innecesarios

  **Agente Recomendado**:
  - **Categoría**: unspecified-high
  - **Razón**: Integración de componentes
  - **Skills**: Ninguno necesario

  **Paralelización**:
  - **Puede ejecutarse en paralelo**: NO
  - **Grupo**: Wave 3
  - **Bloquea**: Tarea 13
  - **Bloqueado por**: Tareas 5, 6, 10

  **Referencias**:
  - `src/components/modules/clients-view.tsx` — Ejemplo de integración API

  **Criterios de Aceptación**:
  - [ ] Datos se cargan correctamente
  - [ ] Cambios se guardan
  - [ ] Errores se muestran al usuario

  **Escenarios QA**:
  ```
  Escenario: Integración API completa
    Herramienta: Bash + Playwright
    Precondiciones: Ninguna
    Pasos:
      1. Probar cada operación CRUD via UI
      2. Verificar que API responde correctamente
      3. Verificar datos en DB
    Resultado Esperado: Todo funciona sin errores
    Evidencia: .sisyphus/evidence/task-12-api-integration.txt
  ```

  **Commit**: SÍ (grupo con wave)
  - Mensaje: `feat(integration): conectar página grupos con API`
  - Archivos: `src/app/(dashboard)/settings/groups/page.tsx`

---

- [ ] 13. **Testing de extremo a extremo**

  **Qué hacer**:
  - Probar flujos completos: crear grupo → subgrupo → editar → eliminar
  - Verificar integridad de datos
  - Probar edge cases

  **No debe hacer**:
  - No modificar datos de producción
  - No probar funcionalidades no relacionadas

  **Agente Recomendado**:
  - **Categoría**: deep
  - **Razón**: Testing comprehensivo
  - **Skills**: Ninguno necesario

  **Paralelización**:
  - **Puede ejecutarse en paralelo**: NO
  - **Grupo**: Wave 3
  - **Bloquea**: Tareas F1-F4
  - **Bloqueado por**: Tareas 10, 11, 12

  **Criterios de Aceptación**:
  - [ ] Todos los flujos funcionan
  - [ ] No hay errores en consola
  - [ ] Datos persistentes correctamente

  **Escenarios QA**:
  ```
  Escenario: Flujo completo E2E
    Herramienta: Playwright
    Precondiciones: Ninguna
    Pasos:
      1. Crear grupo padre "Natación"
      2. Crear subgrupo "Niños" dentro de Natación
      3. Crear subgrupo "Adultos" dentro de Natación
      4. Asignar horario "Lun y Mie 18:00" a Natación
      5. Editar nombre de Niños a "Niños Principiantes"
      6. Eliminar Adultos
      7. Verificar estructura final
    Resultado Esperado: Flujo completo sin errores
    Evidencia: .sisyphus/evidence/task-13-e2e-flow.png
  ```

  **Commit**: SÍ (grupo con wave)
  - Mensaje: `test(e2e): agregar tests de grupos`
  - Archivos: `tests/e2e/groups.test.ts`

---

## Onda Final de Verificación (MANDATORY — después de TODAS las tareas)

> 4 agentes de review corren en PARALELO. TODOS deben APROBAR. Rechazo →fix → re-ejecutar.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Leer el plan completo. Para cada "Must Have": verificar implementación existe (leer archivo, curl endpoint, ejecutar comando). Para cada "Must NOT Have": buscar en codebase patrones forbidden — rechazar con file:line si encuentra. Verificar archivos de evidencia existen en .sisyphus/evidence/. Comparar entregables contra plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Ejecutar `npx tsc --noEmit` + linter + tests. Revisar todos los archivos cambiados para: `as any`/`@ts-ignore`, empty catches, console.log en prod, código comentado, imports sin usar. Check AI slop: comentarios excesivos, sobre-abstracción, nombres genéricos (data/result/item/temp).
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill si UI)
  Comenzar desde estado limpio. Ejecutar CADA escenario de QA de CADA tarea — seguir pasos exactos, capturar evidencia. Testear integración cross-task (features funcionando juntos, no aislamiento). Testear edge cases: estado vacío, input inválido, acciones rápidas. Guardar en `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  Para cada tarea: leer "Qué hacer", leer diff actual (git log/diff). Verificar 1:1 — todo en spec fue construido (no falta), nada más allá de spec fue construido (no creep). Check "No debe hacer" compliance. Detectar cross-task contamination: Task N tocando archivos de Task M. Flaggear cambios no accountados.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Estrategia de Commits

- **Wave 1**: `feat(db): agregar parentId a modelo Group para jerarquía` — prisma/schema.prisma, src/types/index.ts, src/schemas/client.ts
- **Wave 2**: `feat(api+ui): agregar soporte de jerarquía a API y crear componentes GroupTree y GroupForm` — src/app/api/groups/*.ts, src/components/modules/group-tree.tsx, group-form.tsx
- **Wave 3**: `feat(pages): crear página de Gestión de Grupos y actualizar GroupSelector` — src/app/(dashboard)/settings/groups/page.tsx, src/components/modules/group-selector.tsx, tests/e2e/groups.test.ts

---

## Criterios de Éxito

### Comandos de Verificación
```bash
# Verificar API
curl http://localhost:3000/api/groups | jq '.data[] | {id, name, parentId}'

# Verificar página
npx playwright test tests/e2e/groups.test.ts

# Verificar tipos
npx tsc --noEmit
```

### Checklist Final
- [ ] Todos los "Must Have" presentes
- [ ] Todos los "Must NOT Have" ausentes
- [ ] Todos los tests pasan
- [ ] Página accesible en /settings/groups
- [ ] Jerarquía padre-hijo funciona
- [ ] Horarios se pueden asignar a cada grupo
