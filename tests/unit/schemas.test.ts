import { describe, it, expect } from 'vitest'
import { clientSchema, subscriptionSchema, groupSchema } from '@/schemas/client'

describe('clientSchema', () => {
  describe('valid data', () => {
    it('should validate a valid client', () => {
      const result = clientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '+5491122334455',
      })
      expect(result.success).toBe(true)
    })

    it('should validate client with all optional fields', () => {
      const result = clientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '+5491122334455',
        dni: '12345678',
        grupoId: 'group-1',
        preferredDays: 'Lunes,Miércoles',
        preferredTime: '10:00',
        notes: 'Cliente nuevo',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('required fields validation', () => {
    it('should fail without nombre', () => {
      const result = clientSchema.safeParse({
        apellido: 'Pérez',
        telefono: '+5491122334455',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes('nombre'))).toBe(true)
      }
    })

    it('should fail without apellido', () => {
      const result = clientSchema.safeParse({
        nombre: 'Juan',
        telefono: '+5491122334455',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes('apellido'))).toBe(true)
      }
    })

    it('should fail without telefono', () => {
      const result = clientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes('telefono'))).toBe(true)
      }
    })
  })

  describe('string length validation', () => {
    it('should fail with empty nombre', () => {
      const result = clientSchema.safeParse({
        nombre: '',
        apellido: 'Pérez',
        telefono: '+5491122334455',
      })
      expect(result.success).toBe(false)
    })

    it('should fail with very short nombre', () => {
      const result = clientSchema.safeParse({
        nombre: 'J',
        apellido: 'Pérez',
        telefono: '+5491122334455',
      })
      expect(result.success).toBe(false)
    })

    it('should fail with empty telefono', () => {
      const result = clientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '',
      })
      expect(result.success).toBe(false)
    })

    it('should fail with short telefono', () => {
      const result = clientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '1234567',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('optional fields', () => {
    it('should accept null dni', () => {
      const result = clientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '+5491122334455',
        dni: null,
      })
      expect(result.success).toBe(true)
    })

    it('should accept null grupoId', () => {
      const result = clientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '+5491122334455',
        grupoId: null,
      })
      expect(result.success).toBe(true)
    })

    it('should accept empty notes', () => {
      const result = clientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '+5491122334455',
        notes: '',
      })
      expect(result.success).toBe(true)
    })
  })
})

describe('subscriptionSchema', () => {
  describe('valid data', () => {
    it('should validate a valid subscription with status', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 2,
        year: 2024,
        status: 'PENDIENTE',
        classesTotal: 4,
      })
      expect(result.success).toBe(true)
    })
  })

  describe('field validations', () => {
    it('should fail with invalid month (too low)', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 0,
        year: 2024,
        status: 'PENDIENTE',
        classesTotal: 4,
      })
      expect(result.success).toBe(false)
    })

    it('should fail with invalid month (too high)', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 13,
        year: 2024,
        status: 'PENDIENTE',
        classesTotal: 4,
      })
      expect(result.success).toBe(false)
    })

    it('should accept month 1', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 1,
        year: 2024,
        status: 'PENDIENTE',
        classesTotal: 4,
      })
      expect(result.success).toBe(true)
    })

    it('should accept month 12', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 12,
        year: 2024,
        status: 'PENDIENTE',
        classesTotal: 4,
      })
      expect(result.success).toBe(true)
    })

    it('should fail with classesTotal less than 1', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 1,
        year: 2024,
        status: 'PENDIENTE',
        classesTotal: 0,
      })
      expect(result.success).toBe(false)
    })

    it('should fail with classesTotal too high', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 1,
        year: 2024,
        status: 'PENDIENTE',
        classesTotal: 50,
      })
      expect(result.success).toBe(false)
    })

    it('should fail with invalid year', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 1,
        year: 1999,
        status: 'PENDIENTE',
        classesTotal: 4,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('status validation', () => {
    it('should accept AL_DIA status', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 1,
        year: 2024,
        status: 'AL_DIA',
        classesTotal: 4,
      })
      expect(result.success).toBe(true)
    })

    it('should accept PENDIENTE status', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 1,
        year: 2024,
        status: 'PENDIENTE',
        classesTotal: 4,
      })
      expect(result.success).toBe(true)
    })

    it('should accept DEUDOR status', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 1,
        year: 2024,
        status: 'DEUDOR',
        classesTotal: 4,
      })
      expect(result.success).toBe(true)
    })

    it('should fail with invalid status', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 1,
        year: 2024,
        status: 'INVALID',
        classesTotal: 4,
      })
      expect(result.success).toBe(false)
    })
  })
})

describe('groupSchema', () => {
  describe('valid data', () => {
    it('should validate a valid group', () => {
      const result = groupSchema.safeParse({
        name: 'Grupo A',
        color: '#06b6d4',
      })
      expect(result.success).toBe(true)
    })

    it('should validate group with all optional fields', () => {
      const result = groupSchema.safeParse({
        name: 'Grupo A',
        color: '#06b6d4',
        description: 'Niños principiantes',
        schedule: 'Lunes y Miércoles 10:00',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('name validation', () => {
    it('should fail without name', () => {
      const result = groupSchema.safeParse({
        color: '#06b6d4',
      })
      expect(result.success).toBe(false)
    })

    it('should fail with empty name', () => {
      const result = groupSchema.safeParse({
        name: '',
        color: '#06b6d4',
      })
      expect(result.success).toBe(false)
    })

    it('should fail with very long name', () => {
      const result = groupSchema.safeParse({
        name: 'a'.repeat(51),
        color: '#06b6d4',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('color validation', () => {
    it('should accept hex color codes', () => {
      const colors = ['#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444', '#22c55e']
      for (const color of colors) {
        const result = groupSchema.safeParse({
          name: 'Test Group',
          color,
        })
        expect(result.success).toBe(true)
      }
    })

    it('should have default color when not provided', () => {
      const result = groupSchema.safeParse({
        name: 'Test Group',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.color).toBe('#06b6d4')
      }
    })

    it('should fail with invalid color format', () => {
      const result = groupSchema.safeParse({
        name: 'Test Group',
        color: 'red',
      })
      expect(result.success).toBe(false)
    })
  })
})
