import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/db', () => ({
  db: {
    client: { findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
    group: { findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    subscription: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    attendance: { findMany: vi.fn(), create: vi.fn(), count: vi.fn() },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/api-utils', () => ({
  cachedFetch: vi.fn((_k, fetcher) => fetcher()),
  CacheKeys: { dashboard: () => 'dashboard:stats', groups: () => 'groups:all', clients: (p: any) => `clients:${JSON.stringify(p)}`, client: (id: string) => `client:${id}`, attendanceToday: () => 'attendance:today' },
  invalidateCache: vi.fn(),
  invalidateCachePattern: vi.fn(),
  invalidateClientCache: vi.fn(),
  invalidateGroupsCache: vi.fn(),
}))

vi.mock('@/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: 'admin-1', role: 'EMPLEADORA' } }),
}))

vi.mock('@/lib/rate-limit', () => ({ ratelimit: { limit: vi.fn().mockResolvedValue({ success: true }) } }))

import { db } from '@/lib/db'
import { GET as getClients, POST as createClient } from '@/app/api/clients/route'
import { GET as getGroups, POST as createGroup } from '@/app/api/groups/route'

function createRequest(url: string, options: RequestInit = {}): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), options as any)
}

describe('API /clients', () => {
  beforeEach(() => { vi.clearAllMocks() })

  describe('GET /api/clients', () => {
    it('should return empty array when no clients', async () => {
      vi.mocked(db.client.count).mockResolvedValue(0)
      vi.mocked(db.client.findMany).mockResolvedValue([] as any)
      const response = await getClients(createRequest('/api/clients'))
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual([])
      expect(data.pagination.total).toBe(0)
    })

    it('should return paginated clients', async () => {
      vi.mocked(db.client.count).mockResolvedValue(2)
      vi.mocked(db.client.findMany).mockResolvedValue([{ id: '1', nombre: 'Juan', apellido: 'Pérez', telefono: '123' }, { id: '2', nombre: 'María', apellido: 'García', telefono: '456' }] as any)
      const response = await getClients(createRequest('/api/clients?page=1&limit=10'))
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(2)
      expect(data.pagination).toEqual({ page: 1, limit: 10, total: 2, totalPages: 1 })
    })

    it('should filter clients by search term', async () => {
      vi.mocked(db.client.count).mockResolvedValue(1)
      vi.mocked(db.client.findMany).mockResolvedValue([{ id: '1', nombre: 'Juan', apellido: 'Pérez', telefono: '123' }] as any)
      const response = await getClients(createRequest('/api/clients?search=Juan'))
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should filter clients by group', async () => {
      vi.mocked(db.client.count).mockResolvedValue(1)
      vi.mocked(db.client.findMany).mockResolvedValue([{ id: '1', nombre: 'Juan', grupoId: 'group-1' }] as any)
      const response = await getClients(createRequest('/api/clients?grupoId=group-1'))
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should cap limit at 50', async () => {
      vi.mocked(db.client.count).mockResolvedValue(100)
      vi.mocked(db.client.findMany).mockResolvedValue([] as any)
      await getClients(createRequest('/api/clients?limit=100'))
      expect(db.client.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 50 }))
    })
  })

  describe('POST /api/clients', () => {
    it('should create a new client', async () => {
      const mockClient = { id: 'client-1', nombre: 'Juan', apellido: 'Pérez', telefono: '+5491122334455', dni: null, grupoId: null, preferredDays: null, preferredTime: null, notes: null, monthlyAmount: null, registrationFeePaid1: false, registrationFeePaid2: false, createdAt: new Date(), grupo: null }
      vi.mocked(db.client.findFirst).mockResolvedValue(null)
      vi.mocked(db.$transaction).mockImplementation(async (fn: any) => {
        const tx = { client: { create: vi.fn().mockResolvedValue(mockClient) }, subscription: { create: vi.fn().mockResolvedValue({}) } }
        return fn(tx)
      })
      const response = await createClient(createRequest('/api/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre: 'Juan', apellido: 'Pérez', telefono: '+5491122334455' }) }))
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.nombre).toBe('Juan')
    })

    it('should fail with missing required fields', async () => {
      const response = await createClient(createRequest('/api/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre: 'Juan' }) }))
      const data = await response.json()
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Datos inválidos')
    })

    it('should allow duplicate phone (deliberate behavior)', async () => {
      vi.mocked(db.client.findFirst).mockResolvedValue({ id: 'existing-client', telefono: '5491122334455' } as any)
      vi.mocked(db.$transaction).mockImplementation(async (fn: any) => {
        const tx = {
          client: { create: vi.fn().mockResolvedValue({ id: 'new-client', nombre: 'Juan', apellido: 'Pérez' }) },
          subscription: { create: vi.fn().mockResolvedValue({}) }
        }
        return fn(tx)
      })
      const response = await createClient(createRequest('/api/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre: 'Juan', apellido: 'Pérez', telefono: '5491122334455' }) }))
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })
})

describe('API /groups', () => {
  beforeEach(() => { vi.clearAllMocks() })

  describe('GET /api/groups', () => {
    it('should return all groups with client counts', async () => {
      vi.mocked(db.group.findMany).mockResolvedValue([{ id: '1', name: 'Grupo A', color: '#06b6d4', description: null, schedule: null, active: true, _count: { clients: 5 } }, { id: '2', name: 'Grupo B', color: '#8b5cf6', description: null, schedule: null, active: true, _count: { clients: 3 } }] as any)
      const response = await getGroups(createRequest('/api/groups'))
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(2)
      expect(data.data[0].clientCount).toBe(5)
      expect(data.data[1].clientCount).toBe(3)
    })

    it('should return empty array when no groups', async () => {
      vi.mocked(db.group.findMany).mockResolvedValue([] as any)
      const response = await getGroups(createRequest('/api/groups'))
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual([])
    })
  })

  describe('POST /api/groups', () => {
    it('should create a new group', async () => {
      vi.mocked(db.group.findFirst).mockResolvedValue(null)
      vi.mocked(db.group.create).mockResolvedValue({ id: 'group-1', name: 'Grupo Test', color: '#06b6d4', description: 'Test group', schedule: null, active: true, _count: { clients: 0 } } as any)
      const response = await createGroup(createRequest('/api/groups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Grupo Test', color: '#06b6d4', description: 'Test group' }) }))
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.name).toBe('Grupo Test')
    })

    it('should fail without name', async () => {
      const response = await createGroup(createRequest('/api/groups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ color: '#06b6d4' }) }))
      const data = await response.json()
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should fail with duplicate name', async () => {
      vi.mocked(db.group.findFirst).mockResolvedValue({ id: 'existing-group', name: 'Grupo A' } as any)
      const response = await createGroup(createRequest('/api/groups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Grupo A', color: '#06b6d4' }) }))
      const data = await response.json()
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Ya existe')
    })
  })
})
