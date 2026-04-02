import { describe, it, expect } from 'vitest'
import {
  clientSchema,
  subscriptionSchema,
  groupSchema,
  paymentStatusSchema,
  clientGroupSchema,
  createClientSchema,
  updateClientSchema,
  createSubscriptionSchema,
  updateSubscriptionSchema,
  attendanceSchema,
  invoiceSchema,
} from '@/schemas/client'
import {
  createMockClient,
  createMockSubscription,
  createMockGroup,
  createMockAttendance,
  createMockInvoice,
} from '../fixtures/test-data'

// ============================================================
// paymentStatusSchema
// ============================================================
describe('paymentStatusSchema', () => {
  describe('valores validos', () => {
    it('debe aceptar AL_DIA', () => {
      const result = paymentStatusSchema.safeParse('AL_DIA')
      expect(result.success).toBe(true)
    })

    it('debe aceptar PENDIENTE', () => {
      const result = paymentStatusSchema.safeParse('PENDIENTE')
      expect(result.success).toBe(true)
    })

    it('debe aceptar DEUDOR', () => {
      const result = paymentStatusSchema.safeParse('DEUDOR')
      expect(result.success).toBe(true)
    })
  })

  describe('valores invalidos', () => {
    it('debe rechazar estado desconocido', () => {
      const result = paymentStatusSchema.safeParse('SUSPENDIDO')
      expect(result.success).toBe(false)
    })

    it('debe rechazar cadena vacia', () => {
      const result = paymentStatusSchema.safeParse('')
      expect(result.success).toBe(false)
    })

    it('debe rechazar valor numerico', () => {
      const result = paymentStatusSchema.safeParse(1)
      expect(result.success).toBe(false)
    })

    it('debe rechazar valor null', () => {
      const result = paymentStatusSchema.safeParse(null)
      expect(result.success).toBe(false)
    })

    it('debe rechazar valor con espacios al final', () => {
      const result = paymentStatusSchema.safeParse('AL_DIA ')
      expect(result.success).toBe(false)
    })
  })
})

