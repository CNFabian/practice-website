const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const getHeaders = (): HeadersInit => {
  const token = localStorage.getItem('access_token');
  
  if (!token) {
    console.warn('No authentication token found in localStorage.');
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

// Enhanced fetch with automatic token refresh and onboarding detection - FIXED
const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  try {
    console.log(`Making request to: ${url}`);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getHeaders(),
        ...options.headers
      }
    });
    
    console.log(`Response status: ${response.status} for ${url}`);
    
    // Handle unauthorized
    if (response.status === 401) {
      console.log('Received 401, attempting token refresh...');
      const refreshed = await refreshAccessToken();
      
      if (refreshed) {
        const retryResponse = await fetch(url, {
          ...options,
          headers: {
            ...getHeaders(),
            ...options.headers
          }
        });
        console.log(`Retry response status: ${retryResponse.status} for ${url}`);
        return retryResponse;
      } else {
        console.error('Token refresh failed. User needs to re-authenticate.');
        throw new Error('Authentication failed - please log in again');
      }
    }
    
    // Handle onboarding requirement - FIXED: Clone response to avoid body stream read error
    if (response.status === 400) {
      const responseClone = response.clone(); // Create a clone to read the body
      const errorText = await responseClone.text();
      console.log(`400 Error response: ${errorText}`);
      
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.detail === "Please complete onboarding first") {
          console.warn('🚨 ONBOARDING REQUIRED: User must complete onboarding before accessing learning content');
          throw new Error('ONBOARDING_REQUIRED');
        }
      } catch (parseError) {
        if (parseError instanceof Error && parseError.message === 'ONBOARDING_REQUIRED') {
          throw parseError; // Re-throw the onboarding error
        }
        // If we can't parse, continue with normal error handling
      }
    }
    
    // Handle other error statuses
    if (!response.ok) {
      const responseClone = response.clone(); // Create a clone to avoid body stream read error
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

// GET /api/learning/modules - Get all modules (with onboarding check)
export const getModules = async (): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/learning/modules`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Modules data received:', data);
    return data;
  } catch (error) {
    if (error instanceof Error && error.message === 'ONBOARDING_REQUIRED') {
      console.log('👉 User needs to complete onboarding first');
      throw new Error('ONBOARDING_REQUIRED');
    }
    console.error('Error fetching modules:', error);
    throw error;
  }
};

// GET /api/learning/modules/{module_id} - Get specific module
export const getModule = async (moduleId: string): Promise<any> => {
  try {
    console.log(`Fetching module with ID: ${moduleId}`);
    
    const response = await fetchWithAuth(`${API_BASE_URL}/api/learning/modules/${moduleId}`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Module data received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching module:', error);
    throw error;
  }
};

// Helper function to get actual module UUIDs from backend
export const getAvailableModules = async (): Promise<any[]> => {
  try {
    const modules = await getModules();
    console.log('Available backend modules:', modules);
    return modules || [];
  } catch (error) {
    if (error instanceof Error && error.message === 'ONBOARDING_REQUIRED') {
      console.log('Cannot fetch modules - onboarding required');
      return [];
    }
    console.error('Error getting available modules:', error);
    return [];
  }
};

// GET /api/learning/modules/{module_id}/lessons - Get all lessons in a module
export const getModuleLessons = async (moduleId: string): Promise<any> => {
  try {
    console.log(`Fetching lessons for module ID: ${moduleId}`);
    
    const response = await fetchWithAuth(`${API_BASE_URL}/api/learning/modules/${moduleId}/lessons`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Module lessons data received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching module lessons:', error);
    throw error;
  }
};

// GET /api/learning/lessons/{lesson_id} - Get specific lesson
export const getLesson = async (lessonId: string): Promise<any> => {
  try {
    // Check if lessonId is a number (frontend ID) and needs conversion
    if (/^\d+$/.test(lessonId)) {
      console.warn(`⚠️ Lesson ID "${lessonId}" appears to be a frontend ID, not a UUID. Skipping backend call.`);
      throw new Error('Frontend lesson ID provided - UUID required for backend');
    }
    
    console.log(`Fetching lesson with ID: ${lessonId}`);
    
    const response = await fetchWithAuth(`${API_BASE_URL}/api/learning/lessons/${lessonId}`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Lesson data received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching lesson:', error);
    throw error;
  }
};

// Helper function to check if user has completed onboarding
export const checkOnboardingStatus = async (): Promise<boolean> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/onboarding/status`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Onboarding status:', data);
    
    // Check if onboarding is completed - adjust based on your API response structure
    return data.completed === true || data.status === 'completed';
  } catch (error) {
    if (error instanceof Error && error.message === 'ONBOARDING_REQUIRED') {
      return false; // Onboarding required
    }
    console.error('Error checking onboarding status:', error);
    throw error; // Other error
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