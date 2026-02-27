# Sistema de Testing - NMS

Este proyecto incluye un sistema de testing completo con tests unitarios, de integración y E2E.

## Estructura

```
tests/
├── unit/                    # Tests unitarios
│   ├── utils.test.ts        # Tests para utilidades
│   ├── hooks.test.ts        # Tests para hooks personalizados
│   ├── schemas.test.ts      # Tests para validación Zod
│   ├── store.test.ts        # Tests para Zustand store
│   └── components/          # Tests para componentes React
│       └── group-badge.test.tsx
├── integration/             # Tests de integración
│   ├── api-clients.test.ts  # Tests para API de clientes
│   └── api-dashboard-attendance.test.ts
├── e2e/                     # Tests end-to-end (Playwright)
│   └── app.spec.ts          # Tests de flujos completos
├── fixtures/                # Datos de prueba
│   ├── test-data.ts         # Factories para crear datos mock
│   └── db-fixtures.ts       # Fixtures para base de datos
├── mocks/                   # Mocks y stubs
├── utils/                   # Utilidades de testing
└── setup.ts                 # Configuración global de tests
```

## Comandos

### Vitest (Unitario e Integración)

```bash
# Ejecutar todos los tests
bun run test

# Ejecutar tests una vez (CI)
bun run test:run

# Watch mode para desarrollo
bun run test:watch

# Tests con cobertura
bun run test:coverage

# Solo tests unitarios
bun run test:unit

# Solo tests de integración
bun run test:integration
```

### Playwright (E2E)

```bash
# Ejecutar tests E2E
bun run test:e2e

# Modo UI para debug
bun run test:e2e:ui

# Debug mode
bun run test:e2e:debug
```

### Ejecutar todos los tests

```bash
bun run test:all
```

## Tecnologías

- **Vitest**: Framework de testing rápido, compatible con Vite
- **@testing-library/react**: Testing de componentes React
- **@testing-library/user-event**: Simulación de eventos de usuario
- **Playwright**: Testing E2E multi-navegador
- **MSW**: Mock Service Worker para APIs
- **jest-mock-extended**: Mocking para Prisma y otros servicios

## Cobertura de Tests

### Tests Unitarios
- ✅ Utilidades (formatCurrency, formatPhone, formatDate, etc.)
- ✅ Hooks personalizados (useDebounce, useThrottle, useLocalStorage, etc.)
- ✅ Validación Zod (clientSchema, groupSchema, subscriptionSchema)
- ✅ Store Zustand (estado, acciones, selectores)
- ✅ Componentes individuales (GroupBadge, etc.)

### Tests de Integración
- ✅ API /clients (GET, POST)
- ✅ API /groups (GET, POST)
- ✅ API /dashboard (GET)
- ✅ API /attendance (GET, POST)

### Tests E2E
- ✅ Dashboard con estadísticas
- ✅ Navegación entre vistas
- ✅ CRUD de clientes
- ✅ Registro de asistencias
- ✅ Gestión de pagos
- ✅ Responsive design
- ✅ Manejo de errores

## Configuración

### Vitest (`vitest.config.ts`)
- Environment: jsdom
- Coverage: v8
- Timeout: 10s
- Setup: tests/setup.ts

### Playwright (`playwright.config.ts`)
- Navegadores: Chromium, Firefox, WebKit
- Mobile: Pixel 5, iPhone 12
- Retries: 2 (CI)
- Video: on failure
- Screenshot: on failure

## Mejores Prácticas

1. **Aislamiento**: Cada test es independiente y no afecta a otros
2. **Mocking**: Usar vi.mock() para dependencias externas
3. **Factories**: Usar las factories de test-data.ts para crear datos consistentes
4. **Cleanup**: Los tests limpian su estado después de ejecutarse
5. **Descriptivos**: Nombres de tests descriptivos con should/when

## Ejemplos

### Test Unitario
```typescript
describe('formatCurrency', () => {
  it('should format currency in ARS', () => {
    const result = formatCurrency(5000)
    expect(result).toContain('5.000')
    expect(result).toContain('$')
  })
})
```

### Test de Integración
```typescript
describe('API /clients', () => {
  it('should create a new client', async () => {
    const response = await createClient(request)
    const data = await response.json()
    expect(data.success).toBe(true)
  })
})
```

### Test E2E
```typescript
test('should create a new client', async ({ page }) => {
  await page.click('button:has-text("Nuevo Cliente")')
  await page.fill('input[placeholder*="Nombre"]', 'Test')
  await page.click('button:has-text("Crear Cliente")')
  await expect(page.locator('text=Test')).toBeVisible()
})
```
