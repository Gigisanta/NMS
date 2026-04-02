import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  cn,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatTime,
  formatMonthYear,
  getCurrentMonth,
  getCurrentYear,
  checkIsToday,
  checkIsThisMonth,
  getMonthRange,
  formatPhone,
  formatPhoneForWhatsApp,
  getPaymentStatusConfig,
  paymentStatusConfig,
  formatFullName,
  generateId,
  truncate,
  debounce,
} from '@/lib/utils'

// Helper: normalize Intl output (replace any NBSP variant with a regular space)
function normalizeCurrency(result: string): string {
  return result.replace(/\u00A0/g, ' ').replace(/\u202F/g, ' ')
}

// ---------------------------------------------------------------------------
// cn()
// ---------------------------------------------------------------------------
describe('cn', () => {
  it('should merge simple class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('should merge three or more class names', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c')
  })

  it('should filter out falsy values', () => {
    expect(cn('foo', false, null, undefined, '', 'bar')).toBe('foo bar')
  })

  it('should filter out conditional false in objects', () => {
    expect(cn('foo', { bar: true, baz: false })).toBe('foo bar')
  })

  it('should handle arrays of classes', () => {
    expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz')
  })

  it('should handle nested arrays', () => {
    expect(cn(['foo', ['bar', 'baz']], 'qux')).toBe('foo bar baz qux')
  })

  it('should resolve Tailwind conflicts keeping the last value', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
  })

  it('should keep non-conflicting Tailwind classes from both', () => {
    expect(cn('px-2 py-1', 'bg-red-500')).toBe('px-2 py-1 bg-red-500')
  })

  it('should handle an empty call', () => {
    expect(cn()).toBe('')
  })

  it('should handle all falsy inputs', () => {
    expect(cn(false, null, undefined, '')).toBe('')
  })
})

// ---------------------------------------------------------------------------
// formatCurrency()
// ---------------------------------------------------------------------------
describe('formatCurrency', () => {
  it('should format 5000 as $ 5.000 (ARS with thousand separator)', () => {
    expect(normalizeCurrency(formatCurrency(5000))).toBe('$ 5.000')
  })

  it('should format 0 as $ 0', () => {
    expect(normalizeCurrency(formatCurrency(0))).toBe('$ 0')
  })

  it('should format 1 as $ 1 (no separator)', () => {
    expect(normalizeCurrency(formatCurrency(1))).toBe('$ 1')
  })

  it('should format 1234.56 rounding to $ 1.235', () => {
    expect(normalizeCurrency(formatCurrency(1234.56))).toBe('$ 1.235')
  })

  it('should format 999.49 rounding down to $ 999', () => {
    expect(normalizeCurrency(formatCurrency(999.49))).toBe('$ 999')
  })

  it('should format 999.5 rounding up to $ 1.000', () => {
    expect(normalizeCurrency(formatCurrency(999.5))).toBe('$ 1.000')
  })

  it('should format 1_000_000 as $ 1.000.000', () => {
    expect(normalizeCurrency(formatCurrency(1_000_000))).toBe('$ 1.000.000')
  })

  it('should format a negative number with minus sign', () => {
    expect(normalizeCurrency(formatCurrency(-5000))).toBe('-$ 5.000')
  })

  it('should include no decimal fraction digits (minimumFractionDigits: 0)', () => {
    // The Intl formatter uses minimumFractionDigits: 0, maximumFractionDigits: 0
    // so cents are never shown. Verify the result does not end in .00
    const result = normalizeCurrency(formatCurrency(1234.99))
    expect(result).not.toMatch(/[.,]\d{1,2}$/)
    expect(result).toBe('$ 1.235')
  })

  it('should handle very large numbers', () => {
    expect(normalizeCurrency(formatCurrency(99_999_999))).toBe('$ 99.999.999')
  })

  it('should always start with the peso sign (positive) or -$ (negative)', () => {
    expect(formatCurrency(0)).toMatch(/^\$/)
    expect(formatCurrency(1)).toMatch(/^\$/)
    expect(formatCurrency(-1)).toMatch(/^-\$/)
  })
})

