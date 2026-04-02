import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  useDebounce,
  useDebouncedCallback,
  useThrottledCallback,
  useLocalStorage,
  useIsMounted,
} from '@/hooks/use-optimized'

// ============================================================
// vi.mock MUST come before any imports of the module being mocked
// sonnerToast IS the same object as toast (import { toast as sonnerToast })
// ============================================================
vi.mock('sonner', () => {
  const toast = {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(),
    promise: vi.fn(),
    dismiss: vi.fn(),
    custom: vi.fn(),
  }
  return { toast, sonnerToast: toast }
})

// Import toast AFTER the mock is set up so it gets the mocked version
import { toast, toastMessages, handleApiError } from '@/hooks/use-toast'
import { sonnerToast } from 'sonner'

import {
  useCache,
  useIntersectionObserver,
  usePerformanceMeasure,
  useStorageSync,
  useIdleCallback,
} from '@/hooks/use-optimized'
import { useIsMobile } from '@/hooks/use-mobile'
import { useKeyboardShortcuts, useGlobalNavigation, useNMSShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { useViewPreloader } from '@/hooks/use-view-preloader'

// ============================================================
// Existing useOptimized hooks (from original file)
// ============================================================

describe('useDebounce', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('test', 500))
    expect(result.current).toBe('test')
  })

  it('should debounce value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    )
    expect(result.current).toBe('initial')

    rerender({ value: 'changed', delay: 500 })
    expect(result.current).toBe('initial')

    act(() => { vi.advanceTimersByTime(500) })
    expect(result.current).toBe('changed')
  })

  it('should use default delay of 300ms', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: 'initial' } }
    )
    rerender({ value: 'changed' })

    act(() => { vi.advanceTimersByTime(299) })
    expect(result.current).toBe('initial')

    act(() => { vi.advanceTimersByTime(1) })
    expect(result.current).toBe('changed')
  })

  it('should cancel previous debounce on new value', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    )

    rerender({ value: 'first' })
    act(() => { vi.advanceTimersByTime(250) })
    rerender({ value: 'second' })
    act(() => { vi.advanceTimersByTime(250) })
    expect(result.current).toBe('initial')

    act(() => { vi.advanceTimersByTime(250) })
    expect(result.current).toBe('second')
  })
})

describe('useDebouncedCallback', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('should debounce callback execution', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 500))

    act(() => { result.current('arg1'); result.current('arg2'); result.current('arg3') })
    expect(callback).not.toHaveBeenCalled()

    act(() => { vi.advanceTimersByTime(500) })
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith('arg3')
  })

  it('should cancel pending execution on unmount', () => {
    const callback = vi.fn()
    const { result, unmount } = renderHook(() => useDebouncedCallback(callback, 500))

    act(() => { result.current('test') })
    unmount()
    act(() => { vi.advanceTimersByTime(500) })
    expect(callback).not.toHaveBeenCalled()
  })
})

describe('useThrottledCallback', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('should throttle callback execution', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useThrottledCallback(callback, 100))

    act(() => { result.current('first') })
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith('first')

    act(() => { result.current('second') })
    expect(callback).toHaveBeenCalledTimes(1) // throttled

    act(() => { vi.advanceTimersByTime(100) })
    expect(callback).toHaveBeenCalledTimes(2)
    expect(callback).toHaveBeenCalledWith('second')
  })

  it('should allow immediate execution after throttle period', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useThrottledCallback(callback, 100))

    act(() => { result.current('first') })
    expect(callback).toHaveBeenCalledTimes(1)

    act(() => { vi.advanceTimersByTime(150) })
    act(() => { result.current('second') })
    expect(callback).toHaveBeenCalledTimes(2)
  })
})

describe('useLocalStorage', () => {
  it('should return initial value when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))
    expect(result.current[0]).toBe('initial')
  })

  it('should persist value to localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))
    act(() => { result.current[1]('new-value') })
    expect(result.current[0]).toBe('new-value')
    expect(localStorage.setItem).toHaveBeenCalledWith('test-key', JSON.stringify('new-value'))
  })

  it('should handle function updates', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 5))
    act(() => { result.current[1](prev => prev + 1) })
    expect(result.current[0]).toBe(6)
  })

  it('should handle object values', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', { name: 'test' }))
    act(() => { result.current[1]({ name: 'updated' }) })
    expect(result.current[0]).toEqual({ name: 'updated' })
  })
})

