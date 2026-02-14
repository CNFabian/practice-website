// ==================== LEARNING API ====================
// Phase 1: Standardized to use shared fetchWithAuth from authAPI.ts
// Re-exports fetchWithAuth for backward compatibility with any remaining consumers

import { fetchWithAuth } from './authAPI';
import {
  isMockModuleId,
  isMockLessonId,
  getMockLessonsForModule,
  getMockQuizForLesson,
} from './mockLearningData';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Re-export fetchWithAuth for backward compatibility
// (Other files that previously imported from learningAPI will still work)
export { fetchWithAuth };

// GET /api/learning/modules - Get all modules (with onboarding check)
export const getModules = async (): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/learning/modules`, {
      method: 'GET'
    });
    
    // Handle onboarding requirement
    if (response.status === 400) {
      const responseClone = response.clone();
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
          throw parseError;
        }
      }
    }
    
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
  // Return null for mock module IDs — module detail not needed for mock flow
  if (isMockModuleId(moduleId)) {
    console.log(`📋 Mock: Skipping getModule for mock module: ${moduleId}`);
    return null;
  }

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
  // Return mock data for mock module IDs
  if (isMockModuleId(moduleId)) {
    console.log(`📋 Using mock lesson data for mock module: ${moduleId}`);
    return getMockLessonsForModule(moduleId);
  }

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
  if (/^\d+$/.test(lessonId)) {
    console.warn(`⚠️ Lesson ID "${lessonId}" appears to be a frontend ID, not a UUID. Skipping backend call.`);
    return null;
  }

  // Return mock data for mock lesson IDs
  if (isMockLessonId(lessonId)) {
    console.log(`📋 Using mock lesson data for mock lesson: ${lessonId}`);
    const mockLessons = getMockLessonsForModule('mock-module-1');
    return mockLessons.find((l: any) => l.id === lessonId) || null;
  }

  try {
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
    
    return data.completed === true || data.status === 'completed';
  } catch (error) {
    if (error instanceof Error && error.message === 'ONBOARDING_REQUIRED') {
      return false;
    }
    console.error('Error checking onboarding status:', error);
    throw error;
  }
};

// POST /api/learning/lessons/{lesson_id}/progress - Update lesson progress
export const updateLessonProgress = async (lessonId: string, videoProgressSeconds: number): Promise<any> => {
  if (/^\d+$/.test(lessonId)) {
    console.warn(`⚠️ Lesson Progress ID "${lessonId}" appears to be a frontend ID, not a UUID. Skipping backend call.`);
    return { success: false, message: 'Frontend ID used instead of UUID' };
  }

  // Skip backend call for mock lesson IDs
  if (isMockLessonId(lessonId)) {
    console.log(`📋 Mock: Skipping progress update for mock lesson: ${lessonId}`);
    return { success: true, message: 'Mock progress update', data: {} };
  }

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
export const completeLesson = async (
  lessonId: string,
  completionData?: {
    completionMethod?: 'auto' | 'manual' | 'milestone';
    videoProgressSeconds?: number | null;
    transcriptProgressPercentage?: number | null;
    timeSpentSeconds?: number;
    contentType?: 'video' | 'transcript' | null;
  }
): Promise<any> => {
  if (/^\d+$/.test(lessonId)) {
    console.warn(`⚠️ Complete Lesson ID "${lessonId}" appears to be a frontend ID, not a UUID. Skipping backend call.`);
    return { success: false, message: 'Frontend ID used instead of UUID' };
  }

  // Skip backend call for mock lesson IDs
  if (isMockLessonId(lessonId)) {
    console.log(`📋 Mock: Skipping lesson completion for mock lesson: ${lessonId}`);
    return { success: true, message: 'Mock lesson completed', data: {} };
  }

  try {
    // Build request body matching backend LessonCompletionRequest schema
    const body: LessonCompletionRequest = {
      lesson_id: lessonId,
      completion_method: completionData?.completionMethod ?? 'manual',
      video_progress_seconds: completionData?.videoProgressSeconds ?? null,
      transcript_progress_percentage: completionData?.transcriptProgressPercentage ?? null,
      time_spent_seconds: completionData?.timeSpentSeconds ?? 0,
      content_type: completionData?.contentType ?? null,
    };

    const response = await fetchWithAuth(`${API_BASE_URL}/api/learning/lessons/${lessonId}/complete`, {
      method: 'POST',
      body: JSON.stringify(body),
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


export interface LessonMilestoneRequest {
  lesson_id: string;
  milestone: number; // 25, 50, 75, 90
  content_type: 'video' | 'transcript';
  video_progress_seconds?: number | null;
  transcript_progress_percentage?: number | null;
  time_spent_seconds: number;
}

export interface LessonMilestoneResponse {
  lesson_id: string;
  status: string;
  milestones_reached: number[];
  completion_percentage: string;
  auto_completed: boolean;
  message: string;
}

export interface LessonCompletionRequest {
  lesson_id: string;
  completion_method?: 'auto' | 'manual' | 'milestone';
  video_progress_seconds?: number | null;
  transcript_progress_percentage?: number | null;
  time_spent_seconds: number;
  content_type?: 'video' | 'transcript' | null;
}

export interface BatchProgressItem {
  lesson_id: string;
  milestone?: number | null;
  content_type?: 'video' | 'transcript' | null;
  video_progress_seconds?: number | null;
  transcript_progress_percentage?: number | null;
  time_spent_seconds: number;
  completed?: boolean;
}

export interface BatchProgressRequest {
  items: BatchProgressItem[];
}

export interface BatchProgressResponse {
  success: boolean;
  message: string;
  data: {
    results: Array<{
      lesson_id: string;
      status: string;
    }>;
    completed_count: number;
  };
}

// POST /api/learning/lessons/{lesson_id}/milestone
// Called at 25%, 50%, 75%, 90% progress points instead of continuous progress updates
// Rate Limited: 30 requests per minute per user
export const trackLessonMilestone = async (
  lessonId: string,
  milestone: number,
  contentType: 'video' | 'transcript',
  videoProgressSeconds?: number | null,
  transcriptProgressPercentage?: number | null,
  timeSpentSeconds: number = 0
): Promise<LessonMilestoneResponse> => {
  // Skip backend call for mock lesson IDs
  if (isMockLessonId(lessonId)) {
    console.log(`📋 Mock: Skipping milestone tracking for mock lesson: ${lessonId}`);
    return {
      lesson_id: lessonId,
      status: 'mock',
      milestones_reached: [milestone],
      completion_percentage: `${milestone}`,
      auto_completed: milestone >= 90,
      message: 'Mock milestone tracked',
    };
  }

  const response = await fetchWithAuth(`/api/learning/lessons/${lessonId}/milestone`, {
    method: 'POST',
    body: JSON.stringify({
      lesson_id: lessonId,
      milestone,
      content_type: contentType,
      video_progress_seconds: videoProgressSeconds ?? null,
      transcript_progress_percentage: transcriptProgressPercentage ?? null,
      time_spent_seconds: timeSpentSeconds,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to track lesson milestone: ${response.statusText}`);
  }

  return response.json();
};

