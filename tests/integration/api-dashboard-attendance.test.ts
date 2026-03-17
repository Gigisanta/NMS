import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock the db module
vi.mock('@/lib/db', () => ({
  db: {
    client: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    subscription: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      groupBy: vi.fn(),
      aggregate: vi.fn(),
    },
    attendance: {
      count: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
    group: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

// Mock the api-utils module
vi.mock('@/lib/api-utils', () => ({
  cachedFetch: vi.fn((key, fetcher) => fetcher()),
  CacheKeys: {
    dashboard: () => 'dashboard:stats',
    groups: () => 'groups:all',
    clients: () => 'clients:all',
    attendanceToday: () => 'attendance:today',
  },
  invalidateCache: vi.fn(),
  invalidateCachePattern: vi.fn(),
  invalidateClientCache: vi.fn(),
}))

import { db } from '@/lib/db'
import { GET as getDashboard } from '@/app/api/dashboard/route'
import { GET as getAttendance, POST as createAttendance } from '@/app/api/attendance/route'

function createRequest(url: string, options: RequestInit = {}): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), options)
}

describe('API /dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/dashboard', () => {
    it('should return dashboard statistics', async () => {
      vi.mocked(db.client.count).mockResolvedValue(27)
      vi.mocked(db.subscription.groupBy).mockResolvedValue([
        { status: 'AL_DIA', _count: { _all: 2 }, _sum: { amount: 10000 } },
        { status: 'PENDIENTE', _count: { _all: 1 }, _sum: { amount: 5000 } },
        { status: 'DEUDOR', _count: { _all: 1 }, _sum: { amount: 5000 } },
      ] as any)
      vi.mocked(db.attendance.count).mockResolvedValue(10)
      vi.mocked(db.client.findMany).mockResolvedValue([])
      vi.mocked(db.subscription.findMany).mockResolvedValue([])
      vi.mocked(db.group.findMany).mockResolvedValue([])
      vi.mocked(db.attendance.findMany).mockResolvedValue([])

      const response = await getDashboard()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.stats.totalClients).toBe(27)
      expect(data.data.stats.todayAttendances).toBe(10)
    })

    it('should calculate revenue correctly', async () => {
      vi.mocked(db.client.count).mockResolvedValue(10)
      vi.mocked(db.subscription.groupBy).mockResolvedValue([
        { status: 'AL_DIA', _count: { _all: 3 }, _sum: { amount: 15000 } },
        { status: 'PENDIENTE', _count: { _all: 1 }, _sum: { amount: 5000 } },
      ] as any)
      vi.mocked(db.attendance.count).mockResolvedValue(5)
      vi.mocked(db.client.findMany).mockResolvedValue([])
      vi.mocked(db.subscription.findMany).mockResolvedValue([])
      vi.mocked(db.group.findMany).mockResolvedValue([])
      vi.mocked(db.attendance.findMany).mockResolvedValue([])

      const response = await getDashboard()
      const data = await response.json()

      expect(data.data.stats.monthRevenue).toBe(15000) // 3 AL_DIA * 5000
    })

    it('should count pending and overdue payments', async () => {
      vi.mocked(db.client.count).mockResolvedValue(10)
      vi.mocked(db.subscription.groupBy).mockResolvedValue([
        { status: 'AL_DIA', _count: { _all: 1 }, _sum: { amount: 5000 } },
        { status: 'PENDIENTE', _count: { _all: 2 }, _sum: { amount: 10000 } },
        { status: 'DEUDOR', _count: { _all: 2 }, _sum: { amount: 10000 } },
      ] as any)
      vi.mocked(db.attendance.count).mockResolvedValue(5)
      vi.mocked(db.client.findMany).mockResolvedValue([])
      vi.mocked(db.subscription.findMany).mockResolvedValue([])
      vi.mocked(db.group.findMany).mockResolvedValue([])
      vi.mocked(db.attendance.findMany).mockResolvedValue([])

      const response = await getDashboard()
      const data = await response.json()

      expect(data.data.stats.activeClients).toBe(5)
      expect(data.data.stats.pendingPayments).toBe(2)
      expect(data.data.stats.overduePayments).toBe(2)
    })

    it('should handle empty data', async () => {
      vi.mocked(db.client.count).mockResolvedValue(0)
      vi.mocked(db.subscription.groupBy).mockResolvedValue([])
      vi.mocked(db.attendance.count).mockResolvedValue(0)
      vi.mocked(db.client.findMany).mockResolvedValue([])
      vi.mocked(db.subscription.findMany).mockResolvedValue([])
      vi.mocked(db.group.findMany).mockResolvedValue([])
      vi.mocked(db.attendance.findMany).mockResolvedValue([])

      const response = await getDashboard()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.stats.totalClients).toBe(0)
      expect(data.data.stats.monthRevenue).toBe(0)
    })
  })
})

