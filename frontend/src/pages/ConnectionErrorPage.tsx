import React from 'react'
import ErrorPage from '../components/common/ErrorPage'
import { birdSad } from '../assets'

/**
 * Connection Error — Offline / Timeout
 *
 * Shown when the app cannot reach the API due to a network
 * failure, timeout, or the backend returning a 503.
 */
const ConnectionErrorPage: React.FC = () => (
  <ErrorPage
    title="Connection Lost."
    description="We could not reach our servers. Please check your internet connection and try again."
    buttonLabel="Try Again"
    onButtonClick={() => window.location.reload()}
    image={birdSad}
    imageAlt="Nest Navigate bird looking sad"
  />
)

export default ConnectionErrorPage