// POST /api/learning/progress/batch
// Called on page unload/tab close to sync all pending progress
// Rate Limited: 20 requests per minute per user
export const batchUpdateProgress = async (
  items: BatchProgressItem[]
): Promise<BatchProgressResponse> => {
  // Filter out mock lesson IDs from batch updates
  const realItems = items.filter(item => !isMockLessonId(item.lesson_id));
  if (realItems.length === 0) {
    console.log(`📋 Mock: All batch items are mock lessons, skipping backend call`);
    return {
      success: true,
      message: 'Mock batch update',
      data: { results: items.map(i => ({ lesson_id: i.lesson_id, status: 'mock' })), completed_count: 0 },
    };
  }

  const response = await fetchWithAuth('/api/learning/progress/batch', {
    method: 'POST',
    body: JSON.stringify({
      items: realItems,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to batch update progress: ${response.statusText}`);
  }

  return response.json();
};


// GET /api/learning/lessons/{lesson_id}/quiz - Get quiz for lesson
export const getLessonQuiz = async (lessonId: string): Promise<any> => {
  if (/^\d+$/.test(lessonId)) {
    console.warn(`⚠️ Lesson Quiz ID "${lessonId}" appears to be a frontend ID, not a UUID. Skipping backend call.`);
    return null;
  }

  // Return mock data for mock lesson IDs
  if (isMockLessonId(lessonId)) {
    console.log(`📋 Using mock quiz data for mock lesson: ${lessonId}`);
    return getMockQuizForLesson(lessonId);
  }

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