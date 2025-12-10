import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { submitFeedback } from '../../services/helpAPI';

interface SubmitFeedbackParams {
  category: string;
  message: string;
  rating?: number;
  email?: string;
}

export const useSubmitFeedback = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, SubmitFeedbackParams>({
    mutationFn: (feedbackData) => submitFeedback(feedbackData),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.help.feedbackForm(),
      });
    },
  });
};
