import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock the db module
vi.mock('@/lib/db', () => ({
  db: {
    client: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    group: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    subscription: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    attendance: {
      findMany: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn((fn) => fn({
      client: {
        create: vi.fn(),
      },
      subscription: {
        create: vi.fn(),
      },
    })),
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
    client: (id: string) => `client:${id}`,
  },
  invalidateCache: vi.fn(),
  invalidateCachePattern: vi.fn(),
  invalidateClientCache: vi.fn(),
}))

import { db } from '@/lib/db'
import { GET as getClients, POST as createClient } from '@/app/api/clients/route'
import { GET as getGroups, POST as createGroup } from '@/app/api/groups/route'

// Helper to create NextRequest
function createRequest(url: string, options: RequestInit = {}): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), options)
}

describe('API /clients', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/clients', () => {
    it('should return empty array when no clients', async () => {
      vi.mocked(db.client.count).mockResolvedValue(0)
      vi.mocked(db.client.findMany).mockResolvedValue([])

      const request = createRequest('/api/clients')
      const response = await getClients(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual([])
      expect(data.pagination.total).toBe(0)
    })

    it('should return paginated clients', async () => {
      const mockClients = [
        { id: '1', nombre: 'Juan', apellido: 'Pérez', telefono: '123' },
        { id: '2', nombre: 'María', apellido: 'García', telefono: '456' },
      ]

      vi.mocked(db.client.count).mockResolvedValue(2)
      vi.mocked(db.client.findMany).mockResolvedValue(mockClients as any)

      const request = createRequest('/api/clients?page=1&limit=10')
      const response = await getClients(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(2)
      expect(data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      })
    })

    it('should filter clients by search term', async () => {
      vi.mocked(db.client.count).mockResolvedValue(1)
      vi.mocked(db.client.findMany).mockResolvedValue([
        { id: '1', nombre: 'Juan', apellido: 'Pérez', telefono: '123' },
      ] as any)

      const request = createRequest('/api/clients?search=Juan')
      const response = await getClients(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should filter clients by group', async () => {
      vi.mocked(db.client.count).mockResolvedValue(1)
      vi.mocked(db.client.findMany).mockResolvedValue([
        { id: '1', nombre: 'Juan', apellido: 'Pérez', grupoId: 'group-1' },
      ] as any)

      const request = createRequest('/api/clients?grupoId=group-1')
      const response = await getClients(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should cap limit at 50', async () => {
      vi.mocked(db.client.count).mockResolvedValue(100)
      vi.mocked(db.client.findMany).mockResolvedValue([])

      const request = createRequest('/api/clients?limit=100')
      await getClients(request)

      // Should be called with limit: 50 (capped)
      expect(db.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        })
      )
    })
  })

  describe('POST /api/clients', () => {
    it('should create a new client', async () => {
      const mockClient = {
        id: 'client-1',
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '+5491122334455',
        dni: null,
        grupoId: null,
        preferredDays: null,
        preferredTime: null,
        notes: null,
        grupo: null,
      }

      vi.mocked(db.client.findUnique).mockResolvedValue(null)
      vi.mocked(db.client.findFirst).mockResolvedValue(null)
      vi.mocked(db.$transaction).mockImplementation(async (fn: any) => {
        const tx = {
          client: {
            create: vi.fn().mockResolvedValue(mockClient),
          },
          subscription: {
            create: vi.fn().mockResolvedValue({}),
          },
        }
        return fn(tx)
      })

      const request = createRequest('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: 'Juan',
          apellido: 'Pérez',
          telefono: '+5491122334455',
        }),
      })

      const response = await createClient(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.nombre).toBe('Juan')
    })

    it('should fail with missing required fields', async () => {
      const request = createRequest('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: 'Juan',
          // Missing apellido and telefono
        }),
      })

      const response = await createClient(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('requeridos')
    })

    it('should fail with duplicate phone', async () => {
      vi.mocked(db.client.findUnique).mockResolvedValue({
        id: 'existing-client',
        telefono: '+5491122334455',
      } as any)

      const request = createRequest('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: 'Juan',
          apellido: 'Pérez',
          telefono: '+5491122334455',
        }),
      })

      const response = await createClient(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Ya existe')
    })
  })
})

describe('API /groups', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/groups', () => {
    it('should return all groups with client counts', async () => {
      const mockGroups = [
        { 
          id: '1', 
          name: 'Grupo A', 
          color: '#06b6d4',
          description: null,
          schedule: null,
          active: true,
          _count: { clients: 5 },
        },
        { 
          id: '2', 
          name: 'Grupo B', 
          color: '#8b5cf6',
          description: null,
          schedule: null,
          active: true,
          _count: { clients: 3 },
        },
      ]

      vi.mocked(db.group.findMany).mockResolvedValue(mockGroups as any)

      const request = createRequest('/api/groups')
      const response = await getGroups(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(2)
      expect(data.data[0].clientCount).toBe(5)
      expect(data.data[1].clientCount).toBe(3)
    })

    it('should return empty array when no groups', async () => {
      vi.mocked(db.group.findMany).mockResolvedValue([])

      const request = createRequest('/api/groups')
      const response = await getGroups(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual([])
    })
  })

  describe('POST /api/groups', () => {
    it('should create a new group', async () => {
      const mockGroup = {
        id: 'group-1',
        name: 'Grupo Test',
        color: '#06b6d4',
        description: 'Test group',
        schedule: null,
        active: true,
        createdAt: new Date(),
      }

      vi.mocked(db.group.findFirst).mockResolvedValue(null)
      vi.mocked(db.group.create).mockResolvedValue(mockGroup as any)

      const request = createRequest('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Grupo Test',
          color: '#06b6d4',
          description: 'Test group',
        }),
      })

      const response = await createGroup(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.name).toBe('Grupo Test')
    })

    it('should fail without name', async () => {
      const request = createRequest('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          color: '#06b6d4',
        }),
      })

      const response = await createGroup(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should fail with duplicate name', async () => {
      vi.mocked(db.group.findFirst).mockResolvedValue({
        id: 'existing-group',
        name: 'Grupo A',
      } as any)

      const request = createRequest('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Grupo A',
          color: '#06b6d4',
        }),
      })

      const response = await createGroup(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Ya existe')
    })
  })
})