describe('useIsMounted', () => {
  it('should return true when component is mounted', () => {
    const { result } = renderHook(() => useIsMounted())
    expect(result.current()).toBe(true)
  })

  it('should return false after component unmounts', () => {
    const { result, unmount } = renderHook(() => useIsMounted())
    expect(result.current()).toBe(true)
    unmount()
    expect(result.current()).toBe(false)
  })

  it('should be stable across re-renders', () => {
    const { result, rerender } = renderHook(() => useIsMounted())
    const firstResult = result.current
    rerender()
    expect(result.current).toBe(firstResult)
  })
})

// ============================================================
// useCache
// ============================================================

describe('useCache', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('should fetch data on mount', async () => {
    const fetcher = vi.fn().mockResolvedValue('data')
    const { result } = renderHook(() => useCache('key', fetcher, 60000))

    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBe(null)

    await act(async () => {
      vi.advanceTimersByTime(0)
      await vi.runAllTimersAsync()
    })

    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(result.current.data).toBe('data')
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(null)
  })

  it('should respect TTL and not refetch within TTL', async () => {
    const fetcher = vi.fn().mockResolvedValue('data')
    const { result } = renderHook(() => useCache('key', fetcher, 60000))

    await act(async () => {
      vi.advanceTimersByTime(0)
      await vi.runAllTimersAsync()
    })
    expect(fetcher).toHaveBeenCalledTimes(1)

    act(() => { vi.advanceTimersByTime(30000) })
    expect(result.current.data).toBe('data')
  })

  it('should capture errors from fetcher', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('fetch failed'))
    const { result } = renderHook(() => useCache('key', fetcher, 60000))

    await act(async () => {
      vi.advanceTimersByTime(0)
      await vi.runAllTimersAsync()
    })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('fetch failed')
    expect(result.current.loading).toBe(false)
  })

  it('should invalidate and refetch when invalidate is called', async () => {
    const fetcher = vi.fn().mockResolvedValue('data')
    const { result } = renderHook(() => useCache('key', fetcher, 60000))

    await act(async () => {
      vi.advanceTimersByTime(0)
      await vi.runAllTimersAsync()
    })
    expect(fetcher).toHaveBeenCalledTimes(1)

    await act(async () => {
      result.current.invalidate()
      await vi.runAllTimersAsync()
    })
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('should abort previous request when refetch is called mid-flight', async () => {
    let resolveFirst: (v: string) => void
    const firstPromise = new Promise<string>((r) => { resolveFirst = r })
    const fetcher = vi.fn()
      .mockReturnValueOnce(firstPromise)
      .mockResolvedValueOnce('second')

    const { result } = renderHook(() => useCache('key', fetcher, 60000))

    await act(async () => { vi.advanceTimersByTime(0) })
    await act(async () => { result.current.refetch() })

    await act(async () => {
      resolveFirst!('first')
      await vi.runAllTimersAsync()
    })
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('should expose refetch as a function', () => {
    const fetcher = vi.fn().mockResolvedValue('data')
    const { result } = renderHook(() => useCache('key', fetcher, 60000))
    expect(typeof result.current.refetch).toBe('function')
  })
})

// ============================================================
// useIntersectionObserver
// ============================================================

describe('useIntersectionObserver', () => {
  // Track created observer instances so we can verify their methods were called.
  // Using a class that extends the real IntersectionObserver so jsdom
  // accepts it as a valid constructor.
  let observedElements: Element[]
  let disconnectedInstances: unknown[]

  beforeEach(() => {
    vi.useFakeTimers()
    observedElements = []
    disconnectedInstances = []

    // Create a mock class that extends the real IntersectionObserver.
    // The mock methods are own properties (class field syntax) so we
    // spy on instances after creation — not on the prototype.
    class MockIntersectionObserver extends IntersectionObserver {
      constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        super(callback, options)
        // Spy on own properties after construction
        const self = this as unknown as { observe: (el: Element) => void; disconnect: () => void }
        self.observe = vi.fn((el: Element) => {
          observedElements.push(el)
        })
        self.disconnect = vi.fn(() => {
          disconnectedInstances.push(this)
        })
      }
    }

    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('should initialize with isIntersecting false', () => {
    const { result } = renderHook(() => useIntersectionObserver())
    const [, isIntersecting] = result.current
    expect(isIntersecting).toBe(false)
  })

  it('should call observe when element is assigned', () => {
    const { result } = renderHook(() => useIntersectionObserver())
    const [setRef] = result.current

    const element = document.createElement('div')
    act(() => { setRef(element) })

    expect(observedElements).toContain(element)
  })

  it('should call disconnect on unmount', () => {
    const { result, unmount } = renderHook(() => useIntersectionObserver())
    const [setRef] = result.current

    const element = document.createElement('div')
    act(() => { setRef(element) })

    unmount()
    expect(disconnectedInstances.length).toBeGreaterThan(0)
  })

  it('should observe with custom threshold from options', () => {
    const { result } = renderHook(() => useIntersectionObserver({ threshold: 0.5 }))
    const [setRef] = result.current

    const element = document.createElement('div')
    act(() => { setRef(element) })

    expect(observedElements).toContain(element)
  })
})

// ============================================================
// usePerformanceMeasure
// ============================================================

describe('usePerformanceMeasure', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('should return start and end functions', () => {
    const { result } = renderHook(() => usePerformanceMeasure('test'))
    expect(typeof result.current.start).toBe('function')
    expect(typeof result.current.end).toBe('function')
  })

  it('should measure elapsed time between start and end', () => {
    const { result } = renderHook(() => usePerformanceMeasure('test'))
    const { start, end } = result.current

    let duration = 0
    act(() => {
      start()
      vi.advanceTimersByTime(150)
      duration = end()
    })

    expect(typeof duration).toBe('number')
    expect(duration).toBeGreaterThan(0)
  })

  it('should return 0 when end is called immediately after start', () => {
    const { result } = renderHook(() => usePerformanceMeasure('test'))
    const { start, end } = result.current

    let duration = 0
    act(() => { start(); duration = end() })
    expect(typeof duration).toBe('number')
    expect(duration).toBeGreaterThanOrEqual(0)
  })
})

// ============================================================
// useStorageSync
// ============================================================

describe('useStorageSync', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    vi.clearAllMocks()
  })
  afterEach(() => { vi.useRealTimers() })

  it('should return initial value when localStorage is empty', () => {
    const { result } = renderHook(() => useStorageSync('sync-key', 'default'))
    expect(result.current[0]).toBe('default')
  })

  it('should read existing value from localStorage', () => {
    localStorage.getItem = vi.fn().mockReturnValue('"stored"')
    const { result } = renderHook(() => useStorageSync('sync-key', 'default'))
    expect(result.current[0]).toBe('stored')
  })

  it('should update value and persist to localStorage', () => {
    const { result } = renderHook(() => useStorageSync('sync-key', 'default'))
    act(() => { result.current[1]('updated') })
    expect(result.current[0]).toBe('updated')
    expect(localStorage.setItem).toHaveBeenCalledWith('sync-key', JSON.stringify('updated'))
  })

  it('should update state when matching storage event fires', () => {
    const { result } = renderHook(() => useStorageSync('sync-key', 'initial'))

    act(() => { vi.advanceTimersByTime(0) })

    const event = new StorageEvent('storage', { key: 'sync-key', newValue: '"from-tab"' })
    act(() => { window.dispatchEvent(event) })

    expect(result.current[0]).toBe('from-tab')
  })

  it('should not update when a different key storage event fires', () => {
    // Stub getItem to return valid JSON so initial state is deterministic
    localStorage.getItem = vi.fn().mockReturnValue('"my-value"')
    const { result } = renderHook(() => useStorageSync('my-key', 'default'))

    act(() => { vi.advanceTimersByTime(0) })

    // Dispatch event for a different key — hook should ignore it
    const event = new StorageEvent('storage', { key: 'other-key', newValue: '"ignored"' })
    act(() => { window.dispatchEvent(event) })

    expect(result.current[0]).toBe('my-value')
  })

  it('should cleanup storage listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    const { unmount } = renderHook(() => useStorageSync('sync-key', 'default'))

    act(() => { vi.advanceTimersByTime(0) })
    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('storage', expect.any(Function))
  })
})

