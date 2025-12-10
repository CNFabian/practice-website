import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { getDashboardModules } from '../../services/dashboardAPI';

export const useDashboardModules = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.modules(),
    queryFn: getDashboardModules,

    staleTime: 5 * 60 * 1000,

    gcTime: 10 * 60 * 1000,

    refetchOnWindowFocus: true,

    retry: 1,
  });
};
