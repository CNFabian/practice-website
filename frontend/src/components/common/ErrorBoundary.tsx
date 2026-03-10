import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import ServerErrorPage from '../../pages/ServerErrorPage'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

/**
 * Global error boundary.
 *
 * Wraps the top-level route tree so that unhandled React render
 * errors display the branded 500 page instead of a blank screen.
 *
 * The "Back" button on ServerErrorPage calls navigate(-1) which
 * lets the user leave the broken route. If the same route is
 * revisited, the boundary resets via componentDidUpdate.
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to whatever monitoring service you wire up later
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo)
  }

  componentDidUpdate(prevProps: Props) {
    // Reset when children change (e.g. user navigates away)
    if (this.state.hasError && prevProps.children !== this.props.children) {
      this.setState({ hasError: false })
    }
  }

  render() {
    if (this.state.hasError) {
      return <ServerErrorPage />
    }

    return this.props.children
  }
}

export default ErrorBoundary
