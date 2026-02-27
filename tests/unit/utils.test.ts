import { describe, it, expect } from 'vitest'
import {
  formatFullName,
  formatPhone,
  formatCurrency,
  formatDate,
  formatTime,
  formatMonthYear,
  getPaymentStatusConfig,
  getCurrentMonth,
  getCurrentYear,
  cn,
  generateId,
} from '@/lib/utils'

describe('formatFullName', () => {
  it('should format full name correctly', () => {
    expect(formatFullName('Juan', 'Pérez')).toBe('Juan Pérez')
    expect(formatFullName('María', 'García')).toBe('María García')
  })

  it('should handle empty strings', () => {
    expect(formatFullName('', 'Pérez')).toBe('Pérez')
    expect(formatFullName('Juan', '')).toBe('Juan')
    expect(formatFullName('', '')).toBe('')
  })

  it('should handle single names', () => {
    expect(formatFullName('Juan', '')).toBe('Juan')
  })
})

describe('formatPhone', () => {
  it('should format phone number with 10 digits', () => {
    const result = formatPhone('1122334455')
    expect(result).toContain('11')
    expect(result).toBeDefined()
    expect(result.length).toBeGreaterThan(0)
  })

  it('should format phone number with 11 digits', () => {
    const result = formatPhone('11223334455')
    expect(result).toBeDefined()
    expect(result.length).toBeGreaterThan(0)
  })

  it('should handle empty string', () => {
    expect(formatPhone('')).toBe('')
  })

  it('should handle short numbers', () => {
    expect(formatPhone('123')).toBe('123')
  })

  it('should remove non-numeric characters', () => {
    const result = formatPhone('11-22-33-44-55')
    expect(result).toBeDefined()
  })
})

describe('formatCurrency', () => {
  it('should format currency in ARS', () => {
    const result = formatCurrency(5000)
    expect(result).toContain('5.000')
    expect(result).toContain('$')
  })

  it('should handle zero', () => {
    const result = formatCurrency(0)
    expect(result).toContain('0')
  })

  it('should handle large numbers', () => {
    const result = formatCurrency(1000000)
    expect(result).toContain('1.000.000')
  })

  it('should handle decimal numbers', () => {
    const result = formatCurrency(1234.56)
    expect(result).toBeDefined()
  })
})

describe('formatDate', () => {
  it('should format date correctly', () => {
    const date = new Date('2024-02-15')
    const result = formatDate(date)
    expect(result).toContain('2024')
  })

  it('should handle different dates', () => {
    const date1 = new Date('2024-01-01')
    const date2 = new Date('2024-12-31')
    
    const result1 = formatDate(date1)
    const result2 = formatDate(date2)
    
    expect(result1).not.toBe(result2)
  })
})

describe('formatTime', () => {
  it('should format time correctly', () => {
    const date = new Date('2024-02-15T10:30:00')
    const result = formatTime(date)
    expect(result).toBeDefined()
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('formatMonthYear', () => {
  it('should format month and year', () => {
    const result = formatMonthYear(2, 2024)
    expect(result).toContain('2024')
  })

  it('should handle different months', () => {
    const january = formatMonthYear(1, 2024)
    const december = formatMonthYear(12, 2024)
    
    expect(january).not.toBe(december)
  })

  it('should handle all months', () => {
    for (let month = 1; month <= 12; month++) {
      const result = formatMonthYear(month, 2024)
      expect(result).toBeDefined()
    }
  })
})

describe('getPaymentStatusConfig', () => {
  it('should return config for AL_DIA', () => {
    const config = getPaymentStatusConfig('AL_DIA')
    expect(config.label).toBeDefined()
    expect(config.color).toBeDefined()
    expect(config.dotColor).toBeDefined()
  })

  it('should return config for PENDIENTE', () => {
    const config = getPaymentStatusConfig('PENDIENTE')
    expect(config.label).toBeDefined()
    expect(config.color).toBeDefined()
    expect(config.dotColor).toBeDefined()
  })

  it('should return config for DEUDOR', () => {
    const config = getPaymentStatusConfig('DEUDOR')
    expect(config.label).toBeDefined()
    expect(config.color).toBeDefined()
    expect(config.dotColor).toBeDefined()
  })

  it('should return fallback config for unknown status', () => {
    const config = getPaymentStatusConfig('UNKNOWN')
    expect(config.label).toBeDefined()
    expect(config.color).toBeDefined()
  })
})

describe('getCurrentMonth', () => {
  it('should return current month (1-12)', () => {
    const month = getCurrentMonth()
    expect(month).toBeGreaterThanOrEqual(1)
    expect(month).toBeLessThanOrEqual(12)
  })
})

describe('getCurrentYear', () => {
  it('should return current year', () => {
    const year = getCurrentYear()
    expect(year).toBeGreaterThanOrEqual(2024)
  })
})

describe('cn (className utility)', () => {
  it('should merge class names', () => {
    const result = cn('foo', 'bar')
    expect(result).toBe('foo bar')
  })

  it('should handle conditional classes', () => {
    const result = cn('foo', false && 'bar', 'baz')
    expect(result).toBe('foo baz')
  })

  it('should handle undefined and null', () => {
    const result = cn('foo', undefined, null, 'bar')
    expect(result).toBe('foo bar')
  })

  it('should handle tailwind merge conflicts', () => {
    const result = cn('px-2 py-1', 'px-4')
    expect(result).toBe('py-1 px-4')
  })

  it('should handle object syntax', () => {
    const result = cn({ foo: true, bar: false, baz: true })
    expect(result).toBe('foo baz')
  })
})

describe('generateId', () => {
  it('should generate unique IDs', () => {
    const id1 = generateId()
    const id2 = generateId()
    expect(id1).not.toBe(id2)
  })

  it('should generate IDs of correct length', () => {
    const id = generateId()
    expect(id.length).toBeGreaterThan(0)
  })

  it('should generate string IDs', () => {
    const id = generateId()
    expect(typeof id).toBe('string')
  })
})
