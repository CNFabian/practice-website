// src/utils/authUtils.ts
import type { SerializableUser } from '../store/slices/authSlice'

// Backend API user response interface (from your API documentation)
export interface BackendUserResponse {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string | null
  date_of_birth: string | null
  profile_picture_url: string | null
  is_active: boolean
  is_verified: boolean
  last_login_at: string | null
  created_at: string
}

// Convert backend user response to Redux user format
export const mapBackendUserToReduxUser = (backendUser: BackendUserResponse): SerializableUser => {
  return {
    // Core authentication fields
    uid: backendUser.id,
    email: backendUser.email,
    emailVerified: backendUser.is_verified,
    
    // Profile information
    displayName: `${backendUser.first_name} ${backendUser.last_name}`.trim(),
    firstName: backendUser.first_name,
    lastName: backendUser.last_name,
    phone: backendUser.phone,
    dateOfBirth: backendUser.date_of_birth,
    photoURL: backendUser.profile_picture_url,
    
    // Account status
    isActive: backendUser.is_active,
    
    // Timestamps
    lastLoginAt: backendUser.last_login_at,
    createdAt: backendUser.created_at
  }
}

// Convert Redux user format to backend update payload
export const mapReduxUserToBackendUpdate = (reduxUser: Partial<SerializableUser>) => {
  const updatePayload: Partial<{
    first_name: string | null  // FIXED: Allow null values
    last_name: string | null   // FIXED: Allow null values
    phone: string | null       // FIXED: Allow null values
    date_of_birth: string | null  // FIXED: Allow null values
    profile_picture_url: string | null  // FIXED: Allow null values
  }> = {}

  if (reduxUser.firstName !== undefined) updatePayload.first_name = reduxUser.firstName
  if (reduxUser.lastName !== undefined) updatePayload.last_name = reduxUser.lastName
  if (reduxUser.phone !== undefined) updatePayload.phone = reduxUser.phone
  if (reduxUser.dateOfBirth !== undefined) updatePayload.date_of_birth = reduxUser.dateOfBirth
  if (reduxUser.photoURL !== undefined) updatePayload.profile_picture_url = reduxUser.photoURL

  return updatePayload
}

// Validation helpers
export const validateUserProfile = (user: Partial<SerializableUser>): string[] => {
  const errors: string[] = []

  if (user.firstName && user.firstName.length < 2) {
    errors.push('First name must be at least 2 characters')
  }
  
  if (user.lastName && user.lastName.length < 2) {
    errors.push('Last name must be at least 2 characters')
  }
  
  if (user.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
    errors.push('Please enter a valid email address')
  }
  
  if (user.phone && user.phone.length > 0 && !/^[\+]?[1-9][\d]{0,15}$/.test(user.phone.replace(/[\s\-\(\)]/g, ''))) {
    errors.push('Please enter a valid phone number')
  }

  return errors
}

// Format helpers for display
export const formatUserDisplayInfo = (user: SerializableUser | null) => {
  if (!user) return {
    displayName: 'Guest',
    initials: 'G',
    handle: '@guest'
  }

  const displayName = user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email?.split('@')[0] || 'User'
  
  let initials = 'U'
  if (user.firstName && user.lastName) {
    initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
  } else if (user.firstName) {
    initials = user.firstName[0].toUpperCase()
  } else if (user.email) {
    initials = user.email[0].toUpperCase()
  }

  const handle = `@${displayName.toLowerCase().replace(/\s+/g, '')}`

  return {
    displayName,
    initials,
    handle
  }
}

// Date formatting helper
export const formatUserDates = (user: SerializableUser | null) => {
  if (!user) return {}

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return dateString
    }
  }

  return {
    lastLoginFormatted: formatDate(user.lastLoginAt),
    createdAtFormatted: formatDate(user.createdAt),
    dateOfBirthFormatted: formatDate(user.dateOfBirth)
  }
}

export default {
  mapBackendUserToReduxUser,
  mapReduxUserToBackendUpdate,
  validateUserProfile,
  formatUserDisplayInfo,
  formatUserDates
}