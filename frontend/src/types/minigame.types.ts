export interface MinigameResult {
  id: string;
  gameType: 'quiz' | 'memory' | 'matching' | 'sorting' | 'word-scramble' | 'drag-drop' | 'timeline' | 'calculation';
  score: number;
  maxScore: number;
  coinsEarned: number;
  completionTime: number; // in seconds
  lessonId?: number;
  moduleId?: number;
  timestamp: string;
  attempts: number;
  perfectScore: boolean;
  hintsUsed: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface UnlockCondition {
  type: 'lesson_complete' | 'module_complete' | 'coin_balance' | 'streak' | 'custom';
  value: string | number;
  description: string;
}

export interface MinigameConfig {
  id: string;
  type: 'quiz' | 'memory' | 'matching' | 'sorting' | 'word-scramble' | 'drag-drop' | 'timeline' | 'calculation';
  name: string;
  description: string;
  maxScore: number;
  coinReward: number;
  timeLimit?: number; // in seconds
  difficulty: 'easy' | 'medium' | 'hard';
  unlockConditions?: UnlockCondition[];
  
  // Game-specific configuration
  gameConfig: {
    // For memory games
    cardCount?: number;
    gridSize?: { rows: number; cols: number };
    
    // For matching games  
    pairCount?: number;
    categories?: string[];
    
    // For sorting games
    itemCount?: number;
    sortCriteria?: string;
    
    // For quiz games
    questionCount?: number;
    multipleChoice?: boolean;
    
    // For word games
    wordLength?: number;
    vocabulary?: string[];
    
    // For timeline games
    eventCount?: number;
    timeRange?: { start: string; end: string };
    
    // For calculation games
    operationType?: 'addition' | 'subtraction' | 'multiplication' | 'division' | 'mixed';
    numberRange?: { min: number; max: number };
  };
}

export interface MinigameSession {
  id: string;
  minigameId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  currentScore: number;
  timeElapsed: number;
  hintsUsed: number;
  isCompleted: boolean;
  gameState: any; // Game-specific state data
}

export interface MinigameLeaderboard {
  minigameId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'all-time';
  entries: MinigameLeaderboardEntry[];
  userRank?: number;
  totalPlayers: number;
}

export interface MinigameLeaderboardEntry {
  userId: string;
  username: string;
  avatar?: string;
  score: number;
  completionTime: number;
  rank: number;
  coinsEarned: number;
  timestamp: string;
}

export interface MinigameAchievement {
  id: string;
  minigameType: string;
  name: string;
  description: string;
  icon: string;
  requirement: {
    type: 'perfect_score' | 'speed_run' | 'no_hints' | 'streak' | 'total_plays';
    value: number;
  };
  coinReward: number;
  isUnlocked: boolean;
  unlockedAt?: string;
}

export interface MinigameStatistics {
  totalGamesPlayed: number;
  totalTimeSpent: number; // in minutes
  averageScore: number;
  bestScore: number;
  perfectScores: number;
  favoriteGameType: string;
  gamesCompletedToday: number;
  currentStreak: number;
  longestStreak: number;
  totalCoinsEarned: number;
  achievementsUnlocked: string[];
}