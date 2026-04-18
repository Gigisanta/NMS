import { z } from 'zod'

// Payment Status Enum
export const paymentStatusSchema = z.enum(['AL_DIA', 'PENDIENTE', 'DEUDOR'])
export type PaymentStatusType = z.infer<typeof paymentStatusSchema>

// Group Schemas
export const groupSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(50, 'Máximo 50 caracteres').refine(s => s.trim().length > 0, 'El nombre no puede ser solo espacios'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido').default('#06b6d4'),
  description: z.string().max(200).optional().nullable(),
  schedule: z.string().max(100).optional().nullable(),
})

export const createGroupSchema = groupSchema
export const updateGroupSchema = groupSchema.partial()

export type GroupInput = z.infer<typeof groupSchema>
export type CreateGroupInput = z.infer<typeof createGroupSchema>
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>

// Client Schemas
export const clientSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  dni: z.string().regex(/^\d{7,8}$/, 'El DNI debe tener 7 u 8 dígitos').optional().nullable(),
  telefono: z.string()
    .min(8, 'El teléfono debe tener al menos 8 dígitos')
    .regex(/^\+?[\d\s\-]+$/, 'El teléfono debe tener formato válido (+54 11 ... ó 11 ...)')
    .optional()
    .nullable(),
  grupoId: z.string().optional().nullable(),
  preferredDays: z.string().optional().nullable(),
  preferredTime: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  monthlyAmount: z.number().min(0).optional().nullable(),
  registrationFeePaid1: z.boolean().optional().default(false),
  registrationFeePaid2: z.boolean().optional().default(false),
})

// Client-Group Assignment Schema
export const clientGroupSchema = z.object({
  clientId: z.string().min(1, 'El ID del cliente es requerido'),
  groupId: z.string().min(1, 'El ID del grupo es requerido'),
  schedule: z.string().max(100).optional().nullable(),
})

export const createClientGroupSchema = clientGroupSchema
export type CreateClientGroupInput = z.infer<typeof createClientGroupSchema>

export const createClientSchema = clientSchema.extend({
  classesTotal: z.number().int().min(1).max(30).optional().default(4),
  billingPeriod: z.enum(['FULL', 'HALF']).default('FULL'),
})

export const updateClientSchema = clientSchema.partial()

export type ClientInput = z.infer<typeof clientSchema>
export type CreateClientInput = z.infer<typeof createClientSchema>
export type UpdateClientInput = z.infer<typeof updateClientSchema>

// Subscription Schemas
export const subscriptionSchema = z.object({
  clientId: z.string(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
  status: paymentStatusSchema,
  billingPeriod: z.enum(['FULL', 'HALF']).default('FULL'),
  classesTotal: z.number().int().min(1).max(30),
  classesUsed: z.number().int().min(0).default(0),
  amount: z.number().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const createSubscriptionSchema = subscriptionSchema.omit({ status: true, classesUsed: true })
export const updateSubscriptionSchema = subscriptionSchema.partial()

export type SubscriptionInput = z.infer<typeof subscriptionSchema>
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>

// Attendance Schema
export const attendanceSchema = z.object({
  clientId: z.string().min(1, 'El clientId es requerido'),
  date: z.date().optional(),
  notes: z.string().optional().nullable(),
})

export type AttendanceInput = z.infer<typeof attendanceSchema>

// Invoice Schema
export const invoiceSchema = z.object({
  clientId: z.string().min(1, 'El clientId es requerido'),
  imageUrl: z.string().url(),
  verified: z.boolean().default(false),
})

export type InvoiceInput = z.infer<typeof invoiceSchema>
