import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import authReducer from './slices/authSlice'
import moduleReducer from './slices/moduleSlice'
import uiReducer from './slices/uiSlice'
import settingsReducer from './slices/settingsSlice'

const modulesPersistConfig = {
  key: 'modules',
  storage,
  whitelist: [
    'selectedModuleId',
    'selectedLessonId',
    'sidebarCollapsed',
    'showCompactLayout'
  ]
}

const authPersistConfig = {
  key: 'auth',
  storage,
  whitelist: ['user', 'isAuthenticated']
}

const settingsPersistConfig = {
  key: 'settings',
  storage,
  whitelist: ['useMockData']
}

const persistedModuleReducer = persistReducer(modulesPersistConfig, moduleReducer)
const persistedAuthReducer = persistReducer(authPersistConfig, authReducer)
const persistedSettingsReducer = persistReducer(settingsPersistConfig, settingsReducer)

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    modules: persistedModuleReducer,
    ui: uiReducer,
    settings: persistedSettingsReducer,
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