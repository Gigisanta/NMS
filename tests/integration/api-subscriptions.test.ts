import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/db', () => ({
  db: {
    subscription: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
    },
    client: { findMany: vi.fn(), findUnique: vi.fn() },
    settings: { findUnique: vi.fn() },
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

vi.mock('@/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: 'user-1', role: 'EMPLEADORA' } }),
}))

import { db } from '@/lib/db'
import { GET as getSubscriptions } from '@/app/api/subscriptions/route'
import { PUT as updateSubscription } from '@/app/api/subscriptions/[id]/route'

function createRequest(url: string, options: RequestInit = {}): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), options as any)
}
function makeCtx(id: string) { return { params: Promise.resolve({ id }) } }

describe('API /subscriptions', () => {
  beforeEach(() => { vi.clearAllMocks() })

  describe('GET /api/subscriptions', () => {
    it('should return subscriptions for a client', async () => {
      vi.mocked(db.client.findMany).mockResolvedValue([])
      vi.mocked(db.subscription.findMany).mockResolvedValue([{ id: 'sub-1', clientId: 'client-1', month: 4, year: 2026, status: 'AL_DIA', classesTotal: 4, classesUsed: 2, amount: 5000, client: { id: 'client-1', nombre: 'Juan', apellido: 'Pérez', telefono: '12345678', grupo: { id: 'group-1', name: 'Grupo A', color: '#06b6d4' } } }] as any)
      vi.mocked(db.settings.findUnique).mockResolvedValue(null)
      const response = await getSubscriptions(createRequest('/api/subscriptions?clientId=client-1&month=4&year=2026'))
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return empty when no subscriptions', async () => {
      vi.mocked(db.client.findMany).mockResolvedValue([])
      vi.mocked(db.subscription.findMany).mockResolvedValue([])
      vi.mocked(db.settings.findUnique).mockResolvedValue(null)
      const response = await getSubscriptions(createRequest('/api/subscriptions?month=4&year=2026'))
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual([])
    })

    it('should create missing subscriptions when ensureSubsExist is called', async () => {
      vi.mocked(db.client.findMany).mockResolvedValue([{ id: 'client-1' }])
      vi.mocked(db.subscription.findMany).mockResolvedValue([])
      vi.mocked(db.settings.findUnique).mockResolvedValue(null)
      vi.mocked(db.subscription.createMany).mockResolvedValue({ count: 1 })

      // Use current month/year to trigger ensureSubscriptionsExist
      const now = new Date()
      const m = now.getMonth() + 1
      const y = now.getFullYear()

      const response = await getSubscriptions(createRequest(`/api/subscriptions?month=${m}&year=${y}`))
      expect(response.status).toBe(200)
      expect(db.subscription.createMany).toHaveBeenCalled()
    })
  })
})

describe('API /subscriptions/[id]', () => {
  beforeEach(() => { vi.clearAllMocks() })

  describe('PUT /api/subscriptions/[id]', () => {
    it('should update subscription status to AL_DIA', async () => {
      vi.mocked(db.subscription.update).mockResolvedValue({ id: 'sub-1', status: 'AL_DIA', classesTotal: 4, classesUsed: 2, amount: 5000 } as any)
      const response = await updateSubscription(createRequest('/api/subscriptions/sub-1', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'AL_DIA' }) }), makeCtx('sub-1'))
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.status).toBe('AL_DIA')
    })

    it('should update classesUsed correctly', async () => {
      vi.mocked(db.subscription.update).mockResolvedValue({ id: 'sub-1', status: 'PENDIENTE', classesTotal: 4, classesUsed: 3, amount: 5000 } as any)
      const response = await updateSubscription(createRequest('/api/subscriptions/sub-1', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ classesUsed: 3 }) }), makeCtx('sub-1'))
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.classesUsed).toBe(3)
    })

    it('should update amount', async () => {
      vi.mocked(db.subscription.update).mockResolvedValue({ id: 'sub-1', status: 'PENDIENTE', classesTotal: 4, classesUsed: 0, amount: 7500 } as any)
      const response = await updateSubscription(createRequest('/api/subscriptions/sub-1', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: 7500 }) }), makeCtx('sub-1'))
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.amount).toBe(7500)
    })

    it('should fail with invalid status value', async () => {
      const response = await updateSubscription(createRequest('/api/subscriptions/sub-1', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'INVALID_STATUS' }) }), makeCtx('sub-1'))
      const data = await response.json()
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toMatch(/Datos inválidos|one of/i)
    })

    it('should fail with negative classesUsed', async () => {
      const response = await updateSubscription(createRequest('/api/subscriptions/sub-1', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ classesUsed: -1 }) }), makeCtx('sub-1'))
      const data = await response.json()
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should accept billingPeriod update', async () => {
      vi.mocked(db.subscription.update).mockResolvedValue({ id: 'sub-1', status: 'PENDIENTE', classesTotal: 4, classesUsed: 0, amount: 5000, billingPeriod: 'HALF' } as any)
      const response = await updateSubscription(createRequest('/api/subscriptions/sub-1', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ billingPeriod: 'HALF' }) }), makeCtx('sub-1'))
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.billingPeriod).toBe('HALF')
    })
  })
})
