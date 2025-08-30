import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from './store/store.ts'

import AuthLayout from './components/layout/AuthLayout'
import MainLayout from './components/layout/MainLayout'
import ProtectedRoute from './components/common/ProtectedRoute'

import SplashPage from './pages/auth/SplashPage'

import {
  OverviewPage,
  ModulesPage,
  SavedPage,
  RewardsPage,
  BadgesPage,
  HelpPage,
  SettingsPage
} from './pages'

import { setUser, setLoading } from './store/slices/authSlice'
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
      {/* Public Routes - Auth Layout */}
      <Route path="/splash" element={
        <AuthLayout>
          <SplashPage />
        </AuthLayout>
      } />
      
      {/* Temporarily redirect to splash for login/signup until we create those pages */}
      <Route path="/login" element={<Navigate to="/splash" replace />} />
      <Route path="/signup" element={<Navigate to="/splash" replace />} />

      {/* Protected Routes - Main Layout */}
      <Route path="/*" element={
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
        isAuthenticated ? <Navigate to="/overview" replace /> : <Navigate to="/splash" replace />
      } />
    </Routes>
  )
}

export default App