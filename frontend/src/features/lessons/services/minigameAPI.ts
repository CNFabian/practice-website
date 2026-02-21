import { fetchWithAuth } from '../../../services/authAPI';
import type {
  MiniGameQuestionsResponse,
  MiniGameSubmission,
  MiniGameResult,
  MiniGameAttemptHistory,
} from '../../../types/minigame.api.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// --- NEW TYPE: Minigame Statistics Response ---
export interface MinigameStatisticsResponse {
  total_attempts: number;
  total_passed: number;
  total_failed: number;
  pass_rate: number;
  average_score: number;
  best_score: number;
  modules_completed: number;
}

// GET /api/minigame/module/{module_id}
// Get all quiz questions for the module-level Grow Your Nest mini-game
export const getModuleMinigame = async (moduleId: string): Promise<MiniGameQuestionsResponse> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/minigame/module/${moduleId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching module minigame:', error);
    throw error;
  }
};

// POST /api/minigame/module/{module_id}/submit
// Submit mini-game results — validates answers, calculates score, awards coins/badges
// Rate Limited: 10 requests per minute per user
export const submitModuleMinigame = async (
  moduleId: string,
  submission: {
    answers: Array<Record<string, string>>; // [{"question_id": "answer_id"}]
    timeTakenSeconds?: number | null;
    gameData?: Record<string, any> | null;
  }
): Promise<MiniGameResult> => {
  try {
    const body: MiniGameSubmission = {
      module_id: moduleId,
      answers: submission.answers,
      time_taken_seconds: submission.timeTakenSeconds ?? null,
      game_data: submission.gameData ?? null,
    };

    const response = await fetchWithAuth(`${API_BASE_URL}/api/minigame/module/${moduleId}/submit`, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting module minigame:', error);
    throw error;
  }
};

// GET /api/minigame/module/{module_id}/attempts
// Get user's previous mini-game attempts for a module
export const getMinigameAttempts = async (moduleId: string): Promise<MiniGameAttemptHistory[]> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/minigame/module/${moduleId}/attempts`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching minigame attempts:', error);
    throw error;
  }
};

// GET /api/minigame/stats
// Get user's overall mini-game statistics across all modules
export const getMinigameStatistics = async (): Promise<MinigameStatisticsResponse> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/minigame/stats`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching minigame statistics:', error);
    throw error;
  }
};