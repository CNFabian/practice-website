// ═══════════════════════════════════════════════════════════════
// CORE TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

export interface MapPosition {
  x: number;
  y: number;
  z?: number; // For layered maps
}

export interface UnlockCondition {
  type: 'lesson_complete' | 'module_complete' | 'coin_balance' | 'streak' | 'custom';
  value: string | number;
  description: string;
}

export interface MinigameConfig {
  id: string;
  type: 'quiz' | 'memory' | 'matching' | 'sorting' | 'word-scramble' | 'drag-drop';
  name: string;
  description: string;
  maxScore: number;
  coinReward: number;
  timeLimit?: number; // in seconds
  difficulty: 'easy' | 'medium' | 'hard';
  unlockConditions?: UnlockCondition[];
}

// ═══════════════════════════════════════════════════════════════
// MAIN MODULE AND LESSON TYPES
// ═══════════════════════════════════════════════════════════════

export interface Lesson {
  id: number;
  backendId?: string;
  orderIndex?: number;
  image: string;
  title: string;
  duration: string;
  description: string;
  coins: number;
  completed: boolean;
  videoUrl?: string;
  transcript?: string;
  
  // NEW GAMIFIED PROPERTIES
  houseRoom?: string;           // Which "room" in the house this lesson belongs to
  mapPosition?: MapPosition;     // Position within the house/room
  unlockConditions?: UnlockCondition[]; // What's required to unlock this lesson
  lessonType?: 'video' | 'interactive' | 'quiz' | 'minigame' | 'mixed';
  minigames?: MinigameConfig[]; // Available minigames for this lesson
  estimatedDuration?: number;   // More precise duration in minutes
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
  prerequisites?: number[];     // Lesson IDs that must be completed first
  bonusReward?: number;        // Extra coins for perfect completion

  // BACKEND INTEGRATION FIELDS (Phase 1, Step 3)
  /** Brief summary of the lesson content from backend */
  lesson_summary?: string;
  /** Whether Grow Your Nest has been played for this lesson (one-time only) */
  grow_your_nest_played?: boolean | null;
}

export interface Module {
  id: number;
  backendId?: string;
  orderIndex?: number;
  image: string;
  title: string;
  description: string;
  lessonCount: number;
  status: 'In Progress' | 'Not Started' | 'Completed';
  tags: string[];
  illustration: string;
  lessons: Lesson[];
  quizCompleted?: boolean;
  quizScore?: number;
  neighborhoodId?: string;        // Which neighborhood this module belongs to
  houseId?: string;              // Which house this module belongs to
  mapPosition?: MapPosition;      // Position on the map/neighborhood/house
  unlockConditions?: UnlockCondition[]; // What's required to unlock this module
  coinReward?: number;           // Coins earned for completing the module
  isUnlocked?: boolean;          // Whether the module is currently accessible
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration?: number;    // Estimated time to complete (in minutes)
  prerequisites?: number[];      // Module IDs that must be completed first

  // BACKEND INTEGRATION FIELDS (Phase 1, Step 3)
  /** Whether all lessons in this module are completed */
  all_lessons_completed?: boolean | null;
  /** Whether free roam mode is available for this module */
  free_roam_available?: boolean | null;
  /** Current tree growth points for this module */
  tree_growth_points?: number | null;
  /** Current tree stage (0-5) */
  tree_current_stage?: number | null;
  /** Total tree stages (always 5) */
  tree_total_stages?: number | null;
  /** Whether the tree is fully grown */
  tree_completed?: boolean | null;
}

// ═══════════════════════════════════════════════════════════════
// NEIGHBORHOOD AND HOUSE TYPES
// ═══════════════════════════════════════════════════════════════

export interface House {
  id: string;
  neighborhoodId: string;
  name: string;
  description: string;
  moduleIds: number[]; // Links to existing Module IDs
  position: MapPosition;
  isUnlocked: boolean;
  unlockConditions: UnlockCondition[];
  theme: string;
  illustration?: string;
  completionReward: number; // Coins
}

