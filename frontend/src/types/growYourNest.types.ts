/**
 * growYourNest.types.ts
 * 
 * TypeScript type definitions for the "Grow Your Nest" minigame API.
 * Covers lesson mode, free roam mode, tree state, and all request/response formats.
 */

// ═══════════════════════════════════════════════════════════════
// CORE TYPES
// ═══════════════════════════════════════════════════════════════

/** Individual answer option for a Grow Your Nest question */
export interface GrowYourNestAnswer {
  id: string;
  question_id: string;
  answer_text: string;
  order_index: number;
}

/** Question returned by the GYN API */
export interface GrowYourNestQuestion {
  id: string;
  lesson_id: string;
  question_text: string;
  question_type: 'multiple_choice';
  explanation: string;
  order_index: number;
  answers: GrowYourNestAnswer[];
}

/** Tree state returned in various API responses */
export interface TreeState {
  growth_points: number;
  current_stage: number;
  total_stages: number;
  points_per_stage: number;
  completed: boolean;
}

/** Extended tree state returned after submissions (includes transition info) */
export interface TreeStateWithTransition extends TreeState {
  previous_stage: number;
  stage_increased: boolean;
  just_completed: boolean;
  /** Only present in free roam responses */
  points_to_next_stage?: number;
  points_to_complete?: number;
}

// ═══════════════════════════════════════════════════════════════
// VALIDATE ANSWER (instant feedback, no side effects)
// ═══════════════════════════════════════════════════════════════

/** POST /api/grow-your-nest/validate-answer - Request */
export interface ValidateAnswerRequest {
  question_id: string;
  answer_id: string;
}

/** POST /api/grow-your-nest/validate-answer - Response */
export interface ValidateAnswerResponse {
  is_correct: boolean;
  explanation: string | null;
  /** Optional correct answer ID returned from backend (if available) */
  correct_answer_id?: string | null;
}

// ═══════════════════════════════════════════════════════════════
// LESSON MODE TYPES
// ═══════════════════════════════════════════════════════════════

/** GET /api/grow-your-nest/lesson/{lesson_id}/questions */
export interface LessonQuestionsResponse {
  questions: GrowYourNestQuestion[];
  tree_state: TreeState;
}

/** Individual answer submission for lesson mode */
export interface LessonAnswerSubmission {
  question_id: string;
  answer_id: string;
}

/** POST /api/grow-your-nest/lesson/{lesson_id}/submit - Request */
export interface LessonSubmitRequest {
  answers: LessonAnswerSubmission[];
}

/** POST /api/grow-your-nest/lesson/{lesson_id}/submit - Response */
export interface LessonSubmitResponse {
  success: boolean;
  passed: boolean;
  correct_count: number;
  total_questions: number;
  growth_points_earned: number;
  fertilizer_bonus: boolean;
  tree_state: TreeStateWithTransition;
  coins_earned: number;
}

// ═══════════════════════════════════════════════════════════════
// FREE ROAM MODE TYPES
// ═══════════════════════════════════════════════════════════════

/** GET /api/grow-your-nest/freeroam/{module_id}/questions */
export interface FreeRoamQuestionsResponse {
  questions: GrowYourNestQuestion[];
  tree_state: TreeState;
}

/** POST /api/grow-your-nest/freeroam/{module_id}/answer - Request */
export interface FreeRoamAnswerRequest {
  question_id: string;
  answer_id: string;
  consecutive_correct: number;
}

/** POST /api/grow-your-nest/freeroam/{module_id}/answer - Response */
export interface FreeRoamAnswerResponse {
  success: boolean;
  is_correct: boolean;
  explanation: string | null;
  growth_points_earned: number;
  fertilizer_bonus: boolean;
  tree_state: TreeStateWithTransition;
  coins_earned: number;
}