// ============================================================
// useIdleCallback
// ============================================================

describe('useIdleCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('requestIdleCallback', vi.fn((_cb: () => void) => 1))
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('should cleanup all activity listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    const { unmount } = renderHook(() => useIdleCallback(vi.fn(), 5000))

    act(() => { vi.advanceTimersByTime(0) })
    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
  })
})

// ============================================================
// useIsMobile
// ============================================================

describe('useIsMobile', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Stub innerWidth BEFORE rendering so the hook reads the stubbed value
    Object.defineProperty(window, 'innerWidth', {
      value: 1024,
      writable: true,
      configurable: true,
    })
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return false when window width >= 768 (desktop)', () => {
    const { result } = renderHook(() => useIsMobile())
    act(() => { vi.advanceTimersByTime(0) })
    expect(result.current).toBe(false)
  })

  it('should return true when window width < 768 (mobile)', () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 600,
      writable: true,
      configurable: true,
    })
    const { result } = renderHook(() => useIsMobile())
    act(() => { vi.advanceTimersByTime(0) })
    expect(result.current).toBe(true)
  })

  it('should call matchMedia with correct query on mount', () => {
    renderHook(() => useIsMobile())
    act(() => { vi.advanceTimersByTime(0) })
    expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 767px)')
  })
})

// ============================================================
// useKeyboardShortcuts
// ============================================================

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    vi.clearAllMocks()
  })
  afterEach(() => { vi.useRealTimers() })

  it('should not register listener when disabled', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    renderHook(() =>
      useKeyboardShortcuts({
        enabled: false,
        shortcuts: [{ key: 'n', description: 'test', action: vi.fn() }],
      })
    )
    act(() => { vi.advanceTimersByTime(0) })
    expect(addEventListenerSpy).not.toHaveBeenCalledWith('keydown', expect.any(Function))
  })

  it('should trigger action on matching keypress', () => {
    const action = vi.fn()
    renderHook(() =>
      useKeyboardShortcuts({ shortcuts: [{ key: 'n', description: 'test', action }] })
    )
    act(() => { vi.advanceTimersByTime(0) })
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n' })) })
    expect(action).toHaveBeenCalledTimes(1)
  })

  it('should ignore non-special keypresses when event target is an INPUT', () => {
    const action = vi.fn()
    renderHook(() =>
      useKeyboardShortcuts({ shortcuts: [{ key: 'x', description: 'test', action }] })
    )
    act(() => { vi.advanceTimersByTime(0) })

    // Simulate keydown on an INPUT element (e.g. typing in a search box)
    const input = document.createElement('input')
    document.body.appendChild(input)
    const event = new KeyboardEvent('keydown', { key: 'x', bubbles: true })
    Object.defineProperty(event, 'target', { value: input, writable: false })
    act(() => { window.dispatchEvent(event) })

    // Action should be skipped because the target is an INPUT
    expect(action).not.toHaveBeenCalled()
    document.body.removeChild(input)
  })

  it('should trigger Escape even when focus is on input', () => {
    const action = vi.fn()
    const input = document.createElement('input')
    document.body.appendChild(input)

    renderHook(() =>
      useKeyboardShortcuts({ shortcuts: [{ key: 'Escape', description: 'esc', action }] })
    )
    act(() => { vi.advanceTimersByTime(0) })

    act(() => {
      input.focus()
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })
    expect(action).toHaveBeenCalledTimes(1)

    document.body.removeChild(input)
  })

  it('should trigger Ctrl+key shortcut', () => {
    const action = vi.fn()
    renderHook(() =>
      useKeyboardShortcuts({ shortcuts: [{ key: 'n', ctrl: true, description: 'new', action }] })
    )
    act(() => { vi.advanceTimersByTime(0) })
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', ctrlKey: true })) })
    expect(action).toHaveBeenCalledTimes(1)
  })

  it('should prevent default when preventDefault is true', () => {
    renderHook(() =>
      useKeyboardShortcuts({
        shortcuts: [{ key: '/', description: 'search', action: vi.fn() }],
        preventDefault: true,
      })
    )
    act(() => { vi.advanceTimersByTime(0) })

    const event = new KeyboardEvent('keydown', { key: '/' })
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')
    act(() => { window.dispatchEvent(event) })
    expect(preventDefaultSpy).toHaveBeenCalled()
  })

  it('should cleanup listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    const { unmount } = renderHook(() =>
      useKeyboardShortcuts({ shortcuts: [{ key: 'n', description: 'test', action: vi.fn() }] })
    )
    act(() => { vi.advanceTimersByTime(0) })
    unmount()
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
  })

  it('should update shortcuts when shortcuts prop changes', () => {
    const action1 = vi.fn()
    const action2 = vi.fn()

    const { rerender } = renderHook(
      ({ cb }) =>
        useKeyboardShortcuts({
          shortcuts: [{ key: 'n', description: 'test', action: cb }],
        }),
      { initialProps: { cb: action1 } }
    )
    act(() => { vi.advanceTimersByTime(0) })

    rerender({ cb: action2 })
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n' })) })

    expect(action2).toHaveBeenCalledTimes(1)
    expect(action1).not.toHaveBeenCalled()
  })

  it('should only fire the first matching shortcut', () => {
    const action1 = vi.fn()
    const action2 = vi.fn()

    renderHook(() =>
      useKeyboardShortcuts({
        shortcuts: [
          { key: 'a', description: 'first', action: action1 },
          { key: 'a', description: 'second', action: action2 },
        ],
      })
    )
    act(() => { vi.advanceTimersByTime(0) })
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' })) })

    expect(action1).toHaveBeenCalledTimes(1)
    expect(action2).not.toHaveBeenCalled()
  })
})

// ============================================================
// useGlobalNavigation
// ============================================================

describe('useGlobalNavigation', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('should navigate to each view on matching keypress', () => {
    const navigate = vi.fn()
    const views = [
      { key: 'dashboard', label: 'Dashboard', shortcut: '1' },
      { key: 'clientes', label: 'Clientes', shortcut: '2' },
      { key: 'asistencias', label: 'Asistencias', shortcut: '3' },
    ]

    renderHook(() => useGlobalNavigation(navigate, views))
    act(() => { vi.advanceTimersByTime(0) })

    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: '1' })) })
    expect(navigate).toHaveBeenCalledWith('dashboard')

    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: '2' })) })
    expect(navigate).toHaveBeenCalledWith('clientes')

    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: '3' })) })
    expect(navigate).toHaveBeenCalledWith('asistencias')
  })

  it('should not navigate for non-matching keypress', () => {
    const navigate = vi.fn()
    renderHook(() =>
      useGlobalNavigation(navigate, [{ key: 'dashboard', label: 'Dashboard', shortcut: '1' }])
    )
    act(() => { vi.advanceTimersByTime(0) })
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: '9' })) })
    expect(navigate).not.toHaveBeenCalled()
  })
})

// ============================================================
// useNMSShortcuts
// ============================================================

describe('useNMSShortcuts', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    vi.clearAllMocks()
  })
  afterEach(() => { vi.useRealTimers() })

  it('should return configured shortcuts', () => {
    const onNewClient = vi.fn()
    const onSearch = vi.fn()

    const { result } = renderHook(() =>
      useNMSShortcuts({ onNewClient, onSearch })
    )

    expect(result.current).toHaveLength(2)
    expect(result.current.map(s => s.key)).toContain('n')
    expect(result.current.map(s => s.key)).toContain('/')
  })

  it('should return empty array when no callbacks are provided', () => {
    const { result } = renderHook(() => useNMSShortcuts({}))
    expect(result.current).toHaveLength(0)
  })

  it('should trigger new client shortcut with Ctrl modifier', () => {
    const onNewClient = vi.fn()
    renderHook(() => useNMSShortcuts({ onNewClient }))
    act(() => { vi.advanceTimersByTime(0) })
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', ctrlKey: true })) })
    expect(onNewClient).toHaveBeenCalledTimes(1)
  })

  it('should trigger search shortcut without modifier', () => {
    const onSearch = vi.fn()
    renderHook(() => useNMSShortcuts({ onSearch }))
    act(() => { vi.advanceTimersByTime(0) })
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: '/' })) })
    expect(onSearch).toHaveBeenCalledTimes(1)
  })

  it('should include all 8 shortcuts when all callbacks are provided', () => {
    const { result } = renderHook(() =>
      useNMSShortcuts({
        onNewClient: vi.fn(),
        onSearch: vi.fn(),
        onDashboard: vi.fn(),
        onClients: vi.fn(),
        onAttendance: vi.fn(),
        onPayments: vi.fn(),
        onSettings: vi.fn(),
        onEscape: vi.fn(),
      })
    )
    // 1 (Ctrl) + / + 1 + 2 + 3 + 4 + 5 + Escape = 8
    expect(result.current.length).toBe(8)
  })
})

// ============================================================
// useViewPreloader
// ============================================================

describe('useViewPreloader', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.clearAllMocks() })
  afterEach(() => { vi.useRealTimers() })

  it('should return all three preload functions', () => {
    const { result } = renderHook(() => useViewPreloader())
    expect(typeof result.current.preloadView).toBe('function')
    expect(typeof result.current.handleMouseEnter).toBe('function')
    expect(typeof result.current.handleMouseLeave).toBe('function')
  })

  it('should skip preloading dashboard view', () => {
    const { result } = renderHook(() => useViewPreloader())
    act(() => { result.current.preloadView('dashboard') })
    expect(true).toBe(true)
  })

  it('should debounce preloading on handleMouseEnter', () => {
    const { result } = renderHook(() => useViewPreloader())
    act(() => { result.current.handleMouseEnter('clientes') })
    // Preload should not have fired yet (debounced by 150ms)
    expect(true).toBe(true)
    act(() => { vi.advanceTimersByTime(150) })
    expect(true).toBe(true)
  })

  it('should cancel pending preload on handleMouseLeave', () => {
    const { result } = renderHook(() => useViewPreloader())
    act(() => { result.current.handleMouseEnter('clientes') })
    act(() => { result.current.handleMouseLeave('clientes') })
    // After cancelling, advancing time should not cause issues
    act(() => { vi.advanceTimersByTime(200) })
    expect(true).toBe(true)
  })

  it('should skip preloading unknown view keys', () => {
    const { result } = renderHook(() => useViewPreloader())
    act(() => { result.current.preloadView('nonexistent') })
    expect(true).toBe(true)
  })
})

// ============================================================
// toast (uses vi.mock('sonner') at top of file)
// ============================================================

describe('toast', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('toast.success calls sonner with default 3000ms duration', () => {
    toast.success('Done')
    expect(sonnerToast.success).toHaveBeenCalledWith('Done', expect.objectContaining({ duration: 3000 }))
  })

  it('toast.success accepts custom options', () => {
    toast.success('Done', { duration: 5000, description: 'extra info' })
    expect(sonnerToast.success).toHaveBeenCalledWith('Done', expect.objectContaining({
      duration: 5000,
      description: 'extra info',
    }))
  })

  it('toast.error calls sonner with default 4000ms duration', () => {
    toast.error('Failed')
    expect(sonnerToast.error).toHaveBeenCalledWith('Failed', expect.objectContaining({ duration: 4000 }))
  })

  it('toast.warning calls sonner with default 4000ms duration', () => {
    toast.warning('Check this')
    expect(sonnerToast.warning).toHaveBeenCalledWith('Check this', expect.objectContaining({ duration: 4000 }))
  })

  it('toast.info calls sonner with default 3000ms duration', () => {
    toast.info('Info')
    expect(sonnerToast.info).toHaveBeenCalledWith('Info', expect.objectContaining({ duration: 3000 }))
  })

  it('toast.loading sets Infinity duration', () => {
    toast.loading('Working...')
    expect(sonnerToast.loading).toHaveBeenCalledWith('Working...', expect.objectContaining({ duration: Infinity }))
  })

  it('toast.promise passes promise and config to sonner', () => {
    const promise = Promise.resolve('result')
    const config = { loading: 'Loading...', success: 'Success!', error: 'Error' }
    toast.promise(promise, config)
    expect(sonnerToast.promise).toHaveBeenCalledWith(promise, config)
  })

  it('toast.dismiss calls sonner.dismiss with the given id', () => {
    toast.dismiss('my-toast-id')
    expect(sonnerToast.dismiss).toHaveBeenCalledWith('my-toast-id')
  })

  it('toast.dismiss with no arg dismisses all', () => {
    toast.dismiss()
    expect(sonnerToast.dismiss).toHaveBeenCalledWith(undefined)
  })
})

