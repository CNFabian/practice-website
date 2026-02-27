import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { completeLesson } from '../../../services/learningAPI';

interface CompleteLessonParams {
  lessonId: string;
}

interface CompleteLessonResponse {
  success: boolean;
  message?: string;
}

interface MutationContext {
  previousLesson?: any;
}

export const useCompleteLesson = (
  lessonId: string | number,
  moduleId: string | number
) => {
  const queryClient = useQueryClient();

  return useMutation<CompleteLessonResponse, Error, CompleteLessonParams, MutationContext>({
    mutationFn: ({ lessonId }) => completeLesson(lessonId),

    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.learning.lesson(lessonId),
      });

      const previousLesson = queryClient.getQueryData(
        queryKeys.learning.lesson(lessonId)
      );

      queryClient.setQueryData(
        queryKeys.learning.lesson(lessonId),
        (old: any) => ({
          ...old,
          is_completed: true,
          completed: true,
        })
      );

      return { previousLesson };
    },

    onError: (_error, _variables, context) => {
      if (context?.previousLesson) {
        queryClient.setQueryData(
          queryKeys.learning.lesson(lessonId),
          context.previousLesson
        );
      }
    },

    onSettled: () => {
      // NOTE: We intentionally do NOT invalidate the lesson query here.
      // The optimistic update in onMutate already set is_completed=true,
      // and LessonView also uses local videoCompleted/readingCompleted
      // state as a source of truth. Any refetch risks returning stale
      // is_completed=false data from a backend that processes completion
      // asynchronously, overwriting the correct optimistic state.
      // The lesson query will naturally refresh on next navigation/mount.

      // Dependent aggregate queries can invalidate immediately
      queryClient.invalidateQueries({
        queryKey: queryKeys.learning.module(moduleId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.learning.progress.all(),
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
