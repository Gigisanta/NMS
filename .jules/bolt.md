## 2026-03-04 - Parallelism and Date Mutation
**Learning:** Mutating the `Date` object directly (e.g., `now.setHours(0)`) in an API handler that uses `Promise.all` can lead to race conditions or incorrect range calculations for subsequent parallel queries if they rely on the same `now` variable.
**Action:** Always clone Date objects using `new Date(originalDate)` before performing mutations for range calculations.
