import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import {
  useDebounce,
  useDebouncedCallback,
  useThrottledCallback,
  useLocalStorage,
  useIsMounted,
} from '@/hooks/use-optimized'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

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

    // Change value
    rerender({ value: 'changed', delay: 500 })
    expect(result.current).toBe('initial') // Still initial because of debounce

    // Fast forward time
    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(result.current).toBe('changed')
  })

  it('should use default delay of 300ms', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: 'initial' } }
    )

    rerender({ value: 'changed' })

    act(() => {
      vi.advanceTimersByTime(299)
    })
    expect(result.current).toBe('initial')

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe('changed')
  })

  it('should cancel previous debounce on new value', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    )

    rerender({ value: 'first' })
    act(() => {
      vi.advanceTimersByTime(250)
    })

    rerender({ value: 'second' })
    act(() => {
      vi.advanceTimersByTime(250)
    })
    expect(result.current).toBe('initial') // Still initial, timer was reset

    act(() => {
      vi.advanceTimersByTime(250)
    })
    expect(result.current).toBe('second')
  })
})

describe('useDebouncedCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should debounce callback execution', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 500))

    act(() => {
      result.current('arg1')
      result.current('arg2')
      result.current('arg3')
    })

    expect(callback).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith('arg3')
  })

  it('should cancel pending execution on unmount', () => {
    const callback = vi.fn()
    const { result, unmount } = renderHook(() => useDebouncedCallback(callback, 500))

    act(() => {
      result.current('test')
    })

    unmount()

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(callback).not.toHaveBeenCalled()
  })
})

describe('useThrottledCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should throttle callback execution', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useThrottledCallback(callback, 100))

    act(() => {
      result.current('first')
    })

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith('first')

    // Try to call again immediately
    act(() => {
      result.current('second')
    })

    // Should not be called yet (throttled)
    expect(callback).toHaveBeenCalledTimes(1)

    // Advance time
    act(() => {
      vi.advanceTimersByTime(100)
    })

    // Now the queued call should have executed
    expect(callback).toHaveBeenCalledTimes(2)
    expect(callback).toHaveBeenCalledWith('second')
  })

  it('should allow immediate execution after throttle period', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useThrottledCallback(callback, 100))

    act(() => {
      result.current('first')
    })
    expect(callback).toHaveBeenCalledTimes(1)

    act(() => {
      vi.advanceTimersByTime(150)
    })

    act(() => {
      result.current('second')
    })
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

    act(() => {
      result.current[1]('new-value')
    })

    expect(result.current[0]).toBe('new-value')
    expect(localStorage.setItem).toHaveBeenCalledWith('test-key', JSON.stringify('new-value'))
  })

  it('should handle function updates', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 5))

    act(() => {
      result.current[1](prev => prev + 1)
    })

    expect(result.current[0]).toBe(6)
  })

  it('should handle object values', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', { name: 'test' }))

    act(() => {
      result.current[1]({ name: 'updated' })
    })

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
