import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useEffect, useState, useRef, useCallback } from 'react'
import type { RootState } from './store/store'
import { setLoading, logout, setUser } from './store/slices/authSlice'
import { getCurrentUser, checkAuthStatus, clearAuthData, isAuthenticated } from './services/authAPI'
import { checkOnboardingStatus } from './services/learningAPI'
import PublicLayout from './layouts/PublicLayout'
import MainLayout from './layouts/MainLayout'
import ProtectedRoute from './components/common/ProtectedRoute'
import AdminRoute from './components/common/AdminRoute'
import LoadingSpinner from './components/common/LoadingSpinner'
import LoginPage from './pages/public/LoginPage'
import SignupPage from './pages/public/SignupPage'
import OnboardingPage from './components/protected/onboarding/OnBoardingPage'
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
import AdminDashboardPage from './pages/protected/admin/AdminDashboardPage'

function App() {
  const { isAuthenticated: reduxIsAuthenticated, isLoading } = useSelector((state: RootState) => state.auth)
  const dispatch = useDispatch()
  const [isMinLoadingComplete, setIsMinLoadingComplete] = useState(false)
  const [authInitialized, setAuthInitialized] = useState(false)
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null)
  const initializationAttempted = useRef(false)

  useEffect(() => {
    if (initializationAttempted.current) {
      return
    }
    initializationAttempted.current = true

    const initAuth = async () => {
      try {
        dispatch(setLoading(true))
        if (!isAuthenticated()) {
          dispatch(logout())
          setAuthInitialized(true)
          return
        }

        const isAuth = await checkAuthStatus()
        if (isAuth) {
          const userData = await getCurrentUser()
          dispatch(setUser(userData))
        } else {
          dispatch(logout())
        }
      } catch (error) {
        console.error('App: Auth initialization error:', error)
        clearAuthData()
        dispatch(logout())
      } finally {
        setAuthInitialized(true)
        dispatch(setLoading(false))
      }
    }
    initAuth()
  }, [dispatch])

  // ═══════════════════════════════════════════════════════════
  // Reusable onboarding status check
  // ═══════════════════════════════════════════════════════════
  const recheckOnboarding = useCallback(async () => {
    if (!reduxIsAuthenticated || !authInitialized) return

    try {
      const isComplete = await checkOnboardingStatus()
      console.log('🔍 Onboarding status check:', isComplete ? 'Complete' : 'Incomplete')
      setNeedsOnboarding(!isComplete)
    } catch (error) {
      console.error('Error checking onboarding:', error)
      setNeedsOnboarding(true)
    }
  }, [reduxIsAuthenticated, authInitialized])

  // Initial onboarding check on auth ready
  useEffect(() => {
    recheckOnboarding()
  }, [recheckOnboarding])

  // ═══════════════════════════════════════════════════════════
  // Listen for onboarding completion event from OnBoardingPage.
  // This breaks the loop: when OnBoardingPage finishes, it
  // dispatches 'onboarding-completed' BEFORE navigating to /app.
  // App.tsx catches it here and sets needsOnboarding = false so
  // the /app route guard lets the user through immediately.
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    const handleOnboardingCompleted = () => {
      console.log('✅ App: Received onboarding-completed event, updating state')
      setNeedsOnboarding(false)
    }
    window.addEventListener('onboarding-completed', handleOnboardingCompleted)
    return () => {
      window.removeEventListener('onboarding-completed', handleOnboardingCompleted)
    }
  }, [])

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
      <Route
        path="/auth/*"
        element={
          reduxIsAuthenticated ? <Navigate to="/app" replace /> : <PublicLayout />
        }>
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignupPage />} />
        <Route path="*" element={<Navigate to="/auth/login" replace />} />
      </Route>

      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/app/*"
        element={
          reduxIsAuthenticated ? (
            needsOnboarding === true ? (
              <Navigate to="/onboarding" replace />
            ) : needsOnboarding === false ? (
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            ) : (
              <LoadingSpinner minDisplayTime={500} />
            )
          ) : (
            <Navigate to="/splash" replace />
          )
        }
      >
        <Route index element={<ModulesPage />} />
        <Route path="overview" element={<OverviewPage />} />
        <Route path="materials" element={<MaterialsPage />} />
        <Route path="rewards" element={<RewardsPage />} />
        <Route path="badges" element={<BadgesPage />} />
        <Route path="help" element={<HelpPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route
          path="admin/*"
          element={
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          }
        />
      </Route>

      <Route
        path="/"
        element={
          reduxIsAuthenticated ? (needsOnboarding === true ? <Navigate to="/onboarding" replace /> : needsOnboarding === false ? <Navigate to="/app" replace /> : <LoadingSpinner minDisplayTime={500} />) : <Navigate to="/auth/login" replace />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App