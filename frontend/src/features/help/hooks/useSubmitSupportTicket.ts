// 🔴 CRITICAL DEV NOTE: Submit Event Timing
// - Do NOT fire submit/completion events on button click
// - Always wait for backend success response (onSuccess) for true measurement
// - This ensures events only fire when the backend confirms the support ticket was created
// - onSuccess = backend confirmed ✅ | onClick = user intent only ⚠️

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { submitSupportTicket } from '../services/helpAPI';

interface SubmitSupportTicketParams {
  name: string;
  email: string;
  subject: string;
  message: string;
  category: string;
}

export const useSubmitSupportTicket = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, SubmitSupportTicketParams>({
    mutationFn: (ticketData) => submitSupportTicket(ticketData),

    // ✅ onSuccess fires ONLY after backend confirms — correct place for analytics events
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.help.tickets(),
      });
    },
  });
};
