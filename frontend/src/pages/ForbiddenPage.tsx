import React from 'react'
import { useNavigate } from 'react-router-dom'
import ErrorPage from '../components/common/ErrorPage'

/**
 * 403 — Forbidden
 *
 * Shown when a user tries to access a route they do not have
 * permission for (e.g. non-admin hitting /app/admin).
 */
const ForbiddenPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <ErrorPage
      title="Access Restricted."
      description="You do not have permission to view this page. If you think this is a mistake, please contact support."
      buttonLabel="Go Home"
      onButtonClick={() => navigate('/app', { replace: true })}
    />
  )
}

export default ForbiddenPage
