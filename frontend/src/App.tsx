import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useEffect, useState, useRef } from 'react'
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
  
  // Add initialization guard to prevent multiple runs
  const initializationAttempted = useRef(false)

  // Initialize auth state on app load
  useEffect(() => {
    // Prevent multiple initialization attempts (especially in StrictMode)
    if (initializationAttempted.current) {
      return
    }
    initializationAttempted.current = true

    const initAuth = async () => {
      try {
        dispatch(setLoading(true))
        
        // Check if we have tokens in localStorage
        if (!isAuthenticated()) {
          dispatch(logout())
          setAuthInitialized(true)
          return
        }
        
        // Validate tokens with backend
        const isAuth = await checkAuthStatus()
        
        if (isAuth) {
          // Fetch current user data
          const userData = await getCurrentUser()
          dispatch(setUser(userData))
        } else {
          dispatch(logout())
        }
      } catch (error) {
        console.error('App: Auth initialization error:', error)
        
        // Clear any potentially corrupted auth data
        clearAuthData()
        dispatch(logout())
      } finally {
        setAuthInitialized(true)
        dispatch(setLoading(false))
      }
    }

    initAuth()
  }, [dispatch])

  const handleLoadingComplete = () => {
    setIsMinLoadingComplete(true)
  }

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