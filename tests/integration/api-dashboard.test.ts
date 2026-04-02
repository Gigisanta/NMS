import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/db', () => ({
  db: {
    client: { count: vi.fn(), findMany: vi.fn(), groupBy: vi.fn() },
    subscription: { findMany: vi.fn(), groupBy: vi.fn(), aggregate: vi.fn() },
    attendance: { count: vi.fn(), findMany: vi.fn(), create: vi.fn() },
    group: { findMany: vi.fn() },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/api-utils', () => ({
  cachedFetch: vi.fn((_k, fetcher) => fetcher()),
  CacheKeys: { dashboard: () => 'dashboard:stats', groups: () => 'groups:all', clients: () => 'clients:all', attendanceToday: () => 'attendance:today' },
  invalidateCache: vi.fn(),
  invalidateCachePattern: vi.fn(),
  invalidateClientCache: vi.fn(),
}))

import { db } from '@/lib/db'
import { GET as getDashboard } from '@/app/api/dashboard/route'

function createRequest(url: string, options: RequestInit = {}): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), options as any)
}

describe('API /dashboard', () => {
  beforeEach(() => { vi.clearAllMocks() })

  describe('GET /api/dashboard', () => {
    it('should return complete dashboard statistics', async () => {
      vi.mocked(db.group.findMany).mockResolvedValue([{ id: 'group-1', name: 'Grupo A', color: '#06b6d4', active: true, _count: { clients: 10 } }, { id: 'group-2', name: 'Grupo B', color: '#8b5cf6', active: true, _count: { clients: 5 } }] as any)
      vi.mocked(db.client.count).mockResolvedValue(27)
      vi.mocked(db.subscription.groupBy).mockResolvedValue([{ status: 'AL_DIA', _count: { _all: 15 }, _sum: { amount: 75000 } }, { status: 'PENDIENTE', _count: { _all: 7 }, _sum: { amount: 35000 } }, { status: 'DEUDOR', _count: { _all: 5 }, _sum: { amount: 25000 } }] as any)
      vi.mocked(db.attendance.count).mockResolvedValue(10)
      vi.mocked(db.client.findMany).mockResolvedValue([] as any)
      vi.mocked(db.client.groupBy).mockResolvedValue([] as any)
      vi.mocked(db.subscription.findMany).mockResolvedValue([] as any)
      vi.mocked(db.attendance.findMany).mockResolvedValue([] as any)

      const response = await getDashboard(createRequest('/api/dashboard'))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.stats.totalClients).toBe(27)
      expect(data.data.stats.activeClients).toBe(22)
      expect(data.data.stats.pendingPayments).toBe(7)
      expect(data.data.stats.overduePayments).toBe(5)
      expect(data.data.stats.todayAttendances).toBe(10)
      expect(data.data.stats.monthRevenue).toBe(75000)
      expect(data.data.groupRevenue).toBeDefined()
      expect(data.data.stats).toBeDefined()
    })

    it('should calculate revenue correctly from AL_DIA subscriptions', async () => {
      vi.mocked(db.group.findMany).mockResolvedValue([] as any)
      vi.mocked(db.client.count).mockResolvedValue(10)
      vi.mocked(db.subscription.groupBy).mockResolvedValue([{ status: 'AL_DIA', _count: { _all: 3 }, _sum: { amount: 15000 } }, { status: 'PENDIENTE', _count: { _all: 2 }, _sum: { amount: 10000 } }] as any)
      vi.mocked(db.attendance.count).mockResolvedValue(0)
      vi.mocked(db.client.findMany).mockResolvedValue([] as any)
      vi.mocked(db.client.groupBy).mockResolvedValue([] as any)
      vi.mocked(db.subscription.findMany).mockResolvedValue([] as any)
      vi.mocked(db.attendance.findMany).mockResolvedValue([] as any)

      const response = await getDashboard(createRequest('/api/dashboard'))
      const data = await response.json()

      expect(data.data.stats.monthRevenue).toBe(15000)
    })

    it('should return zero stats when no data', async () => {
      vi.mocked(db.group.findMany).mockResolvedValue([] as any)
      vi.mocked(db.client.count).mockResolvedValue(0)
      vi.mocked(db.subscription.groupBy).mockResolvedValue([] as any)
      vi.mocked(db.attendance.count).mockResolvedValue(0)
      vi.mocked(db.client.findMany).mockResolvedValue([] as any)
      vi.mocked(db.client.groupBy).mockResolvedValue([] as any)
      vi.mocked(db.subscription.findMany).mockResolvedValue([] as any)
      vi.mocked(db.attendance.findMany).mockResolvedValue([] as any)

      const response = await getDashboard(createRequest('/api/dashboard'))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.stats.totalClients).toBe(0)
      expect(data.data.stats.activeClients).toBe(0)
      expect(data.data.stats.pendingPayments).toBe(0)
      expect(data.data.stats.overduePayments).toBe(0)
      expect(data.data.stats.todayAttendances).toBe(0)
      expect(data.data.stats.monthRevenue).toBe(0)
      expect(data.data.groupRevenue).toEqual([])
    })

    it('should handle only DEUDOR (overdue) subscriptions - no revenue counted', async () => {
      vi.mocked(db.group.findMany).mockResolvedValue([] as any)
      vi.mocked(db.client.count).mockResolvedValue(8)
      vi.mocked(db.subscription.groupBy).mockResolvedValue([{ status: 'DEUDOR', _count: { _all: 8 }, _sum: { amount: 40000 } }] as any)
      vi.mocked(db.attendance.count).mockResolvedValue(0)
      vi.mocked(db.client.findMany).mockResolvedValue([] as any)
      vi.mocked(db.client.groupBy).mockResolvedValue([] as any)
      vi.mocked(db.subscription.findMany).mockResolvedValue([] as any)
      vi.mocked(db.attendance.findMany).mockResolvedValue([] as any)

      const response = await getDashboard(createRequest('/api/dashboard'))
      const data = await response.json()

      expect(data.data.stats.activeClients).toBe(0)
      expect(data.data.stats.pendingPayments).toBe(0)
      expect(data.data.stats.overduePayments).toBe(8)
      expect(data.data.stats.monthRevenue).toBe(0)
    })

    it('should return groupRevenue in the response', async () => {
      vi.mocked(db.group.findMany).mockResolvedValue([{ id: 'g1', name: 'Niños', color: '#06b6d4', active: true, _count: { clients: 5 } }, { id: 'g2', name: 'Adultos', color: '#f59e0b', active: true, _count: { clients: 10 } }] as any)
      vi.mocked(db.client.count).mockResolvedValue(15)
      vi.mocked(db.subscription.groupBy).mockResolvedValue([] as any)
      vi.mocked(db.attendance.count).mockResolvedValue(0)
      vi.mocked(db.client.findMany).mockResolvedValue([] as any)
      vi.mocked(db.client.groupBy).mockResolvedValue([{ grupoId: 'g1', _sum: { monthlyAmount: 25000 } }, { grupoId: 'g2', _sum: { monthlyAmount: 50000 } }] as any)
      vi.mocked(db.subscription.findMany).mockResolvedValue([] as any)
      vi.mocked(db.attendance.findMany).mockResolvedValue([] as any)

      const response = await getDashboard(createRequest('/api/dashboard'))
      const data = await response.json()

      expect(data.data.groupRevenue).toBeDefined()
      expect(Array.isArray(data.data.groupRevenue)).toBe(true)
    })
  })
})
