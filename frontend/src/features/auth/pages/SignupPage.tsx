import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import {
  registerUser,
  getCurrentUser,
  sendVerificationCode,
  verifyEmailCode,
  resendVerificationCode,
} from '../../../services/authAPI'
import { setUser } from '../../../store/slices/authSlice'
import { birdAtDesk, PublicBackground, Eye, Blind, OnestFont } from '../../../assets'

type SignupStep = 'email' | 'code' | 'register'

const RESEND_COOLDOWN_SECONDS = 90

const SignupPage: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  // Form data
  const [email, setEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // UI state
  const [currentStep, setCurrentStep] = useState<SignupStep>('email')
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left')
  const [isAnimating, setIsAnimating] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  // Refs for cleanup
  const cooldownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const animationTimeoutRef2 = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current)
      }
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
      }
      if (animationTimeoutRef2.current) {
        clearTimeout(animationTimeoutRef2.current)
      }
    }
  }, [])

  // Extract error detail from backend response
  const getErrorDetail = useCallback((err: any): string => {
    if (err.detail) return err.detail
    if (err.message) return err.message
    return 'An unexpected error occurred. Please try again.'
  }, [])

  // Start resend cooldown timer
  const startResendCooldown = useCallback(() => {
    // Clear any existing interval
    if (cooldownIntervalRef.current) {
      clearInterval(cooldownIntervalRef.current)
      cooldownIntervalRef.current = null
    }

    setResendCooldown(RESEND_COOLDOWN_SECONDS)
    cooldownIntervalRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownIntervalRef.current) {
            clearInterval(cooldownIntervalRef.current)
            cooldownIntervalRef.current = null
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  // Animate step transition
  const animateToStep = useCallback(
    (nextStep: SignupStep, direction: 'left' | 'right' = 'left') => {
      if (isAnimating) return
      setIsAnimating(true)
      setSlideDirection(direction)

      // Allow the exit animation to complete, then switch content
      animationTimeoutRef.current = setTimeout(() => {
        setCurrentStep(nextStep)
        setError('')
        // Brief delay then reset animation state for entrance
        animationTimeoutRef2.current = setTimeout(() => {
          setIsAnimating(false)
        }, 50)
      }, 300)
    },
    [isAnimating]
  )

  // ==================== STEP 1: Send verification code ====================
  const handleSendCode = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError('')

      if (!email.trim()) {
        setError('Please enter your email address.')
        return
      }

      setLoading(true)

      try {
        await sendVerificationCode(email.trim())
        startResendCooldown()
        animateToStep('code', 'left')
      } catch (err: any) {
        const detail = getErrorDetail(err)
        if (
          detail.toLowerCase().includes('already registered') ||
          detail.toLowerCase().includes('already exists')
        ) {
          setError('An account with this email already exists. Please log in instead.')
        } else {
          setError(detail)
        }
      } finally {
        setLoading(false)
      }
    },
    [email, getErrorDetail, startResendCooldown, animateToStep]
  )

  // ==================== STEP 2: Verify code ====================
  const handleVerifyCode = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError('')

      const code = verificationCode.trim()
      if (code.length !== 6) {
        setError('Please enter the complete 6-digit code.')
        return
      }

      setLoading(true)

      try {
        await verifyEmailCode(email.trim(), code)
        animateToStep('register', 'left')
      } catch (err: any) {
        const detail = getErrorDetail(err)
        if (
          detail.toLowerCase().includes('invalid') ||
          detail.toLowerCase().includes('expired')
        ) {
          setError('Invalid or expired verification code. Please try again or resend the code.')
        } else {
          setError(detail)
        }
      } finally {
        setLoading(false)
      }
    },
    [verificationCode, email, getErrorDetail, animateToStep]
  )

  // ==================== STEP 2: Resend code ====================
  const handleResendCode = useCallback(async () => {
    if (resendCooldown > 0) return
    setError('')

    try {
      await resendVerificationCode(email.trim())
      startResendCooldown()
    } catch (err: any) {
      setError(getErrorDetail(err))
    }
  }, [resendCooldown, email, getErrorDetail, startResendCooldown])

  // ==================== STEP 3: Register user ====================
  const handleRegister = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError('')

      if (!firstName.trim() || !lastName.trim()) {
        setError('Please enter your first and last name.')
        return
      }

      if (password.length < 8) {
        setError('Password must be at least 8 characters long.')
        return
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match.')
        return
      }

      setLoading(true)

      try {
        await registerUser({
          email: email.trim(),
          password,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          ...(phone.trim() ? { phone: phone.trim() } : {}),
        })

        const userProfile = await getCurrentUser()
        dispatch(setUser(userProfile))

        // Cache user data for App.tsx
        try {
          localStorage.setItem('cached_user_data', JSON.stringify(userProfile))
        } catch {
          // non-critical
        }

        navigate('/', { replace: true })
      } catch (err: any) {
        const detail = getErrorDetail(err)
        if (
          detail.toLowerCase().includes('already registered') ||
          detail.toLowerCase().includes('already exists')
        ) {
          setError('An account with this email already exists. Please log in instead.')
        } else {
          setError(detail)
        }
      } finally {
        setLoading(false)
      }
    },
    [firstName, lastName, password, confirmPassword, email, dispatch, navigate, getErrorDetail]
  )

  // Shared input className
  const inputClassName =
    'w-full px-6 py-3.5 rounded-full bg-light-background-blue text-text-blue-black placeholder-unavailable-button border border-transparent-elegant-blue focus:outline-none focus:ring-2 focus:ring-logo-blue focus:border-logo-blue focus:bg-pure-white transition-colors'

  const disabledInputClassName =
    'w-full px-6 py-3.5 rounded-full bg-light-background-blue text-text-grey border border-transparent-elegant-blue cursor-not-allowed'

  // Get animation classes based on state
  const getAnimationStyle = (): React.CSSProperties => {
    if (isAnimating) {
      return {
        transform: slideDirection === 'left' ? 'translateX(-100%)' : 'translateX(100%)',
        opacity: 0,
        transition: 'transform 300ms ease-in-out, opacity 300ms ease-in-out',
      }
    }
    return {
      transform: 'translateX(0)',
      opacity: 1,
      transition: 'transform 300ms ease-in-out, opacity 300ms ease-in-out',
    }
  }

  // ==================== STEP RENDERERS ====================

  const renderEmailStep = () => (
    <form onSubmit={handleSendCode} className="space-y-6">
      <div className="text-center space-y-2">
        <OnestFont as="h1" weight={700} lineHeight="tight" className="text-4xl text-text-blue-black">
          Welcome To Nest!
        </OnestFont>
        <OnestFont as="p" weight={700} lineHeight="relaxed" className="text-text-blue-black text-base px-4">
          Build confidence before you buy
        </OnestFont>
        <OnestFont as="p" weight={300} lineHeight="relaxed" className="text-text-grey text-base px-4">
          NestNavigate helps you understand the process, compare
          options, and make informed decisions.
        </OnestFont>
      </div>

      {error && (
        <div className="bg-status-red/10 border border-status-red rounded-lg p-3">
          <OnestFont weight={500} lineHeight="relaxed" className="text-status-red text-sm text-center">
            {error}
            {error.includes('log in') && (
              <>
                {' '}
                <a href="/auth/login" className="underline font-semibold">
                  Go to Login
                </a>
              </>
            )}
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
            NEXT
          </OnestFont>
        </button>
      </div>

      <div className="text-center pt-2">
        <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-sm">
          Already have an account?{' '}
          <a href="/auth/login" className="text-logo-blue hover:underline">
            Log in
          </a>
        </OnestFont>
      </div>
    </form>
  )

  const renderCodeStep = () => (
    <form onSubmit={handleVerifyCode} className="space-y-5">
      <div className="text-center space-y-3">
        <OnestFont as="h1" weight={700} lineHeight="tight" className="text-4xl text-text-blue-black">
          Verify your email
        </OnestFont>
        <OnestFont as="p" weight={300} lineHeight="relaxed" className="text-text-grey text-base px-4">
          We sent a 6-digit code to your email. Enter it below
          to confirm your account and continue.
        </OnestFont>
      </div>

      {error && (
        <div className="bg-status-red/10 border border-status-red rounded-lg p-3">
          <OnestFont weight={500} lineHeight="relaxed" className="text-status-red text-sm text-center">
            {error}
          </OnestFont>
        </div>
      )}

      {/* Email - prefilled and disabled */}
      <input
        type="email"
        value={email}
        disabled
        className={disabledInputClassName}
      />

      {/* Code input */}
      <input
        type="text"
        inputMode="numeric"
        placeholder="enter code here"
        value={verificationCode}
        onChange={(e) => {
          const val = e.target.value.replace(/\D/g, '').slice(0, 6)
          setVerificationCode(val)
        }}
        maxLength={6}
        autoFocus
        className={inputClassName}
      />

      {/* Instructional text */}
      <div className="text-center">
        <OnestFont as="p" weight={500} lineHeight="relaxed" className="text-text-blue-black text-sm px-4">
          Check your inbox for a 6-digit code. You can resend
          the code after {RESEND_COOLDOWN_SECONDS} seconds.
        </OnestFont>
      </div>

      {/* Resend / Verify button */}
      <div className="flex justify-center pt-1">
        {verificationCode.length === 6 ? (
          <button
            type="submit"
            disabled={loading}
            className="w-48 bg-logo-blue text-pure-white py-3.5 rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center"
          >
            {loading && (
              <div className="w-5 h-5 border-2 border-pure-white border-t-transparent rounded-full animate-spin mr-2" />
            )}
            <OnestFont weight={700} lineHeight="relaxed" className="text-lg tracking-wider">
              VERIFY
            </OnestFont>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleResendCode}
            disabled={resendCooldown > 0}
            className="w-48 bg-logo-blue text-pure-white py-3.5 rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center"
          >
            <OnestFont weight={700} lineHeight="relaxed" className="text-lg tracking-wider">
              {resendCooldown > 0 ? `RESEND (${resendCooldown}s)` : 'RESEND'}
            </OnestFont>
          </button>
        )}
      </div>

      {/* Back to email */}
      <div className="text-center">
        <button
          type="button"
          onClick={() => {
            setVerificationCode('')
            setError('')
            animateToStep('email', 'right')
          }}
          className="text-sm text-logo-blue hover:underline"
        >
          <OnestFont weight={300} lineHeight="relaxed">
            Change email address
          </OnestFont>
        </button>
      </div>
    </form>
  )

  const renderRegisterStep = () => (
    <form onSubmit={handleRegister} className="space-y-4">
      <div className="text-center space-y-2">
        <OnestFont as="h1" weight={700} lineHeight="tight" className="text-4xl text-text-blue-black">
          Finish setting up your account
        </OnestFont>
        <OnestFont as="p" weight={300} lineHeight="relaxed" className="text-text-grey text-base px-4">
          Your email has been verified. Add your name and create
          a password to continue.
        </OnestFont>
      </div>

      {error && (
        <div className="bg-status-red/10 border border-status-red rounded-lg p-3">
          <OnestFont weight={500} lineHeight="relaxed" className="text-status-red text-sm text-center">
            {error}
            {error.includes('log in') && (
              <>
                {' '}
                <a href="/auth/login" className="underline font-semibold">
                  Go to Login
                </a>
              </>
            )}
          </OnestFont>
        </div>
      )}

      {/* First name / Last name */}
      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="first name *"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          autoComplete="given-name"
          required
          className={inputClassName}
        />
        <input
          type="text"
          placeholder="last name *"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          autoComplete="family-name"
          required
          className={inputClassName}
        />
      </div>

      {/* Email - prefilled and disabled */}
      <input
        type="email"
        value={email}
        disabled
        className={disabledInputClassName}
      />

      {/* Phone number (optional) */}
      <input
        type="tel"
        placeholder="phone number (optional)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        autoComplete="tel"
        className={inputClassName}
      />

      {/* Password */}
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="password *"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onPaste={(e) => e.preventDefault()}
          autoComplete="new-password"
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

      {/* Confirm password */}
      <div className="relative">
        <input
          type={showConfirmPassword ? 'text' : 'password'}
          placeholder="confirm password *"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onPaste={(e) => e.preventDefault()}
          autoComplete="new-password"
          required
          className={`${inputClassName} pr-12`}
        />
        <button
          type="button"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-unavailable-button hover:text-text-grey focus:outline-none"
        >
          <img
            src={showConfirmPassword ? Eye : Blind}
            alt={showConfirmPassword ? 'Hide password' : 'Show password'}
            className="w-5 h-5"
          />
        </button>
      </div>

      {/* Sign Up button */}
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
            SIGN UP
          </OnestFont>
        </button>
      </div>
    </form>
  )

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'email':
        return renderEmailStep()
      case 'code':
        return renderCodeStep()
      case 'register':
        return renderRegisterStep()
    }
  }

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
          {/* Left side - Bird at desk */}
          <div className="hidden lg:flex flex-1 items-center justify-center">
            <img
              src={birdAtDesk}
              alt="Nest Navigate bird character at desk"
              className="max-w-md w-full h-auto object-contain drop-shadow-lg"
            />
          </div>

          {/* Right side - Form card */}
          <div className="flex-1 flex items-center justify-center lg:justify-end">
            <div className="w-full max-w-lg bg-pure-white/95 backdrop-blur-sm rounded-2xl border border-unavailable-button/30 shadow-lg p-8 md:p-10 overflow-hidden">
              <div style={getAnimationStyle()}>
                {renderCurrentStep()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignupPage