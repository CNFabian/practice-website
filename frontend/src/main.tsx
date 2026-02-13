import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from './lib/queryClient'
import { store, persistor } from './store/store'
import { WalkthroughProvider } from './contexts/WalkthroughContext'
import App from './App'
import ResetPasswordPage from './pages/public/ResetPasswordPage'
import './index.css'

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
              <WalkthroughProvider>
                <App />
              </WalkthroughProvider>
            </BrowserRouter>
            {/* React Query DevTools - only included in development builds */}
            <ReactQueryDevtools initialIsOpen={false} />
          </QueryClientProvider>
        </PersistGate>
      </Provider>
    )}
  </React.StrictMode>,
)