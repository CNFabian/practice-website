/**
 * useCoinBalance Hook
 *
 * Example TanStack Query hook for fetching user's coin balance.
 *
 * This hook demonstrates:
 * - Using queryKeys from centralized factory
 * - Custom staleTime for real-time data
 * - Enabling refetchOnWindowFocus
 *
 * Usage:
 *   const { data, isLoading, error, refetch } = useCoinBalance();
 *
 * Called by:
 * - OverviewPage (dashboard)
 * - RewardsPage (show available coins)
 * - Header (coin badge display)
 *
 * Previously caused 3+ duplicate API calls - now deduplicated by TanStack Query!
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { getCoinBalance } from '../../services/dashboardAPI';

export const useCoinBalance = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.coins(),
    queryFn: getCoinBalance,

    // Real-time data - keep fresh for only 30 seconds
    staleTime: 30 * 1000,

    // Cache for 2 minutes after component unmounts
    gcTime: 2 * 60 * 1000,

    // Refetch when user returns to window/tab
    refetchOnWindowFocus: true,

    // Retry once on failure
    retry: 1,
  });
};
