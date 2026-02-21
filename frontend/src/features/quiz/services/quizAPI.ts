// ==================== QUIZ API ====================
// Phase 1: Standardized to use shared fetchWithAuth from authAPI.ts

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

import { fetchWithAuth } from '../../../services/authAPI';

// ==================== QUIZ SUBMISSION ====================

// POST /api/quiz/submit - Submit quiz answers and get results
export const submitQuiz = async (quizData: {
  lesson_id: string;
  answers: Record<string, string>[];
  time_taken_seconds?: number;
}): Promise<any> => {
  try {
    // Add UUID validation
    if (/^\d+$/.test(quizData.lesson_id)) {
      console.error(`❌ Quiz submission failed: lesson_id "${quizData.lesson_id}" appears to be a frontend ID, not a UUID`);
      throw new Error('Invalid lesson_id: expected UUID, got frontend ID');
    }
    
    console.log('Submitting quiz:', quizData);
    
    const response = await fetchWithAuth(`${API_BASE_URL}/api/quiz/submit`, {
      method: 'POST',
      body: JSON.stringify(quizData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Quiz submission result:', data);
    return data;
  } catch (error) {
    console.error('Error submitting quiz:', error);
    throw error;
  }
};

// ==================== QUIZ ATTEMPTS ====================

// GET /api/quiz/attempts/{lesson_id} - Get user's quiz attempts for a specific lesson
export const getQuizAttempts = async (lessonId: string): Promise<any> => {
  try {
    if (/^\d+$/.test(lessonId)) {
      console.warn(`⚠️ Quiz Attempts ID "${lessonId}" appears to be a frontend ID, not a UUID. Skipping backend call.`);
      return [];
    }
    
    console.log(`Fetching quiz attempts for lesson ID: ${lessonId}`);
    
    const response = await fetchWithAuth(`${API_BASE_URL}/api/quiz/attempts/${lessonId}`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Quiz attempts data received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching quiz attempts:', error);
    throw error;
  }
};

// GET /api/quiz/attempt/{attempt_id}/details - Get detailed results for a specific quiz attempt
export const getQuizAttemptDetails = async (attemptId: string): Promise<any> => {
  try {
    console.log(`Fetching quiz attempt details for attempt ID: ${attemptId}`);
    
    const response = await fetchWithAuth(`${API_BASE_URL}/api/quiz/attempt/${attemptId}/details`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Quiz attempt details received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching quiz attempt details:', error);
    throw error;
  }
};

// ==================== QUIZ STATISTICS ====================

// GET /api/quiz/statistics - Get user's overall quiz statistics
export const getQuizStatistics = async (): Promise<any> => {
  try {
    console.log('Fetching quiz statistics');
    
    const response = await fetchWithAuth(`${API_BASE_URL}/api/quiz/statistics`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Quiz statistics data received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching quiz statistics:', error);
    throw error;
  }
};

// ==================== QUIZ LEADERBOARD ====================

// GET /api/quiz/leaderboard - Get quiz leaderboard based on average scores
export const getQuizLeaderboard = async (limit: number = 20): Promise<any> => {
  try {
    console.log(`Fetching quiz leaderboard with limit: ${limit}`);
    
    const queryParams = new URLSearchParams();
    queryParams.append('limit', limit.toString());
    
    const url = `${API_BASE_URL}/api/quiz/leaderboard?${queryParams.toString()}`;
    
    const response = await fetchWithAuth(url, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Quiz leaderboard data received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching quiz leaderboard:', error);
    throw error;
  }
};

// ==================== HELPER FUNCTIONS ====================

// Helper function to format quiz submission data
export const formatQuizSubmission = (
  lessonId: string,
  answers: { questionId: string; answerId: string }[],
  timeTakenSeconds?: number
) => {
  const formattedAnswers = answers.map(answer => ({
    [answer.questionId]: answer.answerId
  }));

  return {
    lesson_id: lessonId,
    answers: formattedAnswers,
    time_taken_seconds: timeTakenSeconds
  };
};

// Helper function to calculate quiz score percentage
export const calculateScorePercentage = (correctAnswers: number, totalQuestions: number): number => {
  if (totalQuestions === 0) return 0;
  return Math.round((correctAnswers / totalQuestions) * 100);
};

// Helper function to determine if quiz was passed
export const isQuizPassed = (score: number, passingScore: number = 70): boolean => {
  return score >= passingScore;
};

// Helper function to format time taken in readable format
export const formatTimeTaken = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${remainingSeconds}s`;
};

// ==================== EXPORT ALL FUNCTIONS ====================

export default {
  submitQuiz,
  getQuizAttempts,
  getQuizAttemptDetails,
  getQuizStatistics,
  getQuizLeaderboard,
  formatQuizSubmission,
  calculateScorePercentage,
  isQuizPassed,
  formatTimeTaken
};