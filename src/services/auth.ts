import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth'
import { auth } from './firebase'

export interface AuthCredentials {
  email: string
  password: string
}

export interface SignupCredentials extends AuthCredentials {
  confirmPassword: string
}

// Login with email and password
export const loginWithEmail = async ({ email, password }: AuthCredentials) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return { user: userCredential.user, error: null }
  } catch (error: any) {
    return { user: null, error: error.message }
  }
}

// Sign up with email and password
export const signupWithEmail = async ({ email, password, confirmPassword }: SignupCredentials) => {
  if (password !== confirmPassword) {
    return { user: null, error: 'Passwords do not match' }
  }

  if (password.length < 6) {
    return { user: null, error: 'Password must be at least 6 characters long' }
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    return { user: userCredential.user, error: null }
  } catch (error: any) {
    return { user: null, error: error.message }
  }
}

// Logout
export const logoutUser = async () => {
  try {
    await signOut(auth)
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

// Auth state listener
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback)
}