/** GET /api/grow-your-nest/freeroam/{module_id}/state */
export interface FreeRoamStateResponse {
  growth_points: number;
  current_stage: number;
  total_stages: number;
  points_per_stage: number;
  points_to_next_stage: number;
  points_to_complete: number;
  completed: boolean;
  completed_at: string | null;
}

// ═══════════════════════════════════════════════════════════════
// UPDATED LESSON & MODULE RESPONSE FIELDS
// ═══════════════════════════════════════════════════════════════

/** Additional fields now included in lesson responses from backend */
export interface LessonGYNFields {
  /** Whether GYN has been played for this lesson (one-time only) */
  grow_your_nest_played: boolean;
}

/** Additional fields now included in module responses from backend */
export interface ModuleGYNFields {
  /** Whether all lessons in this module are completed */
  all_lessons_completed: boolean;
  /** Whether free roam mode is available for this module */
  free_roam_available: boolean;
  /** Current tree growth points for this module */
  tree_growth_points: number;
  /** Current tree stage (0-5) */
  tree_current_stage: number;
  /** Total tree stages (always 5) */
  tree_total_stages: number;
  /** Whether the tree is fully grown */
  tree_completed: boolean;
}

// ═══════════════════════════════════════════════════════════════
// MINIGAME GAME STATE (used by Phaser scene)
// ═══════════════════════════════════════════════════════════════

/** Game mode for the GYN minigame */
export type GYNGameMode = 'lesson' | 'freeroam';

/** Transformed question format used by the Phaser GrowYourNestMinigame scene */
export interface GYNMinigameQuestion {
  id: string;
  question: string;
  options: Array<{
    letter: string;
    text: string;
    answerId: string;
  }>;
  /** null because correct answer is determined server-side */
  correctAnswerId: string | null;
  explanation: string;
}

/** Data passed to the GrowYourNestMinigame scene via init() */
export interface GYNMinigameInitData {
  /** Game mode: lesson (3 questions, one-time) or freeroam (all questions, persistent) */
  mode: GYNGameMode;
  /** Backend lesson ID (for lesson mode) */
  lessonId?: string;
  /** Backend module ID (for free roam mode) */
  moduleId?: string;
  /** Pre-fetched questions transformed for the minigame */
  questions: GYNMinigameQuestion[];
  /** Initial tree state from the API */
  treeState: TreeState;
  /** Module number for display purposes */
  moduleNumber?: number;
  /** Whether to show start screen or jump right into questions */
  showStartScreen?: boolean;
  /** Question IDs that have already awarded base growth points (for deduplication) */
  awardedQuestionIds?: string[];
}

/** Result emitted when the minigame session completes */
export interface GYNMinigameResult {
  mode: GYNGameMode;
  lessonId?: string;
  moduleId?: string;
  totalQuestions: number;
  correctCount: number;
  growthPointsEarned: number;
  coinsEarned: number;
  fertilizerBonuses: number;
  treeState: TreeStateWithTransition | TreeState;
  consecutiveCorrect: number;
}

// ═══════════════════════════════════════════════════════════════
// GAME MECHANICS CONSTANTS
// ═══════════════════════════════════════════════════════════════

/** Game mechanics constants - these match the backend configuration */
export const GYN_CONSTANTS = {
  /** Total tree growth stages */
  TOTAL_STAGES: 5,
  /** Growth points required per stage */
  POINTS_PER_STAGE: 50,
  /** Total growth points for a fully grown tree */
  TOTAL_POINTS: 250,
  /** Points earned per correct answer (water) */
  WATER_POINTS: 10,
  /** Bonus points for 3 consecutive correct (fertilizer) */
  FERTILIZER_POINTS: 20,
  /** Consecutive correct answers needed for fertilizer bonus */
  FERTILIZER_STREAK: 3,
  /** Maximum coins per fully grown tree */
  MAX_COINS: 250,
  /** Number of questions in lesson mode */
  LESSON_QUESTION_COUNT: 3,
  /** Max points per lesson session (3 correct + 1 fertilizer) */
  MAX_LESSON_POINTS: 50,
} as const;