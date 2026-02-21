import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { loginUser, getCurrentUser, requestPasswordReset } from '../../../services/authAPI'
import { setUser } from '../../../store/slices/authSlice'
import { birdWithPencil, PublicBackground, Eye, Blind, OnestFont } from '../../../assets'

const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetMessage, setResetMessage] = useState('')
  const [resetError, setResetError] = useState('')

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      console.log('LoginPage: Starting login process...');

      await loginUser({
        email: email.trim(),
        password,
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
  }, [email, password, dispatch, navigate])

  const handleForgotPassword = useCallback(async () => {
    const emailToReset = resetEmail.trim() || email.trim()
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
  }, [resetEmail, email])

  // Shared input className
  const inputClassName =
    'w-full px-6 py-3.5 rounded-full bg-light-background-blue text-text-blue-black placeholder-unavailable-button border border-transparent-elegant-blue focus:outline-none focus:ring-2 focus:ring-logo-blue focus:border-logo-blue focus:bg-pure-white transition-colors'

  return (
    <div className="relative w-full">
      {/* Background image section */}
      <div className="relative min-h-[600px] flex items-center overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${PublicBackground})` }}
        />
        {/* Blue overlay */}
        <div className="absolute inset-0 bg-logo-blue/30" />
        {/* Bottom gradient fade to white */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-pure-white to-transparent" />

        {/* Content container */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 flex items-center justify-between py-12">
          {/* Left side - Bird with pencil */}
          <div className="hidden lg:flex flex-1 items-center justify-center">
            <img
              src={birdWithPencil}
              alt="Nest Navigate bird character with pencil"
              className="max-w-md w-full h-auto object-contain drop-shadow-lg"
            />
          </div>

          {/* Right side - Form card */}
          <div className="flex-1 flex items-center justify-center lg:justify-end">
            <div className="w-full max-w-lg bg-pure-white/95 backdrop-blur-sm rounded-2xl border border-unavailable-button/30 shadow-lg p-8 md:p-10">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="text-center space-y-3">
                  <OnestFont as="h1" weight={700} lineHeight="tight" className="text-4xl text-text-blue-black">
                    Welcome Back!
                  </OnestFont>
                  <OnestFont as="p" weight={300} lineHeight="relaxed" className="text-text-grey text-base px-4">
                    Continue your home buying learning journey today
                    and get one step closer to your dream home!
                  </OnestFont>
                </div>

                {error && (
                  <div className="bg-status-red/10 border border-status-red rounded-lg p-3">
                    <OnestFont weight={500} lineHeight="relaxed" className="text-status-red text-sm text-center">
                      {error}
                    </OnestFont>
                  </div>
                )}

                <input
                  type="email"
                  placeholder="email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  className={inputClassName}
                />

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onPaste={(e) => e.preventDefault()}
                    autoComplete="current-password"
                    required
                    className={`${inputClassName} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-unavailable-button hover:text-text-grey focus:outline-none"
                  >
                    <img
                      src={showPassword ? Eye : Blind}
                      alt={showPassword ? 'Hide password' : 'Show password'}
                      className="w-5 h-5"
                    />
                  </button>
                </div>

                {/* Forgot Password link */}
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(!showForgotPassword)
                      setResetEmail(email)
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
                  <div className="bg-light-background-blue rounded-xl p-4 space-y-3">
                    <OnestFont as="p" weight={300} lineHeight="relaxed" className="text-sm text-text-grey text-center">
                      Enter your email and we'll send you a link to reset your password.
                    </OnestFont>
                    <input
                      type="email"
                      placeholder="email address"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full px-6 py-3 rounded-full bg-pure-white text-text-blue-black placeholder-unavailable-button border border-transparent-elegant-blue focus:outline-none focus:ring-2 focus:ring-logo-blue"
                    />
                    {resetMessage && (
                      <div className="px-3 py-2 rounded-lg bg-status-green/10">
                        <OnestFont weight={500} lineHeight="relaxed" className="text-status-green text-sm text-center">
                          {resetMessage}
                        </OnestFont>
                      </div>
                    )}
                    {resetError && (
                      <div className="px-3 py-2 rounded-lg bg-status-red/10">
                        <OnestFont weight={500} lineHeight="relaxed" className="text-status-red text-sm text-center">
                          {resetError}
                        </OnestFont>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={resetLoading}
                      className="w-full bg-elegant-blue text-pure-white py-2.5 rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    >
                      <OnestFont weight={500} lineHeight="relaxed" className="text-sm">
                        {resetLoading ? 'Sending...' : 'Send Reset Link'}
                      </OnestFont>
                    </button>
                  </div>
                )}

                <div className="flex justify-center pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-48 bg-logo-blue text-pure-white py-3.5 rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center"
                  >
                    {loading && (
                      <div className="w-5 h-5 border-2 border-pure-white border-t-transparent rounded-full animate-spin mr-2" />
                    )}
                    <OnestFont weight={700} lineHeight="relaxed" className="text-lg tracking-wider">
                      LOG IN
                    </OnestFont>
                  </button>
                </div>

                <div className="text-center pt-2">
                  <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-sm">
                    No account yet? Register{' '}
                    <a href="/auth/signup" className="text-logo-blue hover:underline">
                      here
                    </a>
                  </OnestFont>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage