import React, { useState } from 'react';
import { OnestFont } from '../../../assets';
import { useNotifications } from '../../../hooks/queries/useNotifications';
import { useUpdateNotification } from '../../../hooks/mutations/useUpdateNotification';
import { useMarkAllNotificationsRead } from '../../../hooks/mutations/useMarkAllNotificationsRead';
import { useDeleteNotification } from '../../../hooks/mutations/useDeleteNotification';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';

const NotificationsPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading, error: queryError } = useNotifications({
    unread_only: filter === 'unread',
    limit: 50
  });
  const { mutate: updateNotificationMutation } = useUpdateNotification();
  const { mutate: markAllReadMutation } = useMarkAllNotificationsRead();
  const { mutate: deleteNotificationMutation } = useDeleteNotification();

  const error = queryError ? 'Failed to load notifications. Please try again.' : null;

  const handleMarkAsRead = (notificationId: string, currentStatus: boolean) => {
    updateNotificationMutation(
      { notificationId, updates: { is_read: !currentStatus } },
      {
        onError: (err) => {
          console.error('Error updating notification:', err);
        },
      }
    );
  };

  const handleDelete = (notificationId: string) => {
    deleteNotificationMutation(
      { notificationId },
      {
        onError: (err) => {
          console.error('Error deleting notification:', err);
        },
      }
    );
  };

  const handleMarkAllRead = () => {
    markAllReadMutation(undefined, {
      onError: (err) => {
        console.error('Error marking all as read:', err);
      },
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const minutes = Math.floor(diffInMs / (1000 * 60));
      return `${minutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="p-6 max-w-8xl mx-auto h-full overflow-y-auto">
      {/* Header */}
      <div className="mb-8">
        <OnestFont as="h1" weight={700} lineHeight="tight" className="text-xl lg:text-2xl text-gray-900 mb-3 mt-3">
          Notifications
        </OnestFont>
        <OnestFont as="p" weight={300} lineHeight="relaxed" className="text-base text-gray-600">
          Stay updated with the latest news, reminders, and important information.
        </OnestFont>
      </div>

      {/* Filter and Actions Bar */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm transition-colors ${
              filter === 'all'
                ? 'text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            style={filter === 'all' ? { backgroundColor: '#D7DEFF' } : {}}
          >
            <OnestFont weight={filter === 'all' ? 500 : 300} lineHeight="relaxed">
              All ({notifications.length})
            </OnestFont>
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-md text-sm transition-colors ${
              filter === 'unread'
                ? 'text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            style={filter === 'unread' ? { backgroundColor: '#D7DEFF' } : {}}
          >
            <OnestFont weight={filter === 'unread' ? 500 : 300} lineHeight="relaxed">
              Unread ({unreadCount})
            </OnestFont>
          </button>
        </div>

        {/* Mark All as Read Button */}
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            <OnestFont weight={500} lineHeight="relaxed">Mark all as read</OnestFont>
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <OnestFont weight={300} lineHeight="relaxed" className="text-gray-600">Loading notifications...</OnestFont>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <OnestFont weight={300} lineHeight="relaxed" className="text-red-600 mb-4">{error}</OnestFont>
            <button
              onClick={() => {
                queryClient.invalidateQueries({
                  queryKey: queryKeys.notifications.list(),
                });
              }}
              className="text-blue-600 hover:text-blue-700"
            >
              <OnestFont weight={500} lineHeight="relaxed">Try again</OnestFont>
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <OnestFont weight={500} lineHeight="relaxed" className="text-gray-600 text-lg mb-2">
              No notifications
            </OnestFont>
            <OnestFont weight={500} lineHeight="relaxed" className="text-gray-500 text-sm">
              You're all caught up! Check back later for updates.
            </OnestFont>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-lg p-4 border transition-all hover:shadow-md ${
                notification.is_read
                  ? 'border-gray-200 opacity-75'
                  : 'border-blue-200 bg-blue-50/30'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Notification Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {/* Unread Indicator */}
                    {!notification.is_read && (
                      <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0"></div>
                    )}
                    
                    {/* Title */}
                    <OnestFont
                      weight={notification.is_read ? 500 : 700}
                      lineHeight="relaxed"
                      className="text-gray-900 truncate"
                    >
                      {notification.title}
                    </OnestFont>
                    
                    {/* Priority Badge */}
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs flex-shrink-0 ${getPriorityColor(
                        notification.priority
                      )}`}
                    >
                      {notification.priority}
                    </span>
                  </div>

                  {/* Message */}
                  <OnestFont weight={300} lineHeight="relaxed" className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {notification.message}
                  </OnestFont>

                  {/* Metadata */}
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{formatDate(notification.created_at)}</span>
                    <span>•</span>
                    <span className="capitalize">{notification.notification_type}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Mark as Read/Unread */}
                  <button
                    onClick={() => handleMarkAsRead(notification.id, notification.is_read)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title={notification.is_read ? 'Mark as unread' : 'Mark as read'}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(notification.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete notification"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;