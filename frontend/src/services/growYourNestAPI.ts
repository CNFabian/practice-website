import { fetchWithAuth } from './authAPI';
import type {
  GrowYourNestQuestion,
  LessonQuestionsResponse,
  LessonSubmitRequest,
  LessonSubmitResponse,
  FreeRoamQuestionsResponse,
  FreeRoamProgressRequest,
  FreeRoamProgressResponse,
  FreeRoamStateResponse,
} from '../types/growYourNest.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ═══════════════════════════════════════════════════════════════
// LESSON MODE ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/grow-your-nest/lesson/{lesson_id}/questions
 * Get 3 questions for lesson mode (one-time play after completing lesson video)
 */
export const getLessonQuestions = async (lessonId: string): Promise<LessonQuestionsResponse> => {
  try {
    if (/^\d+$/.test(lessonId)) {
      console.warn(`⚠️ GYN Lesson ID "${lessonId}" appears to be a frontend ID, not a UUID. Skipping backend call.`);
      return { questions: [], tree_state: getDefaultTreeState() };
    }

    console.log(`🌳 Fetching Grow Your Nest questions for lesson: ${lessonId}`);

    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/grow-your-nest/lesson/${lessonId}/questions`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`GYN lesson questions error - Status: ${response.status}, Response: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: LessonQuestionsResponse = await response.json();
    console.log('🌳 Lesson questions received:', data.questions.length, 'questions');
    return data;
  } catch (error) {
    console.error('Error fetching GYN lesson questions:', error);
    throw error;
  }
};

/**
 * POST /api/grow-your-nest/lesson/{lesson_id}/submit
 * Submit all 3 lesson answers at once
 */
export const submitLessonAnswers = async (
  lessonId: string,
  submission: LessonSubmitRequest
): Promise<LessonSubmitResponse> => {
  try {
    if (/^\d+$/.test(lessonId)) {
      console.warn(`⚠️ GYN Submit Lesson ID "${lessonId}" appears to be a frontend ID, not a UUID. Skipping backend call.`);
      throw new Error('Frontend ID used instead of UUID');
    }

    console.log(`🌳 Submitting Grow Your Nest lesson answers for lesson: ${lessonId}`);
    console.log('📤 Submission data:', JSON.stringify(submission));

    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/grow-your-nest/lesson/${lessonId}/submit`,
      {
        method: 'POST',
        body: JSON.stringify(submission),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`GYN lesson submit error - Status: ${response.status}, Response: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: LessonSubmitResponse = await response.json();
    console.log('🌳 Lesson submit response:', {
      correct: data.correct_count,
      total: data.total_questions,
      pointsEarned: data.growth_points_earned,
      coinsEarned: data.coins_earned,
      stageIncreased: data.tree_state.stage_increased,
    });
    return data;
  } catch (error) {
    console.error('Error submitting GYN lesson answers:', error);
    throw error;
  }
};

// ═══════════════════════════════════════════════════════════════
// FREE ROAM MODE ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/grow-your-nest/freeroam/{module_id}/questions
 * Get all questions for free roam mode (available after all lessons completed)
 */
export const getFreeRoamQuestions = async (moduleId: string): Promise<FreeRoamQuestionsResponse> => {
  try {
    if (/^\d+$/.test(moduleId)) {
      console.warn(`⚠️ GYN FreeRoam Module ID "${moduleId}" appears to be a frontend ID, not a UUID. Skipping backend call.`);
      return { questions: [], tree_state: getDefaultTreeState() };
    }

    console.log(`🌳 Fetching Grow Your Nest free roam questions for module: ${moduleId}`);

    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/grow-your-nest/freeroam/${moduleId}/questions`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`GYN free roam questions error - Status: ${response.status}, Response: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: FreeRoamQuestionsResponse = await response.json();
    console.log('🌳 Free roam questions received:', data.questions.length, 'questions');
    return data;
  } catch (error) {
    console.error('Error fetching GYN free roam questions:', error);
    throw error;
  }
};

/**
 * POST /api/grow-your-nest/freeroam/{module_id}/progress
 * Save progress after EACH question in free roam mode (critical for persistent state)
 */
