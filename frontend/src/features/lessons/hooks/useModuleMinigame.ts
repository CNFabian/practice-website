import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { getModuleMinigame } from '../services/minigameAPI';

export const useModuleMinigame = (moduleId: string | null | undefined) => {
  return useQuery({
    queryKey: queryKeys.minigame.module(moduleId || ''),
    queryFn: () => getModuleMinigame(moduleId || ''),
    enabled: !!moduleId,
    staleTime: 5 * 60 * 1000, // 5 minutes — questions don't change often
  });
};