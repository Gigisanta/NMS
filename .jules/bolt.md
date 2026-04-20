# Bolt's Performance Journal

## 2025-05-15 - Optimized Subscription Generation & Caching
**Learning:** Refactoring O(N) database operations into O(1) using Prisma's `none` filter and `createMany` significantly reduces latency and database load. Also, placing expensive synchronization logic (like ensuring records exist) inside the `cachedFetch` callback prevents unnecessary database checks on every request when the cache is hot.

**Action:** Always look for N+1 patterns or manual JS-side filtering of database results that can be offloaded to Prisma filters. Prefer `createMany` for bulk inserts. Surround expensive conditional logic with caching when the result is predictable for a period of time.