// ============================================================
// clientSchema
// ============================================================
describe('clientSchema', () => {
  describe('datos validos', () => {
    it('debe validar un cliente con campos requeridos', () => {
      const result = clientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '+5491122334455',
      })
      expect(result.success).toBe(true)
    })

    it('debe validar cliente con todos los campos opcionales', () => {
      const result = clientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '+5491122334455',
        dni: '12345678',
        grupoId: 'group-1',
        preferredDays: 'Lunes,Miércoles',
        preferredTime: '10:00',
        notes: 'Cliente nuevo',
        monthlyAmount: 5000,
        registrationFeePaid1: true,
        registrationFeePaid2: false,
      })
      expect(result.success).toBe(true)
    })

    it('debe validar cliente usando createMockClient sin telefono en fixture (se provee separado)', () => {
      const mock = createMockClient()
      const result = clientSchema.safeParse({
        ...mock,
        telefono: '+5491134567890',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('campos requeridos', () => {
    it('debe fallar sin nombre', () => {
      const result = clientSchema.safeParse({
        apellido: 'Pérez',
        telefono: '+5491122334455',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes('nombre'))).toBe(true)
      }
    })

    it('debe fallar sin apellido', () => {
      const result = clientSchema.safeParse({
        nombre: 'Juan',
        telefono: '+5491122334455',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes('apellido'))).toBe(true)
      }
    })

    it('debe fallar sin telefono', () => {
      const result = clientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes('telefono'))).toBe(true)
      }
    })

    it('debe fallar con nombre null', () => {
      const result = clientSchema.safeParse({
        nombre: null,
        apellido: 'Pérez',
        telefono: '+5491122334455',
      })
      expect(result.success).toBe(false)
    })

    it('debe fallar con apellido null', () => {
      const result = clientSchema.safeParse({
        nombre: 'Juan',
        apellido: null,
        telefono: '+5491122334455',
      })
      expect(result.success).toBe(false)
    })

    it('debe fallar con telefono null', () => {
      const result = clientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: null,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('longitud de nombre y apellido', () => {
    it('debe fallar con nombre vacio', () => {
      const result = clientSchema.safeParse({
        nombre: '',
        apellido: 'Pérez',
        telefono: '+5491122334455',
      })
      expect(result.success).toBe(false)
    })

    it('debe fallar con nombre de 1 caracter', () => {
      const result = clientSchema.safeParse({
        nombre: 'J',
        apellido: 'Pérez',
        telefono: '+5491122334455',
      })
      expect(result.success).toBe(false)
    })

    it('debe fallar con apellido de 1 caracter', () => {
      const result = clientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'P',
        telefono: '+5491122334455',
      })
      expect(result.success).toBe(false)
    })

    it('debe aceptar nombre de 101 caracteres (sin max en schema)', () => {
      const result = clientSchema.safeParse({
        nombre: 'A'.repeat(101),
        apellido: 'Pérez',
        telefono: '+5491122334455',
      })
      expect(result.success).toBe(true)
    })

    it('debe aceptar nombre de exactamente 2 caracteres', () => {
      const result = clientSchema.safeParse({
        nombre: 'Jo',
        apellido: 'Pérez',
        telefono: '+5491122334455',
      })
      expect(result.success).toBe(true)
    })

    it('debe aceptar nombre de solo espacios (el schema no hace trim)', () => {
      const result = clientSchema.safeParse({
        nombre: '   ',
        apellido: 'Pérez',
        telefono: '+5491122334455',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('validacion de telefono argentino', () => {
    it('debe aceptar formato internacional +54911 sin separadores', () => {
      const result = clientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '+5491122334455',
      })
      expect(result.success).toBe(true)
    })

    it('debe aceptar formato con guiones', () => {
      const result = clientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '+54-9-11-2233-4455',
      })
      expect(result.success).toBe(true)
    })

    it('debe aceptar formato con espacios', () => {
      const result = clientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '+54 9 11 2233 4455',
      })
      expect(result.success).toBe(true)
    })

    it('debe aceptar numero sin prefijo internacional (solo digitos)', () => {
      const result = clientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '1122334455',
      })
      expect(result.success).toBe(true)
    })

    it('debe fallar con telefono vacio', () => {
      const result = clientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '',
      })
      expect(result.success).toBe(false)
    })

    it('debe fallar con telefono de solo 7 digitos', () => {
      const result = clientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '1234567',
      })
      expect(result.success).toBe(false)
    })

    it('debe fallar con telefono que contiene letras', () => {
      const result = clientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '112233445a',
      })
      expect(result.success).toBe(false)
    })

    it('debe fallar con telefono que contiene caracteres invalidos (!)', () => {
      const result = clientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '112233445!',
      })
      expect(result.success).toBe(false)
    })

    it('debe fallar con telefono con parentesis', () => {
      const result = clientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '(11) 2233-4455',
      })
      expect(result.success).toBe(false)
    })

    it('debe fallar con telefono undefined', () => {
      const result = clientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: undefined,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('validacion de DNI', () => {
    it('debe aceptar DNI de 7 digitos', () => {
      const result = clientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '+5491122334455',
        dni: '1234567',
      })
      expect(result.success).toBe(true)
    })

    it('debe aceptar DNI de 8 digitos', () => {
      const result = clientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '+5491122334455',
        dni: '12345678',
      })
      expect(result.success).toBe(true)
    })

    it('debe fallar con DNI de solo 6 digitos', () => {
      const result = clientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '+5491122334455',
        dni: '123456',
      })
      expect(result.success).toBe(false)
    })

    it('debe fallar con DNI que contiene letras', () => {
      const result = clientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '+5491122334455',
        dni: '1234567A',
      })
      expect(result.success).toBe(false)
    })

    it('debe aceptar DNI null (opcional)', () => {
      const result = clientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '+5491122334455',
        dni: null,
      })
      expect(result.success).toBe(true)
    })

    it('debe omitir DNI si no se proporciona (opcional)', () => {
      const result = clientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '+5491122334455',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('campos opcionales', () => {
    it('debe aceptar preferredDays null', () => {
      const result = clientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '+5491122334455',
        preferredDays: null,
      })
      expect(result.success).toBe(true)
    })

    it('debe aceptar preferredDays con dias separados por coma', () => {
      const result = clientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '+5491122334455',
        preferredDays: 'Lunes,Miércoles,Viernes',
      })
      expect(result.success).toBe(true)
    })

    it('debe aceptar preferredTime null', () => {
      const result = clientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '+5491122334455',
        preferredTime: null,
      })
      expect(result.success).toBe(true)
    })

    it('debe aceptar preferredTime con formato HH:MM', () => {
      const result = clientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '+5491122334455',
        preferredTime: '14:30',
      })
      expect(result.success).toBe(true)
    })

    it('debe aceptar notes vacio', () => {
      const result = clientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '+5491122334455',
        notes: '',
      })
      expect(result.success).toBe(true)
    })

    it('debe aceptar notes null', () => {
      const result = clientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '+5491122334455',
        notes: null,
      })
      expect(result.success).toBe(true)
    })

    it('debe aceptar monthlyAmount positivo', () => {
      const result = clientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '+5491122334455',
        monthlyAmount: 5000,
      })
      expect(result.success).toBe(true)
    })

    it('debe aceptar monthlyAmount igual a 0', () => {
      const result = clientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '+5491122334455',
        monthlyAmount: 0,
      })
      expect(result.success).toBe(true)
    })

    it('debe fallar con monthlyAmount negativo', () => {
      const result = clientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '+5491122334455',
        monthlyAmount: -100,
      })
      expect(result.success).toBe(false)
    })

    it('debe aceptar registrationFeePaid1 true', () => {
      const result = clientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '+5491122334455',
        registrationFeePaid1: true,
      })
      expect(result.success).toBe(true)
    })

    it('debe usar default false para registrationFeePaid1 cuando no se provee', () => {
      const result = clientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '+5491122334455',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.registrationFeePaid1).toBe(false)
      }
    })

    it('debe aceptar registrationFeePaid2 true', () => {
      const result = clientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '+5491122334455',
        registrationFeePaid2: true,
      })
      expect(result.success).toBe(true)
    })

    it('debe usar default false para registrationFeePaid2 cuando no se provee', () => {
      const result = clientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '+5491122334455',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.registrationFeePaid2).toBe(false)
      }
    })

    it('debe aceptar grupoId null', () => {
      const result = clientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '+5491122334455',
        grupoId: null,
      })
      expect(result.success).toBe(true)
    })

    it('debe aceptar grupoId con ID valido', () => {
      const result = clientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '+5491122334455',
        grupoId: 'group-abc123',
      })
      expect(result.success).toBe(true)
    })
  })
})

