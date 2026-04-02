import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.resetModules()

vi.mock('@/lib/db', () => ({
  db: {
    user: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
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

vi.mock('@/lib/auth-utils', () => ({ hashPassword: vi.fn().mockResolvedValue('hashed-password-123') }))
vi.mock('@/auth', () => ({ auth: vi.fn().mockResolvedValue({ user: { id: 'admin-1', name: 'Admin User', email: 'admin@test.com', role: 'EMPLEADORA' } }) }))

import { db } from '@/lib/db'
import { GET as getEmployees, POST as createEmployee } from '@/app/api/employees/route'
import { GET as getEmployeeById, PUT as updateEmployee, DELETE as deleteEmployee } from '@/app/api/employees/[id]/route'

function createRequest(url: string, options: RequestInit = {}): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), options as any)
}
function makeCtx(id: string) { return { params: Promise.resolve({ id }) } }

describe('API /employees', () => {
  beforeEach(() => { vi.clearAllMocks() })

  describe('GET /api/employees', () => {
    it('should return all employees for EMPLEADORA', async () => {
      vi.mocked(db.user.findMany).mockResolvedValue([{ id: 'emp-1', name: 'Tomás', email: 'tomas@test.com', role: 'EMPLEADO', employeeRole: 'PROFESOR', hourlyRate: 5000, phone: '12345678', active: true, image: null, createdAt: new Date(), _count: { timeEntries: 10 } }] as any)
      const response = await getEmployees(createRequest('/api/employees'))
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
    })

    it('should filter by role', async () => {
      vi.mocked(db.user.findMany).mockResolvedValue([] as any)
      const response = await getEmployees(createRequest('/api/employees?role=PROFESOR'))
      expect(response.status).toBe(200)
      expect(db.user.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ employeeRole: 'PROFESOR' }) }))
    })

    it('should filter by active status', async () => {
      vi.mocked(db.user.findMany).mockResolvedValue([] as any)
      const response = await getEmployees(createRequest('/api/employees?active=true'))
      expect(response.status).toBe(200)
      expect(db.user.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ active: true }) }))
    })

    it('should return empty array when no employees', async () => {
      vi.mocked(db.user.findMany).mockResolvedValue([] as any)
      const response = await getEmployees(createRequest('/api/employees'))
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual([])
    })

    it('should return 401 when not authenticated', async () => {
      vi.resetModules()
      vi.doMock('@/auth', () => ({ auth: vi.fn().mockResolvedValue(null) }))
      const { GET } = await import('@/app/api/employees/route')
      const response = await GET(createRequest('/api/employees'))
      const data = await response.json()
      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
    })

    it('should return 403 when not EMPLEADORA', async () => {
      vi.resetModules()
      vi.doMock('@/auth', () => ({ auth: vi.fn().mockResolvedValue({ user: { id: 'emp-1', name: 'Employee', email: 'emp@test.com', role: 'EMPLEADO' } }) }))
      const { GET } = await import('@/app/api/employees/route')
      const response = await GET(createRequest('/api/employees'))
      const data = await response.json()
      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Sin permisos')
    })
  })

  describe('POST /api/employees', () => {
    it('should create a new employee with valid data', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(null)
      vi.mocked(db.user.create).mockResolvedValue({ id: 'emp-new', name: 'Nuevo Empleado', email: 'nuevo@test.com', role: 'EMPLEADO', employeeRole: 'PROFESOR', hourlyRate: 5000, phone: '12345678', active: true, createdAt: new Date() } as any)
      const response = await createEmployee(createRequest('/api/employees', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Nuevo Empleado', email: 'nuevo@test.com', password: 'password123', employeeRole: 'PROFESOR', hourlyRate: 5000, phone: '12345678' }) }))
      const data = await response.json()
      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.name).toBe('Nuevo Empleado')
    })

    it('should fail with missing required fields', async () => {
      const response = await createEmployee(createRequest('/api/employees', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Test', email: 'test@test.com' }) }))
      const data = await response.json()
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('requeridos')
    })

    it('should fail with duplicate email', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue({ id: 'existing-emp', email: 'existing@test.com' } as any)
      const response = await createEmployee(createRequest('/api/employees', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Test', email: 'existing@test.com', password: 'password123', employeeRole: 'PROFESOR' }) }))
      const data = await response.json()
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Ya existe')
    })
  })
})

describe('API /employees/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mocks that are shared between tests
    vi.mocked(db.user.findUnique).mockReset()
    vi.mocked(db.user.delete).mockReset()
    vi.mocked(db.user.update).mockReset()
  })

  describe('GET /api/employees/[id]', () => {
    it('should return a single employee by id', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue({ id: 'emp-1', name: 'Tomás', email: 'tomas@test.com', role: 'EMPLEADO', employeeRole: 'PROFESOR', hourlyRate: 5000, phone: '12345678', active: true, image: null, createdAt: new Date(), _count: { timeEntries: 10 } } as any)
      const response = await getEmployeeById(createRequest('/api/employees/emp-1'), makeCtx('emp-1'))
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.name).toBe('Tomás')
    })

    it('should return 404 when employee not found', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(null)
      const response = await getEmployeeById(createRequest('/api/employees/non-existent'), makeCtx('non-existent'))
      const data = await response.json()
      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
    })
  })

  describe('PUT /api/employees/[id]', () => {
    it('should update employee name', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValueOnce({ id: 'emp-1', email: 'tomas@test.com' } as any).mockResolvedValueOnce(null)
      vi.mocked(db.user.update).mockResolvedValue({ id: 'emp-1', name: 'Tomás Updated', email: 'tomas@test.com', role: 'EMPLEADO', employeeRole: 'PROFESOR', hourlyRate: 5000, phone: '12345678', active: true, createdAt: new Date() } as any)
      const response = await updateEmployee(createRequest('/api/employees/emp-1', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Tomás Updated' }) }), makeCtx('emp-1'))
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.name).toBe('Tomás Updated')
    })

    it('should return 404 when employee not found for update', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(null)
      const response = await updateEmployee(createRequest('/api/employees/non-existent', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Updated' }) }), makeCtx('non-existent'))
      const data = await response.json()
      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
    })

    it('should fail with duplicate email on update', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValueOnce({ id: 'emp-1', email: 'tomas@test.com' } as any).mockResolvedValueOnce({ id: 'emp-2', email: 'other@test.com' } as any)
      const response = await updateEmployee(createRequest('/api/employees/emp-1', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'other@test.com' }) }), makeCtx('emp-1'))
      const data = await response.json()
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Ya existe')
    })
  })

  describe('DELETE /api/employees/[id]', () => {
    it('should delete an employee', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue({ id: 'emp-1' } as any)
      vi.mocked(db.user.delete).mockResolvedValue({ id: 'emp-1' } as any)
      const response = await deleteEmployee(createRequest('/api/employees/emp-1', { method: 'DELETE' }), makeCtx('emp-1'))
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(db.user.delete).toHaveBeenCalledWith({ where: { id: 'emp-1' } })
    })

    it('should return 400 when trying to delete yourself', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue({ id: 'admin-1' } as any)
      const response = await deleteEmployee(createRequest('/api/employees/admin-1', { method: 'DELETE' }), makeCtx('admin-1'))
      const data = await response.json()
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('No puedes eliminar')
    })
  })
})
