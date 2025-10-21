const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getAuthToken();
  
  if (!token) {
    console.error('No authentication token found');
    throw new Error('No authentication token found');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  try {
    console.log(`Making request to: ${url}`);
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      console.error('Authentication failed - token may be expired');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
      throw new Error('Authentication failed - please log in again');
    }

    if (!response.ok) {
      const responseClone = response.clone();
      const errorText = await responseClone.text();
      console.error(`API Error - Status: ${response.status}, URL: ${url}, Response: ${errorText}`);
      
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.detail) {
          console.error('Validation errors:', errorData.detail);
        }
      } catch (parseError) {
        console.error('Could not parse error response as JSON');
      }
    }
    
    return response;
  } catch (error) {
    console.error(`Network error for ${url}:`, error);
    throw error;
  }
};

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

// GET /api/notifications/unread-count - Get count of unread notifications
export const getUnreadCount = async (): Promise<any> => {
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
    console.log(`Fetching notification with ID: ${notificationId}`);
    
    const response = await fetchWithAuth(`${API_BASE_URL}/api/notifications/${notificationId}`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Notification data received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching notification:', error);
    throw error;
  }
};

// ==================== UPDATE NOTIFICATIONS ====================

// PUT /api/notifications/{notification_id} - Update notification (mark as read/unread)
export const updateNotification = async (
  notificationId: string,
  updateData: { is_read: boolean }
): Promise<any> => {
  try {
    console.log(`Updating notification ${notificationId}:`, updateData);
    
    const response = await fetchWithAuth(`${API_BASE_URL}/api/notifications/${notificationId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Notification updated:', data);
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
    console.log('All notifications marked as read:', data);
    return data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// ==================== DELETE NOTIFICATIONS ====================

// DELETE /api/notifications/{notification_id} - Delete a notification
export const deleteNotification = async (notificationId: string): Promise<any> => {
  try {
    console.log(`Deleting notification with ID: ${notificationId}`);
    
    const response = await fetchWithAuth(`${API_BASE_URL}/api/notifications/${notificationId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Notification deleted:', data);
    return data;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

// DELETE /api/notifications/ - Delete multiple notifications
export const deleteMultipleNotifications = async (notificationIds: string[]): Promise<any> => {
  try {
    console.log('Deleting multiple notifications:', notificationIds);
    
    const response = await fetchWithAuth(`${API_BASE_URL}/api/notifications/`, {
      method: 'DELETE',
      body: JSON.stringify(notificationIds)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Multiple notifications deleted:', data);
    return data;
  } catch (error) {
    console.error('Error deleting multiple notifications:', error);
    throw error;
  }
};

// ==================== NOTIFICATION METADATA ====================

// GET /api/notifications/types/available - Get available notification types
export const getNotificationTypes = async (): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/notifications/types/available`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Notification types received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching notification types:', error);
    throw error;
  }
};

// GET /api/notifications/summary/recent - Get summary of recent notifications
export const getRecentNotificationsSummary = async (days: number = 7): Promise<any> => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('days', days.toString());
    
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/notifications/summary/recent?${queryParams.toString()}`,
      { method: 'GET' }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Recent notifications summary received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching recent notifications summary:', error);
    throw error;
  }
};

// ==================== TESTING ====================

// POST /api/notifications/test - Create test notification (for development/testing)
export const createTestNotification = async (): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/notifications/test`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Test notification created:', data);
    return data;
  } catch (error) {
    console.error('Error creating test notification:', error);
    throw error;
  }
};