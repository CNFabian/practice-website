import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import ReactGA from 'react-ga4'

/**
 * Sends a GA4 pageview event on every route change.
 * Drop this hook into any component rendered inside <BrowserRouter>.
 */
const usePageTracking = (): void => {
  const location = useLocation()

  useEffect(() => {
    ReactGA.send({
      hitType: 'pageview',
      page: location.pathname + location.search,
    })
  }, [location])
}

export default usePageTracking
