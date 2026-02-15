import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { loginUser, getCurrentUser, requestPasswordReset } from '../../services/authAPI'
import { setUser } from '../../store/slices/authSlice'
import { LoginImage, Eye, Blind, OnestFont } from '../../assets'

const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetMessage, setResetMessage] = useState('')
  const [resetError, setResetError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      console.log('LoginPage: Starting login process...');

      await loginUser({
        email: formData.email,
        password: formData.password
      });

      console.log('LoginPage: Login successful, fetching user profile...');
      const userProfile = await getCurrentUser();
      console.log('LoginPage: User profile fetched:', userProfile);

      dispatch(setUser(userProfile));

      // Cache user data so App.tsx cache path works on next refresh
      try {
        localStorage.setItem('cached_user_data', JSON.stringify(userProfile))
      } catch {
        // non-critical
      }

      console.log('LoginPage: Redux updated, navigating to /');
      navigate('/', { replace: true });
    } catch (err: any) {
      console.error('LoginPage: Login error:', err);
      if (err.message.includes('401')) {
        setError('Invalid email or password');
      } else if (err.message.includes('422')) {
        setError('Please check your email and password format');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  const handleForgotPassword = async () => {
    const emailToReset = resetEmail.trim() || formData.email.trim()
    if (!emailToReset) {
      setResetError('Please enter your email address.')
      return
    }

    setResetLoading(true)
    setResetMessage('')
    setResetError('')

    try {
      await requestPasswordReset(emailToReset)
      setResetMessage('If an account exists with that email, a password reset link has been sent.')
    } catch {
      setResetError('Failed to send reset email. Please try again.')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-6 lg:px-8 my-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <OnestFont as="h1" weight={700} lineHeight="tight" className="text-4xl text-text-blue-black mb-4">
              Welcome Back!
            </OnestFont>
            <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-lg">
              Sign in to continue your learning journey
            </OnestFont>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-status-red/10 border border-status-red rounded-lg p-3">
                <OnestFont weight={500} lineHeight="relaxed" className="text-status-red text-sm">
                  {error}
                </OnestFont>
              </div>
            )}

            <input
              type="email"
              name="email"
              placeholder="email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              required
              className="w-full px-4 py-3 border-0 rounded-lg bg-light-background-blue text-text-blue-black placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-logo-blue focus:bg-pure-white"
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="password"
                value={formData.password}
                onChange={handleChange}
                onPaste={(e) => e.preventDefault()}
                autoComplete="current-password"
                required
                className="w-full px-4 py-3 pr-12 border-0 rounded-lg bg-light-background-blue text-text-blue-black placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-logo-blue focus:bg-pure-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-unavailable-button hover:text-text-grey focus:outline-none"
              >
                <img 
                  src={showPassword ? Eye : Blind} 
                  alt={showPassword ? "Hide password" : "Show password"} 
                  className="w-5 h-5" 
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="stayLoggedIn"
                  name="stayLoggedIn"
                  type="checkbox"
                  className="h-4 w-4 text-logo-blue focus:ring-logo-blue border-light-background-blue rounded"
                />
                <label htmlFor="stayLoggedIn" className="ml-2 block">
                  <OnestFont weight={300} lineHeight="relaxed" className="text-sm text-text-blue-black">
                    Stay logged in
                  </OnestFont>
                </label>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(!showForgotPassword)
                  setResetEmail(formData.email)
                  setResetMessage('')
                  setResetError('')
                }}
                className="focus:outline-none"
              >
                <OnestFont weight={300} lineHeight="relaxed" className="text-sm text-logo-blue hover:underline">
                  Forgot Password?
                </OnestFont>
              </button>
            </div>

            {/* Forgot Password Inline Section */}
            {showForgotPassword && (
              <div className="bg-light-background-blue rounded-lg p-4 space-y-3">
                <OnestFont as="p" weight={300} lineHeight="relaxed" className="text-sm text-text-grey">
                  Enter your email and we'll send you a link to reset your password.
                </OnestFont>
                <input
                  type="email"
                  placeholder="email address"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full px-4 py-3 border-0 rounded-lg bg-pure-white text-text-blue-black placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-logo-blue"
                />
                {resetMessage && (
                  <div className="px-3 py-2 rounded-lg bg-status-green/10">
                    <OnestFont weight={500} lineHeight="relaxed" className="text-status-green text-sm">
                      {resetMessage}
                    </OnestFont>
                  </div>
                )}
                {resetError && (
                  <div className="px-3 py-2 rounded-lg bg-status-red/10">
                    <OnestFont weight={500} lineHeight="relaxed" className="text-status-red text-sm">
                      {resetError}
                    </OnestFont>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={resetLoading}
                  className="w-full bg-elegant-blue text-pure-white py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                >
                  <OnestFont weight={500} lineHeight="relaxed" className="text-sm">
                    {resetLoading ? 'Sending...' : 'Send Reset Link'}
                  </OnestFont>
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mx-auto w-48 bg-logo-blue text-pure-white py-3 px-6 rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-pure-white border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : null}
              <OnestFont weight={700} lineHeight="relaxed" className="text-lg">
                Log In
              </OnestFont>
            </button>
          </form>

          <div className="text-center">
            <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey">
              No account yet? Register <a href='/auth/signup' className="text-logo-blue hover:underline">here</a>
            </OnestFont>
          </div>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:flex flex-1 items-center justify-center m-10">
        <div className="max-w-2xl max-h-[80vh] flex items-center justify-center">
          <img 
            src={LoginImage} 
            alt="Home ownership journey image" 
            className="max-w-full max-h-full object-cover rounded-2xl"
          />
        </div>
      </div>
    </div>
  )
}

export default LoginPage