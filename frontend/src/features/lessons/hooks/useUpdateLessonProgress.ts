import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { updateLessonProgress } from '../../../services/learningAPI';

interface UpdateLessonProgressParams {
  lessonId: string;
  videoProgressSeconds: number;
}

export const useUpdateLessonProgress = (lessonId: string | number, moduleId: string | number) => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, UpdateLessonProgressParams>({
    mutationFn: ({ lessonId, videoProgressSeconds }) => updateLessonProgress(lessonId, videoProgressSeconds),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.learning.lesson(lessonId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.learning.module(moduleId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.learning.progress.all(),
      });
    },
  });
};
