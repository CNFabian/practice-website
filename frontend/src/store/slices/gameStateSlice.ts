import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS for New Gamified Architecture
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

// ═══════════════════════════════════════════════════════════════
// STATE INTERFACE
// ═══════════════════════════════════════════════════════════════

interface GameStateSlice {
  // Map & Navigation State
  currentView: 'map' | 'neighborhood' | 'house' | 'lesson' | 'quiz';
  selectedNeighborhoodId: string | null;
  selectedHouseId: string | null;
  mapViewport: {
    centerX: number;
    centerY: number;
    zoom: number;
  };

  // Game World Data
  neighborhoods: { [id: string]: Neighborhood };
  houses: { [id: string]: House };
  unlockedNeighborhoods: string[];
  unlockedHouses: string[];

  // Coin System
  coinBalance: number;
  coinTransactions: CoinTransaction[];
  dailyCoinLimit: number;
  dailyCoinsEarned: number;

  // Daily Tasks
  dailyTasks: DailyTask[];
  tasksCompletedToday: number;
  streakDays: number;
  lastActivityDate: string;

  // Minigames & Activities
  minigameResults: MinigameResult[];
  availableMinigames: string[];

  // Progress & Achievements
  neighborhoodProgress: { [id: string]: number }; // 0-100 percentage
  houseProgress: { [id: string]: number }; // 0-100 percentage
  totalLearningProgress: number;

  // UI State
  isLoading: boolean;
  error: string | null;
  showCoinAnimation: boolean;
  recentCoinEarned: number;
}

// ═══════════════════════════════════════════════════════════════
// INITIAL STATE
// ═══════════════════════════════════════════════════════════════

const initialState: GameStateSlice = {
  // Map & Navigation
  currentView: 'map',
  selectedNeighborhoodId: null,
  selectedHouseId: null,
  mapViewport: {
    centerX: 0,
    centerY: 0,
    zoom: 1,
  },

  // Game World Data
  neighborhoods: {},
  houses: {},
  unlockedNeighborhoods: ['starter-neighborhood'], // Default starter area
  unlockedHouses: [],

  // Coin System
  coinBalance: 0,
  coinTransactions: [],
  dailyCoinLimit: 100,
  dailyCoinsEarned: 0,

  // Daily Tasks
  dailyTasks: [],
  tasksCompletedToday: 0,
  streakDays: 0,
  lastActivityDate: '',

  // Minigames & Activities
  minigameResults: [],
  availableMinigames: ['quiz-challenge', 'memory-game', 'word-match'],

  // Progress & Achievements
  neighborhoodProgress: {},
  houseProgress: {},
  totalLearningProgress: 0,

  // UI State
  isLoading: false,
  error: null,
  showCoinAnimation: false,
  recentCoinEarned: 0,
};

// ═══════════════════════════════════════════════════════════════
// SLICE DEFINITION
// ═══════════════════════════════════════════════════════════════

