import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock the db module
vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
  },
}))

// Mock hashPassword
vi.mock('@/lib/auth-utils', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed-password-xyz'),
}))

import { db } from '@/lib/db'
import { POST as register } from '@/app/api/auth/register/route'

function createRequest(url: string, options: RequestInit = {}): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), options as any)
}

describe('API /auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/auth/register', () => {
    it('should register first user as EMPLEADORA', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'María',
        email: 'maria@test.com',
        role: 'EMPLEADORA',
        password: 'hashed-password-xyz',
        active: true,
      }

      vi.mocked(db.user.findUnique).mockResolvedValue(null) // No existing user
      vi.mocked(db.user.count).mockResolvedValue(0) // First user
      vi.mocked(db.user.create).mockResolvedValue(mockUser as any)

      const request = createRequest('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'María',
          email: 'maria@test.com',
          password: 'password123',
        }),
      })

      const response = await register(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.role).toBe('EMPLEADORA')
      expect(data.data.email).toBe('maria@test.com')
    })

    it('should register subsequent users as EMPLEADO', async () => {
      const mockUser = {
        id: 'user-2',
        name: 'Tomás',
        email: 'tomas@test.com',
        role: 'EMPLEADO',
        password: 'hashed-password-xyz',
        active: true,
      }

      vi.mocked(db.user.findUnique).mockResolvedValue(null)
      vi.mocked(db.user.count).mockResolvedValue(1) // Not first user
      vi.mocked(db.user.create).mockResolvedValue(mockUser as any)

      const request = createRequest('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Tomás',
          email: 'tomas@test.com',
          password: 'password123',
        }),
      })

      const response = await register(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.role).toBe('EMPLEADO')
    })

    it('should fail with invalid email format', async () => {
      const request = createRequest('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test',
          email: 'invalid-email',
          password: 'password123',
        }),
      })

      const response = await register(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Email inválido')
    })

    it('should fail with short name (< 2 chars)', async () => {
      const request = createRequest('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'T',
          email: 'test@test.com',
          password: 'password123',
        }),
      })

      const response = await register(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('al menos 2 caracteres')
    })

    it('should fail with short password (< 6 chars)', async () => {
      const request = createRequest('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test',
          email: 'test@test.com',
          password: '12345',
        }),
      })

      const response = await register(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('al menos 6 caracteres')
    })

    it('should fail with duplicate email', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue({
        id: 'existing-user',
        email: 'existing@test.com',
      } as any)

      const request = createRequest('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test',
          email: 'existing@test.com',
          password: 'password123',
        }),
      })

      const response = await register(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Ya existe una cuenta con este email')
    })

    it('should normalize email to lowercase', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'Test',
        email: 'test@test.com',
        role: 'EMPLEADORA',
      }

      vi.mocked(db.user.findUnique).mockResolvedValue(null)
      vi.mocked(db.user.count).mockResolvedValue(0)
      vi.mocked(db.user.create).mockResolvedValue(mockUser as any)

      const request = createRequest('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test',
          email: 'TEST@TEST.COM',
          password: 'password123',
        }),
      })

      const response = await register(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.email).toBe('test@test.com')
    })

    it('should fail when no body provided', async () => {
      const request = createRequest('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const response = await register(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })
  })
})