export interface Neighborhood {
  id: string;
  name: string;
  description: string;
  theme: string;
  position: MapPosition;
  isUnlocked: boolean;
  unlockConditions: UnlockCondition[];
  houses: House[];
  backgroundImage?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

// ═══════════════════════════════════════════════════════════════
// COIN SYSTEM TYPES
// ═══════════════════════════════════════════════════════════════

export interface CoinTransaction {
  id: string;
  amount: number;
  type: 'earned' | 'spent';
  source: 'lesson_complete' | 'quiz_complete' | 'module_complete' | 'daily_task' | 'minigame' | 'purchase';
  description: string;
  timestamp: string;
  metadata?: {
    lessonId?: number;
    moduleId?: number;
    taskId?: string;
  };
}

export interface MinigameResult {
  id: string;
  gameType: 'quiz' | 'memory' | 'matching' | 'sorting' | 'custom';
  score: number;
  maxScore: number;
  coinsEarned: number;
  completionTime: number; // in seconds
  lessonId?: number;
  moduleId?: number;
  timestamp: string;
}

// ═══════════════════════════════════════════════════════════════
// ADVANCED GAMIFICATION TYPES
// ═══════════════════════════════════════════════════════════════

export interface DailyTask {
  id: string;
  title: string;
  description: string;
  type: 'lesson' | 'quiz' | 'module' | 'streak' | 'custom';
  targetValue: number;
  currentProgress: number;
  coinReward: number;
  isCompleted: boolean;
  expiresAt: string;
  createdAt: string;
}

export interface LearningStreak {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  streakType: 'daily_login' | 'daily_lesson' | 'perfect_quiz' | 'module_complete';
  multiplier: number; // Coin multiplier for maintaining streak
}

export interface ProgressMilestone {
  id: string;
  name: string;
  description: string;
  type: 'lesson_streak' | 'module_complete' | 'coin_milestone' | 'time_spent' | 'quiz_perfect';
  targetValue: number;
  coinReward: number;
  badgeIcon?: string;
  isAchieved: boolean;
  achievedAt?: string;
}

export interface UserGameProfile {
  userId: string;
  level: number;
  totalXP: number;
  coinBalance: number;
  lifetimeCoinsEarned: number;
  lifetimeCoinsSpent: number;
  streaks: { [key: string]: LearningStreak };
  achievements: ProgressMilestone[];
  unlockedContent: {
    neighborhoods: string[];
    houses: string[];
    modules: number[];
    minigames: string[];
  };
  preferences: {
    dailyGoalLessons: number;
    dailyGoalMinutes: number;
    reminderTime?: string;
    soundEnabled: boolean;
    animationsEnabled: boolean;
  };
  statistics: {
    totalLessonsCompleted: number;
    totalModulesCompleted: number;
    totalQuizzesCompleted: number;
    totalMinigamesPlayed: number;
    averageQuizScore: number;
    totalTimeSpent: number; // in minutes
    favoriteSubjects: string[];
  };
}

// ═══════════════════════════════════════════════════════════════
// NAVIGATION AND ROUTING TYPES
// ═══════════════════════════════════════════════════════════════

export type GameViewType = 'map' | 'neighborhood' | 'house' | 'lesson' | 'quiz' | 'minigame';

export interface NavigationState {
  currentView: GameViewType;
  previousView?: GameViewType;
  viewHistory: GameViewType[];
  selectedNeighborhoodId?: string;
  selectedHouseId?: string;
  selectedModuleId?: number;
  selectedLessonId?: number;
  isTransitioning: boolean;
}

export interface RouteParams {
  neighborhoodId?: string;
  houseId?: string;
  moduleId?: string;
  lessonId?: string;
  minigameId?: string;
}

// ═══════════════════════════════════════════════════════════════
// API RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════

export interface NeighborhoodResponse {
  neighborhoods: Neighborhood[];
  userProgress: { [neighborhoodId: string]: number };
  unlockedNeighborhoods: string[];
}

export interface HouseResponse {
  houses: House[];
  userProgress: { [houseId: string]: number };
  unlockedHouses: string[];
}

export interface GameProfileResponse {
  profile: UserGameProfile;
  dailyTasks: DailyTask[];
  streakInfo: LearningStreak;
  recentTransactions: CoinTransaction[];
}