const gameStateSlice = createSlice({
  name: 'gameState',
  initialState,
  reducers: {
    // ═══════ Navigation Actions ═══════
    setCurrentView: (state, action: PayloadAction<GameStateSlice['currentView']>) => {
      state.currentView = action.payload;
    },

    selectNeighborhood: (state, action: PayloadAction<string>) => {
      state.selectedNeighborhoodId = action.payload;
      state.currentView = 'neighborhood';
    },

    selectHouse: (state, action: PayloadAction<string>) => {
      state.selectedHouseId = action.payload;
      state.currentView = 'house';
    },

    updateMapViewport: (state, action: PayloadAction<{ centerX?: number; centerY?: number; zoom?: number }>) => {
      state.mapViewport = { ...state.mapViewport, ...action.payload };
    },

    // ═══════ World Data Actions ═══════
    loadNeighborhoods: (state, action: PayloadAction<Neighborhood[]>) => {
      state.neighborhoods = {};
      action.payload.forEach(neighborhood => {
        state.neighborhoods[neighborhood.id] = neighborhood;
      });
    },

    loadHouses: (state, action: PayloadAction<House[]>) => {
      state.houses = {};
      action.payload.forEach(house => {
        state.houses[house.id] = house;
      });
    },

    unlockNeighborhood: (state, action: PayloadAction<string>) => {
      const neighborhoodId = action.payload;
      if (!state.unlockedNeighborhoods.includes(neighborhoodId)) {
        state.unlockedNeighborhoods.push(neighborhoodId);
      }
      if (state.neighborhoods[neighborhoodId]) {
        state.neighborhoods[neighborhoodId].isUnlocked = true;
      }
    },

    unlockHouse: (state, action: PayloadAction<string>) => {
      const houseId = action.payload;
      if (!state.unlockedHouses.includes(houseId)) {
        state.unlockedHouses.push(houseId);
      }
      if (state.houses[houseId]) {
        state.houses[houseId].isUnlocked = true;
      }
    },

    // ═══════ Coin System Actions ═══════
    earnCoins: (state, action: PayloadAction<{ amount: number; source: CoinTransaction['source']; description: string; metadata?: CoinTransaction['metadata'] }>) => {
      const { amount, source, description, metadata } = action.payload;
      
      // Add to balance
      state.coinBalance += amount;
      state.dailyCoinsEarned += amount;
      
      // Create transaction record
      const transaction: CoinTransaction = {
        id: `${Date.now()}_${Math.random()}`,
        amount,
        type: 'earned',
        source,
        description,
        timestamp: new Date().toISOString(),
        metadata,
      };
      state.coinTransactions.unshift(transaction);
      
      // UI feedback
      state.showCoinAnimation = true;
      state.recentCoinEarned = amount;
    },

    spendCoins: (state, action: PayloadAction<{ amount: number; description: string; metadata?: CoinTransaction['metadata'] }>) => {
      const { amount, description, metadata } = action.payload;
      
      if (state.coinBalance >= amount) {
        state.coinBalance -= amount;
        
        const transaction: CoinTransaction = {
          id: `${Date.now()}_${Math.random()}`,
          amount,
          type: 'spent',
          source: 'purchase',
          description,
          timestamp: new Date().toISOString(),
          metadata,
        };
        state.coinTransactions.unshift(transaction);
      }
    },

    hideCoinAnimation: (state) => {
      state.showCoinAnimation = false;
      state.recentCoinEarned = 0;
    },

    // ═══════ Daily Tasks Actions ═══════
    loadDailyTasks: (state, action: PayloadAction<DailyTask[]>) => {
      state.dailyTasks = action.payload;
    },

    updateTaskProgress: (state, action: PayloadAction<{ taskId: string; progress: number }>) => {
      const { taskId, progress } = action.payload;
      const task = state.dailyTasks.find(t => t.id === taskId);
      if (task) {
        task.currentProgress = Math.min(progress, task.targetValue);
        if (task.currentProgress >= task.targetValue && !task.isCompleted) {
          task.isCompleted = true;
          state.tasksCompletedToday += 1;
        }
      }
    },

    completeTask: (state, action: PayloadAction<string>) => {
      const taskId = action.payload;
      const task = state.dailyTasks.find(t => t.id === taskId);
      if (task && !task.isCompleted) {
        task.isCompleted = true;
        task.currentProgress = task.targetValue;
        state.tasksCompletedToday += 1;
      }
    },

    // ═══════ Progress Actions ═══════
    updateNeighborhoodProgress: (state, action: PayloadAction<{ neighborhoodId: string; progress: number }>) => {
      const { neighborhoodId, progress } = action.payload;
      state.neighborhoodProgress[neighborhoodId] = Math.max(0, Math.min(100, progress));
    },

    updateHouseProgress: (state, action: PayloadAction<{ houseId: string; progress: number }>) => {
      const { houseId, progress } = action.payload;
      state.houseProgress[houseId] = Math.max(0, Math.min(100, progress));
    },

    updateTotalProgress: (state, action: PayloadAction<number>) => {
      state.totalLearningProgress = Math.max(0, Math.min(100, action.payload));
    },

    // ═══════ Minigame Actions ═══════
    addMinigameResult: (state, action: PayloadAction<Omit<MinigameResult, 'id' | 'timestamp'>>) => {
      const result: MinigameResult = {
        ...action.payload,
        id: `${Date.now()}_${Math.random()}`,
        timestamp: new Date().toISOString(),
      };
      state.minigameResults.unshift(result);
    },

    // ═══════ Utility Actions ═══════
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },

    resetDailyProgress: (state) => {
      state.dailyCoinsEarned = 0;
      state.tasksCompletedToday = 0;
      state.dailyTasks.forEach(task => {
        task.isCompleted = false;
        task.currentProgress = 0;
      });
    },
  },
});

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export const {
  // Navigation
  setCurrentView,
  selectNeighborhood,
  selectHouse,
  updateMapViewport,
  
  // World Data
  loadNeighborhoods,
  loadHouses,
  unlockNeighborhood,
  unlockHouse,
  
  // Coins
  earnCoins,
  spendCoins,
  hideCoinAnimation,
  
  // Daily Tasks
  loadDailyTasks,
  updateTaskProgress,
  completeTask,
  
  // Progress
  updateNeighborhoodProgress,
  updateHouseProgress,
  updateTotalProgress,
  
  // Minigames
  addMinigameResult,
  
  // Utility
  setLoading,
  setError,
  clearError,
  resetDailyProgress,
} = gameStateSlice.actions;

export default gameStateSlice.reducer;