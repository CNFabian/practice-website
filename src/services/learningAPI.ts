const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2N2EwZWQ2OC01MGQyLTQ1MmItYWIxYS05OTE1MjVhOGIwOTMiLCJleHAiOjE3NjAxNTE2OTMsInRva2VuX3R5cGUiOiJhY2Nlc3MifQ.ltcwp5RLA-3UH19gAjKRjDZCr9xZd1Bk8zNHXdBO2eI';

const getHeaders = (): HeadersInit => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${AUTH_TOKEN}`
});

// GET /api/learning/modules - Get all modules
export const getModules = async (): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/learning/modules`, {
      method: 'GET',
      headers: getHeaders()
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
    const response = await fetch(`${API_BASE_URL}/api/learning/modules/${moduleId}`, {
      method: 'GET',
      headers: getHeaders()
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
    const response = await fetch(`${API_BASE_URL}/api/learning/modules/${moduleId}/lessons`, {
      method: 'GET',
      headers: getHeaders()
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
    const response = await fetch(`${API_BASE_URL}/api/learning/lessons/${lessonId}`, {
      method: 'GET',
      headers: getHeaders()
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
    const response = await fetch(`${API_BASE_URL}/api/learning/lessons/${lessonId}/progress`, {
      method: 'POST',
      headers: getHeaders(),
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
    const response = await fetch(`${API_BASE_URL}/api/learning/lessons/${lessonId}/complete`, {
      method: 'POST',
      headers: getHeaders()
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
    const response = await fetch(`${API_BASE_URL}/api/learning/lessons/${lessonId}/quiz`, {
      method: 'GET',
      headers: getHeaders()
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
    const response = await fetch(`${API_BASE_URL}/api/learning/progress/summary`, {
      method: 'GET',
      headers: getHeaders()
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