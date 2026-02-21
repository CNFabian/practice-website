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

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.help.tickets(),
      });
    },
  });
};
