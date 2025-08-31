import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { onAuthStateChange } from '../../services/auth'
import { setUser, setLoading } from '../../store/slices/authSlice'
import LoadingSpinner from '../index'

interface AuthProviderProps {
  children: React.ReactNode
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(setLoading(true))
    
    const unsubscribe = onAuthStateChange((user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'User logged out')
      dispatch(setUser(user))
    })

    return () => unsubscribe()
  }, [dispatch])

  return <>{children}</>
}

export default AuthProvider