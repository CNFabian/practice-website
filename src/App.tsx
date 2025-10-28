import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useEffect, useState } from 'react'
import type { RootState } from './store/store'
import { setLoading, logout, setUser } from './store/slices/authSlice'
import { getCurrentUser, checkAuthStatus, clearAuthData, isAuthenticated } from './services/authAPI'

// Layouts
import AuthLayout from './layouts/AuthLayout'
import PublicLayout from './layouts/PublicLayout'
import MainLayout from './layouts/MainLayout'
import ProtectedRoute from './components/common/ProtectedRoute'
import LoadingSpinner from './components/common/LoadingSpinner'

// Public Pages
import SplashPage from './pages/public/SplashPage'
import LoginPage from './pages/public/LoginPage'
import SignupPage from './pages/public/SignupPage'

// Protected Pages
import {
  OverviewPage,
  ModulesPage,
  MaterialsPage,
  RewardsPage,
  HelpPage,
  SettingsPage,
  NotificationsPage
} from './pages'
import { BadgesPage } from './pages/protected/badges'

function App() {
  const { isAuthenticated: reduxIsAuthenticated, isLoading } = useSelector((state: RootState) => state.auth)
  const dispatch = useDispatch()
  const [isMinLoadingComplete, setIsMinLoadingComplete] = useState(false)
  const [authInitialized, setAuthInitialized] = useState(false)

  // Initialize auth state on app load
  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('App: Starting authentication initialization...')
        dispatch(setLoading(true))
        
        // Check if we have tokens in localStorage
        if (!isAuthenticated()) {
          console.log('App: No authentication tokens found')
          dispatch(logout())
          setAuthInitialized(true)
          return
        }

        console.log('App: Tokens found, validating with backend...')
        
        // Validate tokens with backend
        const isAuth = await checkAuthStatus()
        
        if (isAuth) {
          console.log('App: Authentication valid, fetching user data...')
          
          // Fetch current user data
          const userData = await getCurrentUser()
          dispatch(setUser(userData))
          console.log('App: User data loaded successfully')
        } else {
          console.log('App: Authentication invalid, clearing data...')
          dispatch(logout())
        }
      } catch (error) {
        console.error('App: Auth initialization error:', error)
        
        // Clear any potentially corrupted auth data
        clearAuthData()
        dispatch(logout())
        
        // Don't redirect here - let the route handling take care of it
        console.log('App: Auth data cleared due to initialization error')
      } finally {
        setAuthInitialized(true)
        dispatch(setLoading(false))
        console.log('App: Authentication initialization complete')
      }
    }

    initAuth()
  }, [dispatch])

  const handleLoadingComplete = () => {
    setIsMinLoadingComplete(true)
  }

  // Show loading spinner while initializing auth or during the minimum loading time
  if (!authInitialized || (isLoading && !isMinLoadingComplete)) {
    return (
      <LoadingSpinner 
        minDisplayTime={2000}
        onMinTimeComplete={handleLoadingComplete}
        onReadyToShow={authInitialized}
      />
    )
  }

  return (
    <Routes>
      {/* Public Routes - Auth Layout */}
      <Route path="/splash" element={
        reduxIsAuthenticated ? <Navigate to="/app" replace /> : (
          <AuthLayout>
            <SplashPage />
          </AuthLayout>
        )
      } />

      {/* Public Routes - Public Layout */}
      <Route path="/auth/*" element={
        reduxIsAuthenticated ? <Navigate to="/app" replace /> : <PublicLayout />
      }>
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignupPage />} />
        <Route path="*" element={<Navigate to="/auth/login" replace />} />
      </Route>

      {/* Protected Routes - Main Layout */}
      <Route
        path="/app/*"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<OverviewPage />} />
        <Route path="modules" element={<ModulesPage />} />
        <Route path="materials" element={<MaterialsPage />} />
        <Route path="rewards" element={<RewardsPage />} />
        <Route path="badges" element={<BadgesPage />} />
        <Route path="help" element={<HelpPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      {/* Root redirect */}
      <Route 
        path="/" 
        element={
          reduxIsAuthenticated ? <Navigate to="/app" replace /> : <Navigate to="/splash" replace />
        } 
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App