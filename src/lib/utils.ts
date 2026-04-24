/**
 * @fileoverview Utilidades generales para el sistema NMS
 * @module lib/utils
 * @description Funciones de utilidad para formateo, fechas, monedas y manipulación de datos.
 * Incluye helpers para Tailwind CSS, formateo de moneda ARS, fechas en español,
 * números de teléfono y estados de pago.
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, isToday, isThisMonth, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Combina clases de Tailwind CSS de manera inteligente.
 * Utiliza clsx para combinar y twMerge para resolver conflictos.
 * 
 * @param {...ClassValue[]} inputs - Clases CSS a combinar
 * @returns {string} Clases CSS combinadas y optimizadas
 * 
 * @example
 * cn('px-4 py-2', 'bg-blue-500', { 'opacity-50': isDisabled })
 * // => 'px-4 py-2 bg-blue-500 opacity-50' (si isDisabled es true)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Formatea un número como moneda argentina (ARS).
 * No incluye decimales para mejor legibilidad.
 * 
 * @param {number} amount - Cantidad a formatear
 * @returns {string} Cantidad formateada como moneda ARS
 * 
 * @example
 * formatCurrency(5000) // => '$ 5.000'
 * formatCurrency(15000.50) // => '$ 15.000'
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Formatea una fecha en formato corto (dd/MM/yyyy).
 * Acepta tanto objetos Date como strings ISO.
 * 
 * @param {Date | string} date - Fecha a formatear
 * @returns {string} Fecha formateada en español
 * 
 * @example
 * formatDate(new Date('2026-02-26')) // => '26/02/2026'
 * formatDate('2026-02-26T10:00:00Z') // => '26/02/2026'
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'dd/MM/yyyy', { locale: es })
}

/**
 * Formatea una fecha con hora (dd/MM/yyyy HH:mm).
 * Útil para mostrar timestamps de creación/modificación.
 * 
 * @param {Date | string} date - Fecha a formatear
 * @returns {string} Fecha y hora formateadas
 * 
 * @example
 * formatDateTime('2026-02-26T14:30:00Z') // => '26/02/2026 14:30'
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'dd/MM/yyyy HH:mm', { locale: es })
}

/**
 * Formatea solo la hora de una fecha (HH:mm).
 * Útil para mostrar horarios de clases o asistencias.
 * 
 * @param {Date | string} date - Fecha a formatear
 * @returns {string} Hora formateada
 * 
 * @example
 * formatTime('2026-02-26T14:30:00Z') // => '14:30'
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'HH:mm', { locale: es })
}

/**
 * Formatea mes y año en formato largo (MMMM yyyy).
 * Útil para encabezados de suscripciones.
 * 
 * @param {number} month - Mes (1-12)
 * @param {number} year - Año (ej: 2026)
 * @returns {string} Mes y año formateados en español
 * 
 * @example
 * formatMonthYear(2, 2026) // => 'febrero 2026'
 */
export function formatMonthYear(month: number, year: number): string {
  const date = new Date(year, month - 1)
  return format(date, 'MMMM yyyy', { locale: es })
}

/**
 * Obtiene el mes actual (1-12).
 * @returns {number} Mes actual (1 = Enero, 12 = Diciembre)
 */
export function getCurrentMonth(): number {
  return new Date().getMonth() + 1
}

/**
 * Obtiene el año actual.
 * @returns {number} Año actual (ej: 2026)
 */
export function getCurrentYear(): number {
  return new Date().getFullYear()
}

/**
 * Verifica si una fecha es hoy.
 * @param {Date | string} date - Fecha a verificar
 * @returns {boolean} true si la fecha es hoy
 */
export function checkIsToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  return isToday(d)
}

/**
 * Verifica si una fecha está en el mes actual.
 * @param {Date | string} date - Fecha a verificar
 * @returns {boolean} true si la fecha está en el mes actual
 */
export function checkIsThisMonth(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  return isThisMonth(d)
}

/**
 * Obtiene el rango de fechas de un mes específico.
 * @param {number} month - Mes (1-12)
 * @param {number} year - Año
 * @returns {{ start: Date, end: Date }} Fecha de inicio y fin del mes
 */
export function getMonthRange(month: number, year: number): { start: Date; end: Date } {
  const start = startOfMonth(new Date(year, month - 1))
  const end = endOfMonth(new Date(year, month - 1))
  return { start, end }
}

