import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mocking auth MUST happen before importing the routes
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  db: {
    settings: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    activityLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn((ops) => Promise.all(ops)),
  },
}))

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { GET, PUT, POST } from '@/app/api/settings/route'

function createRequest(url: string, options: RequestInit = {}): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), options as any)
}

describe('API /settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue({ user: { id: 'admin-1', role: 'EMPLEADORA' } } as any)
  })

  describe('GET /api/settings', () => {
    it('should initialize defaults and return settings', async () => {
      vi.mocked(db.settings.findMany).mockResolvedValue([
        { key: 'business.name', value: 'Test', category: 'business', description: 'desc' }
      ] as any)
      vi.mocked(db.settings.createMany).mockResolvedValue({ count: 30 } as any)

      const response = await GET(createRequest('/api/settings'))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(db.settings.createMany).toHaveBeenCalled()
      expect(data.data['business.name']).toBeDefined()
    })
  })

  describe('PUT /api/settings', () => {
    it('should batch update settings', async () => {
      const settingsToUpdate = { 'business.name': 'New Name', 'new.setting': 'value' }
      vi.mocked(db.settings.findMany).mockResolvedValue([{ key: 'business.name' }] as any)
      vi.mocked(db.settings.update).mockResolvedValue({} as any)
      vi.mocked(db.settings.createMany).mockResolvedValue({ count: 1 } as any)

      const response = await PUT(createRequest('/api/settings', {
        method: 'PUT',
        body: JSON.stringify({ settings: settingsToUpdate })
      }))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(db.settings.update).toHaveBeenCalledTimes(1)
      expect(db.settings.createMany).toHaveBeenCalledTimes(1)
      expect(db.$transaction).toHaveBeenCalled()
    })
  })

  describe('POST /api/settings (reset)', () => {
    it('should reset settings to defaults', async () => {
      const response = await POST(createRequest('/api/settings', {
        method: 'POST',
        body: JSON.stringify({ action: 'reset' })
      }))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(db.settings.deleteMany).toHaveBeenCalled()
      expect(db.settings.createMany).toHaveBeenCalled()
      expect(db.$transaction).toHaveBeenCalled()
    })

    it('should fail if not EMPLEADORA', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'emp-1', role: 'EMPLEADO' } } as any)

      const response = await POST(createRequest('/api/settings', {
        method: 'POST',
        body: JSON.stringify({ action: 'reset' })
      }))

      expect(response.status).toBe(403)
    })
  })
})
