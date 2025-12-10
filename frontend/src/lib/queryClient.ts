import { QueryClient, DefaultOptions } from '@tanstack/react-query';

/**
 * Default query options for TanStack Query
 *
 * Configuration Philosophy:
 * - staleTime: How long before data is considered stale (60s default)
 * - cacheTime: How long unused data stays in cache (5min default) - RENAMED to gcTime in v5
 * - retry: Number of retry attempts on failure (1 default)
 * - refetchOnWindowFocus: Refetch when user returns to window (false by default)
 * - refetchOnReconnect: Refetch when network reconnects (true)
 */
const defaultQueryOptions: DefaultOptions = {
  queries: {
    // How long data is considered fresh (60 seconds)
    staleTime: 60 * 1000,

    // How long unused data stays in cache (5 minutes) - v5 uses gcTime instead of cacheTime
    gcTime: 5 * 60 * 1000,

    // Retry failed requests once
    retry: 1,

    // Don't refetch on window focus by default (can override per query)
    refetchOnWindowFocus: false,

    // Refetch when network reconnects
    refetchOnReconnect: true,

    // Refetch on mount only if data is stale
    refetchOnMount: true,
  },
  mutations: {
    // Retry mutations once (can override for critical operations)
    retry: 1,
  },
};

/**
 * Global QueryClient instance
 *
 * Usage:
 * - Import in main.tsx and wrap app with QueryClientProvider
 * - Use in hooks for manual invalidation/refetching
 * - Access via useQueryClient() hook in components
 */
export const queryClient = new QueryClient({
  defaultOptions: defaultQueryOptions,
});

/**
 * Helper to invalidate multiple queries at once
 *
 * Example:
 * invalidateQueries(queryClient, [
 *   queryKeys.dashboard.coins(),
 *   queryKeys.learning.progress()
 * ])
 */
export const invalidateQueries = async (
  client: QueryClient,
  keys: unknown[][]
) => {
  await Promise.all(
    keys.map((key) => client.invalidateQueries({ queryKey: key }))
  );
};

/**
 * Helper to prefetch multiple queries
 *
 * Example:
 * prefetchQueries(queryClient, [
 *   { key: queryKeys.learning.modules(), fn: getModules },
 *   { key: queryKeys.dashboard.overview(), fn: getDashboardOverview }
 * ])
 */
export const prefetchQueries = async (
  client: QueryClient,
  queries: Array<{ key: unknown[]; fn: () => Promise<any> }>
) => {
  await Promise.all(
    queries.map(({ key, fn }) =>
      client.prefetchQuery({ queryKey: key, queryFn: fn })
    )
  );
};
