# Bolt's Journal - Critical Learnings

## 2025-05-15 - Initializing Bolt's Journal
**Learning:** Starting the mission to optimize the codebase.
**Action:** Always measure before optimizing.

## 2025-05-15 - Optimizing Sequential Fetches and List Rendering
**Learning:** Next.js components often fall into the "sequential fetch" trap when multiple `await fetch()` calls are used. Parallelizing them with `Promise.all` is a simple but effective win. Also, rendering lists that involve filtering another array inside the loop can quickly become an $O(N \times M)$ bottleneck; using a pre-calculated `Map` ($O(N+M)$) is a mandatory optimization for scale.
**Action:** Always check for sequential await calls in `useEffect` or `useCallback` and evaluate the complexity of inner-loop calculations in components.
