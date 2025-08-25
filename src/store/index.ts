import { configureStore } from '@reduxjs/toolkit'

// Temporary root reducer - will add slices in future commits
const rootReducer = (state = {}, action: any) => state

export const store = configureStore({
  reducer: rootReducer,
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch