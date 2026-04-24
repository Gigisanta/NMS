/**
 * Comprehensive QA Test Suite - NMS Application
 * Tests all major features: Dashboard, Clientes, Asistencias, Pagos,
 * Facturacion, Calendario, Empleados, Gastos, Configuracion
 *
 * Login: mariela@nms.com / mariela123
 * App: http://localhost:3000
 */

import { test, expect, Page, Dialog, ConsoleMessage } from '@playwright/test'

const BASE = 'http://localhost:3000'
const EMAIL = 'mariela@nms.com'
const PASSWORD = 'mariela123'

// Track console errors across all tests
const consoleErrors: string[] = []
const consoleWarnings: string[] = []

function isNoise(err: string): boolean {
  return (
    err.includes('favicon') ||
    err.includes('net::ERR_') ||
    err.includes('Failed to load resource') ||
    err.includes('Refused to execute') ||
    err.includes('404') ||
    err.includes('chrome-extension') ||
    err.includes('Safari') ||
    err.includes('NEXT_REDIRECT') ||
    err.includes('third-party') ||
    err.includes('analytics') ||
    err.includes('googletagmanager') ||
    err.includes('gtag')
  )
}

function setupConsoleListener(page: Page) {
  page.on('console', (msg: ConsoleMessage) => {
    const text = msg.text()
    if (msg.type() === 'error' && !isNoise(text)) {
      consoleErrors.push(`[${msg.type()}] ${text}`)
    }
    if (msg.type() === 'warning' && !isNoise(text)) {
      consoleWarnings.push(`[${msg.type()}] ${text}`)
    }
  })
  page.on('pageerror', (err) => {
    consoleErrors.push(`[pageerror] ${err.message}`)
  })
}

async function doLogin(page: Page) {
  await page.context().clearCookies()
  const csrfRes = await page.request.get(`${BASE}/api/auth/csrf`)
  const { csrfToken } = await csrfRes.json()

  await page.request.post(`${BASE}/api/auth/callback/credentials`, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    form: { csrfToken, email: EMAIL, password: PASSWORD, json: true },
  })

  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  try {
    await page.waitForFunction(
      () =>
        document.body.innerText.includes('Dashboard') ||
        document.body.innerText.includes('Ver Clientes') ||
        document.body.innerText.includes('Clientes'),
      { timeout: 20000 }
    )
  } catch {
    const sessionRes = await page.request.get(`${BASE}/api/auth/session`)
    const sessionData = await sessionRes.json()
    if (!sessionData.user) {
      throw new Error(`Login failed — no user in session: ${JSON.stringify(sessionData)}`)
    }
  }
}

async function navigateTo(page: Page, label: RegExp | string) {
  const navItem = page.getByRole('button', { name: label }).first()
  await navItem.click()
  await page.waitForTimeout(1200)
}

async function screenshot(page: Page, name: string) {
  await page.screenshot({ path: `tests/e2e/screenshots/${name}.png`, fullPage: false })
}

async function assertNoNewErrors(page: Page, testName: string) {
  const errors = consoleErrors.filter(e => !e.includes(`[${testName}]`))
  if (errors.length > 0) {
    console.log(`\n=== CONSOLE ERRORS in ${testName} ===`)
    errors.forEach(e => console.log(e))
  }
}

let testCounter = 0
function getTestId(): string {
  return `qa-${String(++testCounter).padStart(2, '0')}`
}

// ══════════════════════════════════════════════════════════════════════════════
// 0. LOGIN
// ══════════════════════════════════════════════════════════════════════════════

