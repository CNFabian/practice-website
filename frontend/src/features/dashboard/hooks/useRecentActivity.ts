import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { getRecentActivity } from '../../../services/dashboardAPI';

export const useRecentActivity = (limit: number = 10) => {
  return useQuery({
    queryKey: queryKeys.dashboard.activity(limit),
    queryFn: () => getRecentActivity(limit),

    staleTime: 1 * 60 * 1000,

    gcTime: 5 * 60 * 1000,

    refetchOnWindowFocus: true,

    retry: 1,
  });
};