import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useEffect } from 'react'
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

  const location = useLocation()
  const state = location.state as { background?: RouterLocation } | null

  const background: RouterLocation | undefined =
    state?.background ||
    (location.pathname === '/onboarding'
      ? ({ ...location, pathname: '/app' } as RouterLocation)
      : undefined)

  // AUTHENTICATION INITIALIZATION
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('App: Starting authentication initialization...');
      
      try {
        // Check if user has valid tokens
        if (checkAuthStatus()) {
          console.log('App: Found valid tokens, fetching user profile...');
          
          try {
            // Get current user profile from backend (already mapped by authAPI)
            const userProfile = await getCurrentUser();
            console.log('App: Successfully fetched user profile:', userProfile);
            
            // FIXED: userProfile is already in Redux format from authAPI utility
            dispatch(setUser(userProfile));
            
            console.log('App: User authenticated and profile loaded');
            
          } catch (profileError) {
            console.error('App: Failed to fetch user profile:', profileError);
            
            // If profile fetch fails, tokens might be invalid
            console.log('App: Clearing invalid authentication data');
            dispatch(logout());
          }
          
        } else {
          console.log('App: No valid tokens found, user not authenticated');
          
          // Ensure Redux state reflects unauthenticated status
          if (isAuthenticated) {
            console.log('App: Clearing stale Redux auth state');
            dispatch(logout());
          }
        }
        
      } catch (error) {
        console.error('App: Authentication initialization error:', error);
        dispatch(logout());
        
      } finally {
        // Authentication check complete, hide loading spinner
        console.log('App: Authentication initialization complete');
        dispatch(setLoading(false));
      }
    };

    // Only run auth initialization if we're still loading
    if (isLoading) {
      initializeAuth();
    }
  }, [dispatch, isAuthenticated, isLoading]);

  const handleLoadingComplete = () => {
    console.log('App: Loading spinner complete - authentication should be initialized')
    // Don't set loading false here anymore - let auth initialization handle it
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

            {/* Public Routes - Public Layout (FIXED) */}
            <Route path="/auth/*" element={
              isAuthenticated ? <Navigate to="/app" replace /> : <PublicLayout />
            }>
              <Route path="login" element={<LoginPage />} />
              <Route path="signup" element={<SignupPage />} />
              <Route path="*" element={<Navigate to="/auth/login" replace />} />
            </Route>

            {/* Onboarding Routes */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <OnBoardingPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Routes - Main Layout (FIXED) */}
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

          {/* Modal routes for onboarding overlay */}
          {background && location.pathname === '/onboarding' && (
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