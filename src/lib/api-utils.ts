/**
 * In-memory cache utility for API routes
 * Reduces database queries for frequently accessed data
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

// Simple in-memory cache
const cache = new Map<string, CacheEntry<unknown>>()

/**
 * Get data from cache or fetch it
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 60 * 1000 // 1 minute default TTL
): Promise<T> {
  const now = Date.now()
  const cached = cache.get(key) as CacheEntry<T> | undefined

  // Return cached data if valid
  if (cached && now - cached.timestamp < cached.ttl) {
    return cached.data
  }

  // Fetch fresh data
  const data = await fetcher()
  
  // Store in cache
  cache.set(key, {
    data,
    timestamp: now,
    ttl,
  })

  return data
}

/**
 * Invalidate cache entry
 */
export function invalidateCache(key: string): void {
  cache.delete(key)
}

/**
 * Invalidate all cache entries matching pattern
 */
export function invalidateCachePattern(pattern: string): void {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key)
    }
  }
}

/**
 * Invalidate client-related caches (both list and details)
 */
export function invalidateClientCache(): void {
  invalidateCachePattern('clients:')
  invalidateCachePattern('client:')
}

/**
 * Clear all cache
 */
export function clearCache(): void {
  cache.clear()
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  }
}

// Cache key generators
export const CacheKeys = {
  groups: () => 'groups:all',
  clients: (params: Record<string, string>) => `clients:${JSON.stringify(params)}`,
  client: (id: string) => `client:${id}`,
  dashboard: () => 'dashboard:stats',
  attendanceToday: () => `attendance:today`,
} as const
