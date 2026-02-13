import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useEffect, useState, useRef } from 'react'
import type { RootState } from './store/store'
import { setLoading, logout, setUser } from './store/slices/authSlice'
import { getCurrentUser, clearAuthData, isAuthenticated } from './services/authAPI'
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
import MobileGate from './components/common/MobileGate'

// ═══════════════════════════════════════════════════════════
// Cache helpers — persist auth state so refreshes are instant
// ═══════════════════════════════════════════════════════════
const CACHE_KEY_USER = 'cached_user_data'
const CACHE_KEY_ONBOARDING = 'cached_onboarding_complete'

const getCachedAuth = () => {
  try {
    const userJson = localStorage.getItem(CACHE_KEY_USER)
    const onboardingStr = localStorage.getItem(CACHE_KEY_ONBOARDING)
    if (userJson && onboardingStr !== null) {
      return {
        user: JSON.parse(userJson),
        onboardingComplete: onboardingStr === 'true'
      }
    }
  } catch {
    // Corrupted cache — ignore
  }
  return null
}

const setCachedAuth = (user: any, onboardingComplete: boolean) => {
  try {
    localStorage.setItem(CACHE_KEY_USER, JSON.stringify(user))
    localStorage.setItem(CACHE_KEY_ONBOARDING, String(onboardingComplete))
  } catch {
    // localStorage full or unavailable — non-critical
  }
}

const clearCachedAuth = () => {
  localStorage.removeItem(CACHE_KEY_USER)
  localStorage.removeItem(CACHE_KEY_ONBOARDING)
}

function App() {
  const { isAuthenticated: reduxIsAuthenticated } = useSelector((state: RootState) => state.auth)
  const dispatch = useDispatch()
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

        // No token? Not authenticated — skip everything
        if (!isAuthenticated()) {
          clearCachedAuth()
          dispatch(logout())
          setAuthInitialized(true)
          return
        }

        // ─── Optimistic: restore from cache instantly ───
        const cached = getCachedAuth()
        if (cached) {
          console.log('⚡ App: Restoring from cache — instant render')
          dispatch(setUser(cached.user))
          setNeedsOnboarding(!cached.onboardingComplete)
          setAuthInitialized(true)
          dispatch(setLoading(false))

          // ─── Background verify: silently re-validate ───
          Promise.all([
            getCurrentUser().catch(() => null),
            checkOnboardingStatus().catch(() => null)
          ]).then(([freshUser, freshOnboarding]) => {
            if (freshUser) {
              // Update Redux + cache with fresh data
              dispatch(setUser(freshUser))
              const onboardingComplete = freshOnboarding === true
              setNeedsOnboarding(!onboardingComplete)
              setCachedAuth(freshUser, onboardingComplete)
            } else {
              // Token expired or invalid — force logout
              console.warn('⚠️ App: Background verify failed — logging out')
              clearCachedAuth()
              clearAuthData()
              dispatch(logout())
            }
          })

          return // Already rendered — don't hit the finally block again
        }

        // ─── No cache: first login — must wait for network ───
        console.log('🔄 App: No cache — fetching from network')
        const [userData, onboardingComplete] = await Promise.all([
          getCurrentUser().catch((err) => {
            console.error('App: getCurrentUser failed:', err)
            return null
          }),
          checkOnboardingStatus().catch((err) => {
            console.error('App: checkOnboardingStatus failed:', err)
            return false
          })
        ])

        if (userData) {
          dispatch(setUser(userData))
          const isComplete = onboardingComplete === true
          console.log('🔍 Onboarding status check:', isComplete ? 'Complete' : 'Incomplete')
          setNeedsOnboarding(!isComplete)
          // Cache for next refresh
          setCachedAuth(userData, isComplete)
        } else {
          clearCachedAuth()
          clearAuthData()
          dispatch(logout())
        }
      } catch (error) {
        console.error('App: Auth initialization error:', error)
        clearCachedAuth()
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
      // Update cache so next refresh knows onboarding is done
      try {
        const userJson = localStorage.getItem(CACHE_KEY_USER)
        if (userJson) {
          setCachedAuth(JSON.parse(userJson), true)
        }
      } catch {
        // non-critical
      }
    }

    window.addEventListener('onboarding-completed', handleOnboardingCompleted)
    return () => {
      window.removeEventListener('onboarding-completed', handleOnboardingCompleted)
    }
  }, [])

  if (!authInitialized) {
    return <LoadingSpinner />
  }

  return (
    <MobileGate>
      <Routes>
        <Route path="/auth/*" element={
          reduxIsAuthenticated ? <Navigate to="/app" replace /> : <PublicLayout />
        }>
          <Route path="login" element={<LoginPage />} />
          <Route path="signup" element={<SignupPage />} />
          <Route path="*" element={<Navigate to="/auth/login" replace />} />
        </Route>

        <Route path="/onboarding" element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        } />

        <Route path="/app/*" element={
          reduxIsAuthenticated ? (
            needsOnboarding === true ? (
              <Navigate to="/onboarding" replace />
            ) : needsOnboarding === false ? (
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            ) : (
              <LoadingSpinner />
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
          <Route path="admin/*" element={
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          } />
        </Route>

        <Route path="/" element={
          reduxIsAuthenticated
            ? (needsOnboarding === true ? <Navigate to="/onboarding" replace /> : needsOnboarding === false ? <Navigate to="/app" replace /> : <LoadingSpinner />)
            : <Navigate to="/auth/login" replace />
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MobileGate>
  )
}

export default App