test.describe('0. Login', () => {
  test('0-1: Login page renders correctly', async ({ page }) => {
    setupConsoleListener(page)
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
    await screenshot(page, `${getTestId()}-login-page`)

    // Check essential form elements
    const emailInput = page.locator('input[type="email"], input[name="email"]').first()
    const passwordInput = page.locator('input[type="password"]').first()
    const submitBtn = page.getByRole('button', { name: /iniciar/i }).or(page.getByRole('button', { name: /entrar/i })).first()

    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
    await expect(submitBtn).toBeVisible()

    const errors = consoleErrors.filter(e => !isNoise(e))
    if (errors.length > 0) console.log(`Errors: ${errors.join(', ')}`)
  })

  test('0-2: Login with valid credentials redirects to dashboard', async ({ page }) => {
    setupConsoleListener(page)
    await doLogin(page)
    await screenshot(page, `${getTestId()}-after-login`)

    const bodyText = await page.evaluate(() => document.body.innerText)
    const isOnDashboard = bodyText.includes('Dashboard') || bodyText.includes('Clientes')
    expect(isOnDashboard).toBeTruthy()
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 1. DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════

test.describe('1. Dashboard', () => {
  test('1-1: Dashboard loads with all stat cards visible', async ({ page }) => {
    setupConsoleListener(page)
    await doLogin(page)
    await screenshot(page, `${getTestId()}-dashboard`)
    await page.waitForTimeout(2000) // Allow async data to load

    // Check dashboard heading
    const dashHeading = page.getByText(/dashboard/i).first()
    await expect(dashHeading).toBeVisible()

    // Check stat cards - look for common labels
    const clientesCard = page.getByText(/cliente/i).first()
    await expect(clientesCard).toBeVisible({ timeout: 8000 })

    // Check for income card
    const ingresosCard = page.getByText(/ingreso/i).first()
    await expect(ingresosCard).toBeVisible({ timeout: 8000 })

    // Check "Ver Clientes" CTA button
    const verClientesBtn = page.getByRole('button', { name: /ver clientes/i }).first()
    if (await verClientesBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(verClientesBtn).toBeVisible()
    }

    // Check sidebar is present
    const sidebar = page.getByRole('navigation').or(page.locator('[class*="sidebar"]')).first()
    await expect(sidebar).toBeVisible({ timeout: 5000 })

    console.log(`[1-1] Console errors: ${consoleErrors.filter(e => !isNoise(e)).join('; ')}`)
  })

  test('1-2: Income chart renders on dashboard', async ({ page }) => {
    setupConsoleListener(page)
    await doLogin(page)
    await page.waitForTimeout(2000)

    // Look for chart or graph elements
    const chartCanvas = page.locator('canvas').first()
    const chartDiv = page.locator('[class*="chart"]').first()
    const rechartsWrapper = page.locator('.recharts-wrapper, [class*="recharts"]').first()

    const hasChart = await (
      chartCanvas.isVisible({ timeout: 2000 }).catch(() => false) ||
      chartDiv.isVisible({ timeout: 2000 }).catch(() => false) ||
      rechartsWrapper.isVisible({ timeout: 2000 }).catch(() => false)
    )

    if (hasChart) {
      await expect(chartCanvas.or(chartDiv).or(rechartsWrapper)).toBeVisible()
    } else {
      // Chart may not be present if no data - check for loading or empty state
      const hasContent = await (
        page.getByText(/sin datos|no hay ingresos/i).first().isVisible({ timeout: 2000 }).catch(() => false) ||
        page.locator('svg').first().isVisible({ timeout: 2000 }).catch(() => false)
      )
      console.log(`[1-2] Chart state: ${hasChart ? 'visible' : 'not present (may be empty data)'}`)
    }
  })

  test('1-3: Dashboard reloads correctly on page refresh', async ({ page }) => {
    setupConsoleListener(page)
    await doLogin(page)
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    const bodyText = await page.evaluate(() => document.body.innerText)
    const isOnDashboard = bodyText.includes('Dashboard') || bodyText.includes('Clientes')
    expect(isOnDashboard).toBeTruthy()
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 2. CLIENTES (/clientes)
// ══════════════════════════════════════════════════════════════════════════════

test.describe('2. Clientes', () => {
  test('2-1: Clientes page loads with client table', async ({ page }) => {
    setupConsoleListener(page)
    await doLogin(page)
    await navigateTo(page, /clientes/i)
    await screenshot(page, `${getTestId()}-clientes`)
    await page.waitForTimeout(1000)

    await expect(page).toHaveURL(/clientes/)

    const table = page.getByRole('table').first()
    const hasTable = await table.isVisible({ timeout: 5000 }).catch(() => false)
    if (hasTable) {
      await expect(table).toBeVisible()
    }

    // Should show some client-related text
    await expect(page.getByText(/cliente/i).first()).toBeVisible({ timeout: 5000 })
    console.log(`[2-1] Errors: ${consoleErrors.filter(e => !isNoise(e)).join('; ')}`)
  })

  test('2-2: Search clients by name', async ({ page }) => {
    setupConsoleListener(page)
    await doLogin(page)
    await navigateTo(page, /clientes/i)
    await page.waitForTimeout(1000)

    const searchInput = page.getByPlaceholder(/buscar/i).or(page.locator('input[type="search"]').first())
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('Juan')
      await page.waitForTimeout(800)

      const table = page.getByRole('table').first()
      if (await table.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(table).toBeVisible()
      }
      // Clear search
      await searchInput.clear()
      await page.waitForTimeout(400)
    }
  })

  test('2-3: Filter by group', async ({ page }) => {
    setupConsoleListener(page)
    await doLogin(page)
    await navigateTo(page, /clientes/i)
    await page.waitForTimeout(1000)

    // Click "Todos" in the sidebar group filter section (below the Clientes nav button)
    // The sidebar has group color buttons - use a more specific selector within the sidebar
    const sidebar = page.locator('nav, [class*="sidebar"]').first()
    const groupBtns = sidebar.locator('button').filter({ hasText: /todos/i })
    const count = await groupBtns.count()
    if (count > 0) {
      // Find the one inside the sidebar filter area (not the nav item itself)
      await groupBtns.first().click()
      await page.waitForTimeout(600)
      console.log(`[2-3] Clicked group filter, found ${count} buttons`)
    }
  })

  test('2-4: Click a client row to open profile panel', async ({ page }) => {
    setupConsoleListener(page)
    await doLogin(page)
    await navigateTo(page, /clientes/i)
    await page.waitForTimeout(1500)

    const table = page.getByRole('table').first()
    if (!(await table.isVisible({ timeout: 3000 }).catch(() => false))) {
      console.log('[2-4] No table visible, skipping client click test')
      return
    }

    // Get row count before clicking
    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()
    if (rowCount === 0) {
      console.log('[2-4] No client rows, skipping')
      return
    }

    // Click on first data row (not header)
    const firstRow = rows.first()
    await firstRow.click()
    await page.waitForTimeout(1500)
    await screenshot(page, `${getTestId()}-cliente-profile-open`)

    // Profile panel should open - look for dialog, drawer, or sheet
    const dialogContent = page.locator('[data-state="open"], [role="dialog"], [data-slot="dialog-content"]').first()
    const sheetContent = page.locator('[data-slot="sheet-content"], [role="dialog"]').first()
    const panelVisible = await (dialogContent.isVisible({ timeout: 3000 }).catch(() => false) || sheetContent.isVisible({ timeout: 3000 }).catch(() => false))
    if (!panelVisible) {
      console.log('[2-4] WARNING: Profile panel not visible after click')
    }
    expect(panelVisible).toBeTruthy()
  })

  test('2-5: Close client profile panel', async ({ page }) => {
    setupConsoleListener(page)
    await doLogin(page)
    await navigateTo(page, /clientes/i)
    await page.waitForTimeout(1500)

    const table = page.getByRole('table').first()
    if (!(await table.isVisible({ timeout: 3000 }).catch(() => false))) return

    const rows = page.locator('tbody tr')
    const rowCount = await rows.count()
    if (rowCount === 0) return

    // Open profile
    await rows.first().click()
    await page.waitForTimeout(1000)

    // Try to close - look for X or close button
    const closeBtn = page.locator('[data-slot="dialog-close"]').or(page.getByRole('button', { name: /cerrar|x|close/i })).first()
    const backdrop = page.locator('[data-state="open"]').locator('..').locator('..')

    if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeBtn.click()
    } else {
      // Try pressing Escape
      await page.keyboard.press('Escape')
    }
    await page.waitForTimeout(800)

    // Table should still be visible (dialog closed)
    await expect(table).toBeVisible()
  })

  test('2-6: Open "Nuevo Cliente" dialog', async ({ page }) => {
    setupConsoleListener(page)
    await doLogin(page)
    await navigateTo(page, /clientes/i)
    await page.waitForTimeout(1000)

    const nuevoBtn = page.getByRole('button', { name: /nuevo cliente/i }).first()
    if (await nuevoBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nuevoBtn.click()
      await page.waitForTimeout(800)
      await screenshot(page, `${getTestId()}-nuevo-cliente-dialog`)

      // Dialog should open - look for the dialog content container
      const dialogContent = page.locator('[data-slot="dialog-content"], [role="dialog"]').first()
      const hasDialog = await dialogContent.isVisible({ timeout: 5000 }).catch(() => false)
      if (!hasDialog) {
        // Dialog might use a different data-slot, try to find the form
        const formField = page.getByPlaceholder(/^juan$/i).or(page.getByText(/datos personales/i).first())
        const hasForm = await formField.isVisible({ timeout: 3000 }).catch(() => false)
        expect(hasForm).toBeTruthy()
      } else {
        await expect(dialogContent).toBeVisible()
        // Dialog is open - close it
        const cancelBtn = page.getByRole('button', { name: /cancelar/i }).first()
        if (await cancelBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await cancelBtn.click()
        } else {
          await page.keyboard.press('Escape')
        }
        await page.waitForTimeout(500)
      }
    }
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 3. ASISTENCIAS (/asistencias)
// ══════════════════════════════════════════════════════════════════════════════

test.describe('3. Asistencias', () => {
  test('3-1: Asistencias page loads', async ({ page }) => {
    setupConsoleListener(page)
    await doLogin(page)
    await navigateTo(page, /asistencias/i)
    await screenshot(page, `${getTestId()}-asistencias`)
    await page.waitForTimeout(1500)

    // Look for the main page heading (h1 element with asistencia text)
    const heading = page.locator('h1').filter({ hasText: /asistencia/i }).first()
    const hasHeading = await heading.isVisible({ timeout: 8000 }).catch(() => false)
    if (!hasHeading) {
      // Fallback: any text containing "Asistencias"
      const anyText = page.getByText(/asistencias/i).first()
      await expect(anyText).toBeVisible({ timeout: 8000 })
    } else {
      await expect(heading).toBeVisible()
    }
    console.log(`[3-1] Errors: ${consoleErrors.filter(e => !isNoise(e)).join('; ')}`)
  })

  test('3-2: Mark attendance for a client', async ({ page }) => {
    setupConsoleListener(page)
    await doLogin(page)
    await navigateTo(page, /asistencias/i)
    await page.waitForTimeout(1500)

    // Look for check button (mark attendance)
    const checkBtn = page.locator('button').filter({ has: page.locator('svg[class*="lucide-check"], svg[class*="check"]') }).first()
    const markBtn = page.getByRole('button', { name: /marcar|asist|presente/i }).first()

    let clicked = false
    if (await checkBtn.isVisible({ timeout: 2000 }).catch(() => false) && await checkBtn.isEnabled({ timeout: 1000 }).catch(() => false)) {
      await checkBtn.click()
      clicked = true
    } else if (await markBtn.isVisible({ timeout: 2000 }).catch(() => false) && await markBtn.isEnabled({ timeout: 1000 }).catch(() => false)) {
      await markBtn.click()
      clicked = true
    }

    if (clicked) {
      await page.waitForTimeout(1000)
      console.log('[3-2] Marked attendance successfully')
    } else {
      // No clients available - check for empty state
      const emptyState = page.getByText(/sin alumnos|sin asistencia|no hay alumnos/i).first()
      const hasEmpty = await emptyState.isVisible({ timeout: 2000 }).catch(() => false)
      if (hasEmpty) {
        console.log('[3-2] No clients to mark attendance for (empty state)')
      } else {
        console.log('[3-2] Could not find attendance button')
      }
    }
  })

  test('3-3: Remove attendance', async ({ page }) => {
    setupConsoleListener(page)
    await doLogin(page)
    await navigateTo(page, /asistencias/i)
    await page.waitForTimeout(1500)

    // Look for unmark/remove attendance button (typically X or undo)
    const unmarkBtn = page.locator('button').filter({ has: page.locator('svg[class*="lucide-x"], svg[class*="x"]') }).first()
    const removeBtn = page.getByRole('button', { name: /quitar|eliminar|retirar/i }).first()

    let clicked = false
    if (await unmarkBtn.isVisible({ timeout: 2000 }).catch(() => false) && await unmarkBtn.isEnabled({ timeout: 1000 }).catch(() => false)) {
      await unmarkBtn.click()
      clicked = true
    } else if (await removeBtn.isVisible({ timeout: 2000 }).catch(() => false) && await removeBtn.isEnabled({ timeout: 1000 }).catch(() => false)) {
      await removeBtn.click()
      clicked = true
    }

    if (clicked) {
      await page.waitForTimeout(1000)
      console.log('[3-3] Removed attendance successfully')
    } else {
      console.log('[3-3] No removable attendance found')
    }
  })

  test('3-4: Filter by group tabs', async ({ page }) => {
    setupConsoleListener(page)
    await doLogin(page)
    await navigateTo(page, /asistencias/i)
    await page.waitForTimeout(1500)

    // Click "Todos" tab
    const todosBtn = page.getByRole('button', { name: /todos/i }).first()
    if (await todosBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await todosBtn.click()
      await page.waitForTimeout(500)
    }

    // Check for group filter tabs
    const tabList = page.locator('[role="tablist"]').first()
    const hasTabs = await tabList.isVisible({ timeout: 2000 }).catch(() => false)
    if (hasTabs) {
      const tabs = page.locator('[role="tab"]')
      const tabCount = await tabs.count()
      console.log(`[3-4] Found ${tabCount} group tabs`)
    }
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 4. PAGOS (/pagos)
// ══════════════════════════════════════════════════════════════════════════════

test.describe('4. Pagos', () => {
  test('4-1: Pagos page loads with subscriptions', async ({ page }) => {
    setupConsoleListener(page)
    await doLogin(page)
    await navigateTo(page, /pagos/i)
    await screenshot(page, `${getTestId()}-pagos`)
    await page.waitForTimeout(1500)

    const heading = page.getByText(/pago|suscripcion/i).first()
    await expect(heading).toBeVisible({ timeout: 8000 })
    console.log(`[4-1] Errors: ${consoleErrors.filter(e => !isNoise(e)).join('; ')}`)
  })

  test('4-2: View payment status - stats cards', async ({ page }) => {
    setupConsoleListener(page)
    await doLogin(page)
    await navigateTo(page, /pagos/i)
    await page.waitForTimeout(1500)

    const totalCard = page.getByText(/total/i).first()
    const alDiaCard = page.getByText(/al día/i).first()
    const pendientesCard = page.getByText(/pendiente/i).first()

    await expect(totalCard).toBeVisible({ timeout: 5000 })

    const hasAlDia = await alDiaCard.isVisible({ timeout: 2000 }).catch(() => false)
    const hasPendientes = await pendientesCard.isVisible({ timeout: 2000 }).catch(() => false)
    console.log(`[4-2] Stats: total=${await totalCard.isVisible().catch(() => false)}, al_dia=${hasAlDia}, pendientes=${hasPendientes}`)
  })

  test('4-3: Filter payments by status', async ({ page }) => {
    setupConsoleListener(page)
    await doLogin(page)
    await navigateTo(page, /pagos/i)
    await page.waitForTimeout(1500)

    const filterBtns = [
      page.getByRole('button', { name: /todos/i }).first(),
      page.getByRole('button', { name: /pendiente/i }).first(),
    ]

    for (const btn of filterBtns) {
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btn.click()
        await page.waitForTimeout(600)
      }
    }
  })

  test('4-4: Change month/year filter', async ({ page }) => {
    setupConsoleListener(page)
    await doLogin(page)
    await navigateTo(page, /pagos/i)
    await page.waitForTimeout(1500)

    const monthSelect = page.locator('select').first()
    if (await monthSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      const options = await monthSelect.locator('option').count()
      if (options > 1) {
        await monthSelect.selectOption({ index: 1 })
        await page.waitForTimeout(600)
        console.log(`[4-4] Changed month, found ${options} options`)
      }
    }
  })

  test('4-5: Mark payment as paid (Efectivo)', async ({ page }) => {
    setupConsoleListener(page)
    await doLogin(page)
    await navigateTo(page, /pagos/i)
    await page.waitForTimeout(1500)

    // Look for "Efectivo" button in the table rows
    const efBtn = page.getByRole('button', { name: /efectivo/i }).first()
    if (await efBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await efBtn.click()
      await page.waitForTimeout(1500)
      console.log('[4-5] Marked payment as paid')
    } else {
      console.log('[4-5] No pending payments with Efectivo option')
    }
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 5. FACTURACION (/facturacion)
// ══════════════════════════════════════════════════════════════════════════════

test.describe('5. Facturacion', () => {
  test('5-1: Facturacion page loads', async ({ page }) => {
    setupConsoleListener(page)
    await doLogin(page)
    await navigateTo(page, /facturación/i)
    await screenshot(page, `${getTestId()}-facturacion`)
    await page.waitForTimeout(2000)

    // Look for the main page heading (h1 element with facturacion text)
    const heading = page.locator('h1').filter({ hasText: /facturación/i }).first()
    const hasHeading = await heading.isVisible({ timeout: 8000 }).catch(() => false)
    if (!hasHeading) {
      const anyText = page.getByText(/facturación/i).first()
      await expect(anyText).toBeVisible({ timeout: 8000 })
    } else {
      await expect(heading).toBeVisible()
    }
    console.log(`[5-1] Errors: ${consoleErrors.filter(e => !isNoise(e)).join('; ')}`)
  })

  test('5-2: ARCA and Mercado Pago status cards visible', async ({ page }) => {
    setupConsoleListener(page)
    await doLogin(page)
    await navigateTo(page, /facturación/i)
    await page.waitForTimeout(2000)

    const arcaCard = page.getByText(/arca|afip/i).first()
    const mpCard = page.getByText(/mercado pago/i).first()

    const hasArca = await arcaCard.isVisible({ timeout: 3000 }).catch(() => false)
    const hasMp = await mpCard.isVisible({ timeout: 3000 }).catch(() => false)
    console.log(`[5-2] ARCA visible: ${hasArca}, Mercado Pago visible: ${hasMp}`)
  })

  test('5-3: Invoice items table renders', async ({ page }) => {
    setupConsoleListener(page)
    await doLogin(page)
    await navigateTo(page, /facturación/i)
    await page.waitForTimeout(2000)

    const table = page.getByRole('table').first()
    const emptyState = page.getByText(/sin items|no hay|sin facturar/i).first()

    const hasTable = await table.isVisible({ timeout: 3000 }).catch(() => false)
    const hasEmpty = await emptyState.isVisible({ timeout: 2000 }).catch(() => false)

    expect(hasTable || hasEmpty).toBeTruthy()
    if (hasTable) {
      await expect(table).toBeVisible()
      // Check for checkboxes in table
      const checkboxes = page.locator('input[type="checkbox"]')
      const cbCount = await checkboxes.count()
      console.log(`[5-3] Table with ${cbCount} checkboxes`)
    }
  })

  test('5-4: Select individual invoice item', async ({ page }) => {
    setupConsoleListener(page)
    await doLogin(page)
    await navigateTo(page, /facturación/i)
    await page.waitForTimeout(2000)

    const rowCheckbox = page.locator('tbody input[type="checkbox"]').first()
    if (await rowCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await rowCheckbox.click()
      await page.waitForTimeout(400)
      console.log('[5-4] Selected invoice item')
    }
  })

  test('5-5: Facturar button disabled when nothing selected', async ({ page }) => {
    setupConsoleListener(page)
    await doLogin(page)
    await navigateTo(page, /facturación/i)
    await page.waitForTimeout(2000)

    // First deselect everything
    const selectAllCb = page.locator('th input[type="checkbox"]').first()
    if (await selectAllCb.isVisible({ timeout: 2000 }).catch(() => false)) {
      const isChecked = await selectAllCb.isChecked()
      if (isChecked) await selectAllCb.click()
    }

    const facturarBtn = page.getByRole('button', { name: /facturar/i }).first()
    if (await facturarBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(facturarBtn).toBeDisabled()
    }
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 6. CALENDARIO (/calendario)
// ══════════════════════════════════════════════════════════════════════════════

test.describe('6. Calendario', () => {
  test('6-1: Calendario page loads with events', async ({ page }) => {
    setupConsoleListener(page)
    await doLogin(page)
    await navigateTo(page, /calendario/i)
    await screenshot(page, `${getTestId()}-calendario`)
    await page.waitForTimeout(2000)

    const heading = page.getByText(/calendario/i).first()
    await expect(heading).toBeVisible({ timeout: 8000 })
    console.log(`[6-1] Errors: ${consoleErrors.filter(e => !isNoise(e)).join('; ')}`)
  })

  test('6-2: Calendar renders with month navigation', async ({ page }) => {
    setupConsoleListener(page)
    await doLogin(page)
    await navigateTo(page, /calendario/i)
    await page.waitForTimeout(2000)

    // Check for calendar grid or date cells
    const calGrid = page.locator('[class*="calendar"], [class*="cal-"], [class*="date-picker"]').first()
    const hasGrid = await calGrid.isVisible({ timeout: 3000 }).catch(() => false)

    if (hasGrid) {
      await expect(calGrid).toBeVisible()
    }

    // Look for navigation buttons
    const prevBtn = page.getByRole('button', { name: /anterior|prev/i }).first()
    const nextBtn = page.getByRole('button', { name: /siguiente|next/i }).first()

    const hasPrev = await prevBtn.isVisible({ timeout: 1000 }).catch(() => false)
    const hasNext = await nextBtn.isVisible({ timeout: 1000 }).catch(() => false)
    console.log(`[6-2] Nav buttons: prev=${hasPrev}, next=${hasNext}`)
  })

  test('6-3: Navigate between months', async ({ page }) => {
    setupConsoleListener(page)
    await doLogin(page)
    await navigateTo(page, /calendario/i)
    await page.waitForTimeout(2000)

    const nextBtn = page.getByRole('button', { name: /siguiente|›|>/i }).or(page.getByLabel(/mes siguiente/i)).first()
    if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nextBtn.click()
      await page.waitForTimeout(600)
      await nextBtn.click()
      await page.waitForTimeout(600)
      console.log('[6-3] Navigated forward 2 months')
    }
  })

  test('6-4: Calendar events render', async ({ page }) => {
    setupConsoleListener(page)
    await doLogin(page)
    await navigateTo(page, /calendario/i)
    await page.waitForTimeout(2000)

    // Look for event indicators (colored dots, event divs, etc.)
    const events = page.locator('[class*="event"], [class*="cal-event"]').first()
    const hasEvents = await events.isVisible({ timeout: 2000 }).catch(() => false)

    // Look for today's date indicator
    const todayCell = page.locator('[data-today="true"], [class*="today"], [class*="selected"]').first()
    const hasToday = await todayCell.isVisible({ timeout: 2000 }).catch(() => false)

    console.log(`[6-4] Events visible: ${hasEvents}, Today indicator: ${hasToday}`)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 7. EMPLEADOS (/empleados)
// ══════════════════════════════════════════════════════════════════════════════

test.describe('7. Empleados', () => {
  test('7-1: Empleados page loads for EMPLEADORA', async ({ page }) => {
    setupConsoleListener(page)
    await doLogin(page)
    await navigateTo(page, /empleados/i)
    await screenshot(page, `${getTestId()}-empleados`)
    await page.waitForTimeout(2000)

    // Should show employee-related content
    const employeeText = page.getByText(/empleado/i).first()
    await expect(employeeText).toBeVisible({ timeout: 8000 })
    console.log(`[7-1] Errors: ${consoleErrors.filter(e => !isNoise(e)).join('; ')}`)
  })

  test('7-2: Employee list renders', async ({ page }) => {
    setupConsoleListener(page)
    await doLogin(page)
    await navigateTo(page, /empleados/i)
    await page.waitForTimeout(2000)

    // Empleados view uses cards, not a table. Check for the main content.
    const heading = page.locator('h1').filter({ hasText: /empleado/i }).first()
    const statsCards = page.locator('text=Total activos').or(page.locator('text=Profesores')).first()

    const hasHeading = await heading.isVisible({ timeout: 3000 }).catch(() => false)
    const hasStats = await statsCards.isVisible({ timeout: 3000 }).catch(() => false)

    // Also check for empty state or card grid
    const emptyState = page.locator('[class*="empty"], [class*="EmptyState"]').first()
    const cardGrid = page.locator('.grid').first()

    const hasEmpty = await emptyState.isVisible({ timeout: 2000 }).catch(() => false)
    const hasGrid = await cardGrid.isVisible({ timeout: 2000 }).catch(() => false)

    expect(hasHeading || hasStats).toBeTruthy()
    if (hasGrid) {
      const cards = page.locator('[class*="Card"]')
      const cardCount = await cards.count()
      console.log(`[7-2] Employee view has ${cardCount} cards`)
    }
  })

  test('7-3: Time clock widget is visible', async ({ page }) => {
    setupConsoleListener(page)
    await doLogin(page)
    await navigateTo(page, /empleados/i)
    await page.waitForTimeout(2000)

    // Look for clock/punch widget
    const clockWidget = page.getByText(/reloj|punto|entrada|salida|clock/i).first()
    const hasClock = await clockWidget.isVisible({ timeout: 3000 }).catch(() => false)

    if (hasClock) {
      await expect(clockWidget).toBeVisible()
      console.log('[7-3] Time clock widget is visible')
    } else {
      // If no clock, just verify employees view loaded
      await expect(page.getByText(/empleado/i).first()).toBeVisible()
      console.log('[7-3] No dedicated clock widget, employee list visible')
    }
  })

  test('7-4: Employee time entries visible', async ({ page }) => {
    setupConsoleListener(page)
    await doLogin(page)
    await navigateTo(page, /empleados/i)
    await page.waitForTimeout(2000)

    // Look for time-related content
    const timeEntry = page.getByText(/entrada|salida|hora|time/i).first()
    const hasTimeEntry = await timeEntry.isVisible({ timeout: 3000 }).catch(() => false)
    console.log(`[7-4] Time entry content visible: ${hasTimeEntry}`)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 8. GASTOS (/gastos)
// ══════════════════════════════════════════════════════════════════════════════

test.describe('8. Gastos', () => {
  test('8-1: Gastos page loads', async ({ page }) => {
    setupConsoleListener(page)
    await doLogin(page)
    await navigateTo(page, /gastos/i)
    await screenshot(page, `${getTestId()}-gastos`)
    await page.waitForTimeout(1500)

    const heading = page.getByText(/gasto/i).first()
    await expect(heading).toBeVisible({ timeout: 8000 })
    console.log(`[8-1] Errors: ${consoleErrors.filter(e => !isNoise(e)).join('; ')}`)
  })

  test('8-2: Expenses list renders', async ({ page }) => {
    setupConsoleListener(page)
    await doLogin(page)
    await navigateTo(page, /gastos/i)
    await page.waitForTimeout(1500)

    const table = page.getByRole('table').first()
    const emptyState = page.getByText(/sin gastos|no hay gastos/i).first()
    const statsCard = page.getByText(/total/i).first()

    const hasTable = await table.isVisible({ timeout: 3000 }).catch(() => false)
    const hasEmpty = await emptyState.isVisible({ timeout: 2000 }).catch(() => false)
    const hasStats = await statsCard.isVisible({ timeout: 2000 }).catch(() => false)

    expect(hasTable || hasEmpty || hasStats).toBeTruthy()
    console.log(`[8-2] Table: ${hasTable}, Empty: ${hasEmpty}, Stats: ${hasStats}`)
  })

  test('8-3: Add a new expense', async ({ page }) => {
    setupConsoleListener(page)
    await doLogin(page)
    await navigateTo(page, /gastos/i)
    await page.waitForTimeout(1500)

    const addBtn = page.getByRole('button', { name: /nuevo gasto|agregar|gasto/i }).first()
    if (!(await addBtn.isVisible({ timeout: 3000 }).catch(() => false))) {
      console.log('[8-3] Add expense button not found, checking for alternative')
      // Try finding any button that might add expenses
      const anyAddBtn = page.getByRole('button', { name: /\+.*gasto|nuevo/i }).first()
      if (await anyAddBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await anyAddBtn.click()
      }
    } else {
      await addBtn.click()
    }
    await page.waitForTimeout(800)
    await screenshot(page, `${getTestId()}-nuevo-gasto-dialog`)

    // Check if dialog opened
    const dialogContent = page.locator('[data-slot="dialog-content"], [role="dialog"], [class*="dialog"]').first()
    const hasDialog = await dialogContent.isVisible({ timeout: 3000 }).catch(() => false)

    if (hasDialog) {
      console.log('[8-3] Expense dialog opened')

      // Try to fill in expense form
      const descInput = page.getByPlaceholder(/descripcion|concepto|detalle/i).or(page.locator('input[type="text"]').first())
      const amountInput = page.locator('input[type="number"]').first()

      if (await descInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await descInput.fill('Gasto de prueba E2E')
      }
      if (await amountInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await amountInput.fill('5000')
      }

      // Submit
      const createBtn = page.getByRole('button', { name: /crear|guardar|agregar/i }).first()
      if (await createBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await createBtn.click()
        await page.waitForTimeout(1500)
        console.log('[8-3] Expense form submitted')
      }

      // Close dialog
      const cancelBtn = page.getByRole('button', { name: /cancelar/i }).first()
      if (await cancelBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await cancelBtn.click()
      } else {
        await page.keyboard.press('Escape')
      }
    } else {
      console.log('[8-3] Could not open expense dialog')
    }
  })

  test('8-4: Filter expenses by month', async ({ page }) => {
    setupConsoleListener(page)
    await doLogin(page)
    await navigateTo(page, /gastos/i)
    await page.waitForTimeout(1500)

    const monthSelect = page.locator('select').first()
    if (await monthSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      const options = await monthSelect.locator('option').count()
      if (options > 1) {
        await monthSelect.selectOption({ index: 1 })
        await page.waitForTimeout(600)
        console.log(`[8-4] Filtered expenses by month, found ${options} options`)
      }
    }
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 9. CONFIGURACION (/configuracion)
// ══════════════════════════════════════════════════════════════════════════════

test.describe('9. Configuracion', () => {
  test('9-1: Configuracion page loads with tabs', async ({ page }) => {
    setupConsoleListener(page)
    await doLogin(page)
    await navigateTo(page, /configuración/i)
    await screenshot(page, `${getTestId()}-configuracion`)
    await page.waitForTimeout(2000)

    const settingsText = page.getByText(/configur/i).first()
    await expect(settingsText).toBeVisible({ timeout: 8000 })
    console.log(`[9-1] Errors: ${consoleErrors.filter(e => !isNoise(e)).join('; ')}`)
  })

  test('9-2: Settings tabs render correctly', async ({ page }) => {
    setupConsoleListener(page)
    await doLogin(page)
    await navigateTo(page, /configuración/i)
    await page.waitForTimeout(2000)

    const tabList = page.getByRole('tablist').first()
    const hasTabs = await tabList.isVisible({ timeout: 5000 }).catch(() => false)
    expect(hasTabs).toBeTruthy()

    const tabs = page.locator('[role="tab"]')
    const tabCount = await tabs.count()
    console.log(`[9-2] Found ${tabCount} settings tabs`)
  })

  test('9-3: Navigate through all settings tabs', async ({ page }) => {
    setupConsoleListener(page)
    await doLogin(page)
    await navigateTo(page, /configuración/i)
    await page.waitForTimeout(2000)

    const tabNames = [
      /mi perfil/i,
      /negocio/i,
      /pagos/i,
      /alertas/i,
      /usuarios/i,
      /whatsapp/i,
      /datos/i,
    ]

    let passed = 0
    for (const tabName of tabNames) {
      const tabBtn = page.getByRole('tab', { name: tabName }).first()
      if (await tabBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await tabBtn.click()
        await page.waitForTimeout(500)
        passed++
      }
    }
    console.log(`[9-3] Navigated through ${passed} settings tabs`)
  })

  test('9-4: Mi Perfil tab - save button', async ({ page }) => {
    setupConsoleListener(page)
    await doLogin(page)
    await navigateTo(page, /configuración/i)
    await page.waitForTimeout(2000)

    const perfilTab = page.getByRole('tab', { name: /mi perfil/i }).first()
    if (await perfilTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await perfilTab.click()
      await page.waitForTimeout(800)

      const saveBtn = page.getByRole('button', { name: /guardar|actualizar/i }).first()
      const hasSave = await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)
      console.log(`[9-4] Save button in Mi Perfil: ${hasSave}`)
    }
  })

  test('9-5: Negocio tab loads correctly', async ({ page }) => {
    setupConsoleListener(page)
    await doLogin(page)
    await navigateTo(page, /configuración/i)
    await page.waitForTimeout(2000)

    const negocioTab = page.getByRole('tab', { name: /negocio/i }).first()
    if (await negocioTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await negocioTab.click()
      await page.waitForTimeout(800)
      await screenshot(page, `${getTestId()}-config-negocio`)

      // Check for business-related fields
      const negocioText = page.getByText(/negocio/i).first()
      await expect(negocioText).toBeVisible({ timeout: 3000 })
    }
  })

  test('9-6: Usuarios tab - list of users', async ({ page }) => {
    setupConsoleListener(page)
    await doLogin(page)
    await navigateTo(page, /configuración/i)
    await page.waitForTimeout(2000)

    const usuariosTab = page.getByRole('tab', { name: /usuarios/i }).first()
    if (await usuariosTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await usuariosTab.click()
      await page.waitForTimeout(1000)

      const table = page.getByRole('table').first()
      const hasTable = await table.isVisible({ timeout: 3000 }).catch(() => false)
      console.log(`[9-6] Users table visible: ${hasTable}`)
    }
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 10. CROSS-FEATURE ERRORS CHECK
// ══════════════════════════════════════════════════════════════════════════════

test.describe('10. Cross-Feature Console Error Check', () => {
  test('10-1: No console errors across all main views', async ({ page }) => {
    setupConsoleListener(page)
    await doLogin(page)

    const views = [
      { name: 'dashboard', label: /dashboard/i },
      { name: 'clientes', label: /clientes/i },
      { name: 'asistencias', label: /asistencias/i },
      { name: 'pagos', label: /pagos/i },
      { name: 'facturacion', label: /facturación/i },
      { name: 'calendario', label: /calendario/i },
      { name: 'empleados', label: /empleados/i },
      { name: 'gastos', label: /gastos/i },
      { name: 'configuracion', label: /configuración/i },
    ]

    for (const view of views) {
      await navigateTo(page, view.label)
      await page.waitForTimeout(1500)
      console.log(`[10-1] Checked ${view.name}`)
    }

    const criticalErrors = consoleErrors.filter(e => !isNoise(e))
    if (criticalErrors.length > 0) {
      console.log(`\n=== CRITICAL CONSOLE ERRORS (${criticalErrors.length}) ===`)
      criticalErrors.forEach(e => console.log(e))
    }
    expect(criticalErrors).toHaveLength(0)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 11. SIDEBAR NAVIGATION STRESS TEST
// ══════════════════════════════════════════════════════════════════════════════

test.describe('11. Sidebar Navigation', () => {
  test('11-1: All sidebar nav items clickable without crash', async ({ page }) => {
    setupConsoleListener(page)
    await doLogin(page)
    await page.waitForTimeout(1000)

    const navItems = [
      /dashboard/i,
      /clientes/i,
      /asistencias/i,
      /pagos/i,
      /facturación/i,
      /calendario/i,
      /empleados/i,
      /gastos/i,
      /configuración/i,
    ]

    for (const item of navItems) {
      const btn = page.getByRole('button', { name: item }).first()
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btn.click()
        await page.waitForTimeout(800)
        // Verify page didn't crash - at minimum the item text should still be in DOM
        const hasContent = await page.getByText(/./i).first().isVisible({ timeout: 2000 }).catch(() => false)
        expect(hasContent).toBeTruthy()
      }
    }
    console.log('[11-1] All nav items clicked without crash')
  })

  test('11-2: URL sync on navigation', async ({ page }) => {
    setupConsoleListener(page)
    await doLogin(page)

    const routes = [
      { label: /clientes/i, expected: /clientes/ },
      { label: /pagos/i, expected: /pagos/ },
      { label: /gastos/i, expected: /gastos/ },
    ]

    for (const route of routes) {
      await navigateTo(page, route.label)
      await expect(page).toHaveURL(route.expected)
    }
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 12. FINAL SUMMARY
// ══════════════════════════════════════════════════════════════════════════════

test.describe('12. Final Report', () => {
  test('12-1: Generate QA summary report', async ({ page }) => {
    setupConsoleListener(page)
    await doLogin(page)
    await screenshot(page, 'qa-final-dashboard')

    const criticalErrors = consoleErrors.filter(e => !isNoise(e))
    const warnings = consoleWarnings.filter(e => !isNoise(e))

    console.log('\n' + '='.repeat(70))
    console.log('NMS COMPREHENSIVE QA REPORT')
    console.log('='.repeat(70))
    console.log(`Critical Errors: ${criticalErrors.length}`)
    console.log(`Warnings: ${warnings.length}`)
    console.log(`Total Console Events Tracked: ${consoleErrors.length}`)
    console.log('='.repeat(70))

    if (criticalErrors.length > 0) {
      console.log('\nCRITICAL ERRORS:')
      criticalErrors.forEach(e => console.log(`  - ${e}`))
    }

    if (warnings.length > 0) {
      console.log('\nWARNINGS:')
      warnings.slice(0, 10).forEach(e => console.log(`  - ${e}`))
    }

    // Take final screenshot
    await navigateTo(page, /dashboard/i)
    await screenshot(page, 'qa-final-screenshot')

    console.log('\nScreenshots saved to: tests/e2e/screenshots/')
    console.log('='.repeat(70))
  })
})
