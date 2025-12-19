import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import type { RootState, AppDispatch } from '../store/store';
import {
  incrementCoins as incrementCoinsAction,
  setAnimationComplete,
  resetToBackend,
  enableCache,
  setCoinBalance,
  decrementCoins as decrementCoinsAction,
} from '../store/slices/coinSlice';

export const useCoinSystem = () => {
  const dispatch = useDispatch<AppDispatch>();
  const coinState = useSelector((state: RootState) => state.coins);

  // Increment coins with animation
  const incrementCoins = useCallback((amount: number) => {
    dispatch(incrementCoinsAction(amount));
    
    // Auto-complete animation after a short delay
    setTimeout(() => {
      dispatch(setAnimationComplete());
    }, 2000);
  }, [dispatch]);

  // Decrement coins (for future spending features)
  const decrementCoins = useCallback((amount: number) => {
    dispatch(decrementCoinsAction(amount));
  }, [dispatch]);

  // Manually set balance
  const setBalance = useCallback((balance: number) => {
    dispatch(setCoinBalance(balance));
  }, [dispatch]);

  // Reset to use backend balance
  const useBackendBalance = useCallback((backendBalance: number) => {
    dispatch(resetToBackend(backendBalance));
  }, [dispatch]);

  // Enable cached mode
  const useCachedBalance = useCallback(() => {
    dispatch(enableCache());
  }, [dispatch]);

  return {
    // Current balance to display
    currentBalance: coinState.cachedBalance,
    
    // State flags
    isAnimating: coinState.isAnimating,
    useCache: coinState.useCache,
    
    // Actions
    incrementCoins,
    decrementCoins,
    setBalance,
    useBackendBalance,
    useCachedBalance,
  };
};