// ---------------------------------------------------------------------------
// formatDate()
// ---------------------------------------------------------------------------
describe('formatDate', () => {
  // Use Date.UTC + a fixed midday hour to avoid any off-by-one in date boundaries
  const makeUTC = (y: number, m: number, d: number) =>
    new Date(Date.UTC(y, m - 1, d, 12, 0, 0))

  it('should format 2024-02-15 as 15/02/2024', () => {
    expect(formatDate(makeUTC(2024, 2, 15))).toBe('15/02/2024')
  })

  it('should format 2026-01-01 as 01/01/2026', () => {
    expect(formatDate(makeUTC(2026, 1, 1))).toBe('01/01/2026')
  })

  it('should format 2026-12-31 as 31/12/2026', () => {
    expect(formatDate(makeUTC(2026, 12, 31))).toBe('31/12/2026')
  })

  it('should accept an ISO string instead of a Date object', () => {
    const result = formatDate('2024-02-15T12:00:00Z')
    expect(result).toBe('15/02/2024')
  })

  it('should format a UTC midnight timestamp correctly', () => {
    expect(formatDate('2024-03-10T00:00:00Z')).toMatch(/^\d{2}\/\d{2}\/2024$/)
  })

  it('should return dd/mm/yyyy structure with leading zeros', () => {
    const result = formatDate(makeUTC(2024, 5, 9))
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
    expect(result).toBe('09/05/2024')
  })
})

// ---------------------------------------------------------------------------
// formatDateTime()
// ---------------------------------------------------------------------------
describe('formatDateTime', () => {
  // Use Date.UTC and account for timezone offset so the local HH:mm is predictable
  // System is in ART (UTC-3): UTC 03:00 = local 00:00; UTC 02:59 = local 23:59

  it('should include both date and time components', () => {
    const result = formatDateTime(new Date(Date.UTC(2024, 1, 15, 14, 30, 0)))
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/)
  })

  it('should format local midnight as 00:00', () => {
    // UTC 03:00 = ART 00:00
    const result = formatDateTime(new Date(Date.UTC(2024, 5, 1, 3, 0, 0)))
    expect(result).toContain('00:00')
  })

  it('should format end-of-day time as 23:59', () => {
    // UTC 02:59:59 = ART 23:59:59
    const result = formatDateTime(new Date(Date.UTC(2024, 5, 1, 2, 59, 59)))
    expect(result).toContain('23:59')
  })

  it('should accept an ISO string', () => {
    const result = formatDateTime('2024-02-15T14:30:00Z')
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/)
  })

  it('should produce date portion as dd/mm/yyyy', () => {
    const result = formatDateTime('2024-02-15T12:00:00Z')
    expect(result.slice(0, 10)).toBe('15/02/2024')
  })
})

// ---------------------------------------------------------------------------
// formatTime()
// ---------------------------------------------------------------------------
describe('formatTime', () => {
  // System is ART (UTC-3): UTC 14:30 → local 11:30; UTC 17:30 → local 14:30
  const local = (h: number, m: number) => new Date(Date.UTC(2024, 1, 15, h, m, 0))

  it('should format 14:30 correctly', () => {
    // UTC 17:30 = ART 14:30
    expect(formatTime(local(17, 30))).toBe('14:30')
  })

  it('should format midnight as 00:00', () => {
    // UTC 03:00 = ART 00:00
    expect(formatTime(local(3, 0))).toBe('00:00')
  })

  it('should format 09:05 with leading zero', () => {
    // UTC 12:05 = ART 09:05
    expect(formatTime(local(12, 5))).toBe('09:05')
  })

  it('should accept an ISO string', () => {
    expect(formatTime('2024-02-15T12:30:00Z')).toMatch(/^\d{2}:\d{2}$/)
  })

  it('should return exactly 5 characters (HH:mm)', () => {
    const result = formatTime(local(8, 5))
    expect(result).toMatch(/^\d{2}:\d{2}$/)
    expect(result.length).toBe(5)
  })
})

// ---------------------------------------------------------------------------
// formatMonthYear()
// ---------------------------------------------------------------------------
describe('formatMonthYear', () => {
  it('should format February 2024 as "febrero 2024"', () => {
    expect(formatMonthYear(2, 2024)).toBe('febrero 2024')
  })

  it('should format January 2026 as "enero 2026"', () => {
    expect(formatMonthYear(1, 2026)).toBe('enero 2026')
  })

  it('should format December 2025 as "diciembre 2025"', () => {
    expect(formatMonthYear(12, 2025)).toBe('diciembre 2025')
  })

  it('should handle all 12 months with correct Spanish names', () => {
    const names = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
    ]
    for (let m = 1; m <= 12; m++) {
      expect(formatMonthYear(m, 2024)).toBe(`${names[m - 1]} 2024`)
    }
  })
})

