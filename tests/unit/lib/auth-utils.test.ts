import { describe, it, expect, vi } from 'vitest'
import { hasPermission } from '@/lib/auth-utils'
import type { Role } from '@prisma/client'

// Mock the db to prevent Prisma from trying to connect during tests
vi.mock('@/lib/db', () => ({
  db: {
    user: {
      create: vi.fn(),
      findUnique: vi.fn()
    }
  }
}))

describe('hasPermission', () => {
  it('should return true for EMPLEADORA with valid permission', () => {
    expect(hasPermission('EMPLEADORA', 'canManageUsers')).toBe(true)
    expect(hasPermission('EMPLEADORA', 'canManageClients')).toBe(true)
  })

  it('should return true for EMPLEADO with valid permission', () => {
    expect(hasPermission('EMPLEADO', 'canManageClients')).toBe(true)
  })

  it('should return false for EMPLEADO with invalid permission', () => {
    expect(hasPermission('EMPLEADO', 'canManageUsers')).toBe(false)
  })

  it('should return false for unknown roles', () => {
    expect(hasPermission('UNKNOWN_ROLE' as Role, 'canManageUsers')).toBe(false)
  })

  it('should return false for undefined roles', () => {
    expect(hasPermission(undefined as unknown as Role, 'canManageUsers')).toBe(false)
  })

  it('should return false for unknown permissions', () => {
    expect(hasPermission('EMPLEADORA', 'UNKNOWN_PERMISSION' as any)).toBe(false)
  })
})
