import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { submitQuiz } from '../../services/quizAPI';

interface SubmitQuizParams {
  lesson_id: string;
  answers: Record<string, string>[];
  time_taken_seconds?: number;
}

interface SubmitQuizResponse {
  score: number;
  passed: boolean;
  coins_earned?: number;
  badges_earned?: any[];
  results: any[];
}

interface MutationContext {
  previousLesson?: any;
}

export const useSubmitQuiz = (
  lessonId: string | number,
  moduleId: string | number
) => {
  const queryClient = useQueryClient();

  return useMutation<SubmitQuizResponse, Error, SubmitQuizParams, MutationContext>({
    mutationFn: (data) => submitQuiz(data),

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
      queryClient.invalidateQueries({
        queryKey: queryKeys.learning.lesson(lessonId),
      });
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
      queryClient.invalidateQueries({
        queryKey: queryKeys.badges.list(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.quiz.attempts(lessonId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.quiz.statistics(),
      });
    },
  });
};
