import React, { useState, useEffect } from 'react';
import { RobotoFont } from '../../../assets';
import {
  getNotifications,
  updateNotification,
  deleteNotification,
  markAllNotificationsRead,
  type Notification
} from '../../../services/notificationsAPI';

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getNotifications({
        unread_only: filter === 'unread',
        limit: 50
      });
      setNotifications(data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string, currentStatus: boolean) => {
    try {
      await updateNotification(notificationId, { is_read: !currentStatus });
      
      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: !currentStatus } : n
        )
      );
    } catch (err) {
      console.error('Error updating notification:', err);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
      
      // Remove from local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      
      // Update all to read in local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
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
        <RobotoFont as="h1" weight={700} className="text-xl lg:text-2xl text-gray-900 mb-3 mt-3">
          Notifications
        </RobotoFont>
        <RobotoFont as="p" weight={400} className="text-base text-gray-600 leading-relaxed">
          Stay updated with the latest news, reminders, and important information.
        </RobotoFont>
      </div>

      {/* Filter and Actions Bar */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            style={filter === 'all' ? { backgroundColor: '#D7DEFF' } : {}}
          >
            <RobotoFont weight={filter === 'all' ? 600 : 400}>
              All ({notifications.length})
            </RobotoFont>
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'unread'
                ? 'text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            style={filter === 'unread' ? { backgroundColor: '#D7DEFF' } : {}}
          >
            <RobotoFont weight={filter === 'unread' ? 600 : 400}>
              Unread ({unreadCount})
            </RobotoFont>
          </button>
        </div>

        {/* Mark All as Read Button */}
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            <RobotoFont weight={500}>Mark all as read</RobotoFont>
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <RobotoFont className="text-gray-600">Loading notifications...</RobotoFont>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <RobotoFont className="text-red-600 mb-4">{error}</RobotoFont>
            <button
              onClick={fetchNotifications}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              <RobotoFont weight={500}>Try again</RobotoFont>
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
            <RobotoFont weight={500} className="text-gray-600 text-lg mb-2">
              No notifications
            </RobotoFont>
            <RobotoFont className="text-gray-500 text-sm">
              You're all caught up! Check back later for updates.
            </RobotoFont>
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
                    <RobotoFont
                      weight={notification.is_read ? 500 : 600}
                      className="text-gray-900 truncate"
                    >
                      {notification.title}
                    </RobotoFont>
                    
                    {/* Priority Badge */}
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${getPriorityColor(
                        notification.priority
                      )}`}
                    >
                      {notification.priority}
                    </span>
                  </div>

                  {/* Message */}
                  <RobotoFont className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {notification.message}
                  </RobotoFont>

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