export const saveFreeRoamProgress = async (
  moduleId: string,
  progressData: FreeRoamProgressRequest
): Promise<FreeRoamProgressResponse> => {
  try {
    if (/^\d+$/.test(moduleId)) {
      console.warn(`⚠️ GYN FreeRoam Progress Module ID "${moduleId}" appears to be a frontend ID, not a UUID. Skipping backend call.`);
      throw new Error('Frontend ID used instead of UUID');
    }

    console.log(`🌳 Saving free roam progress for module: ${moduleId}`);
    console.log('📤 Progress data:', JSON.stringify(progressData));

    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/grow-your-nest/freeroam/${moduleId}/progress`,
      {
        method: 'POST',
        body: JSON.stringify(progressData),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`GYN free roam progress error - Status: ${response.status}, Response: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: FreeRoamProgressResponse = await response.json();
    console.log('🌳 Free roam progress response:', {
      isCorrect: data.is_correct,
      pointsEarned: data.growth_points_earned,
      fertilizerBonus: data.fertilizer_bonus,
      coinsEarned: data.coins_earned,
      stageIncreased: data.tree_state.stage_increased,
      currentStage: data.tree_state.current_stage,
    });
    return data;
  } catch (error) {
    console.error('Error saving GYN free roam progress:', error);
    throw error;
  }
};

/**
 * GET /api/grow-your-nest/freeroam/{module_id}/state
 * Get current tree state for resuming free roam mode
 */
export const getFreeRoamState = async (moduleId: string): Promise<FreeRoamStateResponse> => {
  try {
    if (/^\d+$/.test(moduleId)) {
      console.warn(`⚠️ GYN FreeRoam State Module ID "${moduleId}" appears to be a frontend ID, not a UUID. Skipping backend call.`);
      return getDefaultTreeState();
    }

    console.log(`🌳 Fetching Grow Your Nest free roam state for module: ${moduleId}`);

    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/grow-your-nest/freeroam/${moduleId}/state`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`GYN free roam state error - Status: ${response.status}, Response: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: FreeRoamStateResponse = await response.json();
    console.log('🌳 Free roam state received:', {
      growthPoints: data.growth_points,
      currentStage: data.current_stage,
      totalStages: data.total_stages,
      completed: data.completed,
    });
    return data;
  } catch (error) {
    console.error('Error fetching GYN free roam state:', error);
    throw error;
  }
};

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Returns default tree state for fallback scenarios
 */
const getDefaultTreeState = (): FreeRoamStateResponse => ({
  growth_points: 0,
  current_stage: 0,
  total_stages: 5,
  points_per_stage: 50,
  points_to_next_stage: 50,
  points_to_complete: 250,
  completed: false,
  completed_at: null,
});

/**
 * Transform backend GYN questions into the format expected by the Phaser minigame.
 * Maps backend question/answer structure to the QuizQuestion interface used by GrowYourNestMinigame.
 */
export const transformGYNQuestionsForMinigame = (
  questions: GrowYourNestQuestion[]
): Array<{
  id: string;
  question: string;
  options: Array<{ letter: string; text: string; answerId: string }>;
  correctAnswerId: string | null;
  explanation: string;
}> => {
  return questions.map((q) => {
    // Sort answers by order_index
    const sortedAnswers = [...q.answers].sort((a, b) => a.order_index - b.order_index);

    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const options = sortedAnswers.map((ans, idx) => ({
      letter: letters[idx] || String.fromCharCode(65 + idx),
      text: ans.answer_text,
      answerId: ans.id,
    }));

    return {
      id: q.id,
      question: q.question_text,
      options,
      // Note: The backend does NOT include is_correct in answers (to prevent cheating).
      // Correct answer is determined server-side on submit.
      // We set correctAnswerId to null - the game will rely on backend response.
      correctAnswerId: null,
      explanation: q.explanation || '',
    };
  });
};

/**
 * POST /api/grow-your-nest/lesson/{lesson_id}/reset-dev
 * DEV ONLY: Reset GYN played status for a lesson so it can be replayed.
 * Remove before production launch.
 */
export const resetLessonGYNDev = async (lessonId: string): Promise<{ success: boolean; message: string }> => {
  try {
    if (/^\d+$/.test(lessonId)) {
      console.warn(`⚠️ GYN Reset Lesson ID "${lessonId}" appears to be a frontend ID, not a UUID. Skipping.`);
      throw new Error('Frontend ID used instead of UUID');
    }

    console.log(`🧪 [Dev] Resetting GYN played status for lesson: ${lessonId}`);

    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/grow-your-nest/lesson/${lessonId}/reset-dev`,
      { method: 'POST' }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`GYN reset error - Status: ${response.status}, Response: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('🧪 [Dev] GYN reset successful:', data);
    return { success: true, message: data.message || 'Reset successful' };
  } catch (error) {
    console.error('Error resetting GYN lesson:', error);
    throw error;
  }
};