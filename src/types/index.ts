// Shared types for the application

// User types
export interface User {
  id: string
  email: string
  username: string
  firstName?: string
  lastName?: string
  avatar?: string
  createdAt: string
  updatedAt: string
}

// Course types
export interface Course {
  id: string
  title: string
  description: string
  videoUrl: string
  thumbnailUrl?: string
  duration: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  category: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

// Progress tracking
export interface Progress {
  id: string
  userId: string
  courseId: string
  completionPercentage: number
  timeSpent: number
  lastWatchedAt: string
  bookmarks: number[]
  notes: string[]
}

// Gamification types
export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  tier: 'foundation' | 'skill' | 'habit' | 'community'
  points: number
  unlocked: boolean
  unlockedAt?: string
  requirements: {
    type: string
    target: number
    current: number
  }
}

export interface UserStats {
  totalCourses: number
  completedCourses: number
  totalTimeSpent: number
  currentStreak: number
  longestStreak: number
  totalPoints: number
  level: number
  nextLevelPoints: number
}

// API response types
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  errors?: string[]
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Form types
export interface LoginForm {
  email: string
  password: string
}

export interface RegisterForm {
  username: string
  email: string
  password: string
  confirmPassword: string
}

// State types for Redux
export interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  error: string | null
}

export interface CoursesState {
  courses: Course[]
  currentCourse: Course | null
  progress: Record<string, Progress>
  loading: boolean
  error: string | null
}

export interface UIState {
  theme: 'light' | 'dark'
  sidebar: {
    isOpen: boolean
    collapsed: boolean
  }
  notifications: Notification[]
}

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  actions?: NotificationAction[]
}

export interface NotificationAction {
  label: string
  action: () => void
}
