import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { deleteNotification } from '../../../services/notificationsAPI';

interface DeleteNotificationParams {
  notificationId: string;
}

interface MutationContext {
  previousNotifications?: any;
}

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, DeleteNotificationParams, MutationContext>({
    mutationFn: ({ notificationId }) => deleteNotification(notificationId),

    onMutate: async ({ notificationId }) => {
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
          return old.filter((notification: any) => notification.id !== notificationId);
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
