import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import authReducer from './slices/authSlice'
import moduleReducer from './slices/moduleSlice'
import uiReducer from './slices/uiSlice'

const modulesPersistConfig = {
  key: 'modules',
  storage,
  whitelist: [
    'lessonProgress', 
    'moduleProgress', 
    'selectedModuleId', 
    'selectedLessonId',
    'sidebarCollapsed',
    'showCompactLayout',
    'totalCoins'
  ]
}

const authPersistConfig = {
  key: 'auth',
  storage,
  whitelist: ['user', 'isAuthenticated']
}

const persistedModuleReducer = persistReducer(modulesPersistConfig, moduleReducer)
const persistedAuthReducer = persistReducer(authPersistConfig, authReducer)

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    modules: persistedModuleReducer,
    ui: uiReducer,
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