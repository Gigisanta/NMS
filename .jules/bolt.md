#WZ#PB|## 2026-03-04 - Parallelism and Date Mutation
**Learning:** Mutating the `Date` object directly (e.g., `now.setHours(0)`) in an API handler that uses `Promise.all` can lead to race conditions or incorrect range calculations for subsequent parallel queries if they rely on the same `now` variable.
**Action:** Always clone Date objects using `new Date(originalDate)` before performing mutations for range calculations.
#XV
#SW|# Bolt's Journal - Critical Learnings

## 2025-05-15 - Initializing Bolt's Journal
**Learning:** Starting the mission to optimize the codebase.
**Action:** Always measure before optimizing.

## 2025-05-15 - Optimizing Sequential Fetches and List Rendering
**Learning:** Next.js components often fall into the "sequential fetch" trap when multiple `await fetch()` calls are used. Parallelizing them with `Promise.all` is a simple but effective win. Also, rendering lists that involve filtering another array inside the loop can quickly become an $O(N \times M)$ bottleneck; using a pre-calculated `Map` ($O(N+M)$) is a mandatory optimization for scale.
**Action:** Always check for sequential await calls in `useEffect` or `useCallback` and evaluate the complexity of inner-loop calculations in components.

## 2025-05-15 - Centralized Server-Side Caching with Invalidation
**Learning:** Implementing a per-route `cachedFetch` strategy with a centralized `CacheKeys` generator simplifies cache management. However, cache invalidation must be granular yet comprehensive; using a pattern-based invalidator like `invalidateCachePattern('client')` is essential for routes that affect both list and detail views (e.g., updating a client profile).
**Action:** When adding caching to related routes, ensure a consistent key prefix and use pattern invalidation in all mutating handlers (POST, PUT, PATCH, DELETE).

## 2026-03-04 - Batching Aggregations to Avoid N+1
**Learning:** Prisma's `groupBy` doesn't support grouping by related fields (e.g., grouping Subscriptions by Client.grupoId). Using `map()` with individual `aggregate()` calls creates an N+1 query bottleneck that scales poorly with the number of groups.
**Action:** Use a single `findMany` to batch-fetch all required records in a single query (parallelized with other requests) and perform the aggregation in-memory using `reduce()`. This reduces database roundtrips from N to 1.
