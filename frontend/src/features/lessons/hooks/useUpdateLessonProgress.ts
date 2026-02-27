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
      // NOTE: We intentionally do NOT invalidate the lesson query here.
      // Progress updates only track video_progress_seconds — they don't
      // change is_completed or other lesson fields. Invalidating the
      // lesson query here causes a race condition when video completion
      // fires both handleVideoProgress and completeLessonMutation at
      // the same time: the progress response arrives first and refetches
      // stale is_completed=false data, overwriting the completion
      // mutation's optimistic update.
      queryClient.invalidateQueries({
        queryKey: queryKeys.learning.module(moduleId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.learning.progress.all(),
      });
    },
  });
};
