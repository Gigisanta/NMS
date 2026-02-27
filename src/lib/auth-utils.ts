import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import type { Role } from '@prisma/client'

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// User creation with auto-generated credentials
export async function createUser(data: {
  name: string
  email: string
  password: string
  role?: Role
}): Promise<{ id: string; name: string | null; email: string; role: Role }> {
  const hashedPassword = await hashPassword(data.password)
  
  const user = await db.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role || 'EMPLEADO',
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  })
  
  return user
}

// Get user by email
export async function getUserByEmail(email: string) {
  return db.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      password: true,
      role: true,
      active: true,
    },
  })
}

// Validate credentials
export async function validateCredentials(email: string, password: string) {
  const user = await getUserByEmail(email)
  
  if (!user || !user.active) {
    return null
  }
  
  const isValid = await verifyPassword(password, user.password)
  
  if (!isValid) {
    return null
  }
  
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  }
}

// Role-based access control
export const rolePermissions = {
  EMPLEADORA: {
    canManageUsers: true,
    canManageClients: true,
    canManageGroups: true,
    canManagePayments: true,
    canViewReports: true,
    canViewSettings: true,
    canDeleteClients: true,
  },
  EMPLEADO: {
    canManageUsers: false,
    canManageClients: true,
    canManageGroups: false,
    canManagePayments: false,
    canViewReports: true,
    canViewSettings: false,
    canDeleteClients: false,
  },
} as const

export type Permission = keyof typeof rolePermissions.EMPLEADORA

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role][permission] ?? false
}

// Generate default password for new employees
export function generateDefaultPassword(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let password = ''
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}
