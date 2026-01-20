import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import authReducer from './slices/authSlice'
import moduleReducer from './slices/moduleSlice'
import quizReducer from './slices/quizSlice'
import uiReducer from './slices/uiSlice'
import coinReducer from './slices/coinSlice'

const modulesPersistConfig = {
  key: 'modules',
  storage,
  whitelist: [
    'selectedModuleId',
    'selectedLessonId'
  ]
}

const authPersistConfig = {
  key: 'auth',
  storage,
  whitelist: ['user', 'isAuthenticated']
}

const coinPersistConfig = {
  key: 'coins',
  storage,
  whitelist: ['cachedBalance']
}

const quizPersistConfig = {
  key: 'quiz',
  storage,
  whitelist: [] // Don't persist quiz state, should restart fresh each time
}

const persistedModuleReducer = persistReducer(modulesPersistConfig, moduleReducer)
const persistedAuthReducer = persistReducer(authPersistConfig, authReducer)
const persistedCoinReducer = persistReducer(coinPersistConfig, coinReducer)
const persistedQuizReducer = persistReducer(quizPersistConfig, quizReducer)

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    modules: persistedModuleReducer,
    quiz: persistedQuizReducer,
    ui: uiReducer,
    coins: persistedCoinReducer,
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