import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { getMinigameAttempts } from '../../services/minigameAPI';

export const useMinigameAttempts = (moduleId: string | null | undefined) => {
  return useQuery({
    queryKey: queryKeys.minigame.attempts(moduleId || ''),
    queryFn: () => getMinigameAttempts(moduleId || ''),
    enabled: !!moduleId,
    staleTime: 2 * 60 * 1000, // 2 minutes — attempts update after submission
  });
};