/**
 * Formatea un número de teléfono argentino.
 * Agrega espacios para mejor legibilidad.
 * 
 * @param {string} phone - Número de teléfono
 * @returns {string} Teléfono formateado
 * 
 * @example
 * formatPhone('5491112345678') // => '54 911 123 45678'
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7)}`
  }
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`
  }
  
  return phone
}

/**
 * Formatea un teléfono para usar en enlace de WhatsApp.
 * Asegura que tenga el código de país argentino (54).
 * 
 * @param {string} phone - Número de teléfono
 * @returns {string} Teléfono formateado para WhatsApp
 * 
 * @example
 * formatPhoneForWhatsApp('01112345678') // => '541112345678'
 * formatPhoneForWhatsApp('+5491112345678') // => '5491112345678'
 */
export function formatPhoneForWhatsApp(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.startsWith('0')) {
    return `54${cleaned.slice(1)}`
  }
  
  if (!cleaned.startsWith('54')) {
    return `54${cleaned}`
  }
  
  return cleaned
}

/**
 * Configuración visual para estados de pago.
 * Incluye etiquetas, colores de Tailwind y colores de indicador.
 */
export const paymentStatusConfig = {
  /** Cliente al día con sus pagos */
  AL_DIA: {
    label: 'Al Día',
    color: 'bg-[var(--success)]/20 text-[var(--success)] border-[var(--success)]/30',
    dotColor: 'bg-[var(--success)]',
  },
  /** Pago pendiente */
  PENDIENTE: {
    label: 'Pendiente',
    color: 'bg-[var(--warning)]/20 text-[var(--warning)] border-[var(--warning)]/30',
    dotColor: 'bg-[var(--warning)]',
  },
  /** Pago atrasado */
  DEUDOR: {
    label: 'Deudor',
    color: 'bg-destructive/20 text-destructive border-destructive/30',
    dotColor: 'bg-destructive',
  },
} as const

/**
 * Obtiene la configuración visual para un estado de pago.
 * @param {string} status - Estado del pago (AL_DIA, PENDIENTE, DEUDOR)
 * @returns Configuración visual del estado
 */
export function getPaymentStatusConfig(status: string) {
  return paymentStatusConfig[status as keyof typeof paymentStatusConfig] || paymentStatusConfig.PENDIENTE
}

/**
 * Formatea nombre completo combinando nombre y apellido.
 * @param {string} nombre - Nombre
 * @param {string} apellido - Apellido
 * @returns {string} Nombre completo
 */
export function formatFullName(nombre: string, apellido: string): string {
  return `${nombre} ${apellido}`.trim()
}

/**
 * Genera un ID único basado en timestamp y random.
 * @returns {string} ID único
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Trunca un texto a una longitud máxima, agregando "..." si es necesario.
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @returns {string} Texto truncado
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

/**
 * Crea una función debounced que retrasa la ejecución.
 * Útil para optimizar búsquedas y validaciones.
 * 
 * @template T - Tipo de la función
 * @param {T} func - Función a debounced
 * @param {number} wait - Tiempo de espera en ms
 * @returns {Function} Función debounced
 * 
 * @example
 * const debouncedSearch = debounce((query) => fetchResults(query), 300)
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Ajusta el brillo de un color hex sumando un valor RGB.
 * Útil para crear variaciones de color para hover/gradientes.
 *
 * @param {string} color - Color en formato hex (#RRGGBB)
 * @param {number} amount - Cantidad a ajustar (-255 a 255)
 * @returns {string} Color hex ajustado
 */
export function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '')
  if (hex.length !== 6) return color
  const r = Math.min(255, Math.max(0, parseInt(hex.substring(0, 2), 16) + amount))
  const g = Math.min(255, Math.max(0, parseInt(hex.substring(2, 4), 16) + amount))
  const b = Math.min(255, Math.max(0, parseInt(hex.substring(4, 6), 16) + amount))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

/**
 * Paleta de colores predefinidos para grupos.
 * Orden canónico para ordenamiento por color.
 */
export const GROUP_COLORS = [
  '#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444',
  '#3b82f6', '#ec4899', '#84cc16', '#f97316', '#6366f1',
] as const

/**
 * Parsea un monto en formato argentino (ARS) a numero.
 * Maneja puntos como separador de miles y comas como separador decimal.
 *
 * @param {string} value - Valor en formato string (ej: "55.000", "55,00", "55000")
 * @returns {number} Numero parseado
 *
 * @example
 * parseArsAmount("55.000") // => 55000
 * parseArsAmount("55,00")  // => 55
 * parseArsAmount("55000")  // => 55000
 */
export function parseArsAmount(value: string): number {
  if (!value) return 0
  // Remover puntos (separadores de miles en formato argentino)
  const withoutDots = value.replace(/\./g, '')
  // Reemplazar coma por punto para decimales
  const normalized = withoutDots.replace(',', '.')
  return parseFloat(normalized) || 0
}