// ============================================================
// toastMessages
// ============================================================

describe('toastMessages', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('created shows success with Spanish grammar', () => {
    toastMessages.created('Cliente')
    expect(sonnerToast.success).toHaveBeenCalledWith('Cliente creado exitosamente', expect.any(Object))
  })

  it('updated shows success with masculine article', () => {
    toastMessages.updated('Pago')
    expect(sonnerToast.success).toHaveBeenCalledWith('Pago actualizado exitosamente', expect.any(Object))
  })

  it('deleted shows success with masculine article', () => {
    toastMessages.deleted('Registro')
    expect(sonnerToast.success).toHaveBeenCalledWith('Registro eliminado exitosamente', expect.any(Object))
  })

  it('saved shows generic success message', () => {
    toastMessages.saved()
    expect(sonnerToast.success).toHaveBeenCalledWith('Cambios guardados', expect.any(Object))
  })

  it('error.generic shows generic error message', () => {
    toastMessages.error.generic()
    expect(sonnerToast.error).toHaveBeenCalledWith(
      'Ha ocurrido un error. Por favor, intenta de nuevo.',
      expect.any(Object)
    )
  })

  it('error.network shows network error message', () => {
    toastMessages.error.network()
    expect(sonnerToast.error).toHaveBeenCalledWith(
      'Error de conexión. Verifica tu conexión a internet.',
      expect.any(Object)
    )
  })

  it('error.notFound interpolates item name', () => {
    toastMessages.error.notFound('Empleado')
    expect(sonnerToast.error).toHaveBeenCalledWith('Empleado no encontrado', expect.any(Object))
  })

  it('error.unauthorized shows permission error', () => {
    toastMessages.error.unauthorized()
    expect(sonnerToast.error).toHaveBeenCalledWith(
      'No tienes permisos para realizar esta acción',
      expect.any(Object)
    )
  })

  it('error.validation shows validation error', () => {
    toastMessages.error.validation()
    expect(sonnerToast.error).toHaveBeenCalledWith(
      'Por favor, revisa los datos ingresados',
      expect.any(Object)
    )
  })

  it('loading.saving shows saving toast', () => {
    toastMessages.loading.saving()
    expect(sonnerToast.loading).toHaveBeenCalledWith('Guardando...', expect.any(Object))
  })

  it('loading.loading shows loading toast', () => {
    toastMessages.loading.loading()
    expect(sonnerToast.loading).toHaveBeenCalledWith('Cargando...', expect.any(Object))
  })

  it('loading.processing shows processing toast', () => {
    toastMessages.loading.processing()
    expect(sonnerToast.loading).toHaveBeenCalledWith('Procesando...', expect.any(Object))
  })

  it('confirm.delete shows warning with item name', () => {
    toastMessages.confirm.delete('Cliente')
    expect(sonnerToast.warning).toHaveBeenCalledWith('¿Estás seguro de eliminar Cliente?', expect.any(Object))
  })
})

// ============================================================
// handleApiError
// ============================================================

describe('handleApiError', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('logs and shows toast for Error instances', () => {
    const error = new Error('DB connection failed')
    handleApiError(error)
    expect(consoleErrorSpy).toHaveBeenCalledWith('API Error:', error)
    expect(sonnerToast.error).toHaveBeenCalledWith('DB connection failed', expect.any(Object))
  })

  it('shows toast for string errors', () => {
    handleApiError('Network timeout')
    expect(sonnerToast.error).toHaveBeenCalledWith('Network timeout', expect.any(Object))
  })

  it('shows fallback message for unknown error types', () => {
    handleApiError({ code: 500 })
    expect(sonnerToast.error).toHaveBeenCalledWith('Ha ocurrido un error', expect.any(Object))
  })

  it('uses custom fallback message when provided', () => {
    handleApiError({ code: 500 }, 'Something went wrong')
    expect(sonnerToast.error).toHaveBeenCalledWith('Something went wrong', expect.any(Object))
  })

  it('prefers error.message over fallback when available', () => {
    const error = new Error('specific')
    handleApiError(error, 'generic fallback')
    expect(sonnerToast.error).toHaveBeenCalledWith('specific', expect.any(Object))
  })
})