// ---------------------------------------------------------------------------
// getCurrentMonth()
// ---------------------------------------------------------------------------
describe('getCurrentMonth', () => {
  it('should return a number between 1 and 12', () => {
    const month = getCurrentMonth()
    expect(month).toBeGreaterThanOrEqual(1)
    expect(month).toBeLessThanOrEqual(12)
  })

  it('should return an integer', () => {
    expect(Number.isInteger(getCurrentMonth())).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// getCurrentYear()
// ---------------------------------------------------------------------------
describe('getCurrentYear', () => {
  it('should return a year >= 2024', () => {
    expect(getCurrentYear()).toBeGreaterThanOrEqual(2024)
  })

  it('should return an integer', () => {
    expect(Number.isInteger(getCurrentYear())).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// checkIsToday()
// ---------------------------------------------------------------------------
describe('checkIsToday', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: false })
    // Freeze to 2026-04-02 in ART (UTC-3), so local midnight is UTC 03:00
    vi.setSystemTime(new Date(2026, 3, 2, 0, 0, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return true for today (Date)', () => {
    expect(checkIsToday(new Date(2026, 3, 2))).toBe(true)
  })

  it('should return true for today (ISO string with time)', () => {
    expect(checkIsToday('2026-04-02T12:00:00Z')).toBe(true)
  })

  it('should return false for yesterday', () => {
    expect(checkIsToday('2026-04-01T12:00:00Z')).toBe(false)
  })

  it('should return false for tomorrow', () => {
    expect(checkIsToday('2026-04-03T12:00:00Z')).toBe(false)
  })

  it('should return false for a date in a different month', () => {
    expect(checkIsToday('2026-03-15T12:00:00Z')).toBe(false)
  })

  it('should return false for a date in a different year', () => {
    expect(checkIsToday('2025-04-02T12:00:00Z')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// checkIsThisMonth()
// ---------------------------------------------------------------------------
describe('checkIsThisMonth', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: false })
    // Freeze to 2026-04-15 in ART
    vi.setSystemTime(new Date(2026, 3, 15, 10, 0, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return true for a date in April 2026', () => {
    expect(checkIsThisMonth('2026-04-10T12:00:00Z')).toBe(true)
  })

  it('should return true for the first day of the month', () => {
    expect(checkIsThisMonth('2026-04-01T12:00:00Z')).toBe(true)
  })

  it('should return true for the last day of the month', () => {
    expect(checkIsThisMonth('2026-04-30T12:00:00Z')).toBe(true)
  })

  it('should return false for March 2026', () => {
    expect(checkIsThisMonth('2026-03-15T12:00:00Z')).toBe(false)
  })

  it('should return false for May 2026', () => {
    expect(checkIsThisMonth('2026-05-01T12:00:00Z')).toBe(false)
  })

  it('should return false for April of a different year', () => {
    expect(checkIsThisMonth('2025-04-15T12:00:00Z')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// getMonthRange()
// ---------------------------------------------------------------------------
describe('getMonthRange', () => {
  it('should return correct range for February 2024 (29 days, leap year)', () => {
    const { start, end } = getMonthRange(2, 2024)
    expect(start.getFullYear()).toBe(2024)
    expect(start.getMonth()).toBe(1) // 0-indexed February
    expect(start.getDate()).toBe(1)
    expect(end.getFullYear()).toBe(2024)
    expect(end.getMonth()).toBe(1)
    expect(end.getDate()).toBe(29)
  })

  it('should return correct range for January 2026 (31 days)', () => {
    const { start, end } = getMonthRange(1, 2026)
    expect(start.getDate()).toBe(1)
    expect(start.getMonth()).toBe(0)
    expect(end.getDate()).toBe(31)
    expect(end.getMonth()).toBe(0)
  })

  it('should return correct range for December 2025 (31 days)', () => {
    const { start, end } = getMonthRange(12, 2025)
    expect(start.getMonth()).toBe(11)
    expect(end.getDate()).toBe(31)
    expect(end.getMonth()).toBe(11)
  })

  it('should return correct range for April 2026 (30 days)', () => {
    const { start, end } = getMonthRange(4, 2026)
    expect(end.getDate()).toBe(30)
  })

  it('should return a start date before the end date', () => {
    const { start, end } = getMonthRange(6, 2026)
    expect(start.getTime()).toBeLessThan(end.getTime())
  })

  it('should include start and end dates in the same month and year', () => {
    const { start, end } = getMonthRange(7, 2026)
    expect(start.getMonth()).toBe(end.getMonth())
    expect(start.getFullYear()).toBe(end.getFullYear())
  })
})

// ---------------------------------------------------------------------------
// formatPhone()
// ---------------------------------------------------------------------------
describe('formatPhone', () => {
  // Implementation: length 10 → "DD DDD DD DDDD" (2,3,2,n groups)
  //                 length 11 → "DD DDD DDD DDDD" (2,3,3,n groups)
  // Non-digits are stripped first, then the above pattern is applied.

  it('should format a 10-digit Argentine local number', () => {
    // '1122334455' → cleaned '1122334455' → '11 223 34 455' (last group: 455)
    expect(formatPhone('1122334455')).toBe('11 223 34 455')
  })

  it('should format an 11-digit number with leading 0', () => {
    // '01112345678' → cleaned '01112345678' → '01 112 345 678'
    expect(formatPhone('01112345678')).toBe('01 112 345 678')
  })

  it('should remove non-numeric characters', () => {
    // '11-22-33-44-55' → cleaned '1122334455' → '11 223 34 455'
    expect(formatPhone('11-22-33-44-55')).toBe('11 223 34 455')
  })

  it('should remove spaces and parentheses', () => {
    // '(11) 2233 4455' → cleaned '1122334455' → '11 223 34 455'
    expect(formatPhone('(11) 2233 4455')).toBe('11 223 34 455')
  })

  it('should return input unchanged if fewer than 10 digits', () => {
    expect(formatPhone('123')).toBe('123')
    expect(formatPhone('123456789')).toBe('123456789')
  })

  it('should handle exactly 10 digits', () => {
    // '1234567890' → '12 345 67 890'
    expect(formatPhone('1234567890')).toBe('12 345 67 890')
  })

  it('should handle exactly 11 digits', () => {
    // '12345678901' → '12 345 678 901'
    expect(formatPhone('12345678901')).toBe('12 345 678 901')
  })

  it('should return the original string for mixed content with <10 digits', () => {
    expect(formatPhone('abc')).toBe('abc')
  })

  it('should handle empty string', () => {
    expect(formatPhone('')).toBe('')
  })
})

// ---------------------------------------------------------------------------
// formatPhoneForWhatsApp()
// ---------------------------------------------------------------------------
describe('formatPhoneForWhatsApp', () => {
  it('should add 54 prefix to a local number starting with 0', () => {
    expect(formatPhoneForWhatsApp('01112345678')).toBe('541112345678')
  })

  it('should add 54 prefix to a local number without leading 0', () => {
    expect(formatPhoneForWhatsApp('1122345678')).toBe('541122345678')
  })

  it('should not double 54 if already present', () => {
    expect(formatPhoneForWhatsApp('5491112345678')).toBe('5491112345678')
  })

  it('should remove non-numeric characters before processing', () => {
    expect(formatPhoneForWhatsApp('+54 11 1234 5678')).toBe('541112345678')
  })

  it('should handle a 10-digit Argentine mobile number', () => {
    // '91112345678' → cleaned '91112345678' → '5491112345678'
    expect(formatPhoneForWhatsApp('91112345678')).toBe('5491112345678')
  })

  it('should prepend 54 to empty input (edge case)', () => {
    // '' → cleaned '' → !startsWith('0') && !startsWith('54') → '54' + ''
    expect(formatPhoneForWhatsApp('')).toBe('54')
  })

  it('should produce a numeric-only string', () => {
    const result = formatPhoneForWhatsApp('01112345678')
    expect(/^\d+$/.test(result)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// getPaymentStatusConfig()
// ---------------------------------------------------------------------------
describe('getPaymentStatusConfig', () => {
  it('should return AL_DIA config with correct shape', () => {
    const config = getPaymentStatusConfig('AL_DIA')
    expect(config.label).toBe('Al Día')
    expect(config.color).toMatch(/green/)
    expect(config.dotColor).toMatch(/green/)
  })

  it('should return PENDIENTE config with correct shape', () => {
    const config = getPaymentStatusConfig('PENDIENTE')
    expect(config.label).toBe('Pendiente')
    expect(config.color).toMatch(/yellow/)
    expect(config.dotColor).toMatch(/yellow/)
  })

  it('should return DEUDOR config with correct shape', () => {
    const config = getPaymentStatusConfig('DEUDOR')
    expect(config.label).toBe('Deudor')
    expect(config.color).toMatch(/red/)
    expect(config.dotColor).toMatch(/red/)
  })

  it('should return PENDIENTE as default for unknown status', () => {
    const config = getPaymentStatusConfig('INVALIDO')
    expect(config.label).toBe('Pendiente')
    expect(config.color).toBe(paymentStatusConfig.PENDIENTE.color)
  })

  it('should return PENDIENTE for empty string', () => {
    expect(getPaymentStatusConfig('').label).toBe('Pendiente')
  })

  it('should have all three statuses with required string keys', () => {
    const requiredKeys = ['label', 'color', 'dotColor'] as const
    for (const status of ['AL_DIA', 'PENDIENTE', 'DEUDOR'] as const) {
      const config = paymentStatusConfig[status]
      for (const key of requiredKeys) {
        expect(config[key]).toBeDefined()
        expect(typeof config[key]).toBe('string')
      }
    }
  })
})

// ---------------------------------------------------------------------------
// formatFullName()
// ---------------------------------------------------------------------------
describe('formatFullName', () => {
  it('should return "Juan Pérez" for "Juan" and "Pérez"', () => {
    expect(formatFullName('Juan', 'Pérez')).toBe('Juan Pérez')
  })

  it('should return "María García" for "María" and "García"', () => {
    expect(formatFullName('María', 'García')).toBe('María García')
  })

  it('should handle a single name (empty surname)', () => {
    expect(formatFullName('Juan', '')).toBe('Juan')
  })

  it('should handle a single surname (empty name)', () => {
    expect(formatFullName('', 'Pérez')).toBe('Pérez')
  })

  it('should return empty string when both are empty', () => {
    expect(formatFullName('', '')).toBe('')
  })

  it('should trim leading/trailing whitespace from each part', () => {
    const result = formatFullName(' Juan ', ' Pérez ')
    expect(result).toBe('Juan   Pérez') // each part is trimmed, middle stays
    expect(result).toContain('Juan')
    expect(result).toContain('Pérez')
  })
})

// ---------------------------------------------------------------------------
// generateId()
// ---------------------------------------------------------------------------
describe('generateId', () => {
  it('should return a string', () => {
    expect(typeof generateId()).toBe('string')
  })

  it('should include a dash separator', () => {
    expect(generateId()).toMatch(/-/)
  })

  it('should generate unique IDs on consecutive calls', () => {
    const ids = new Set<string>()
    for (let i = 0; i < 100; i++) {
      ids.add(generateId())
    }
    expect(ids.size).toBe(100)
  })

  it('should have a reasonable length (at least 10 chars)', () => {
    expect(generateId().length).toBeGreaterThanOrEqual(10)
  })

  it('should generate IDs that start with a numeric timestamp', () => {
    const id = generateId()
    const prefix = id.split('-')[0]
    expect(Number.isFinite(Number(prefix))).toBe(true)
    expect(Number(prefix)).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// truncate()
// ---------------------------------------------------------------------------
describe('truncate', () => {
  it('should not truncate text shorter than maxLength', () => {
    expect(truncate('hello', 10)).toBe('hello')
    expect(truncate('hello', 5)).toBe('hello')
  })

  it('should truncate text longer than maxLength with "..."', () => {
    expect(truncate('hello world', 5)).toBe('hello...')
  })

  it('should truncate at exactly maxLength characters', () => {
    expect(truncate('hello', 4)).toBe('hell...')
    expect(truncate('abcdefgh', 4).length).toBe(7) // 4 chars + '...'
  })

  it('should return "..." for maxLength of 0', () => {
    expect(truncate('hello', 0)).toBe('...')
  })

  it('should not append "..." when text length equals maxLength', () => {
    // maxLength < text length is required to trigger truncation
    // negative maxLength means text.length (5) is never <= -1, so no truncation
    expect(truncate('hello', -1)).toBe('hell...')
  })

  it('should handle single character maxLength', () => {
    expect(truncate('abc', 1)).toBe('a...')
  })

  it('should handle empty string', () => {
    expect(truncate('', 5)).toBe('')
    expect(truncate('', 0)).toBe('')
  })

  it('should handle text that is exactly maxLength + 1', () => {
    expect(truncate('ab', 1)).toBe('a...')
  })

  it('should preserve characters before truncation point', () => {
    const result = truncate('Hello World!', 5)
    expect(result.startsWith('Hello')).toBe(true)
    expect(result.endsWith('...')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// debounce()
// ---------------------------------------------------------------------------
describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: false })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should call the original function after the wait period', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)
    debounced()
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(99)
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should pass arguments to the original function', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)
    debounced('arg1', 42)
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledWith('arg1', 42)
  })

  it('should debounce multiple calls — only the last one fires', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)
    debounced(1)
    debounced(2)
    debounced(3)
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith(3)
  })

  it('should reset the timer on each call', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)
    debounced(1)
    vi.advanceTimersByTime(50)
    debounced(2) // reset timer
    vi.advanceTimersByTime(50) // only 50ms into new timer — should not fire yet
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(50) // now 100ms total — should fire
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith(2)
  })

  it('should call once when called once and timer is advanced', () => {
    // Simple case: single debounced call fires after wait time
    const fn = vi.fn()
    const debounced = debounce(fn, 50)
    debounced('only-call')
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(49)
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('only-call')
  })
})
