/**
 * In-memory cache utility for API routes
 * Reduces database queries for frequently accessed data
 *
 * NOTE: This in-memory cache is ineffective in serverless environments (Vercel).
 * Each function invocation may run on a different Node.js instance.
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

// Simple in-memory cache
const cache = new Map<string, CacheEntry<unknown>>()

// Cache key generators
export const CacheKeys = {
  groups: () => 'groups:all',
  clients: (params: Record<string, string>) => `clients:${JSON.stringify(params)}`,
  client: (id: string) => `client:${id}`,
  dashboard: () => 'dashboard:stats',
  attendanceToday: () => `attendance:today`,
  subscriptions: (params: Record<string, string | number | null>) => `subscriptions:${JSON.stringify(params)}`,
} as const

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
 * Uses prefix matching to avoid false positives (e.g. 'client' won't match 'clients')
 */
export function invalidateCachePattern(pattern: string): void {
  for (const key of cache.keys()) {
    // Only match exact key or keys with the pattern as a prefix followed by ':'
    // This ensures 'client' matches 'client:abc' but NOT 'clients:all'
    if (key === pattern || key.startsWith(pattern + ':')) {
      cache.delete(key)
    }
  }
}

/**
 * Invalidate groups cache and any related caches (clients include group data)
 */
export function invalidateGroupsCache(): void {
  invalidateCache('groups:all')
  // Clients cache contains group data (grupo object), so invalidate it too
  invalidateCachePattern('clients')
  invalidateCachePattern('dashboard')
}

/**
 * Invalidate client-related caches (both list and details)
 * Clears lists, specific details, dashboard and attendance
 */
export function invalidateClientCache(): void {
  invalidateCachePattern('clients')
  invalidateCachePattern('client:')
  invalidateCachePattern('dashboard')
  invalidateCachePattern('attendance')
  invalidateCachePattern('subscriptions')
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

