import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { getUserStatistics } from '../../services/dashboardAPI';

export const useUserStatistics = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.statistics(),
    queryFn: getUserStatistics,

    staleTime: 5 * 60 * 1000,

    gcTime: 10 * 60 * 1000,

    refetchOnWindowFocus: true,

    retry: 1,
  });
};