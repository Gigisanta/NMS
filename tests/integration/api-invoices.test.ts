import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/db', () => ({
  db: {
    invoice: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
    client: { findUnique: vi.fn() },
    user: { findUnique: vi.fn() },
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

vi.mock('@/auth', () => ({ auth: vi.fn().mockResolvedValue({ user: { id: 'user-1', name: 'Admin', email: 'admin@test.com', role: 'EMPLEADORA' } }) }))
vi.mock('@/lib/rate-limit', () => ({ ratelimit: { limit: vi.fn().mockResolvedValue({ success: true }) } }))

import { db } from '@/lib/db'
import { GET as getInvoices, POST as createInvoice } from '@/app/api/invoices/route'
import { GET as getInvoiceById, PUT as updateInvoice, DELETE as deleteInvoice } from '@/app/api/invoices/[id]/route'

function createRequest(url: string, options: RequestInit = {}): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), options as any)
}
function makeCtx(id: string) { return { params: Promise.resolve({ id }) } }

describe('API /invoices', () => {
  beforeEach(() => { vi.clearAllMocks() })

  describe('GET /api/invoices', () => {
    it('should return paginated invoices', async () => {
      vi.mocked(db.invoice.findMany).mockResolvedValue([{ id: 'inv-1', clientId: 'c1', fileName: 'f1.pdf', amount: 5000, status: 'PENDIENTE', client: { id: 'c1', nombre: 'Juan', apellido: 'Pérez', telefono: '123' } }] as any)
      vi.mocked(db.invoice.count).mockResolvedValue(1)
      const response = await getInvoices(createRequest('/api/invoices?limit=50&offset=0'))
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.pagination.total).toBe(1)
    })

    it('should filter invoices by clientId', async () => {
      vi.mocked(db.invoice.findMany).mockResolvedValue([] as any)
      vi.mocked(db.invoice.count).mockResolvedValue(0)
      const response = await getInvoices(createRequest('/api/invoices?clientId=client-1'))
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(db.invoice.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { clientId: 'client-1' } }))
    })

    it('should filter invoices by status', async () => {
      vi.mocked(db.invoice.findMany).mockResolvedValue([] as any)
      vi.mocked(db.invoice.count).mockResolvedValue(0)
      const response = await getInvoices(createRequest('/api/invoices?status=PAGADO'))
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(db.invoice.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { status: 'PAGADO' } }))
    })

    it('should return empty array when no invoices', async () => {
      vi.mocked(db.invoice.findMany).mockResolvedValue([] as any)
      vi.mocked(db.invoice.count).mockResolvedValue(0)
      const response = await getInvoices(createRequest('/api/invoices'))
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual([])
    })
  })
})

describe('API /invoices/[id]', () => {
  beforeEach(() => { vi.clearAllMocks() })

  describe('GET /api/invoices/[id]', () => {
    it('should return a single invoice by id', async () => {
      vi.mocked(db.invoice.findUnique).mockResolvedValue({ id: 'inv-1', clientId: 'c1', fileName: 'f1.pdf', filePath: '/uploads/f1.pdf', amount: 5000, status: 'PENDIENTE', type: 'PAYMENT', client: { id: 'c1', nombre: 'Juan', apellido: 'Pérez', telefono: '123', grupo: null } } as any)
      const response = await getInvoiceById(createRequest('/api/invoices/inv-1'), makeCtx('inv-1'))
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.fileName).toBe('f1.pdf')
      expect(data.data.amount).toBe(5000)
    })

    it('should return 404 when invoice not found', async () => {
      vi.mocked(db.invoice.findUnique).mockResolvedValue(null)
      const response = await getInvoiceById(createRequest('/api/invoices/non-existent'), makeCtx('non-existent'))
      const data = await response.json()
      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toContain('no encontrada')
    })
  })

  describe('PUT /api/invoices/[id]', () => {
    it('should update invoice status to PAGADO', async () => {
      vi.mocked(db.invoice.findUnique).mockResolvedValue({ id: 'inv-1', clientId: 'c1', status: 'PAGADO', amount: 5000 } as any)
      vi.mocked(db.invoice.update).mockResolvedValue({ id: 'inv-1', clientId: 'c1', status: 'PAGADO', amount: 5000 } as any)
      const response = await updateInvoice(createRequest('/api/invoices/inv-1', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'PAGADO' }) }), makeCtx('inv-1'))
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.status).toBe('PAGADO')
    })

    it('should update invoice amount', async () => {
      vi.mocked(db.invoice.findUnique).mockResolvedValue({ id: 'inv-1', clientId: 'c1', status: 'PENDIENTE', amount: 5000 } as any)
      vi.mocked(db.invoice.update).mockResolvedValue({ id: 'inv-1', clientId: 'c1', status: 'PENDIENTE', amount: 7500 } as any)
      const response = await updateInvoice(createRequest('/api/invoices/inv-1', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: '7500' }) }), makeCtx('inv-1'))
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.amount).toBe(7500)
    })

    it('should mark invoice as verified', async () => {
      vi.mocked(db.invoice.findUnique).mockResolvedValue({ id: 'inv-1', clientId: 'c1', status: 'PENDIENTE', verified: false } as any)
      vi.mocked(db.invoice.update).mockResolvedValue({ id: 'inv-1', clientId: 'c1', status: 'PENDIENTE', verified: true } as any)
      const response = await updateInvoice(createRequest('/api/invoices/inv-1', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ verified: true }) }), makeCtx('inv-1'))
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.verified).toBe(true)
    })

    it('should return 404 when invoice not found', async () => {
      vi.mocked(db.invoice.findUnique).mockResolvedValue(null)
      const response = await updateInvoice(createRequest('/api/invoices/non-existent', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'PAGADO' }) }), makeCtx('non-existent'))
      const data = await response.json()
      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
    })
  })

  describe('DELETE /api/invoices/[id]', () => {
    it('should delete an invoice', async () => {
      vi.mocked(db.invoice.findUnique).mockResolvedValue({ id: 'inv-1', clientId: 'c1', filePath: '/uploads/placeholder', fileName: 'f1.pdf' } as any)
      vi.mocked(db.invoice.delete).mockResolvedValue({ id: 'inv-1' } as any)
      const response = await deleteInvoice(createRequest('/api/invoices/inv-1', { method: 'DELETE' }), makeCtx('inv-1'))
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(db.invoice.delete).toHaveBeenCalledWith({ where: { id: 'inv-1' } })
    })

    it('should return 404 when invoice not found', async () => {
      vi.mocked(db.invoice.findUnique).mockResolvedValue(null)
      const response = await deleteInvoice(createRequest('/api/invoices/non-existent', { method: 'DELETE' }), makeCtx('non-existent'))
      const data = await response.json()
      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
    })
  })
})
