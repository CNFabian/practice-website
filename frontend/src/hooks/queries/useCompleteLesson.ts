import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { completeLesson } from '../../services/learningAPI';

// --- Updated mutation params type ---
interface CompleteLessonParams {
  lessonId: string;
  completionData?: {
    completionMethod?: 'auto' | 'manual' | 'milestone';
    videoProgressSeconds?: number | null;
    transcriptProgressPercentage?: number | null;
    timeSpentSeconds?: number;
    contentType?: 'video' | 'transcript' | null;
  };
}

export const useCompleteLesson = (lessonId: string, moduleId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CompleteLessonParams) =>
      completeLesson(params.lessonId, params.completionData),

    onMutate: async () => {
      // Optimistic update: mark lesson as completed in cache
      await queryClient.cancelQueries({
        queryKey: queryKeys.learning.lesson(lessonId),
      });

      queryClient.setQueryData(
        queryKeys.learning.lesson(lessonId),
        (old: any) => (old ? { ...old, is_completed: true } : old)
      );
    },

    onSettled: () => {
      // Invalidate all related queries after completion
      queryClient.invalidateQueries({
        queryKey: queryKeys.learning.lesson(lessonId),
      });

      if (moduleId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.learning.module(moduleId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.learning.moduleLessons(moduleId),
        });
      }

      queryClient.invalidateQueries({
        queryKey: queryKeys.learning.modules(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.overview(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.coins(),
      });
    },
  });
};