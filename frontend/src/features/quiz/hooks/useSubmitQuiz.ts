// 🔴 CRITICAL DEV NOTE: Submit Event Timing
// - Do NOT fire submit/completion events on button click
// - Always wait for backend success response (onSuccess) for true measurement
// - This ensures events only fire when the backend confirms the quiz submission succeeded
// - onMutate is used for optimistic UI updates ONLY — not for analytics
// - onError rolls back optimistic updates if the submission fails
// - onSuccess = backend confirmed ✅ | onClick = user intent only ⚠️

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { submitQuiz } from '../services/quizAPI';

interface SubmitQuizParams {
  lesson_id: string;
  answers: Record<string, string>[];
  time_taken_seconds?: number;
}

interface SubmitQuizResponse {
  attempt_id: string;
  score: string;
  total_questions: number;
  correct_answers: number;
  passed: boolean;
  coins_earned: number;
  badges_earned: string[];
  time_taken_seconds: number;
}

interface MutationContext {
  previousLesson?: any;
}

export const useSubmitQuiz = (
  lessonBackendId: string,
  moduleBackendId: string
) => {
  const queryClient = useQueryClient();

  return useMutation<SubmitQuizResponse, Error, SubmitQuizParams, MutationContext>({
    mutationFn: (data) => submitQuiz(data),

    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.learning.lesson(lessonBackendId),
      });

      const previousLesson = queryClient.getQueryData(
        queryKeys.learning.lesson(lessonBackendId)
      );

      queryClient.setQueryData(
        queryKeys.learning.lesson(lessonBackendId),
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
          queryKeys.learning.lesson(lessonBackendId),
          context.previousLesson
        );
      }
    },

    // ✅ onSuccess fires ONLY after backend confirms — correct place for analytics events
    onSuccess: (data) => {
      console.log('✅ Quiz submitted successfully:', data);
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.learning.lesson(lessonBackendId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.learning.module(moduleBackendId),
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
        queryKey: queryKeys.quiz.attempts(lessonBackendId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.quiz.statistics(),
      });
    },
  });
};