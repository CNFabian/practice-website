import React from 'react'
import { useNavigate } from 'react-router-dom'
import ErrorPage from '../components/common/ErrorPage'

/**
 * 404 — Page Not Found
 *
 * Rendered by the catch-all `*` route when no other route matches.
 */
const NotFoundPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <ErrorPage
      title="Page Not Found."
      description="We could not find the page you were looking for. It may have been moved or no longer exists."
      buttonLabel="Go Home"
      onButtonClick={() => navigate('/app', { replace: true })}
    />
  )
}

export default NotFoundPage
