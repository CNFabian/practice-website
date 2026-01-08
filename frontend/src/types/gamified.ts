// ═══════════════════════════════════════════════════════════════
// EXTENDED MODULE TYPES for Gamified Learning
// ═══════════════════════════════════════════════════════════════

import { 
  MapPosition, 
  UnlockCondition, 
  Neighborhood, 
  House,
  CoinTransaction,
  MinigameResult 
} from '../store/slices/gameStateSlice';

// Re-export the new types from gameStateSlice
export type {
  MapPosition,
  UnlockCondition,
  Neighborhood,
  House,
  CoinTransaction,
  MinigameResult,
};

// ═══════════════════════════════════════════════════════════════
// EXTENDED EXISTING TYPES
// ═══════════════════════════════════════════════════════════════

// Extended Module interface to support new gamified structure
export interface ExtendedModule {
  id: number;
  backendId?: string;
  image: string;
  title: string;
  description: string;
  lessonCount: number;
  status: 'Not Started' | 'In Progress' | 'Completed';
  tags: string[];
  illustration: string;
  lessons: ExtendedLesson[];
  
  // NEW GAMIFIED PROPERTIES
  neighborhoodId?: string;        // Which neighborhood this module belongs to
  houseId?: string;              // Which house this module belongs to
  mapPosition?: MapPosition;      // Position on the map/neighborhood/house
  unlockConditions?: UnlockCondition[]; // What's required to unlock this module
  coinReward?: number;           // Coins earned for completing the module
  isUnlocked?: boolean;          // Whether the module is currently accessible
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration?: number;    // Estimated time to complete (in minutes)
  prerequisites?: number[];      // Module IDs that must be completed first
}

// Extended Lesson interface to support new gamified structure  
export interface ExtendedLesson {
  id: number;
  backendId?: string;
  image: string;
  title: string;
  duration: string;
  description: string;
  coins: number;
  completed: boolean;
  videoUrl?: string;
  
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
}

// ═══════════════════════════════════════════════════════════════
// NEW TYPES FOR GAMIFIED FEATURES
// ═══════════════════════════════════════════════════════════════

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

export interface LessonRoom {
  id: string;
  houseId: string;
  name: string;
  description: string;
  roomType: 'study' | 'practice' | 'assessment' | 'bonus' | 'library';
  position: MapPosition;
  lessonIds: number[];
  isUnlocked: boolean;
  unlockConditions?: UnlockCondition[];
  theme?: string;
  backgroundImage?: string;
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

export interface LearningStreak {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  streakType: 'daily_login' | 'daily_lesson' | 'perfect_quiz' | 'module_complete';
  multiplier: number; // Coin multiplier for maintaining streak
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
// ROUTING TYPES
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
  dailyTasks: any[];
  streakInfo: LearningStreak;
  recentTransactions: CoinTransaction[];
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT PROP INTERFACES
// ═══════════════════════════════════════════════════════════════

export interface MapViewProps {
  neighborhoods: { [id: string]: Neighborhood };
  userProgress: { [id: string]: number };
  onNeighborhoodSelect: (neighborhoodId: string) => void;
  currentPosition?: MapPosition;
}

export interface NeighborhoodViewProps {
  neighborhood: Neighborhood;
  houses: House[];
  userProgress: { [houseId: string]: number };
  onHouseSelect: (houseId: string) => void;
  onBackToMap: () => void;
}

export interface HouseViewProps {
  house: House;
  modules: ExtendedModule[];
  rooms: LessonRoom[];
  userProgress: { [moduleId: string]: number };
  onModuleSelect: (moduleId: number) => void;
  onRoomSelect: (roomId: string) => void;
  onBackToNeighborhood: () => void;
}

// ═══════════════════════════════════════════════════════════════
// BACKWARDS COMPATIBILITY
// ═══════════════════════════════════════════════════════════════

// Keep original types for compatibility during transition
export interface Module extends ExtendedModule {}
export interface Lesson extends ExtendedLesson {}

// Legacy interfaces (to be removed after migration)
export interface LegacyModule {
  id: number;
  backendId?: string;
  image: string;
  title: string;
  description: string;
  lessonCount: number;
  status: 'Not Started' | 'In Progress' | 'Completed';
  tags: string[];
  illustration: string;
  lessons: LegacyLesson[];
}

export interface LegacyLesson {
  id: number;
  backendId?: string;
  image: string;
  title: string;
  duration: string;
  description: string;
  coins: number;
  completed: boolean;
  videoUrl?: string;
}