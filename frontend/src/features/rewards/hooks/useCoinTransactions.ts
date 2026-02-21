import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { getCoinTransactions } from '../../../services/dashboardAPI';

export const useCoinTransactions = (limit: number = 20, offset: number = 0) => {
  return useQuery({
    queryKey: queryKeys.dashboard.transactions({ limit, offset }),
    queryFn: () => getCoinTransactions(limit, offset),

    staleTime: 2 * 60 * 1000,

    gcTime: 5 * 60 * 1000,

    refetchOnWindowFocus: true,

    retry: 1,
  });
};