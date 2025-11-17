import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { markAllNotificationsRead } from '../../services/notificationsAPI';

interface MutationContext {
  previousNotifications?: any;
}

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, void, MutationContext>({
    mutationFn: () => markAllNotificationsRead(),

    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.notifications.list(),
      });

      const previousNotifications = queryClient.getQueryData(
        queryKeys.notifications.list()
      );

      queryClient.setQueryData(
        queryKeys.notifications.list(),
        (old: any) => {
          if (!Array.isArray(old)) return old;
          return old.map((notification: any) => ({
            ...notification,
            is_read: true,
          }));
        }
      );

      return { previousNotifications };
    },

    onError: (_error, _variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          queryKeys.notifications.list(),
          context.previousNotifications
        );
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.list(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unreadCount(),
      });
    },
  });
};
