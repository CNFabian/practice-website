import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// UPDATED: Enhanced user interface that matches backend API response
export interface SerializableUser {
  // Core authentication fields
  uid: string
  email: string | null
  emailVerified: boolean
  
  // Profile information
  displayName: string | null
  firstName: string | null     // NEW: from backend first_name
  lastName: string | null      // NEW: from backend last_name
  phone: string | null         // NEW: from backend phone
  dateOfBirth: string | null   // NEW: from backend date_of_birth
  photoURL: string | null      // Maps to profile_picture_url
  
  // Account status
  isActive: boolean            // NEW: from backend is_active
  
  // Timestamps
  lastLoginAt: string | null   // NEW: from backend last_login_at
  createdAt: string | null     // NEW: from backend created_at
}

interface AuthState {
  user: SerializableUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<SerializableUser | null>) => {
      state.user = action.payload
      state.isAuthenticated = !!action.payload
      state.error = null
    },
    // NEW: Update specific user fields without full replacement
    updateUserProfile: (state, action: PayloadAction<Partial<SerializableUser>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
      state.isLoading = false
    },
    clearError: (state) => {
      state.error = null
    },
    logout: (state) => {
      state.user = null
      state.isAuthenticated = false
      state.isLoading = false
      state.error = null
    }
  }
})

export const { 
  setUser, 
  updateUserProfile,  // NEW: Export the new action
  setLoading, 
  setError, 
  clearError, 
  logout 
} = authSlice.actions

export default authSlice.reducer

// UTILITY SELECTORS: Helper functions to get common user data
export const selectUserDisplayName = (user: SerializableUser | null): string => {
  if (!user) return 'Guest'
  
  // Try display name first, then first + last name, then email
  if (user.displayName) return user.displayName
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`
  if (user.firstName) return user.firstName
  if (user.email) return user.email.split('@')[0]
  return 'User'
}

export const selectUserInitials = (user: SerializableUser | null): string => {
  if (!user) return 'G'
  
  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
  }
  if (user.firstName) {
    return user.firstName[0].toUpperCase()
  }
  if (user.displayName) {
    const names = user.displayName.split(' ')
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase()
    }
    return names[0][0].toUpperCase()
  }
  if (user.email) {
    return user.email[0].toUpperCase()
  }
  return 'U'
}

export const selectIsProfileComplete = (user: SerializableUser | null): boolean => {
  if (!user) return false
  
  // Define what constitutes a complete profile
  return !!(
    user.firstName &&
    user.lastName &&
    user.email &&
    user.emailVerified
  )
}