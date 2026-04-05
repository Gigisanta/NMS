## Summary

Added a 5th stat card on the dashboard: **Morosos** (overdue clients / DEUDOR status).

## What changed

- **Dashboard card** (`dashboard-view.tsx`): New `StatCard` showing `overduePayments` (clients with DEUDOR status) with red accent and "+10 dias" trend label
- **Grid layout**: Updated from 4 to 5 columns to fit the new card
- **Data**: No backend changes needed - `overduePayments` was already computed in `api/dashboard/route.ts` but never displayed on the frontend

## Why this is the most impactful change

The owner already has the number hidden in the API, but the dashboard was only showing 4 cards:
- Clientes (total - not actionable)
- Activos (clients with any subscription status this month)
- Pendientes (PENDIENTE - first reminder stage)
- Hoy (today's attendances - useful but not financial)

**Missing**: A clear, always-visible signal for clients who are truly overdue. Currently an owner must navigate to the Payments view or look at the Pending card to understand the debt picture. This card surfaces it immediately on the dashboard landing page.

## Other improvements identified (for follow-up PRs)

1. **Payment tracking**: Dashboard shows monthRevenue (AL_DIA only) but does not show total projected vs collected at the stat level. A simple "collected/total" progress bar next to monthRevenue would help.

2. **Client management**: The clients table doesn't show the actual payment amount per client - only the status badge. Adding the monthly amount (from subscription) would let the owner sort/filter by revenue value.