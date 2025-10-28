import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useEffect, useState } from 'react'
import type { RootState } from './store/store'
import { setLoading, logout, setUser } from './store/slices/authSlice'
import { getCurrentUser, isAuthenticated as checkAuthStatus } from './services/authAPI'

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
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth)
  const dispatch = useDispatch()
  const [isMinLoadingComplete, setIsMinLoadingComplete] = useState(false)

  // Initialize auth state on app load
  useEffect(() => {
    const initAuth = async () => {
      try {
        dispatch(setLoading(true))
        
        // Check if user is authenticated
        const isAuth = await checkAuthStatus()
        
        if (isAuth) {
          // Fetch current user data
          const userData = await getCurrentUser()
          dispatch(setUser(userData))
        } else {
          dispatch(logout())
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        dispatch(logout())
      } finally {
        dispatch(setLoading(false))
      }
    }

    initAuth()
  }, [dispatch])

  const handleLoadingComplete = () => {
    setIsMinLoadingComplete(true)
  }

  return (
    <>
      {isLoading && !isMinLoadingComplete ? (
        <LoadingSpinner 
          minDisplayTime={2000}
          onMinTimeComplete={handleLoadingComplete}
          onReadyToShow={true}
        />
      ) : (
        <Routes>
          {/* Public Routes - Auth Layout */}
          <Route path="/splash" element={
            isAuthenticated ? <Navigate to="/app" replace /> : (
              <AuthLayout>
                <SplashPage />
              </AuthLayout>
            )
          } />

          {/* Public Routes - Public Layout */}
          <Route path="/auth/*" element={
            isAuthenticated ? <Navigate to="/app" replace /> : <PublicLayout />
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
              isAuthenticated ? <Navigate to="/app" replace /> : <Navigate to="/splash" replace />
            } 
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </>
  )
}

export default App