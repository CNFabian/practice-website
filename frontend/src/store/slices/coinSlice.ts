import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CoinState {
  // Frontend cached balance - starts at 200 (onboarding bonus), updated from backend
  cachedBalance: number;
  
  // Track if we should use cached vs backend data
  useCache: boolean;
  
  // Animation state for coin increments
  isAnimating: boolean;
}

const initialState: CoinState = {
  cachedBalance: 200, // Start with 200 coins (onboarding bonus)
  useCache: true, // Use cached balance by default
  isAnimating: false,
};

const coinSlice = createSlice({
  name: 'coins',
  initialState,
  reducers: {
    // Increment coins when earning from quizzes
    incrementCoins: (state, action: PayloadAction<number>) => {
      state.cachedBalance += action.payload;
      state.isAnimating = true;
    },

    // Set animation complete
    setAnimationComplete: (state) => {
      state.isAnimating = false;
    },

    // Reset to backend balance (if needed)
    resetToBackend: (state, action: PayloadAction<number>) => {
      state.cachedBalance = action.payload;
      state.useCache = false;
    },

    // Enable cache mode
    enableCache: (state) => {
      state.useCache = true;
    },

    // Manually set coin balance
    setCoinBalance: (state, action: PayloadAction<number>) => {
      state.cachedBalance = action.payload;
    },

    // Decrement coins when spending (for future use)
    decrementCoins: (state, action: PayloadAction<number>) => {
      state.cachedBalance = Math.max(0, state.cachedBalance - action.payload);
    }
  },
});

export const {
  incrementCoins,
  setAnimationComplete,
  resetToBackend,
  enableCache,
  setCoinBalance,
  decrementCoins,
} = coinSlice.actions;

export default coinSlice.reducer;