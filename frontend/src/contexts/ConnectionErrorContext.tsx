import React, { createContext, useContext, useState, useCallback } from 'react'
import ConnectionErrorPage from '../pages/ConnectionErrorPage'

interface ConnectionErrorContextValue {
  /** Call this to show the connection error screen */
  showConnectionError: () => void
  /** Call this to dismiss the connection error screen */
  clearConnectionError: () => void
}

const ConnectionErrorContext = createContext<ConnectionErrorContextValue>({
  showConnectionError: () => {},
  clearConnectionError: () => {},
})

export const useConnectionError = () => useContext(ConnectionErrorContext)

/**
 * Wraps the app and shows a full-screen ConnectionErrorPage
 * overlay when a network failure is reported via the context.
 *
 * Usage in API layer:
 *   import { connectionErrorEmitter } from '../contexts/ConnectionErrorContext'
 *   connectionErrorEmitter.emit()   // triggers the overlay
 */
export const ConnectionErrorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasError, setHasError] = useState(false)

  const showConnectionError = useCallback(() => setHasError(true), [])
  const clearConnectionError = useCallback(() => setHasError(false), [])

  return (
    <ConnectionErrorContext.Provider value={{ showConnectionError, clearConnectionError }}>
      {hasError ? <ConnectionErrorPage /> : children}
    </ConnectionErrorContext.Provider>
  )
}

// ────────────────────────────────────────────────────
// Lightweight emitter so non-React code (API services)
// can trigger the connection error screen without
// importing React hooks.
// ────────────────────────────────────────────────────
type Listener = () => void
let _listener: Listener | null = null

export const connectionErrorEmitter = {
  /** Subscribe — called once by ConnectionErrorProvider */
  subscribe(fn: Listener) {
    _listener = fn
    return () => { _listener = null }
  },
  /** Emit — call from fetchWithAuth on network failure */
  emit() {
    _listener?.()
  },
}

// Enhanced provider that wires the emitter automatically
export const ConnectionErrorProviderWithEmitter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasError, setHasError] = useState(false)

  const showConnectionError = useCallback(() => setHasError(true), [])
  const clearConnectionError = useCallback(() => setHasError(false), [])

  // Wire the emitter on mount
  React.useEffect(() => {
    const unsub = connectionErrorEmitter.subscribe(showConnectionError)
    return unsub
  }, [showConnectionError])

  return (
    <ConnectionErrorContext.Provider value={{ showConnectionError, clearConnectionError }}>
      {hasError ? <ConnectionErrorPage /> : children}
    </ConnectionErrorContext.Provider>
  )
}

export default ConnectionErrorContext
