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
  completionReward?: number;
  estimatedCompletionTime?: number; // in hours
  totalModules?: number;
  completedModules?: number;
}

export interface NeighborhoodProgress {
  neighborhoodId: string;
  completionPercentage: number;
  housesUnlocked: number;
  totalHouses: number;
  modulesCompleted: number;
  totalModules: number;
  coinsEarned: number;
  timeSpent: number; // in minutes
  lastVisited?: string;
}

export interface NeighborhoodTheme {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundImage: string;
  iconSet: string;
  musicTrack?: string;
  soundEffects: {
    unlock: string;
    complete: string;
    click: string;
  };
}