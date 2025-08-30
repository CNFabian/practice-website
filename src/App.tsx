import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from './store/store'

// Layouts
import AuthLayout from './layouts/AuthLayout'
import PublicLayout from './layouts/PublicLayout'
import MainLayout from './layouts/MainLayout'
import ProtectedRoute from './components/common/ProtectedRoute'

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

import { setUser } from './store/slices/authSlice'
import { onAuthStateChange } from './services/auth'

function App() {
  const dispatch = useDispatch()
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      dispatch(setUser(user))
    })

    return () => unsubscribe()
  }, [dispatch])

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <Routes>
      {/* Public Routes - Auth Layout (no header) */}
      <Route path="/splash" element={
        <AuthLayout>
          <SplashPage />
        </AuthLayout>
      } />

      {/* Public Routes - Public Layout (with header) */}
      <Route path="/auth" element={<PublicLayout />}>
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

      {/* Default redirect */}
      <Route path="/" element={
        isAuthenticated ? <Navigate to="/app" replace /> : <Navigate to="/splash" replace />
      } />
    </Routes>
  )
}

export default App