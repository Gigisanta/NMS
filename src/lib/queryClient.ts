import { QueryClient } from '@tanstack/react-query'

// TanStack Query client - created once and exported for use across the app
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
    },
  },
})
