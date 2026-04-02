import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/db', () => ({
  db: {
    expense: { findMany: vi.fn(), create: vi.fn(), delete: vi.fn() },
    $executeRawUnsafe: vi.fn(),
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/api-utils', () => ({
  cachedFetch: vi.fn((_k, fetcher) => fetcher()),
  CacheKeys: { dashboard: () => 'dashboard:stats' },
  invalidateCache: vi.fn(),
  invalidateCachePattern: vi.fn(),
  invalidateClientCache: vi.fn(),
}))

vi.mock('@/auth', () => ({ auth: vi.fn().mockResolvedValue({ user: { id: 'admin-1', name: 'Admin User', email: 'admin@test.com', role: 'EMPLEADORA' } }) }))

import { db } from '@/lib/db'
import { GET as getExpenses, POST as createExpense } from '@/app/api/expenses/route'
import { PUT as updateExpense, DELETE as deleteExpense } from '@/app/api/expenses/[id]/route'

function createRequest(url: string, options: RequestInit = {}): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), options as any)
}
function makeCtx(id: string) { return { params: Promise.resolve({ id }) } }

describe('API /expenses', () => {
  beforeEach(() => { vi.clearAllMocks() })

  describe('GET /api/expenses', () => {
    it('should return all expenses for EMPLEADORA', async () => {
      vi.mocked(db.expense.findMany).mockResolvedValue([{ id: 'exp-1', description: 'Cloro', amount: 5000, category: 'FIJO', date: new Date(), month: 4, year: 2026, supplier: 'Quimicos SA', notes: null, user: { name: 'Admin' } }] as any)
      const response = await getExpenses(createRequest('/api/expenses'))
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
    })

    it('should filter expenses by category', async () => {
      vi.mocked(db.expense.findMany).mockResolvedValue([] as any)
      const response = await getExpenses(createRequest('/api/expenses?category=FIJO'))
      expect(response.status).toBe(200)
      expect(db.expense.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ category: 'FIJO' }) }))
    })

    it('should filter expenses by month/year', async () => {
      vi.mocked(db.expense.findMany).mockResolvedValue([] as any)
      const response = await getExpenses(createRequest('/api/expenses?month=4&year=2026'))
      expect(response.status).toBe(200)
      expect(db.expense.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ month: 4, year: 2026 }) }))
    })

    it('should filter expenses by supplier', async () => {
      vi.mocked(db.expense.findMany).mockResolvedValue([] as any)
      const response = await getExpenses(createRequest('/api/expenses?supplier=Quimicos'))
      expect(response.status).toBe(200)
      expect(db.expense.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ supplier: { contains: 'Quimicos', mode: 'insensitive' } }) }))
    })

    it('should return empty array when no expenses', async () => {
      vi.mocked(db.expense.findMany).mockResolvedValue([] as any)
      const response = await getExpenses(createRequest('/api/expenses'))
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual([])
    })

    it('should return 401 when not authenticated', async () => {
      vi.resetModules()
      vi.doMock('@/auth', () => ({ auth: vi.fn().mockResolvedValue(null) }))
      const { GET } = await import('@/app/api/expenses/route')
      const response = await GET(createRequest('/api/expenses'))
      const data = await response.json()
      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
    })

    it('should return 403 when not EMPLEADORA', async () => {
      vi.resetModules()
      vi.doMock('@/auth', () => ({ auth: vi.fn().mockResolvedValue({ user: { id: 'emp-1', name: 'Employee', email: 'emp@test.com', role: 'EMPLEADO' } }) }))
      const { GET } = await import('@/app/api/expenses/route')
      const response = await GET(createRequest('/api/expenses'))
      const data = await response.json()
      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Sin permisos')
    })
  })

  describe('POST /api/expenses', () => {
    it('should create a new expense with valid data', async () => {
      vi.mocked(db.expense.create).mockResolvedValue({ id: 'exp-new', description: 'Material de limpieza', amount: 3500, category: 'VARIABLE', date: new Date(), month: 4, year: 2026, supplier: 'Limpieza SA', notes: null } as any)
      const response = await createExpense(createRequest('/api/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description: 'Material de limpieza', amount: 3500, category: 'VARIABLE', supplier: 'Limpieza SA' }) }))
      const data = await response.json()
      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.description).toBe('Material de limpieza')
      expect(data.data.amount).toBe(3500)
    })

    it('should fail with missing required fields', async () => {
      const response = await createExpense(createRequest('/api/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description: 'Only description' }) }))
      const data = await response.json()
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('requeridos')
    })

    it('should normalize invalid category to OTROS', async () => {
      vi.mocked(db.expense.create).mockResolvedValue({ id: 'exp-new', description: 'Test', amount: 1000, category: 'OTROS', date: new Date(), month: 4, year: 2026 } as any)
      const response = await createExpense(createRequest('/api/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description: 'Test', amount: 1000, category: 'INVALID_CATEGORY' }) }))
      const data = await response.json()
      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
    })
  })
})

describe('API /expenses/[id]', () => {
  beforeEach(() => { vi.clearAllMocks() })

  describe('PUT /api/expenses/[id]', () => {
    it('should update an expense using raw SQL', async () => {
      vi.mocked(db.$executeRawUnsafe).mockResolvedValue(1 as any)
      const response = await updateExpense(createRequest('/api/expenses/exp-1', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description: 'Updated description', amount: 6000, category: 'FIJO' }) }), makeCtx('exp-1'))
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(db.$executeRawUnsafe).toHaveBeenCalled()
    })

    it('should update expense with date', async () => {
      vi.mocked(db.$executeRawUnsafe).mockResolvedValue(1 as any)
      const response = await updateExpense(createRequest('/api/expenses/exp-1', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description: 'Updated', amount: 6000, category: 'FIJO', date: '2026-04-15', month: 4, year: 2026 }) }), makeCtx('exp-1'))
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('DELETE /api/expenses/[id]', () => {
    it('should delete an expense using raw SQL', async () => {
      vi.mocked(db.$executeRawUnsafe).mockResolvedValue(1 as any)
      const response = await deleteExpense(createRequest('/api/expenses/exp-1', { method: 'DELETE' }), makeCtx('exp-1'))
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(db.$executeRawUnsafe).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM "expenses"'), 'exp-1')
    })

    it('should return 401 when not authenticated', async () => {
      vi.resetModules()
      vi.doMock('@/auth', () => ({ auth: vi.fn().mockResolvedValue(null) }))
      const { DELETE } = await import('@/app/api/expenses/[id]/route')
      const response = await DELETE(createRequest('/api/expenses/exp-1', { method: 'DELETE' }), makeCtx('exp-1'))
      const data = await response.json()
      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
    })

    it('should return 403 when not EMPLEADORA', async () => {
      vi.resetModules()
      vi.doMock('@/auth', () => ({ auth: vi.fn().mockResolvedValue({ user: { id: 'emp-1', name: 'Employee', email: 'emp@test.com', role: 'EMPLEADO' } }) }))
      const { DELETE } = await import('@/app/api/expenses/[id]/route')
      const response = await DELETE(createRequest('/api/expenses/exp-1', { method: 'DELETE' }), makeCtx('exp-1'))
      const data = await response.json()
      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
    })
  })
})
