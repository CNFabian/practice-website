// CRITICAL DEV NOTE: Event Deduplication + Submit Event Timing
// - Do NOT fire milestone events on click or timer tick — always wait for backend success response
// - Deduplication is naturally handled by useMutation: TanStack Query prevents duplicate in-flight
//   requests for the same mutation key, and the caller tracks milestones via milestonesReachedRef
// - onSuccess fires ONLY after backend confirms the milestone was recorded
// - onSuccess = backend confirmed | immediate/optimistic call = user intent only ⚠️

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { trackLessonMilestone } from '../../../services/learningAPI'
import { queryKeys } from '../../../lib/queryKeys'
import type { LessonMilestoneResponse } from '../../../services/learningAPI'

interface TrackMilestoneParams {
  lessonId: string
  milestone: number
  contentType: 'video' | 'transcript'
  videoProgressSeconds?: number | null
  transcriptProgressPercentage?: number | null
  timeSpentSeconds?: number
}

export const useTrackLessonMilestone = (lessonId: string, _moduleId: string) => {
  const queryClient = useQueryClient()

  return useMutation<LessonMilestoneResponse, Error, TrackMilestoneParams>({
    mutationFn: (params) =>
      trackLessonMilestone(
        params.lessonId,
        params.milestone,
        params.contentType,
        params.videoProgressSeconds,
        params.transcriptProgressPercentage,
        params.timeSpentSeconds ?? 0
      ),

    // onSuccess fires ONLY after backend confirms — correct place for analytics events
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.learning.milestone(lessonId),
      })
    },
  })
}
