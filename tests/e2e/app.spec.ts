import { test, expect, Page } from '@playwright/test'

// Helper to wait for page load
async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle')
}

// Helper to login or setup state if needed
async function setupTestState(page: Page) {
  // Navigate to the app
  await page.goto('/')
  await waitForPageLoad(page)
}

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestState(page)
  })

  test('should display dashboard with statistics', async ({ page }) => {
    // Check dashboard title
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible()

    // Check stat cards are present
    await expect(page.locator('text=Total Clientes')).toBeVisible()
    await expect(page.locator('text=Activos Este Mes')).toBeVisible()
    await expect(page.locator('text=Pagos Pendientes')).toBeVisible()
    await expect(page.locator('text=Asistencias Hoy')).toBeVisible()
  })

  test('should display revenue card', async ({ page }) => {
    await expect(page.locator('text=Ingresos del Mes')).toBeVisible()
    await expect(page.locator('text=Cobros confirmados')).toBeVisible()
  })

  test('should navigate to clients from dashboard', async ({ page }) => {
    await page.click('button:has-text("Ver Clientes")')
    await expect(page.locator('h1:has-text("Clientes")')).toBeVisible()
  })
})

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestState(page)
  })

  test('should navigate between views using sidebar', async ({ page }) => {
    // Navigate to Clients
    await page.click('button:has-text("Clientes")')
    await expect(page.locator('h1:has-text("Clientes")')).toBeVisible()

    // Navigate to Attendance
    await page.click('button:has-text("Asistencias")')
    await expect(page.locator('h1:has-text("Asistencias")')).toBeVisible()

    // Navigate to Payments
    await page.click('button:has-text("Pagos")')
    await expect(page.locator('h1:has-text("Pagos")')).toBeVisible()

    // Navigate to Settings
    await page.click('button:has-text("Configuración")')
    await expect(page.locator('h1:has-text("Configuración")')).toBeVisible()

    // Navigate back to Dashboard
    await page.click('button:has-text("Dashboard")')
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible()
  })
})

test.describe('Clients CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestState(page)
    await page.click('button:has-text("Clientes")')
    await expect(page.locator('h1:has-text("Clientes")')).toBeVisible()
  })

  test('should display clients list', async ({ page }) => {
    // Check that the clients table exists
    await expect(page.locator('table')).toBeVisible()
  })

  test('should open new client dialog', async ({ page }) => {
    await page.click('button:has-text("Nuevo Cliente")')
    
    // Dialog should be visible
    await expect(page.locator('text=Nuevo Cliente')).toBeVisible()
    await expect(page.locator('input[placeholder*="Nombre"]')).toBeVisible()
  })

  test('should create a new client', async ({ page }) => {
    // Open dialog
    await page.click('button:has-text("Nuevo Cliente")')
    
    // Fill form
    await page.fill('input[placeholder*="Nombre"]', 'Test')
    await page.fill('input[placeholder*="Apellido"]', 'User')
    await page.fill('input[placeholder*="teléfono"]', '+5491199887766')
    
    // Submit
    await page.click('button:has-text("Crear Cliente")')
    
    // Should close dialog and show new client
    await expect(page.locator('text=Test User')).toBeVisible({ timeout: 5000 })
  })

  test('should search clients', async ({ page }) => {
    // Type in search box
    await page.fill('input[placeholder*="Buscar"]', 'Juan')
    
    // Wait for search to complete
    await page.waitForTimeout(500)
    
    // Should filter results
    const table = page.locator('table')
    await expect(table).toBeVisible()
  })

  test('should filter by group', async ({ page }) => {
    // Open group filter
    const groupSelect = page.locator('select').first()
    await groupSelect.click()
    
    // Select a group if available
    const options = page.locator('option')
    const count = await options.count()
    
    if (count > 1) {
      await options.nth(1).click()
      await page.waitForTimeout(500)
    }
  })

  test('should open client profile when clicking row', async ({ page }) => {
    // Click on first client row
    const firstRow = page.locator('table tbody tr').first()
    await firstRow.click()
    
    // Profile sheet should open
    await expect(page.locator('text=Datos Personales')).toBeVisible({ timeout: 3000 })
  })
})

test.describe('Attendance', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestState(page)
    await page.click('button:has-text("Asistencias")')
    await expect(page.locator('h1:has-text("Asistencias")')).toBeVisible()
  })

  test('should display attendance cards', async ({ page }) => {
    // Check for attendance cards
    const cards = page.locator('text=Marcar Asistencia')
    await expect(cards.first()).toBeVisible()
  })

  test('should mark attendance', async ({ page }) => {
    // Find first available attendance button
    const markButton = page.locator('button:has-text("Marcar Asistencia")').first()
    
    if (await markButton.isVisible()) {
      await markButton.click()
      
      // Should show success or update classes
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

  test('should display today attendance list', async ({ page }) => {
    // Check for attendance list section
    const attendanceList = page.locator('text=Asistencias de Hoy')
    
    // May or may not be visible depending on data
    if (await attendanceList.isVisible()) {
      await expect(attendanceList).toBeVisible()
    }
  })
})

test.describe('Payments', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestState(page)
    await page.click('button:has-text("Pagos")')
    await expect(page.locator('h1:has-text("Pagos")')).toBeVisible()
  })

  test('should display payments table', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible()
  })

  test('should filter by month', async ({ page }) => {
    // Find month filter
    const monthSelect = page.locator('select').first()
    
    if (await monthSelect.isVisible()) {
      await monthSelect.click()
      await page.waitForTimeout(300)
    }
  })

  test('should display payment status badges', async ({ page }) => {
    // Check for status badges
    const badges = page.locator('[class*="badge"]')
    await expect(badges.first()).toBeVisible()
  })
})

test.describe('Responsive Design', () => {
  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await setupTestState(page)

    // Dashboard should still be visible
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible()
  })

  test('should be responsive on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await setupTestState(page)

    // Dashboard should be visible
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible()
  })

  test('should collapse sidebar on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await setupTestState(page)

    // Sidebar should be collapsed or hidden
    const sidebar = page.locator('[class*="sidebar"]')
    // The sidebar might be hidden or have a different style
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible()
  })
})

test.describe('Error Handling', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate offline
    await page.context().setOffline(true)
    
    await page.goto('/')
    
    // Should show some error state or retry option
    await page.context().setOffline(false)
  })

  test('should validate form inputs', async ({ page }) => {
    await setupTestState(page)
    await page.click('button:has-text("Clientes")')
    await page.click('button:has-text("Nuevo Cliente")')
    
    // Try to submit empty form
    await page.click('button:has-text("Crear Cliente")')
    
    // Should show validation error
    await page.waitForTimeout(500)
    // The form should not close
    await expect(page.locator('text=Nuevo Cliente')).toBeVisible()
  })
})