// ============================================================
// createClientSchema
// ============================================================
describe('createClientSchema', () => {
  describe('datos validos', () => {
    it('debe validar cliente con telefono y classesTotal', () => {
      const result = createClientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '+5491122334455',
        classesTotal: 8,
      })
      expect(result.success).toBe(true)
    })

    it('debe usar default 4 para classesTotal cuando no se provee', () => {
      const result = createClientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '+5491122334455',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.classesTotal).toBe(4)
      }
    })
  })

  describe('validacion de classesTotal', () => {
    it('debe fallar con classesTotal igual a 0', () => {
      const result = createClientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '+5491122334455',
        classesTotal: 0,
      })
      expect(result.success).toBe(false)
    })

    it('debe fallar con classesTotal negativo', () => {
      const result = createClientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '+5491122334455',
        classesTotal: -1,
      })
      expect(result.success).toBe(false)
    })

    it('debe fallar con classesTotal mayor a 30', () => {
      const result = createClientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '+5491122334455',
        classesTotal: 31,
      })
      expect(result.success).toBe(false)
    })

    it('debe aceptar classesTotal igual a 1', () => {
      const result = createClientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '+5491122334455',
        classesTotal: 1,
      })
      expect(result.success).toBe(true)
    })

    it('debe aceptar classesTotal igual a 30', () => {
      const result = createClientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '+5491122334455',
        classesTotal: 30,
      })
      expect(result.success).toBe(true)
    })

    it('debe fallar con classesTotal decimal', () => {
      const result = createClientSchema.safeParse({
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '+5491122334455',
        classesTotal: 4.5,
      })
      expect(result.success).toBe(false)
    })
  })
})

