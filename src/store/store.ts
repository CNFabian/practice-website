import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import authReducer from './slices/authSlice'
import moduleReducer from './slices/moduleSlice'

// Persist config for modules (to maintain progress across page navigation)
const modulesPersistConfig = {
  key: 'modules',
  storage,
  whitelist: ['lessonProgress', 'moduleProgress', 'selectedModuleId', 'selectedLessonId'] // Only persist progress data
}

// Persist config for auth (optional, but helpful for login persistence)
const authPersistConfig = {
  key: 'auth',
  storage,
  whitelist: ['user', 'isAuthenticated'] // Don't persist loading states
}

const persistedModuleReducer = persistReducer(modulesPersistConfig, moduleReducer)
const persistedAuthReducer = persistReducer(authPersistConfig, authReducer)

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    modules: persistedModuleReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch