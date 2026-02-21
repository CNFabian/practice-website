import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { submitModuleMinigame } from '../services/minigameAPI';
import type { MiniGameResult } from '../../../types/minigame.api.types';

interface SubmitMinigameParams {
  moduleId: string;
  answers: Array<Record<string, string>>;
  timeTakenSeconds?: number | null;
  gameData?: Record<string, any> | null;
}

export const useSubmitMinigame = (moduleId: string) => {
  const queryClient = useQueryClient();

  return useMutation<MiniGameResult, Error, SubmitMinigameParams>({
    mutationFn: (params) =>
      submitModuleMinigame(params.moduleId, {
        answers: params.answers,
        timeTakenSeconds: params.timeTakenSeconds,
        gameData: params.gameData,
      }),

    onSuccess: () => {
      // Invalidate minigame-related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.minigame.module(moduleId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.minigame.attempts(moduleId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.minigame.statistics(),
      });

      // Invalidate module/dashboard queries (module may now be completed)
      queryClient.invalidateQueries({
        queryKey: queryKeys.learning.modules(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.overview(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.coins(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.badges(),
      });
    },
  });
};