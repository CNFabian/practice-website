import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile
} from 'firebase/auth'
import { auth } from './firebase'

export interface AuthCredentials {
  email: string
  password: string
}

export interface SignupCredentials extends AuthCredentials {
  confirmPassword: string
  firstName?: string
  lastName?: string
}

// Login with email and password
export const loginWithEmail = async ({ email, password }: AuthCredentials) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return { user: userCredential.user, error: null }
  } catch (error: any) {
    console.error('Login error:', error)
    
    // Return user-friendly error messages
    let errorMessage = 'An error occurred during login'
    
    switch (error.code) {
      case 'auth/invalid-credential':
        errorMessage = 'Invalid email or password.'
        break
      default:
        errorMessage = error.message || 'Login failed'
    }
    
    return { user: null, error: errorMessage }
  }
}

// Sign up with email and password
export const signupWithEmail = async ({ email, password, confirmPassword, firstName, lastName }: SignupCredentials) => {
  if (password !== confirmPassword) {
    return { user: null, error: 'Passwords do not match' }
  }

  if (password.length < 6) {
    return { user: null, error: 'Password must be at least 6 characters long' }
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    
    // Update user profile with display name if first name is provided
    if (firstName) {
      const displayName = lastName ? `${firstName} ${lastName}` : firstName
      await updateProfile(userCredential.user, {
        displayName: displayName
      })
    }
    
    return { user: userCredential.user, error: null }
  } catch (error: any) {
    console.error('Signup error:', error)
    
    // Return user-friendly error messages
    let errorMessage = 'An error occurred during signup'
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'An account with this email already exists'
        break
      case 'auth/invalid-email':
        errorMessage = 'Invalid email address'
        break
      default:
        errorMessage = error.message || 'Signup failed'
    }
    
    return { user: null, error: errorMessage }
  }
}

// Logout
export const logoutUser = async () => {
  try {
    await signOut(auth)
    return { error: null }
  } catch (error: any) {
    console.error('Logout error:', error)
    return { error: error.message || 'Logout failed' }
  }
}

// Auth state listener
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback)
}

// Get current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser
}

// Update user profile
export const updateUserProfile = async (updates: { displayName?: string; photoURL?: string }) => {
  if (!auth.currentUser) {
    return { error: 'No user logged in' }
  }
  
  try {
    await updateProfile(auth.currentUser, updates)
    return { error: null }
  } catch (error: any) {
    console.error('Profile update error:', error)
    return { error: error.message || 'Failed to update profile' }
  }
}