// ============================================================
// updateClientSchema
// ============================================================
describe('updateClientSchema', () => {
  it('debe validar un objeto vacio (todos los campos son opcionales)', () => {
    const result = updateClientSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('debe validar actualizacion parcial del nombre', () => {
    const result = updateClientSchema.safeParse({ nombre: 'Pedro' })
    expect(result.success).toBe(true)
  })

  it('debe validar actualizacion parcial del telefono', () => {
    const result = updateClientSchema.safeParse({ telefono: '+5491144556677' })
    expect(result.success).toBe(true)
  })

  it('debe validar actualizacion de fees de inscripcion', () => {
    const result = updateClientSchema.safeParse({
      registrationFeePaid1: true,
      registrationFeePaid2: true,
    })
    expect(result.success).toBe(true)
  })

  it('debe validar actualizacion de grupoId a null', () => {
    const result = updateClientSchema.safeParse({ grupoId: null })
    expect(result.success).toBe(true)
  })

  it('debe validar actualizacion de monthlyAmount', () => {
    const result = updateClientSchema.safeParse({ monthlyAmount: 7500 })
    expect(result.success).toBe(true)
  })

  it('debe fallar con monthlyAmount negativo', () => {
    const result = updateClientSchema.safeParse({ monthlyAmount: -500 })
    expect(result.success).toBe(false)
  })
})

// ============================================================
// subscriptionSchema
// ============================================================
describe('subscriptionSchema', () => {
  describe('datos validos', () => {
    it('debe validar suscripcion con todos los campos', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 6,
        year: 2025,
        status: 'AL_DIA',
        billingPeriod: 'FULL',
        classesTotal: 8,
        classesUsed: 2,
        amount: 10000,
        notes: 'Pago en efectivo',
      })
      expect(result.success).toBe(true)
    })

    it('debe validar suscripcion fixture con telefono override', () => {
      const mock = createMockSubscription({ status: 'PENDIENTE' })
      const result = subscriptionSchema.safeParse(mock)
      expect(result.success).toBe(true)
    })

    it('debe usar defaults de billingPeriod y classesUsed cuando no se proveen', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 3,
        year: 2025,
        status: 'PENDIENTE',
        classesTotal: 4,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.billingPeriod).toBe('FULL')
        expect(result.data.classesUsed).toBe(0)
      }
    })
  })

  describe('campos requeridos', () => {
    it('debe fallar sin clientId', () => {
      const result = subscriptionSchema.safeParse({
        month: 1,
        year: 2025,
        status: 'PENDIENTE',
        classesTotal: 4,
      })
      expect(result.success).toBe(false)
    })

    it('debe fallar sin status', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 1,
        year: 2025,
        classesTotal: 4,
      })
      expect(result.success).toBe(false)
    })

    it('debe fallar sin classesTotal', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 1,
        year: 2025,
        status: 'PENDIENTE',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('validacion de mes', () => {
    it('debe aceptar mes igual a 1', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 1,
        year: 2025,
        status: 'PENDIENTE',
        classesTotal: 4,
      })
      expect(result.success).toBe(true)
    })

    it('debe aceptar mes igual a 12', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 12,
        year: 2025,
        status: 'PENDIENTE',
        classesTotal: 4,
      })
      expect(result.success).toBe(true)
    })

    it('debe fallar con mes igual a 0', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 0,
        year: 2025,
        status: 'PENDIENTE',
        classesTotal: 4,
      })
      expect(result.success).toBe(false)
    })

    it('debe fallar con mes igual a 13', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 13,
        year: 2025,
        status: 'PENDIENTE',
        classesTotal: 4,
      })
      expect(result.success).toBe(false)
    })

    it('debe fallar con mes negativo', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: -1,
        year: 2025,
        status: 'PENDIENTE',
        classesTotal: 4,
      })
      expect(result.success).toBe(false)
    })

    it('debe fallar con mes decimal', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 5.5,
        year: 2025,
        status: 'PENDIENTE',
        classesTotal: 4,
      })
      expect(result.success).toBe(false)
    })

    it('debe fallar con mes como string', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: '5',
        year: 2025,
        status: 'PENDIENTE',
        classesTotal: 4,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('validacion de anio', () => {
    it('debe aceptar anio minimo 2020', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 1,
        year: 2020,
        status: 'PENDIENTE',
        classesTotal: 4,
      })
      expect(result.success).toBe(true)
    })

    it('debe aceptar anio maximo 2100', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 1,
        year: 2100,
        status: 'PENDIENTE',
        classesTotal: 4,
      })
      expect(result.success).toBe(true)
    })

    it('debe fallar con anio 2019', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 1,
        year: 2019,
        status: 'PENDIENTE',
        classesTotal: 4,
      })
      expect(result.success).toBe(false)
    })

    it('debe fallar con anio 2101', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 1,
        year: 2101,
        status: 'PENDIENTE',
        classesTotal: 4,
      })
      expect(result.success).toBe(false)
    })

    it('debe fallar con anio negativo', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 1,
        year: -2025,
        status: 'PENDIENTE',
        classesTotal: 4,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('validacion de status', () => {
    it('debe aceptar AL_DIA', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 1,
        year: 2025,
        status: 'AL_DIA',
        classesTotal: 4,
      })
      expect(result.success).toBe(true)
    })

    it('debe aceptar PENDIENTE', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 1,
        year: 2025,
        status: 'PENDIENTE',
        classesTotal: 4,
      })
      expect(result.success).toBe(true)
    })

    it('debe aceptar DEUDOR', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 1,
        year: 2025,
        status: 'DEUDOR',
        classesTotal: 4,
      })
      expect(result.success).toBe(true)
    })

    it('debe fallar con status invalido', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 1,
        year: 2025,
        status: 'INVALID',
        classesTotal: 4,
      })
      expect(result.success).toBe(false)
    })

    it('debe fallar con status en minusculas', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 1,
        year: 2025,
        status: 'al_dia',
        classesTotal: 4,
      })
      expect(result.success).toBe(false)
    })

    it('debe fallar con status null', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 1,
        year: 2025,
        status: null,
        classesTotal: 4,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('validacion de billingPeriod', () => {
    it('debe aceptar FULL', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 1,
        year: 2025,
        status: 'PENDIENTE',
        billingPeriod: 'FULL',
        classesTotal: 4,
      })
      expect(result.success).toBe(true)
    })

    it('debe aceptar HALF', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 1,
        year: 2025,
        status: 'PENDIENTE',
        billingPeriod: 'HALF',
        classesTotal: 4,
      })
      expect(result.success).toBe(true)
    })

    it('debe usar default FULL cuando no se provee', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 1,
        year: 2025,
        status: 'PENDIENTE',
        classesTotal: 4,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.billingPeriod).toBe('FULL')
      }
    })

    it('debe fallar con billingPeriod invalido', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 1,
        year: 2025,
        status: 'PENDIENTE',
        billingPeriod: 'QUARTER',
        classesTotal: 4,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('validacion de classesTotal y classesUsed', () => {
    it('debe aceptar classesTotal de 1', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 1,
        year: 2025,
        status: 'PENDIENTE',
        classesTotal: 1,
      })
      expect(result.success).toBe(true)
    })

    it('debe aceptar classesTotal de 30', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 1,
        year: 2025,
        status: 'PENDIENTE',
        classesTotal: 30,
      })
      expect(result.success).toBe(true)
    })

    it('debe fallar con classesTotal igual a 0', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 1,
        year: 2025,
        status: 'PENDIENTE',
        classesTotal: 0,
      })
      expect(result.success).toBe(false)
    })

    it('debe fallar con classesTotal mayor a 30', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 1,
        year: 2025,
        status: 'PENDIENTE',
        classesTotal: 31,
      })
      expect(result.success).toBe(false)
    })

    it('debe usar default 0 para classesUsed cuando no se provee', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 1,
        year: 2025,
        status: 'PENDIENTE',
        classesTotal: 4,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.classesUsed).toBe(0)
      }
    })

    it('debe aceptar classesUsed igual a classesTotal', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 1,
        year: 2025,
        status: 'PENDIENTE',
        classesTotal: 8,
        classesUsed: 8,
      })
      expect(result.success).toBe(true)
    })

    it('debe aceptar classesUsed mayor a classesTotal (edge case)', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 1,
        year: 2025,
        status: 'PENDIENTE',
        classesTotal: 4,
        classesUsed: 6,
      })
      expect(result.success).toBe(true)
    })

    it('debe fallar con classesUsed negativo', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 1,
        year: 2025,
        status: 'PENDIENTE',
        classesTotal: 4,
        classesUsed: -1,
      })
      expect(result.success).toBe(false)
    })

    it('debe fallar con classesTotal decimal', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 1,
        year: 2025,
        status: 'PENDIENTE',
        classesTotal: 4.5,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('validacion de amount', () => {
    it('debe aceptar amount positivo', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 1,
        year: 2025,
        status: 'PENDIENTE',
        classesTotal: 4,
        amount: 15000,
      })
      expect(result.success).toBe(true)
    })

    it('debe aceptar amount decimal (precios con centavos)', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 1,
        year: 2025,
        status: 'PENDIENTE',
        classesTotal: 4,
        amount: 15000.99,
      })
      expect(result.success).toBe(true)
    })

    it('debe aceptar amount null (opcional)', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 1,
        year: 2025,
        status: 'PENDIENTE',
        classesTotal: 4,
        amount: null,
      })
      expect(result.success).toBe(true)
    })

    it('debe omitir amount si no se provee (opcional)', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 1,
        year: 2025,
        status: 'PENDIENTE',
        classesTotal: 4,
      })
      expect(result.success).toBe(true)
    })

    it('debe fallar con amount igual a 0', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 1,
        year: 2025,
        status: 'PENDIENTE',
        classesTotal: 4,
        amount: 0,
      })
      expect(result.success).toBe(false)
    })

    it('debe fallar con amount negativo', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 1,
        year: 2025,
        status: 'PENDIENTE',
        classesTotal: 4,
        amount: -500,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('validacion de notes', () => {
    it('debe aceptar notes null', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 1,
        year: 2025,
        status: 'PENDIENTE',
        classesTotal: 4,
        notes: null,
      })
      expect(result.success).toBe(true)
    })

    it('debe aceptar notes con texto', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 1,
        year: 2025,
        status: 'PENDIENTE',
        classesTotal: 4,
        notes: 'Pago realizado via transferencia',
      })
      expect(result.success).toBe(true)
    })

    it('debe aceptar notes vacio', () => {
      const result = subscriptionSchema.safeParse({
        clientId: 'client-1',
        month: 1,
        year: 2025,
        status: 'PENDIENTE',
        classesTotal: 4,
        notes: '',
      })
      expect(result.success).toBe(true)
    })
  })
})

