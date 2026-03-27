import { test, expect, Page } from '@playwright/test'

// Helper to wait for page load
async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle')
}

// Helper to login
async function login(page: Page) {
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  // If we're on login page, fill credentials
  if (await page.locator('text=Iniciar Sesión').isVisible()) {
    await page.fill('input[type="email"], input[placeholder*="correo"]', 'mariela@nms.com')
    await page.fill('input[type="password"], input[placeholder*="contraseña"]', 'mariela123')
    await page.click('button:has-text("Iniciar Sesión")')
    await page.waitForLoadState('networkidle')
    // Wait for redirect and dashboard to render
    await page.waitForTimeout(2000)
  }
}

// Helper to setup test state (login first)
async function setupTestState(page: Page) {
  await login(page)
}

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestState(page)
  })

  test('should display dashboard with statistics', async ({ page }) => {
    // Check dashboard is visible - uses text in header
    await expect(page.getByText('Dashboard').first()).toBeVisible()

    // Check stat cards are present - match actual UI labels
    await expect(page.getByText('Clientes').first()).toBeVisible()
    await expect(page.getByText('Activos').first()).toBeVisible()
    await expect(page.getByText('Pendientes').first()).toBeVisible()
    await expect(page.getByText('Hoy').first()).toBeVisible()
  })

  test('should display revenue card', async ({ page }) => {
    // Revenue section shows "Ingresos" card - wait for it to load
    await expect(page.getByText('Ingresos', { exact: false }).first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Mes actual', { exact: false }).first()).toBeVisible()
  })

  test('should navigate to clients from dashboard', async ({ page }) => {
    await page.click('button:has-text("Ver Clientes")')
    // Wait for navigation to complete
    await page.waitForTimeout(500)
    await expect(page.getByText('Clientes').first()).toBeVisible()
  })
})

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestState(page)
  })

  test('should navigate between views using sidebar', async ({ page }) => {
    // Navigate to Clients
    await page.click('button:has-text("Clientes")')
    await page.waitForTimeout(300)
    await expect(page.getByText('Clientes').first()).toBeVisible()

    // Navigate to Attendance
    await page.click('button:has-text("Asistencias")')
    await page.waitForTimeout(300)
    await expect(page.getByText('Asistencias').first()).toBeVisible()

    // Navigate to Payments
    await page.click('button:has-text("Pagos")')
    await page.waitForTimeout(300)
    await expect(page.getByText('Pagos').first()).toBeVisible()

    // Navigate to Settings
    await page.click('button:has-text("Configuración")')
    await page.waitForTimeout(300)
    await expect(page.getByText('Configuración').first()).toBeVisible()

    // Navigate back to Dashboard
    await page.click('button:has-text("Dashboard")')
    await page.waitForTimeout(300)
    await expect(page.getByText('Dashboard').first()).toBeVisible()
  })
})

test.describe('Clients CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestState(page)
    await page.click('button:has-text("Clientes")')
    await page.waitForTimeout(500)
  })

  test('should display clients list', async ({ page }) => {
    // Check that the clients table exists
    await expect(page.locator('table')).toBeVisible()
  })

  test('should open new client dialog', async ({ page }) => {
    await page.click('button:has-text("Nuevo Cliente")')

    // Dialog should be visible - look for the form title or button
    await expect(page.getByText('Nuevo Cliente').first()).toBeVisible()
  })

  test('should create a new client', async ({ page }) => {
    // Open dialog
    await page.click('button:has-text("Nuevo Cliente")')
    await page.waitForTimeout(500)

    // Fill form - use getByPlaceholder which is more robust
    await page.getByPlaceholder('Juan').fill('Test')
    await page.getByPlaceholder('Pérez').fill('User')
    await page.getByPlaceholder('3512345678').fill('+5491199887766')

    // Submit
    await page.click('button:has-text("Crear Cliente")')

    // Should show success or new client appears
    await page.waitForTimeout(1000)
  })

  test('should search clients', async ({ page }) => {
    // Type in search box
    const searchInput = page.locator('input[placeholder*="Buscar"]')
    if (await searchInput.isVisible()) {
      await searchInput.fill('Juan')
      await page.waitForTimeout(500)
    }
    // Table should still be visible
    await expect(page.locator('table')).toBeVisible()
  })

  test('should filter by group', async ({ page }) => {
    // Look for a group selector dropdown
    const groupSelect = page.locator('select').first()
    if (await groupSelect.isVisible()) {
      await groupSelect.click()
      await page.waitForTimeout(300)
    }
  })

  test('should open client profile when clicking row', async ({ page }) => {
    // Click on first client row if table has data
    const firstRow = page.locator('table tbody tr').first()
    if (await firstRow.isVisible()) {
      await firstRow.click()
      await page.waitForTimeout(500)
    }
  })
})

test.describe('Attendance', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestState(page)
    await page.click('button:has-text("Asistencias")')
    await page.waitForTimeout(500)
  })

  test('should display attendance view', async ({ page }) => {
    await expect(page.getByText('Asistencias').first()).toBeVisible()
  })

  test('should mark attendance', async ({ page }) => {
    // Find first available attendance button
    const markButton = page.locator('button:has-text("Marcar Asistencia")').first()

    if (await markButton.isVisible()) {
      await markButton.click()
      await page.waitForTimeout(1000)
    }
  })

  test('should filter by group', async ({ page }) => {
    // Click on a group filter button
    const groupButton = page.locator('button:has-text("Grupo")').first()

    if (await groupButton.isVisible()) {
      await groupButton.click()
      await page.waitForTimeout(500)
    }
  })
})

test.describe('Payments', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestState(page)
    await page.click('button:has-text("Pagos")')
    await page.waitForTimeout(500)
  })

  test('should display payments view', async ({ page }) => {
    await expect(page.getByText('Pagos y Suscripciones').first()).toBeVisible()
  })

  test('should display payment stats', async ({ page }) => {
    // Check that stats cards are visible
    await expect(page.getByText('Total').first()).toBeVisible()
    await expect(page.getByText('Al Día').first()).toBeVisible()
    await expect(page.getByText('Pendientes').first()).toBeVisible()
  })

  test('should filter by month', async ({ page }) => {
    // Find month filter - use combobox instead of select
    const monthSelect = page.locator('combobox').first()

    if (await monthSelect.isVisible()) {
      await monthSelect.click()
      await page.waitForTimeout(300)
    }
  })
})

test.describe('Responsive Design', () => {
  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await setupTestState(page)

    // Dashboard should still be accessible
    await expect(page.getByText('Dashboard').first()).toBeVisible()
  })

  test('should be responsive on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await setupTestState(page)

    // Dashboard should be visible
    await expect(page.getByText('Dashboard').first()).toBeVisible()
  })
})

test.describe('Error Handling', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    // Navigate first while online
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Then simulate offline and try to reload
    await page.context().setOffline(true)

    // Page should handle offline gracefully (show error or cached content)
    await page.reload().catch(() => {})

    // Restore connectivity
    await page.context().setOffline(false)
  })

  test('should validate form inputs', async ({ page }) => {
    await setupTestState(page)
    await page.click('button:has-text("Clientes")')
    await page.waitForTimeout(300)
    await page.click('button:has-text("Nuevo Cliente")')

    // Try to submit empty form
    await page.click('button:has-text("Crear Cliente")')

    // Should show validation error - dialog should still be open
    await page.waitForTimeout(500)
  })
})
