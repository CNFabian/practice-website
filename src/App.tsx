import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useEffect } from 'react'
import type { RootState } from './store/store'
import { setLoading, logout } from './store/slices/authSlice'

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
import OnBoardingPage from './components/protected/onboarding/OnBoardingPage'

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

import type { Location as RouterLocation } from 'react-router-dom'

function App() {
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const location = useLocation()
  const state = location.state as { background?: RouterLocation } | null

  const background: RouterLocation | undefined =
    state?.background ||
    (location.pathname === '/onboarding'
      ? ({ ...location, pathname: '/app' } as RouterLocation)
      : undefined)

  // Check if user is authenticated but has no token - force logout
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    
    // If authenticated in Redux but no token in localStorage, log out
    if (isAuthenticated && !token) {
      console.log('No authentication token found - forcing logout');
      dispatch(logout());
      navigate('/auth/login');
    }
  }, [isAuthenticated, dispatch, navigate]);

  const handleLoadingComplete = () => {
    console.log('App: Loading complete - hiding spinner')
    dispatch(setLoading(false))
  }

  console.log('App render - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated)

  return (
    <>
      {isLoading ? (
        <LoadingSpinner 
          minDisplayTime={2000}
          onMinTimeComplete={handleLoadingComplete}
          onReadyToShow={true}
        />
      ) : (
        <>
          <Routes location={background || location}>
            {/* Public Routes - Auth Layout */}
            <Route path="/splash" element={
              isAuthenticated ? <Navigate to="/app" replace /> : (
                <AuthLayout>
                  <SplashPage />
                </AuthLayout>
              )
            } />

            {/* Public Routes - Public Layout */}
            <Route path="/auth" element={
              isAuthenticated ? <Navigate to="/app" replace /> : <PublicLayout />
            }>
              <Route path="login" element={<LoginPage />} />
              <Route path="signup" element={<SignupPage />} />
            </Route>
            
            {/* Redirect old paths to new structure */}
            <Route path="/login" element={<Navigate to="/auth/login" replace />} />
            <Route path="/signup" element={<Navigate to="/auth/signup" replace />} />

            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <OnBoardingPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Routes - Main Layout */}
            <Route path="/app" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route index element={<OverviewPage />} />
              <Route path="modules" element={<ModulesPage />} />
              <Route path="materials" element={<MaterialsPage />} />
              <Route path="rewards" element={<RewardsPage />} />
              <Route path="badges" element={<BadgesPage />} />
              <Route path="help" element={<HelpPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
            </Route>

            {/* Default redirect based on auth state */}
            <Route path="/" element={
              isAuthenticated ? <Navigate to="/app" replace /> : <Navigate to="/splash" replace />
            } />
          </Routes>

          {background && (
            <Routes>
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute>
                    <OnBoardingPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          )}
        </>
      )}
    </>
  )
}

export default App