import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { getBadges } from '../services/badgesAPI';

export const useBadges = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.badges(),
    queryFn: getBadges,

    staleTime: 2 * 60 * 1000,

    gcTime: 5 * 60 * 1000,

    refetchOnWindowFocus: true,

    retry: 1,
  });
};