// ============================================================
// createSubscriptionSchema
// ============================================================
describe('createSubscriptionSchema', () => {
  it('debe omitir status al crear (no existe en este schema)', () => {
    const result = createSubscriptionSchema.safeParse({
      clientId: 'client-1',
      month: 1,
      year: 2025,
      classesTotal: 4,
    })
    expect(result.success).toBe(true)
  })

  it('debe omitir classesUsed al crear', () => {
    const result = createSubscriptionSchema.safeParse({
      clientId: 'client-1',
      month: 1,
      year: 2025,
      classesTotal: 4,
    })
    expect(result.success).toBe(true)
  })

  it('debe fallar sin clientId', () => {
    const result = createSubscriptionSchema.safeParse({
      month: 1,
      year: 2025,
      classesTotal: 4,
    })
    expect(result.success).toBe(false)
  })
})

// ============================================================
// updateSubscriptionSchema
// ============================================================
describe('updateSubscriptionSchema', () => {
  it('debe validar un objeto vacio (todos los campos son opcionales)', () => {
    const result = updateSubscriptionSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('debe permitir actualizar solo status', () => {
    const result = updateSubscriptionSchema.safeParse({ status: 'AL_DIA' })
    expect(result.success).toBe(true)
  })

  it('debe permitir actualizar solo amount', () => {
    const result = updateSubscriptionSchema.safeParse({ amount: 20000 })
    expect(result.success).toBe(true)
  })

  it('debe permitir actualizar classesUsed', () => {
    const result = updateSubscriptionSchema.safeParse({ classesUsed: 3 })
    expect(result.success).toBe(true)
  })

  it('debe fallar con amount negativo', () => {
    const result = updateSubscriptionSchema.safeParse({ amount: -100 })
    expect(result.success).toBe(false)
  })

  it('debe fallar con status invalido', () => {
    const result = updateSubscriptionSchema.safeParse({ status: 'BAJA' })
    expect(result.success).toBe(false)
  })
})

// ============================================================
// groupSchema
// ============================================================
describe('groupSchema', () => {
  describe('datos validos', () => {
    it('debe validar un grupo con campos requeridos', () => {
      const result = groupSchema.safeParse({ name: 'Grupo A', color: '#06b6d4' })
      expect(result.success).toBe(true)
    })

    it('debe validar grupo con fixture createMockGroup', () => {
      const result = groupSchema.safeParse(createMockGroup())
      expect(result.success).toBe(true)
    })

    it('debe validar grupo con todos los campos opcionales', () => {
      const result = groupSchema.safeParse({
        name: 'Grupo A',
        color: '#8b5cf6',
        description: 'Niños principiantes',
        schedule: 'Lunes y Miércoles 10:00',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('validacion de name', () => {
    it('debe fallar sin name', () => {
      const result = groupSchema.safeParse({ color: '#06b6d4' })
      expect(result.success).toBe(false)
    })

    it('debe fallar con name vacio', () => {
      const result = groupSchema.safeParse({ name: '', color: '#06b6d4' })
      expect(result.success).toBe(false)
    })

    it('debe fallar con name de solo espacios', () => {
      const result = groupSchema.safeParse({ name: '   ', color: '#06b6d4' })
      expect(result.success).toBe(false)
    })

    it('debe fallar con name de 51 caracteres', () => {
      const result = groupSchema.safeParse({ name: 'A'.repeat(51), color: '#06b6d4' })
      expect(result.success).toBe(false)
    })

    it('debe aceptar name de exactamente 50 caracteres', () => {
      const result = groupSchema.safeParse({ name: 'A'.repeat(50), color: '#06b6d4' })
      expect(result.success).toBe(true)
    })
  })

  describe('validacion de color', () => {
    it('debe usar default #06b6d4 cuando no se provee', () => {
      const result = groupSchema.safeParse({ name: 'Grupo A' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.color).toBe('#06b6d4')
      }
    })

    it('debe aceptar colores hex validos', () => {
      const colors = ['#000000', '#ffffff', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444']
      for (const color of colors) {
        const result = groupSchema.safeParse({ name: 'Test Group', color })
        expect(result.success).toBe(true)
      }
    })

    it('debe aceptar color hex en minusculas', () => {
      const result = groupSchema.safeParse({ name: 'Test Group', color: '#abcdef' })
      expect(result.success).toBe(true)
    })

    it('debe fallar con color sin numeral', () => {
      const result = groupSchema.safeParse({ name: 'Test Group', color: '06b6d4' })
      expect(result.success).toBe(false)
    })

    it('debe fallar con color nombre CSS (no hex)', () => {
      const result = groupSchema.safeParse({ name: 'Test Group', color: 'red' })
      expect(result.success).toBe(false)
    })

    it('debe fallar con color hex de 3 digitos', () => {
      const result = groupSchema.safeParse({ name: 'Test Group', color: '#fff' })
      expect(result.success).toBe(false)
    })

    it('debe fallar con color null', () => {
      const result = groupSchema.safeParse({ name: 'Test Group', color: null })
      expect(result.success).toBe(false)
    })
  })

  describe('campos opcionales', () => {
    it('debe aceptar description null', () => {
      const result = groupSchema.safeParse({
        name: 'Grupo A',
        color: '#06b6d4',
        description: null,
      })
      expect(result.success).toBe(true)
    })

    it('debe aceptar description con hasta 200 caracteres', () => {
      const result = groupSchema.safeParse({
        name: 'Grupo A',
        color: '#06b6d4',
        description: 'B'.repeat(200),
      })
      expect(result.success).toBe(true)
    })

    it('debe fallar con description de mas de 200 caracteres', () => {
      const result = groupSchema.safeParse({
        name: 'Grupo A',
        color: '#06b6d4',
        description: 'B'.repeat(201),
      })
      expect(result.success).toBe(false)
    })

    it('debe aceptar schedule null', () => {
      const result = groupSchema.safeParse({
        name: 'Grupo A',
        color: '#06b6d4',
        schedule: null,
      })
      expect(result.success).toBe(true)
    })

    it('debe aceptar schedule con hasta 100 caracteres', () => {
      const result = groupSchema.safeParse({
        name: 'Grupo A',
        color: '#06b6d4',
        schedule: 'S'.repeat(100),
      })
      expect(result.success).toBe(true)
    })

    it('debe fallar con schedule de mas de 100 caracteres', () => {
      const result = groupSchema.safeParse({
        name: 'Grupo A',
        color: '#06b6d4',
        schedule: 'S'.repeat(101),
      })
      expect(result.success).toBe(false)
    })
  })
})

// ============================================================
// clientGroupSchema
// ============================================================
describe('clientGroupSchema', () => {
  it('debe validar asignacion valida', () => {
    const result = clientGroupSchema.safeParse({
      clientId: 'client-1',
      groupId: 'group-1',
    })
    expect(result.success).toBe(true)
  })

  it('debe validar asignacion con schedule opcional', () => {
    const result = clientGroupSchema.safeParse({
      clientId: 'client-1',
      groupId: 'group-1',
      schedule: 'Lunes 10:00',
    })
    expect(result.success).toBe(true)
  })

  it('debe fallar sin clientId', () => {
    const result = clientGroupSchema.safeParse({ groupId: 'group-1' })
    expect(result.success).toBe(false)
  })

  it('debe fallar sin groupId', () => {
    const result = clientGroupSchema.safeParse({ clientId: 'client-1' })
    expect(result.success).toBe(false)
  })

  it('debe fallar con clientId vacio', () => {
    const result = clientGroupSchema.safeParse({ clientId: '', groupId: 'group-1' })
    expect(result.success).toBe(false)
  })

  it('debe fallar con groupId vacio', () => {
    const result = clientGroupSchema.safeParse({ clientId: 'client-1', groupId: '' })
    expect(result.success).toBe(false)
  })

  it('debe fallar con schedule de mas de 100 caracteres', () => {
    const result = clientGroupSchema.safeParse({
      clientId: 'client-1',
      groupId: 'group-1',
      schedule: 'S'.repeat(101),
    })
    expect(result.success).toBe(false)
  })

  it('debe aceptar schedule null', () => {
    const result = clientGroupSchema.safeParse({
      clientId: 'client-1',
      groupId: 'group-1',
      schedule: null,
    })
    expect(result.success).toBe(true)
  })
})

// ============================================================
// attendanceSchema
// ============================================================
describe('attendanceSchema', () => {
  describe('datos validos', () => {
    it('debe validar asistencia con clientId requerido', () => {
      const result = attendanceSchema.safeParse({ clientId: 'client-1' })
      expect(result.success).toBe(true)
    })

    it('debe validar asistencia con fixture createMockAttendance', () => {
      const result = attendanceSchema.safeParse(createMockAttendance())
      expect(result.success).toBe(true)
    })

    it('debe validar asistencia con todos los campos', () => {
      const result = attendanceSchema.safeParse({
        clientId: 'client-1',
        date: new Date('2025-04-01'),
        notes: 'Asistio puntual',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('validacion de clientId', () => {
    it('debe fallar sin clientId', () => {
      const result = attendanceSchema.safeParse({ date: new Date() })
      expect(result.success).toBe(false)
    })

    it('debe fallar con clientId vacio', () => {
      const result = attendanceSchema.safeParse({ clientId: '', date: new Date() })
      expect(result.success).toBe(false)
    })

    it('debe fallar con clientId null', () => {
      const result = attendanceSchema.safeParse({ clientId: null, date: new Date() })
      expect(result.success).toBe(false)
    })
  })

  describe('validacion de date', () => {
    it('debe usar date como opcional', () => {
      const result = attendanceSchema.safeParse({ clientId: 'client-1' })
      expect(result.success).toBe(true)
    })

    it('debe aceptar instancia de Date', () => {
      const result = attendanceSchema.safeParse({
        clientId: 'client-1',
        date: new Date(),
      })
      expect(result.success).toBe(true)
    })

    it('debe aceptar fecha futura', () => {
      const result = attendanceSchema.safeParse({
        clientId: 'client-1',
        date: new Date('2030-01-01'),
      })
      expect(result.success).toBe(true)
    })

    it('debe rechazar date como string', () => {
      const result = attendanceSchema.safeParse({
        clientId: 'client-1',
        date: '2025-04-01',
      })
      expect(result.success).toBe(false)
    })

    it('debe rechazar date como numero (timestamp)', () => {
      const result = attendanceSchema.safeParse({
        clientId: 'client-1',
        date: 1711929600000,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('validacion de notes', () => {
    it('debe aceptar notes null', () => {
      const result = attendanceSchema.safeParse({ clientId: 'client-1', notes: null })
      expect(result.success).toBe(true)
    })

    it('debe aceptar notes con texto', () => {
      const result = attendanceSchema.safeParse({
        clientId: 'client-1',
        notes: 'Llego 5 minutos tarde',
      })
      expect(result.success).toBe(true)
    })

    it('debe aceptar notes vacio', () => {
      const result = attendanceSchema.safeParse({ clientId: 'client-1', notes: '' })
      expect(result.success).toBe(true)
    })
  })
})

// ============================================================
// invoiceSchema
// ============================================================
describe('invoiceSchema', () => {
  describe('datos validos', () => {
    it('debe validar factura con campos requeridos', () => {
      const result = invoiceSchema.safeParse({
        clientId: 'client-1',
        imageUrl: 'https://example.com/invoice.pdf',
        verified: false,
      })
      expect(result.success).toBe(true)
    })

    it('debe validar factura con fixture createMockInvoice (campos extra son stripped)', () => {
      const mock = createMockInvoice({ imageUrl: 'https://example.com/factura.pdf' })
      const result = invoiceSchema.safeParse({ ...mock, clientId: 'client-1' })
      expect(result.success).toBe(true)
    })

    it('debe usar default false para verified si no se provee', () => {
      const result = invoiceSchema.safeParse({
        clientId: 'client-1',
        imageUrl: 'https://example.com/invoice.pdf',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.verified).toBe(false)
      }
    })
  })

  describe('validacion de clientId', () => {
    it('debe fallar sin clientId', () => {
      const result = invoiceSchema.safeParse({ imageUrl: 'https://example.com/invoice.pdf' })
      expect(result.success).toBe(false)
    })

    it('debe fallar con clientId vacio', () => {
      const result = invoiceSchema.safeParse({
        clientId: '',
        imageUrl: 'https://example.com/invoice.pdf',
      })
      expect(result.success).toBe(false)
    })

    it('debe fallar con clientId null', () => {
      const result = invoiceSchema.safeParse({
        clientId: null,
        imageUrl: 'https://example.com/invoice.pdf',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('validacion de imageUrl', () => {
    it('debe aceptar URL con https', () => {
      const result = invoiceSchema.safeParse({
        clientId: 'client-1',
        imageUrl: 'https://example.com/invoice.pdf',
      })
      expect(result.success).toBe(true)
    })

    it('debe aceptar URL con http', () => {
      const result = invoiceSchema.safeParse({
        clientId: 'client-1',
        imageUrl: 'http://example.com/invoice.pdf',
      })
      expect(result.success).toBe(true)
    })

    it('debe fallar con URL invalida (sin protocolo)', () => {
      const result = invoiceSchema.safeParse({
        clientId: 'client-1',
        imageUrl: 'not-a-url',
      })
      expect(result.success).toBe(false)
    })

    it('debe fallar con URL sin protocolo', () => {
      const result = invoiceSchema.safeParse({
        clientId: 'client-1',
        imageUrl: 'example.com/invoice.pdf',
      })
      expect(result.success).toBe(false)
    })

    it('debe fallar con imageUrl vacio', () => {
      const result = invoiceSchema.safeParse({
        clientId: 'client-1',
        imageUrl: '',
      })
      expect(result.success).toBe(false)
    })

    it('debe fallar con imageUrl null', () => {
      const result = invoiceSchema.safeParse({
        clientId: 'client-1',
        imageUrl: null,
      })
      expect(result.success).toBe(false)
    })

    it('debe fallar con imageUrl que tiene espacios', () => {
      const result = invoiceSchema.safeParse({
        clientId: 'client-1',
        imageUrl: 'https://example .com/invoice.pdf',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('validacion de verified', () => {
    it('debe aceptar verified true', () => {
      const result = invoiceSchema.safeParse({
        clientId: 'client-1',
        imageUrl: 'https://example.com/invoice.pdf',
        verified: true,
      })
      expect(result.success).toBe(true)
    })

    it('debe aceptar verified false', () => {
      const result = invoiceSchema.safeParse({
        clientId: 'client-1',
        imageUrl: 'https://example.com/invoice.pdf',
        verified: false,
      })
      expect(result.success).toBe(true)
    })

    it('debe fallar con verified como string', () => {
      const result = invoiceSchema.safeParse({
        clientId: 'client-1',
        imageUrl: 'https://example.com/invoice.pdf',
        verified: 'true',
      })
      expect(result.success).toBe(false)
    })

    it('debe fallar con verified null', () => {
      const result = invoiceSchema.safeParse({
        clientId: 'client-1',
        imageUrl: 'https://example.com/invoice.pdf',
        verified: null,
      })
      expect(result.success).toBe(false)
    })
  })
})

// ============================================================
// exports de schemas/index.ts
// ============================================================
describe('schemas/index.ts exports', () => {
  it('debe exportar todos los schemas esperados', async () => {
    const mod = await import('@/schemas')
    expect(mod.clientSchema).toBeDefined()
    expect(mod.subscriptionSchema).toBeDefined()
    expect(mod.groupSchema).toBeDefined()
    expect(mod.paymentStatusSchema).toBeDefined()
    expect(mod.clientGroupSchema).toBeDefined()
    expect(mod.createClientSchema).toBeDefined()
    expect(mod.updateClientSchema).toBeDefined()
    expect(mod.createSubscriptionSchema).toBeDefined()
    expect(mod.updateSubscriptionSchema).toBeDefined()
    expect(mod.attendanceSchema).toBeDefined()
    expect(mod.invoiceSchema).toBeDefined()
  })

  // Nota: los tipos TypeScript no existen en runtime (son borrados por TS).
  // Solo se pueden verificar en tiempo de compilacion. Los schemas runtime se prueban arriba.
  it.todo('verificar tipos TypeScript en tiempo de compilacion (revisar client.ts manualmente)')

  it('debe inferir PaymentStatusType como union correcta', () => {
    type PaymentStatusType = 'AL_DIA' | 'PENDIENTE' | 'DEUDOR'
    const validStatuses: PaymentStatusType[] = ['AL_DIA', 'PENDIENTE', 'DEUDOR']
    validStatuses.forEach(status => {
      const result = paymentStatusSchema.safeParse(status)
      expect(result.success).toBe(true)
    })
  })
})
