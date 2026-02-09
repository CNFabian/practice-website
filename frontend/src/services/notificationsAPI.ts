import { fetchWithAuth } from './authAPI';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// ==================== NOTIFICATION TYPES ====================

export interface Notification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  priority: string;
  expires_at: string;
  created_at: string;
}

// ==================== GET NOTIFICATIONS ====================

// GET /api/notifications/ - Get user notifications
export const getNotifications = async (params?: {
  unread_only?: boolean;
  notification_type?: string;
  limit?: number;
  offset?: number;
}): Promise<Notification[]> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.unread_only !== undefined) queryParams.append('unread_only', params.unread_only.toString());
    if (params?.notification_type) queryParams.append('notification_type', params.notification_type);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const url = `${API_BASE_URL}/api/notifications/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const response = await fetchWithAuth(url, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Notifications data received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

// GET /api/notifications/unread-count - Get unread notification count
export const getUnreadCount = async (): Promise<{ unread_count: number }> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/notifications/unread-count`, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Unread count received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    throw error;
  }
};

// GET /api/notifications/{notification_id} - Get specific notification
export const getNotification = async (notificationId: string): Promise<Notification> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/notifications/${notificationId}`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching notification:', error);
    throw error;
  }
};

// ==================== UPDATE NOTIFICATIONS ====================

// PUT /api/notifications/{notification_id} - Update notification (mark read, etc.)
export const updateNotification = async (
  notificationId: string,
  updates: { is_read?: boolean }
): Promise<Notification> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/notifications/${notificationId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating notification:', error);
    throw error;
  }
};

// POST /api/notifications/mark-all-read - Mark all notifications as read
export const markAllNotificationsRead = async (): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/notifications/mark-all-read`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error marking all notifications read:', error);
    throw error;
  }
};

// ==================== DELETE NOTIFICATIONS ====================

// DELETE /api/notifications/{notification_id} - Delete specific notification
export const deleteNotification = async (notificationId: string): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/notifications/${notificationId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

// DELETE /api/notifications/ - Delete multiple notifications
export const deleteMultipleNotifications = async (notificationIds: string[]): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/notifications/`, {
      method: 'DELETE',
      body: JSON.stringify({ notification_ids: notificationIds }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting multiple notifications:', error);
    throw error;
  }
};

// ==================== NOTIFICATION METADATA ====================

// GET /api/notifications/types/available - Get available notification types
export const getNotificationTypes = async (): Promise<string[]> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/notifications/types/available`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching notification types:', error);
    throw error;
  }
};

// GET /api/notifications/summary/recent - Get recent notifications summary
export const getRecentNotificationsSummary = async (): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/notifications/summary/recent`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching recent notifications summary:', error);
    throw error;
  }
};

// ==================== TEST ====================

// POST /api/notifications/test - Create test notification
export const createTestNotification = async (notificationData?: {
  notification_type?: string;
  title?: string;
  message?: string;
}): Promise<Notification> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/notifications/test`, {
      method: 'POST',
      body: JSON.stringify(notificationData || {}),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating test notification:', error);
    throw error;
  }
};