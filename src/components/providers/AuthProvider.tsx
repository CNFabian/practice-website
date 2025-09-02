import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { onAuthStateChange } from '../../services/auth'
import { setUser, setLoading } from '../../store/slices/authSlice'

interface AuthProviderProps {
  children: React.ReactNode
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useDispatch()
  const [authResolved, setAuthResolved] = useState(false)

  useEffect(() => {
    dispatch(setLoading(true))
    
    const unsubscribe = onAuthStateChange((user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'User logged out')
      dispatch(setUser(user))
      setAuthResolved(true)
    })

    return () => unsubscribe()
  }, [dispatch])

  const handleLoadingComplete = () => {
    // Called when the loading spinner completes its animation
    dispatch(setLoading(false))
  }

  // Pass auth resolution status to loading spinner
  const isReadyToShow = authResolved

  return (
    <>
      {children}
      {/* You can access isReadyToShow and handleLoadingComplete in your App component */}
    </>
  )
}

export default AuthProvider