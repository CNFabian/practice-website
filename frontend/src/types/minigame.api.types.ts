// Single answer option within a mini-game question
export interface MiniGameAnswerOption {
  id: string;
  answer_text: string;
  order_index: number;
}

// Single question for mini-game
export interface MiniGameQuestion {
  id: string;
  lesson_id: string;
  lesson_title: string;
  question_text: string;
  question_type: string;
  order_index: number;
  answers: MiniGameAnswerOption[];
}

// Module info included in mini-game response
export interface MiniGameModuleInfo {
  id: string;
  title: string;
  description?: string;
  [key: string]: any;
}

// User status info included in mini-game response
export interface MiniGameUserStatus {
  attempts: number;
  best_score?: number;
  passed?: boolean;
  [key: string]: any;
}

// Response with all questions for the module mini-game
// GET /api/minigame/module/{module_id}
export interface MiniGameQuestionsResponse {
  module: MiniGameModuleInfo;
  total_lessons: number;
  completed_lessons: number;
  total_questions: number;
  questions: MiniGameQuestion[];
  user_status: MiniGameUserStatus;
}

// Submit mini-game answers
// POST /api/minigame/module/{module_id}/submit
export interface MiniGameSubmission {
  module_id: string;
  answers: Array<Record<string, string>>; // [{"question_id": "answer_id"}]
  time_taken_seconds?: number | null;
  game_data?: Record<string, any> | null;
}

// Mini-game results response
export interface MiniGameResult {
  attempt_id: string;
  module_id: string;
  module_title: string;
  score: string;
  total_questions: number;
  correct_answers: number;
  passed: boolean;
  coins_earned: number;
  badges_earned: string[];
  time_taken_seconds?: number | null;
  attempt_number: number;
  module_completed: boolean;
}

// Previous attempt summary
// GET /api/minigame/module/{module_id}/attempts
export interface MiniGameAttemptHistory {
  id: string;
  attempt_number: number;
  score: string;
  passed: boolean;
  completed_at: string;
}