import { useState, useEffect, useCallback, useRef, useMemo } from 'react'

/**
 * Hook para cacheo de datos con TTL (Time To Live)
 * Optimiza las peticiones a la API cacheando los resultados
 */
export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 5 * 60 * 1000 // 5 minutos por defecto
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const lastFetch = useRef<number>(0)
  const abortController = useRef<AbortController | null>(null)

  const fetch = useCallback(async (force = false) => {
    const now = Date.now()
    const shouldFetch = force || now - lastFetch.current > ttl

    if (!shouldFetch) return

    // Cancel previous request
    if (abortController.current) {
      abortController.current.abort()
    }
    abortController.current = new AbortController()

    setLoading(true)
    setError(null)

    try {
      const result = await fetcher()
      setData(result)
      lastFetch.current = now
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err)
      }
    } finally {
      setLoading(false)
    }
  }, [fetcher, ttl])

  useEffect(() => {
    fetch()
    return () => {
      if (abortController.current) {
        abortController.current.abort()
      }
    }
  }, [fetch])

  const invalidate = useCallback(() => {
    lastFetch.current = 0
    fetch(true)
  }, [fetch])

  return { data, loading, error, refetch: () => fetch(true), invalidate }
}

/**
 * Hook para debounce de valores
 * Optimiza búsquedas y inputs que disparan peticiones
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook para debounce de funciones
 * Previene llamadas excesivas a funciones costosas
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number = 300
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => callback(...args), delay)
    },
    [callback, delay]
  ) as T

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return debouncedCallback
}

/**
 * Hook para throttle de funciones
 * Limita la frecuencia de ejecución
 */
export function useThrottledCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  limit: number = 100
): T {
  const lastRun = useRef<number>(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now()
      const timeSinceLastRun = now - lastRun.current

      if (timeSinceLastRun >= limit) {
        lastRun.current = now
        callback(...args)
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        timeoutRef.current = setTimeout(() => {
          lastRun.current = Date.now()
          callback(...args)
        }, limit - timeSinceLastRun)
      }
    },
    [callback, limit]
  ) as T

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return throttledCallback
}

/**
 * Hook para lazy loading con Intersection Observer
 * Mejora el rendimiento cargando elementos solo cuando son visibles
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
): [React.RefCallback<Element>, boolean] {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [element, setElement] = useState<Element | null>(null)

  useEffect(() => {
    if (!element) return

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
    }, { threshold: 0.1, ...options })

    observer.observe(element)
    return () => observer.disconnect()
  }, [element, options])

  return [setElement, isIntersecting]
}

/**
 * Hook para medir el rendimiento de operaciones
 * Útil para debugging y optimización
 */
export function usePerformanceMeasure(name: string) {
  const startTime = useRef<number>(0)

  const start = useCallback(() => {
    startTime.current = performance.now()
  }, [])

  const end = useCallback(() => {
    const duration = performance.now() - startTime.current
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Perf] ${name}: ${duration.toFixed(2)}ms`)
    }
    return duration
  }, [name])

  return { start, end }
}

/**
 * Hook para localStorage con sincronización
 * Persiste datos con serialización automática
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue
    
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue(prev => {
      const newValue = value instanceof Function ? value(prev) : value
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(newValue))
      }
      return newValue
    })
  }, [key])

  return [storedValue, setValue]
}

/**
 * Hook para detectar si el componente está montado
 * Previene actualizaciones de estado en componentes desmontados
 */
export function useIsMounted() {
  const isMounted = useRef(false)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  return useCallback(() => isMounted.current, [])
}

/**
 * Hook para localStorage con sincronización entre pestañas
 */
export function useStorageSync<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setState(JSON.parse(e.newValue))
        } catch {
          // Ignore parse errors
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key])

  const setValue = useCallback((value: T) => {
    setState(value)
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Ignore storage errors
    }
  }, [key])

  return [state, setValue]
}

/**
 * Hook para detectar cuando el usuario está inactivo
 * Útil para pausar operaciones costosas
 */
export function useIdleCallback(callback: () => void, timeout = 30000) {
  const savedCallback = useRef(callback)

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    const idleCallback = requestIdleCallback
      ? () => requestIdleCallback(() => savedCallback.current())
      : () => setTimeout(() => savedCallback.current(), 1)

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll']
    let timeoutId: ReturnType<typeof setTimeout>

    const resetTimer = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(idleCallback, timeout)
    }

    events.forEach(event => window.addEventListener(event, resetTimer))
    timeoutId = setTimeout(idleCallback, timeout)

    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimer))
      clearTimeout(timeoutId)
    }
  }, [timeout])
}
