import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from '../lib/queryClient'
import { store, persistor } from '../store/store'
import { WalkthroughProvider } from '../contexts/WalkthroughContext'
import { ToastProvider } from '../contexts/ToastContext'
import ToastContainer from '../components/shared/ToastContainer'
import ReactGA from 'react-ga4'
import App from './App'
import ResetPasswordPage from '../features/auth/pages/ResetPasswordPage'
import '../index.css'

// Initialize Google Analytics
const GA_TRACKING_ID = 'G-MFJ1V9NWW0'
ReactGA.initialize(GA_TRACKING_ID)

const isResetPasswordRoute = window.location.pathname.startsWith('/reset-password')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isResetPasswordRoute ? (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ResetPasswordPage />
        </BrowserRouter>
      </QueryClientProvider>
    ) : (
      <Provider store={store}>
        <PersistGate loading={<div>Loading...</div>} persistor={persistor}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <ToastProvider>
                <WalkthroughProvider>
                  <App />
                </WalkthroughProvider>
                <ToastContainer />
              </ToastProvider>
            </BrowserRouter>
            {/* React Query DevTools - only included in development builds */}
            <ReactQueryDevtools initialIsOpen={false} />
          </QueryClientProvider>
        </PersistGate>
      </Provider>
    )}
  </React.StrictMode>,
)