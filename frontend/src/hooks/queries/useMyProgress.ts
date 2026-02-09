import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { getMyProgress } from '../../services/analyticsAPI';
import type { UserProgressResponse } from '../../services/analyticsAPI';

/**
 * Hook to fetch the current user's progress metrics.
 *
 * Returns engagement level, progress percentage, lessons/modules completed,
 * badges earned, coin balance, and recent achievements.
 *
 * staleTime: 2 minutes — engagement metrics update with user activity
 * but don't need real-time refresh.
 *
 * Usage:
 *   const { data: progress, isLoading, error } = useMyProgress();
 *   // progress?.progress_percentage, progress?.engagement_level, etc.
 */
export const useMyProgress = (enabled: boolean = true) => {
  return useQuery<UserProgressResponse, Error>({
    queryKey: queryKeys.analytics.myProgress(),
    queryFn: getMyProgress,
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled,
  });
};