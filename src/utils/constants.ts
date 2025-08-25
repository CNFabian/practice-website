// App-wide constants
export const APP_NAME = 'Nest Navigate'
export const APP_VERSION = '1.0.0'

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me'
  },
  COURSES: {
    LIST: '/courses',
    DETAIL: '/courses',
    PROGRESS: '/progress'
  }
} as const

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  THEME: 'theme_preference'
} as const

// Gamification tiers
export const ACHIEVEMENT_TIERS = {
  FOUNDATION: 'foundation',
  SKILL: 'skill', 
  HABIT: 'habit',
  COMMUNITY: 'community'
} as const
