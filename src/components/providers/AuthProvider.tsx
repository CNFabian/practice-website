import React, { useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { onAuthStateChange } from '../../services/auth'
import { setUser, setLoading } from '../../store/slices/authSlice'
import type { User } from 'firebase/auth'

interface AuthProviderProps {
  children: React.ReactNode
}

// Serializable user interface - only store what we need
interface SerializableUser {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  emailVerified: boolean
}

// Helper function to convert Firebase User to serializable format
const serializeUser = (user: User | null): SerializableUser | null => {
  if (!user) return null
  
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified
  }
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useDispatch()
  const previousUserRef = useRef<SerializableUser | null | undefined>(undefined)

  useEffect(() => {
    console.log('AuthProvider: Setting up auth state listener')
    
    const unsubscribe = onAuthStateChange((user) => {
      console.log('AuthProvider: Raw Firebase auth state changed:', user ? 'User logged in' : 'User logged out')
      
      // Serialize the user before dispatching to Redux
      const serializedUser = serializeUser(user)
      console.log('AuthProvider: Serialized user:', serializedUser)
      
      // Check if this is a login transition (from null/undefined to user)
      const wasLoggedOut = previousUserRef.current === null || previousUserRef.current === undefined
      const isNowLoggedIn = serializedUser !== null
      
      if (wasLoggedOut && isNowLoggedIn) {
        console.log('AuthProvider: Login transition detected - triggering loading spinner')
        dispatch(setLoading(true))
      }
      
      // Update the user state
      dispatch(setUser(serializedUser))
      
      // Store current user for next comparison
      previousUserRef.current = serializedUser
    })

    // Cleanup function to unsubscribe from auth state changes
    return () => {
      console.log('AuthProvider: Cleaning up auth listener')
      unsubscribe()
    }
  }, [dispatch])

  return <>{children}</>
}

export default AuthProvider