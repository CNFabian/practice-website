import { store } from '../store/store';

/**
 * Utility function to check if mock data should be used
 * This reads directly from the Redux store
 */
export const shouldUseMockData = (): boolean => {
  const state = store.getState();
  return state.settings?.useMockData ?? false;
};