import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { updateNotification } from '../../services/notificationsAPI';

interface UpdateNotificationParams {
  notificationId: string;
  updates: {
    is_read: boolean;
  };
}

interface MutationContext {
  previousNotifications?: any;
}

export const useUpdateNotification = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, UpdateNotificationParams, MutationContext>({
    mutationFn: ({ notificationId, updates }) => updateNotification(notificationId, updates),

    onMutate: async ({ notificationId, updates }) => {
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
          return old.map((notification: any) =>
            notification.id === notificationId
              ? { ...notification, ...updates }
              : notification
          );
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
