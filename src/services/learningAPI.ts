const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const getHeaders = (): HeadersInit => {
  // First, try to get token from localStorage
  const token = localStorage.getItem('access_token');
  
  // If no token in localStorage, check if we need to get a real token
  if (!token) {
    console.warn('No authentication token found in localStorage. Please implement proper authentication.');
    // For now, we'll throw an error that can be caught
    throw new Error('No authentication token found');
  }
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// Helper function to refresh token
const refreshAccessToken = async (): Promise<boolean> => {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) {
    console.error('No refresh token available');
    return false;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh?refresh_token=${refreshToken}`, {
      method: 'POST'
    });
    
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      console.log('Token refreshed successfully');
      return true;
    } else {
      console.error('Token refresh failed:', response.status);
      return false;
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    return false;
  }
};

// Enhanced fetch with automatic token refresh
const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  try {
    // First attempt
    const response = await fetch(url, {
      ...options,
      headers: getHeaders()
    });
    
    // If unauthorized, try to refresh token once
    if (response.status === 401) {
      console.log('Received 401, attempting token refresh...');
      const refreshed = await refreshAccessToken();
      
      if (refreshed) {
        // Retry request with new token
        const retryResponse = await fetch(url, {
          ...options,
          headers: getHeaders()
        });
        return retryResponse;
      } else {
        // Token refresh failed - user needs to log in again
        console.error('Token refresh failed. User needs to re-authenticate.');
        // Optionally: redirect to login page
        // window.location.href = '/login';
      }
    }
    
    return response;
  } catch (error) {
    throw error;
  }
};

// GET /api/learning/modules - Get all modules
export const getModules = async (): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/learning/modules`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching modules:', error);
    throw error;
  }
};

// GET /api/learning/modules/{module_id} - Get specific module
export const getModule = async (moduleId: string): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/learning/modules/${moduleId}`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching module:', error);
    throw error;
  }
};

// GET /api/learning/modules/{module_id}/lessons - Get all lessons in a module
export const getModuleLessons = async (moduleId: string): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/learning/modules/${moduleId}/lessons`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching module lessons:', error);
    throw error;
  }
};

// GET /api/learning/lessons/{lesson_id} - Get specific lesson
export const getLesson = async (lessonId: string): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/learning/lessons/${lessonId}`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching lesson:', error);
    throw error;
  }
};

// POST /api/learning/lessons/{lesson_id}/progress - Update lesson progress
export const updateLessonProgress = async (lessonId: string, videoProgressSeconds: number): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/learning/lessons/${lessonId}/progress`, {
      method: 'POST',
      body: JSON.stringify({
        lesson_id: lessonId,
        video_progress_seconds: videoProgressSeconds
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating lesson progress:', error);
    throw error;
  }
};

// POST /api/learning/lessons/{lesson_id}/complete - Mark lesson as completed
export const completeLesson = async (lessonId: string): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/learning/lessons/${lessonId}/complete`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error completing lesson:', error);
    throw error;
  }
};

// GET /api/learning/lessons/{lesson_id}/quiz - Get quiz for lesson
export const getLessonQuiz = async (lessonId: string): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/learning/lessons/${lessonId}/quiz`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching lesson quiz:', error);
    throw error;
  }
};

// GET /api/learning/progress/summary - Get learning progress summary
export const getLearningProgressSummary = async (): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/learning/progress/summary`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching learning progress summary:', error);
    throw error;
  }
};