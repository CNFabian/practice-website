import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { uncompleteLesson } from '../../../services/learningAPI';

interface UncompleteLessonParams {
  lessonId: string;
}

interface UncompleteLessonResponse {
  success: boolean;
  message?: string;
}

interface MutationContext {
  previousLesson?: any;
}

export const useUncompleteLesson = (
  lessonId: string | number,
  moduleId: string | number
) => {
  const queryClient = useQueryClient();

  return useMutation<UncompleteLessonResponse, Error, UncompleteLessonParams, MutationContext>({
    mutationFn: ({ lessonId }) => uncompleteLesson(lessonId),

    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.learning.lesson(lessonId),
      });

      const previousLesson = queryClient.getQueryData(
        queryKeys.learning.lesson(lessonId)
      );

      // Optimistically mark as uncompleted
      queryClient.setQueryData(
        queryKeys.learning.lesson(lessonId),
        (old: any) => ({
          ...old,
          is_completed: false,
          completed: false,
        })
      );

      return { previousLesson };
    },

    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousLesson) {
        queryClient.setQueryData(
          queryKeys.learning.lesson(lessonId),
          context.previousLesson
        );
      }
    },

    onSettled: () => {
      // NOTE: We intentionally do NOT invalidate the lesson query here.
      // Same reasoning as useCompleteLesson — the optimistic update in
      // onMutate already set is_completed=false, and any refetch risks
      // returning stale data that overwrites the correct optimistic state.

      queryClient.invalidateQueries({
        queryKey: queryKeys.learning.module(moduleId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.learning.progress.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.overview(),
      });
      // Note: No coin invalidation — uncompleting a lesson does NOT deduct coins
    },
  });
};
