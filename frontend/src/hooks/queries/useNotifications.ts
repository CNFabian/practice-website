import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { getNotifications, getUnreadCount } from '../../services/notificationsAPI';

interface NotificationsParams {
  unread_only?: boolean;
  notification_type?: string;
  limit?: number;
  offset?: number;
}

export const useNotifications = (params?: NotificationsParams) => {
  return useQuery({
    queryKey: queryKeys.notifications.list(params),
    queryFn: () => getNotifications(params),

    staleTime: 30 * 1000,

    gcTime: 2 * 60 * 1000,

    refetchOnWindowFocus: true,

    retry: 1,
  });
};

 export const useUnreadCount = () => {
  return useQuery<{ unread_count: number }>({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: getUnreadCount,

    staleTime: 30 * 1000,

    gcTime: 2 * 60 * 1000,

    refetchInterval: 30 * 1000,

    refetchOnWindowFocus: true,

    retry: 1,
  });
};
