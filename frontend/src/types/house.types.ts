// Define the required types locally to avoid circular dependencies
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
  
  // Extended properties
  houseType: 'starter' | 'intermediate' | 'advanced' | 'bonus';
  rooms: LessonRoom[];
  estimatedCompletionTime?: number; // in hours
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  specialFeatures?: string[]; // Special mechanics or features
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
  specialMechanics?: RoomMechanic[];
}

export interface RoomMechanic {
  id: string;
  type: 'timer_challenge' | 'streak_bonus' | 'perfect_score_only' | 'collaborative' | 'mini_boss';
  description: string;
  isActive: boolean;
  parameters?: { [key: string]: any };
}

export interface HouseProgress {
  houseId: string;
  completionPercentage: number;
  roomsUnlocked: number;
  totalRooms: number;
  lessonsCompleted: number;
  totalLessons: number;
  coinsEarned: number;
  timeSpent: number; // in minutes
  perfectScores: number;
  lastVisited?: string;
  achievements?: string[]; // House-specific achievements
}

export interface HouseTheme {
  id: string;
  name: string;
  style: 'modern' | 'classic' | 'fantasy' | 'sci-fi' | 'rustic';
  exteriorImage: string;
  interiorImages: { [roomType: string]: string };
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
  animations: {
    entrance: string;
    completion: string;
    unlock: string;
  };
}