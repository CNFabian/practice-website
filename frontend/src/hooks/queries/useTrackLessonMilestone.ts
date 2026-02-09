import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import {
  trackLessonMilestone,
  type LessonMilestoneResponse,
} from '../../services/learningAPI';

interface TrackMilestoneParams {
  lessonId: string;
  milestone: number;
  contentType: 'video' | 'transcript';
  videoProgressSeconds?: number | null;
  transcriptProgressPercentage?: number | null;
  timeSpentSeconds: number;
}

export const useTrackLessonMilestone = (lessonId: string, moduleId?: string) => {
  const queryClient = useQueryClient();

  return useMutation<LessonMilestoneResponse, Error, TrackMilestoneParams>({
    mutationFn: (params) =>
      trackLessonMilestone(
        params.lessonId,
        params.milestone,
        params.contentType,
        params.videoProgressSeconds,
        params.transcriptProgressPercentage,
        params.timeSpentSeconds
      ),

    onSuccess: (data) => {
      // Invalidate lesson data to reflect updated milestones
      queryClient.invalidateQueries({
        queryKey: queryKeys.learning.lesson(lessonId),
      });

      // If auto-completed at 90% milestone, invalidate broader queries
      if (data.auto_completed) {
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
      }
    },
  });
};