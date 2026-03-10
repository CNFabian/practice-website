import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import ReactGA from 'react-ga4'

// CRITICAL DEV NOTE: Event Deduplication
// - Do NOT fire events on click. Always wait for backend success response
// - Deduplicate route-based events to prevent double-firing on refresh/re-render
// - Use lastTrackedState to store previous path and timestamp
// - Only fire if path actually changed OR minimum debounce threshold met (1000ms)
// - This prevents duplicate GA4 pageview events on rapid navigation or component re-renders

export const usePageTracking = () => {
  const location = useLocation()
  const lastTrackedState = useRef<{ path: string; timestamp: number } | null>(null)

  useEffect(() => {
    const currentPath = location.pathname + location.search
    const now = Date.now()
    
    // Deduplicate: Only fire if path changed OR minimum time elapsed
    if (
      !lastTrackedState.current || 
      lastTrackedState.current.path !== currentPath ||
      (now - lastTrackedState.current.timestamp) > 1000
    ) {
      ReactGA.send({
        hitType: 'pageview',
        page: currentPath,
      })
      
      lastTrackedState.current = { path: currentPath, timestamp: now }
    }
  }, [location])
}