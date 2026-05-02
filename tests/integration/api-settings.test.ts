import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mocking the database
vi.mock('@/lib/db', () => ({
  db: {
    settings: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
      upsert: vi.fn(),
    },
    activityLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn((ops) => {
      if (Array.isArray(ops)) return Promise.all(ops)
      return ops
    }),
  },
}))

// Mocking auth
vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

import { db } from '@/lib/db'
import { auth } from '@/auth'
import { GET, PUT, POST } from '@/app/api/settings/route'

function createRequest(url: string, options: RequestInit = {}): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), options as any)
}

describe('API /api/settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'admin-1', role: 'EMPLEADORA' }
    } as any)
  })

  describe('GET /api/settings', () => {
    it('should initialize defaults and return settings', async () => {
      // Mock existing settings to be empty initially
      vi.mocked(db.settings.findMany)
        .mockResolvedValueOnce([]) // First call inside initializeDefaults
        .mockResolvedValueOnce([   // Second call for the GET response
          { key: 'business.name', value: 'Test', category: 'business', description: 'desc' }
        ] as any)

      vi.mocked(db.settings.createMany).mockResolvedValue({ count: 1 } as any)

      const response = await GET(createRequest('/api/settings'))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(db.settings.findMany).toHaveBeenCalledTimes(2)
      expect(db.settings.createMany).toHaveBeenCalled()
      expect(data.data['business.name'].value).toBe('Test')
    })

    it('should filter by category', async () => {
      vi.mocked(db.settings.findMany).mockResolvedValue([
        { key: 'payment.dueDay', value: '10', category: 'payment', description: 'desc' }
      ] as any)

      const response = await GET(createRequest('/api/settings?category=payment'))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(db.settings.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { category: 'payment' }
      }))
      expect(data.data['payment.dueDay'].value).toBe('10')
    })
  })

  describe('PUT /api/settings', () => {
    it('should update existing settings and create new ones in batch', async () => {
      vi.mocked(db.settings.findMany).mockResolvedValue([
        { key: 'existing.key' }
      ] as any)

      const payload = {
        settings: {
          'existing.key': 'new-value',
          'new.key': 'brand-new-value'
        }
      }

      const response = await PUT(createRequest('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(payload)
      }))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      // Verify transaction contents
      // 1 createMany call and 1 individual update call
      expect(db.$transaction).toHaveBeenCalled()
      expect(db.settings.createMany).toHaveBeenCalledWith(expect.objectContaining({
        data: [{ key: 'new.key', value: 'brand-new-value', category: 'general' }]
      }))
      expect(db.settings.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { key: 'existing.key' },
        data: { value: 'new-value' }
      }))
    })
  })

  describe('POST /api/settings (reset)', () => {
    it('should reset settings using deleteMany and createMany', async () => {
      const response = await POST(createRequest('/api/settings', {
        method: 'POST',
        body: JSON.stringify({ action: 'reset' })
      }))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      expect(db.$transaction).toHaveBeenCalled()
      expect(db.settings.deleteMany).toHaveBeenCalled()
      expect(db.settings.createMany).toHaveBeenCalled()
    })

    it('should fail for non-admin users', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'staff-1', role: 'EMPLEADO' }
      } as any)

      const response = await POST(createRequest('/api/settings', {
        method: 'POST',
        body: JSON.stringify({ action: 'reset' })
      }))

      expect(response.status).toBe(403)
    })
  })
})
