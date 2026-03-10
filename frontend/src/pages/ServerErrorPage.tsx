import React from 'react'
import ErrorPage from '../components/common/ErrorPage'

/**
 * 500 — Service Unavailable
 *
 * Shown when the ErrorBoundary catches an unhandled runtime
 * error, or when a server-side 500 response needs a full-page
 * error state.
 */
const ServerErrorPage: React.FC = () => (
  <ErrorPage
    title="Service Unavailable."
    description="Looks like something went wrong. We're fixing the problem, so please try again later or contact support if the issue persists."
  />
)

export default ServerErrorPage
