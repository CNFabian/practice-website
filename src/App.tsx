import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useState, useEffect } from 'react'
import type { RootState } from './store/store'
import { setLoading } from './store/slices/authSlice'

// Layouts
import AuthLayout from './layouts/AuthLayout'
import PublicLayout from './layouts/PublicLayout'
import MainLayout from './layouts/MainLayout'
import ProtectedRoute from './components/common/ProtectedRoute'
import AuthProvider from './components/providers/AuthProvider'
import LoadingSpinner from './components/common/LoadingSpinner'

// Public Pages
import SplashPage from './pages/public/SplashPage'
import LoginPage from './pages/public/LoginPage'
import SignupPage from './pages/public/SignupPage'

// Protected Pages
import {
  OverviewPage,
  ModulesPage,
  SavedPage,
  RewardsPage,
  BadgesPage,
  HelpPage,
  SettingsPage
} from './pages'

function App() {
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth)
  const dispatch = useDispatch()
  const [authResolved, setAuthResolved] = useState(false)

  // Monitor auth state changes to determine when content is ready
  useEffect(() => {
    // This effect runs when authentication state changes
    if (isAuthenticated !== null) { // null means still checking, true/false means resolved
      setAuthResolved(true)
    }
  }, [isAuthenticated])

  const handleLoadingComplete = () => {
    // Called when the bird progress bar completes and minimum time is reached
    dispatch(setLoading(false))
  }

  return (
    <AuthProvider>
      {isLoading ? (
        <LoadingSpinner 
          minDisplayTime={2000} // 2 seconds minimum display time
          onMinTimeComplete={handleLoadingComplete}
          onReadyToShow={authResolved} // Pass whether auth state has been determined
        />
      ) : (
        <Routes>
          {/* Public Routes - Auth Layout (no header/footer) */}
          <Route path="/splash" element={
            isAuthenticated ? <Navigate to="/app" replace /> : (
              <AuthLayout>
                <SplashPage />
              </AuthLayout>
            )
          } />

          {/* Public Routes - Public Layout (with header/footer) */}
          <Route path="/auth" element={
            isAuthenticated ? <Navigate to="/app" replace /> : <PublicLayout />
          }>
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<SignupPage />} />
          </Route>
          
          {/* Redirect old paths to new structure */}
          <Route path="/login" element={<Navigate to="/auth/login" replace />} />
          <Route path="/signup" element={<Navigate to="/auth/signup" replace />} />

          {/* Protected Routes - Main Layout */}
          <Route path="/app" element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route index element={<OverviewPage />} />
            <Route path="modules" element={<ModulesPage />} />
            <Route path="saved" element={<SavedPage />} />
            <Route path="rewards" element={<RewardsPage />} />
            <Route path="badges" element={<BadgesPage />} />
            <Route path="help" element={<HelpPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Default redirect based on auth state */}
          <Route path="/" element={
            isAuthenticated ? <Navigate to="/app" replace /> : <Navigate to="/splash" replace />
          } />
        </Routes>
      )}
    </AuthProvider>
  )
}

export default App