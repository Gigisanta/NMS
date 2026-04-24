import { test, expect, Page, Dialog } from '@playwright/test'

const BASE = 'http://localhost:3000'
const EMAIL = 'mariela@nms.com'
const PASSWORD = 'mariela123'

// ─── Login helper ────────────────────────────────────────────────────────────

async function doLogin(page: Page) {
  await page.context().clearCookies()
  const csrfRes = await page.request.get(`${BASE}/api/auth/csrf`)
  const { csrfToken } = await csrfRes.json()

  await page.request.post(`${BASE}/api/auth/callback/credentials`, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    form: { csrfToken, email: EMAIL, password: PASSWORD, json: true },
  })

  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(
    () =>
      document.body.innerText.includes('Dashboard') ||
      document.body.innerText.includes('Ver Clientes') ||
      document.body.innerText.includes('Clientes'),
    { timeout: 20000 }
  )
}

// ─── QA Checks ───────────────────────────────────────────────────────────────

test('QA-1: Login page loads and is visually correct', async ({ page }) => {
  const errors: string[] = []
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
  page.on('pageerror', err => errors.push(err.message))

  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.screenshot({ path: 'tests/e2e/screenshots/qa-1-login.png' })

  // Check login form elements
  await expect(page.getByRole('heading', { name: /iniciar/i }).or(page.getByText(/iniciar/i).first())).toBeVisible()
  await expect(page.getByRole('button', { name: /iniciar sesión/i }).or(page.getByText(/iniciar sesión/i).first())).toBeVisible()
  await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible()
  await expect(page.locator('input[type="password"]').first()).toBeVisible()

  // Report errors
  if (errors.length > 0) {
    console.log('[QA-1 console errors]', errors)
  }
  expect(errors.filter(e => !e.includes('favicon'))).toHaveLength(0)
})

test('QA-2: Login with valid credentials succeeds', async ({ page }) => {
  const errors: string[] = []
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
  page.on('pageerror', err => errors.push(err.message))

  await doLogin(page)
  await page.screenshot({ path: 'tests/e2e/screenshots/qa-2-after-login.png' })

  // Should be on dashboard
  const bodyText = await page.evaluate(() => document.body.innerText)
  const onDashboard = bodyText.includes('Dashboard') || bodyText.includes('Ver Clientes') || bodyText.includes('Clientes')
  expect(onDashboard).toBeTruthy()

  if (errors.length > 0) console.log('[QA-2 console errors]', errors)
  expect(errors.filter(e => !e.includes('favicon'))).toHaveLength(0)
})

test('QA-3: Dashboard loads correctly', async ({ page }) => {
  const errors: string[] = []
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
  page.on('pageerror', err => errors.push(err.message))

  await doLogin(page)
  await page.screenshot({ path: 'tests/e2e/screenshots/qa-3-dashboard.png' })

  // Check key dashboard elements
  await expect(page.getByText(/dashboard/i).first()).toBeVisible()
  await expect(page.getByText(/cliente/i).first()).toBeVisible()
  await expect(page.getByText(/ingreso/i).first()).toBeVisible()

  // Sidebar navigation
  await expect(page.getByText(/clientes/i).first()).toBeVisible()

  if (errors.length > 0) console.log('[QA-3 console errors]', errors)
  expect(errors.filter(e => !e.includes('favicon'))).toHaveLength(0)
})

test('QA-4: /clientes view works', async ({ page }) => {
  const errors: string[] = []
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
  page.on('pageerror', err => errors.push(err.message))

  await doLogin(page)

  // Navigate to clientes via sidebar
  const navBtn = page.getByRole('button', { name: /clientes/i }).first()
  await navBtn.click()
  await page.waitForTimeout(1000)
  await page.screenshot({ path: 'tests/e2e/screenshots/qa-4-clientes.png' })

  // Verify view loaded
  await expect(page).toHaveURL(/clientes/)
  await expect(page.getByRole('table')).toBeVisible()

  if (errors.length > 0) console.log('[QA-4 console errors]', errors)
  expect(errors.filter(e => !e.includes('favicon'))).toHaveLength(0)
})

test('QA-5: /gastos view works', async ({ page }) => {
  const errors: string[] = []
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
  page.on('pageerror', err => errors.push(err.message))

  await doLogin(page)

  // Navigate to gastos via sidebar
  const navBtn = page.getByRole('button', { name: /gastos/i }).first()
  await navBtn.click()
  await page.waitForTimeout(1000)
  await page.screenshot({ path: 'tests/e2e/screenshots/qa-5-gastos.png' })

  // Verify view loaded
  await expect(page).toHaveURL(/gastos/)
  await expect(page.getByText(/gasto/i).first()).toBeVisible()

  if (errors.length > 0) console.log('[QA-5 console errors]', errors)
  expect(errors.filter(e => !e.includes('favicon'))).toHaveLength(0)
})

test('QA-6: No console errors across main routes', async ({ page }) => {
  const allErrors: string[] = []
  page.on('console', msg => { if (msg.type() === 'error') allErrors.push(msg.text()) })
  page.on('pageerror', err => allErrors.push(err.message))

  await doLogin(page)

  const routes = [
    { name: 'dashboard', path: '/' },
    { name: 'clientes', path: '/clientes' },
    { name: 'gastos', path: '/gastos' },
  ]

  for (const route of routes) {
    await page.goto(`${BASE}${route.path}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(500)
  }

  await page.screenshot({ path: 'tests/e2e/screenshots/qa-6-final.png' })

  const criticalErrors = allErrors.filter(e =>
    !e.includes('favicon') &&
    !e.includes('net::ERR_') &&
    !e.includes('Failed to load resource')
  )

  if (criticalErrors.length > 0) {
    console.log('[QA-6 critical errors]', criticalErrors)
  }
  expect(criticalErrors).toHaveLength(0)
})
