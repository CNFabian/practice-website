// 🔴 CRITICAL DEV NOTE: Submit Event Timing
// - Do NOT fire submit/completion events on button click
// - Always wait for backend success response (onSuccess) for true measurement
// - This ensures events only fire when the backend confirms feedback was received
// - onSuccess = backend confirmed ✅ | onClick = user intent only ⚠️

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { submitFeedback } from '../services/helpAPI';

interface SubmitFeedbackParams {
  category?: string;
  feedback_type?: string;
  message: string;
  rating?: number;
  email?: string;
  page_url?: string;
  [key: string]: any;
}

export const useSubmitFeedback = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, SubmitFeedbackParams>({
    mutationFn: (feedbackData) => submitFeedback(feedbackData),

    // ✅ onSuccess fires ONLY after backend confirms — correct place for analytics events
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.help.feedbackForm(),
      });
    },
  });
};