import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/db', () => ({
  db: {
    group: { findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    client: { updateMany: vi.fn() },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/api-utils', () => ({
  cachedFetch: vi.fn((_k, fetcher) => fetcher()),
  CacheKeys: { groups: () => 'groups:all' },
  invalidateCache: vi.fn(),
  invalidateCachePattern: vi.fn(),
  invalidateClientCache: vi.fn(),
}))

import { db } from '@/lib/db'
import { GET as getGroups, POST as createGroup } from '@/app/api/groups/route'
import { GET as getGroupById, PUT as updateGroup, DELETE as deleteGroup } from '@/app/api/groups/[id]/route'

function createRequest(url: string, options: RequestInit = {}): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), options as any)
}

// Route handlers use (request, { params }) — context must have params key
function makeCtx(id: string) { return { params: Promise.resolve({ id }) } }

describe('API /groups', () => {
  beforeEach(() => { vi.clearAllMocks() })

  describe('GET /api/groups', () => {
    it('should return all groups with client counts', async () => {
      vi.mocked(db.group.findMany).mockResolvedValue([{ id: 'g1', name: 'Grupo A', color: '#06b6d4', description: null, schedule: null, active: true, _count: { clients: 5 } }, { id: 'g2', name: 'Grupo B', color: '#8b5cf6', description: null, schedule: null, active: true, _count: { clients: 3 } }] as any)
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
    it('should create a new group with valid data', async () => {
      vi.mocked(db.group.findFirst).mockResolvedValue(null)
      vi.mocked(db.group.create).mockResolvedValue({ id: 'gn', name: 'Grupo Test', color: '#06b6d4', description: 'Test group', schedule: null, active: true } as any)
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
      vi.mocked(db.group.findFirst).mockResolvedValue({ id: 'eg', name: 'Grupo A' } as any)
      const response = await createGroup(createRequest('/api/groups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Grupo A', color: '#06b6d4' }) }))
      const data = await response.json()
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Ya existe')
    })
  })
})

describe('API /groups/[id]', () => {
  beforeEach(() => { vi.clearAllMocks() })

  describe('GET /api/groups/[id]', () => {
    it('should return a single group by id', async () => {
      vi.mocked(db.group.findUnique).mockResolvedValue({ id: 'g1', name: 'Grupo A', color: '#06b6d4', description: 'Test description', schedule: 'Lunes 10:00', active: true, _count: { clients: 5 } } as any)
      const response = await getGroupById(createRequest('/api/groups/g1'), makeCtx('g1'))
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.name).toBe('Grupo A')
      expect(data.data.clientCount).toBe(5)
    })

    it('should return 404 when group not found', async () => {
      vi.mocked(db.group.findUnique).mockResolvedValue(null)
      const response = await getGroupById(createRequest('/api/groups/non-existent'), makeCtx('non-existent'))
      const data = await response.json()
      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toContain('no encontrado')
    })
  })

  describe('PUT /api/groups/[id]', () => {
    it('should update a group with valid data', async () => {
      vi.mocked(db.group.findFirst).mockResolvedValue(null)
      vi.mocked(db.group.update).mockResolvedValue({ id: 'g1', name: 'Grupo Updated', color: '#06b6d4', description: 'Updated description', schedule: null, active: true } as any)
      const response = await updateGroup(createRequest('/api/groups/g1', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Grupo Updated', description: 'Updated description' }) }), makeCtx('g1'))
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.name).toBe('Grupo Updated')
    })

    it('should fail with invalid data', async () => {
      const response = await updateGroup(createRequest('/api/groups/g1', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ color: 'invalid' }) }), makeCtx('g1'))
      const data = await response.json()
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should fail when updating to duplicate name', async () => {
      vi.mocked(db.group.findFirst).mockResolvedValue({ id: 'g2', name: 'Grupo B' } as any)
      const response = await updateGroup(createRequest('/api/groups/g1', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Grupo B' }) }), makeCtx('g1'))
      const data = await response.json()
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Ya existe')
    })
  })

  describe('DELETE /api/groups/[id]', () => {
    it('should soft delete a group by setting active=false', async () => {
      vi.mocked(db.group.findUnique).mockResolvedValue({ id: 'g1', name: 'Grupo A', active: true, _count: { clients: 2 } } as any)
      vi.mocked(db.group.update).mockResolvedValue({ id: 'g1', active: false } as any)
      vi.mocked(db.client.updateMany).mockResolvedValue({ count: 2 } as any)
      const response = await deleteGroup(createRequest('/api/groups/g1', { method: 'DELETE' }), makeCtx('g1'))
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(db.group.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'g1' }, data: { active: false } }))
      expect(db.client.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { grupoId: 'g1' }, data: { grupoId: null } }))
    })

    it('should return 404 when group not found', async () => {
      vi.mocked(db.group.findUnique).mockResolvedValue(null)
      const response = await deleteGroup(createRequest('/api/groups/non-existent', { method: 'DELETE' }), makeCtx('non-existent'))
      const data = await response.json()
      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
    })
  })
})
