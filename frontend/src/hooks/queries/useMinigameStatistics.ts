import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { getMinigameStatistics } from '../../services/minigameAPI';

export const useMinigameStatistics = () => {
  return useQuery({
    queryKey: queryKeys.minigame.statistics(),
    queryFn: getMinigameStatistics,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};