describe('API /attendance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/attendance', () => {
    it('should return today attendance when today=true', async () => {
      const mockAttendance = [
        {
          id: '1',
          clientId: 'client-1',
          date: new Date(),
          client: {
            nombre: 'Juan',
            apellido: 'Pérez',
            grupo: null,
          },
        },
      ]

      vi.mocked(db.attendance.findMany).mockResolvedValue(mockAttendance as any)

      const request = createRequest('/api/attendance?today=true')
      const response = await getAttendance(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
    })

    it('should return client attendance when clientId provided', async () => {
      vi.mocked(db.attendance.findMany).mockResolvedValue([
        { id: '1', clientId: 'client-1', date: new Date() },
      ] as any)

      const request = createRequest('/api/attendance?clientId=client-1')
      const response = await getAttendance(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should limit results to 100 by default', async () => {
      vi.mocked(db.attendance.findMany).mockResolvedValue([])

      const request = createRequest('/api/attendance')
      await getAttendance(request)

      expect(db.attendance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        })
      )
    })
  })

  describe('POST /api/attendance', () => {
    it('should create attendance and update subscription', async () => {
      const mockClient = {
        id: 'client-1',
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '123',
        grupo: null,
        subscriptions: [
          {
            id: 'sub-1',
            status: 'PENDIENTE',
            classesUsed: 0,
            classesTotal: 4,
          },
        ],
      }

      vi.mocked(db.client.findUnique).mockResolvedValue(mockClient as any)
      vi.mocked(db.$transaction).mockImplementation(async (fn: any) => {
        const tx = {
          attendance: {
            create: vi.fn().mockResolvedValue({
              id: 'attendance-1',
              date: new Date(),
            }),
          },
          subscription: {
            update: vi.fn().mockResolvedValue({}),
          },
        }
        return fn(tx)
      })

      const request = createRequest('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: 'client-1' }),
      })

      const response = await createAttendance(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.attendance).toBeDefined()
    })

    it('should fail without clientId', async () => {
      const request = createRequest('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const response = await createAttendance(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('clientId')
    })

    it('should fail when client not found', async () => {
      vi.mocked(db.client.findUnique).mockResolvedValue(null)

      const request = createRequest('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: 'non-existent' }),
      })

      const response = await createAttendance(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toContain('no encontrado')
    })

    it('should fail when client has no subscription', async () => {
      vi.mocked(db.client.findUnique).mockResolvedValue({
        id: 'client-1',
        nombre: 'Juan',
        apellido: 'Pérez',
        subscriptions: [],
      } as any)

      const request = createRequest('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: 'client-1' }),
      })

      const response = await createAttendance(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('suscripción')
    })

    it('should fail when class limit reached', async () => {
      const mockClient = {
        id: 'client-1',
        nombre: 'Juan',
        apellido: 'Pérez',
        subscriptions: [
          {
            id: 'sub-1',
            status: 'PENDIENTE',
            classesUsed: 4,
            classesTotal: 4,
          },
        ],
      }

      vi.mocked(db.client.findUnique).mockResolvedValue(mockClient as any)

      const request = createRequest('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: 'client-1' }),
      })

      const response = await createAttendance(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('límite')
    })
  })
})
