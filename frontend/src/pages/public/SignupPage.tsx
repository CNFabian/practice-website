import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { registerUser, getCurrentUser, sendVerificationCode, verifyEmailCode, resendVerificationCode } from '../../services/authAPI'
import { setUser } from '../../store/slices/authSlice'
import { SignupImage, TermsConditionsDoc, Eye, Blind, OnestFont } from '../../assets'

const SignupPage: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Email verification state
  const [verificationStep, setVerificationStep] = useState<'form' | 'code'>('form')
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', ''])
  const [codeSending, setCodeSending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Extract error detail from backend response
  const getErrorDetail = (err: any): string => {
    if (err.detail) return err.detail
    if (err.message) return err.message
    return 'An unexpected error occurred. Please try again.'
  }

  // Start resend cooldown timer
  const startResendCooldown = () => {
    setResendCooldown(60)
    const interval = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // Handle sending verification code
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.email) {
      setError('Please enter your email address.')
      return
    }

    if (!formData.firstName || !formData.lastName) {
      setError('Please enter your first and last name.')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setCodeSending(true)

    try {
      console.log('SignupPage: Sending verification code...');
      await sendVerificationCode(formData.email)
      console.log('SignupPage: Verification code sent successfully');
      setVerificationStep('code')
      startResendCooldown()
      setTimeout(() => codeInputRefs.current[0]?.focus(), 100)
    } catch (err: any) {
      console.error('SignupPage: Send verification code error:', err);
      const detail = getErrorDetail(err)
      if (detail.toLowerCase().includes('already registered') || detail.toLowerCase().includes('already exists')) {
        setError('An account with this email already exists. Please log in instead.')
      } else {
        setError(detail)
      }
    } finally {
      setCodeSending(false)
    }
  }

  // Handle code input changes
  const handleCodeChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return

    const newCode = [...verificationCode]
    newCode[index] = value
    setVerificationCode(newCode)

    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus()
    }
  }

  // Handle backspace in code inputs
  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus()
    }
  }

  // Handle paste in code inputs
  const handleCodePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length > 0) {
      const newCode = [...verificationCode]
      for (let i = 0; i < 6; i++) {
        newCode[i] = pasted[i] || ''
      }
      setVerificationCode(newCode)
      const nextEmpty = newCode.findIndex(c => !c)
      codeInputRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus()
    }
  }

  // Handle resend code
  const handleResendCode = async () => {
    if (resendCooldown > 0) return
    setError('')

    try {
      console.log('SignupPage: Resending verification code...');
      await resendVerificationCode(formData.email)
      console.log('SignupPage: Verification code resent successfully');
      startResendCooldown()
    } catch (err: any) {
      console.error('SignupPage: Resend code error:', err);
      const detail = getErrorDetail(err)
      setError(detail)
    }
  }

  // Handle verify code and then register
  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const code = verificationCode.join('')
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit code.')
      return
    }

    setLoading(true)

    try {
      console.log('SignupPage: Verifying email code...');
      await verifyEmailCode(formData.email, code)
      console.log('SignupPage: Email code verified, proceeding to registration...');

      await registerUser({
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        date_of_birth: formData.dateOfBirth
      });

      console.log('SignupPage: Registration successful, fetching user profile...');
      const userProfile = await getCurrentUser();
      console.log('SignupPage: User profile fetched:', userProfile);

      dispatch(setUser(userProfile));
      console.log('SignupPage: Redux updated, navigating to /');
      navigate('/', { replace: true });
    } catch (err: any) {
      console.error('SignupPage: Verification/Registration error:', err);
      const detail = getErrorDetail(err)

      if (detail.toLowerCase().includes('verify your email') || detail.toLowerCase().includes('request a code')) {
        console.log('SignupPage: Email verification required, resending code...');
        setVerificationCode(['', '', '', '', '', ''])
        setVerificationStep('code')
        try {
          await sendVerificationCode(formData.email)
          startResendCooldown()
          setError('Your verification expired. We sent a new code to your email.')
          setTimeout(() => codeInputRefs.current[0]?.focus(), 100)
        } catch (resendErr: any) {
          console.error('SignupPage: Failed to resend code:', resendErr);
          setError('Verification expired. Please click "Resend Code" to get a new code.')
        }
      } else if (detail.toLowerCase().includes('invalid') || detail.toLowerCase().includes('expired')) {
        setError('Invalid or expired verification code. Please try again or resend the code.')
      } else if (detail.toLowerCase().includes('already registered') || detail.toLowerCase().includes('already exists')) {
        setError('An account with this email already exists. Please log in instead.')
      } else {
        setError(detail)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-6 lg:px-8 my-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <OnestFont as="h1" weight={700} lineHeight="tight" className="text-4xl text-text-blue-black mb-4">
              {verificationStep === 'code' ? 'Verify Your Email' : 'Join NestNavigate'}
            </OnestFont>
            <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-lg">
              {verificationStep === 'code'
                ? `We sent a 6-digit code to ${formData.email}`
                : 'Start your journey to homeownership'}
            </OnestFont>
          </div>

          {/* Error display */}
          {error && (
            <div className="bg-status-red/10 border border-status-red rounded-lg p-3">
              <OnestFont weight={500} lineHeight="relaxed" className="text-status-red text-sm">
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

          {verificationStep === 'form' ? (
            /* ==================== STEP 1: Registration Form ==================== */
            <form onSubmit={handleSendCode} className="space-y-4" autoComplete="on">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  autoComplete="given-name"
                  required
                  className="w-full px-4 py-3 border-0 rounded-lg bg-light-background-blue text-text-blue-black placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-logo-blue focus:bg-pure-white"
                />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  autoComplete="family-name"
                  required
                  className="w-full px-4 py-3 border-0 rounded-lg bg-light-background-blue text-text-blue-black placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-logo-blue focus:bg-pure-white"
                />
              </div>

              <input
                id="email"
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                required
                className="w-full px-4 py-3 border-0 rounded-lg bg-light-background-blue text-text-blue-black placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-logo-blue focus:bg-pure-white"
              />

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  onPaste={(e) => e.preventDefault()}
                  autoComplete="new-password"
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

              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onPaste={(e) => e.preventDefault()}
                  autoComplete="new-password"
                  required
                  className="w-full px-4 py-3 pr-12 border-0 rounded-lg bg-light-background-blue text-text-blue-black placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-logo-blue focus:bg-pure-white"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-unavailable-button hover:text-text-grey focus:outline-none"
                >
                  <img
                    src={showConfirmPassword ? Eye : Blind}
                    alt={showConfirmPassword ? "Hide password" : "Show password"}
                    className="w-5 h-5"
                  />
                </button>
              </div>

              <input
                id="phone"
                type="tel"
                name="phone"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                autoComplete="tel"
                className="w-full px-4 py-3 border-0 rounded-lg bg-light-background-blue text-text-blue-black placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-logo-blue focus:bg-pure-white"
              />

              <input
                type="date"
                name="dateOfBirth"
                placeholder="Date of Birth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                autoComplete="bday"
                className="w-full px-4 py-3 border-0 rounded-lg bg-light-background-blue text-text-blue-black placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-logo-blue focus:bg-pure-white"
              />

              {/* Terms and Conditions text */}
              <div className="text-center mt-4 whitespace-nowrap">
                <OnestFont weight={300} lineHeight="relaxed" className="text-sm text-text-grey">
                  By clicking Sign Up, you automatically agree to our{' '}
                  <a
                    href={TermsConditionsDoc}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-logo-blue hover:underline"
                  >Terms and Conditions</a>
                </OnestFont>
              </div>

              <button
                type="submit"
                disabled={codeSending}
                className="mx-auto w-48 bg-logo-blue text-pure-white py-3 px-6 rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center"
              >
                {codeSending ? (
                  <div className="w-5 h-5 border-2 border-pure-white border-t-transparent rounded-full animate-spin mr-2"></div>
                ) : null}
                <OnestFont weight={700} lineHeight="relaxed" className="text-lg">
                  Sign Up
                </OnestFont>
              </button>
            </form>
          ) : (
            /* ==================== STEP 2: Verification Code ==================== */
            <form onSubmit={handleVerifyAndRegister} className="space-y-6">
              {/* 6-digit code inputs */}
              <div className="flex justify-center gap-3">
                {verificationCode.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { codeInputRefs.current[index] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(index, e)}
                    onPaste={index === 0 ? handleCodePaste : undefined}
                    className="w-12 h-14 text-center text-2xl border-2 border-transparent-elegant-blue rounded-lg bg-light-background-blue text-text-blue-black focus:outline-none focus:ring-2 focus:ring-logo-blue focus:border-logo-blue focus:bg-pure-white"
                  />
                ))}
              </div>

              {/* Resend code */}
              <div className="text-center">
                <OnestFont weight={300} lineHeight="relaxed" className="text-sm text-text-grey">
                  Didn't receive the code?{' '}
                  {resendCooldown > 0 ? (
                    <span className="text-unavailable-button">
                      Resend in {resendCooldown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendCode}
                      className="text-logo-blue hover:underline"
                    >
                      Resend Code
                    </button>
                  )}
                </OnestFont>
              </div>

              {/* Change email link */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setVerificationStep('form')
                    setVerificationCode(['', '', '', '', '', ''])
                    setError('')
                  }}
                  className="text-sm text-logo-blue hover:underline"
                >
                  <OnestFont weight={300} lineHeight="relaxed">
                    Change email address
                  </OnestFont>
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || verificationCode.join('').length !== 6}
                className="mx-auto w-48 bg-logo-blue text-pure-white py-3 px-6 rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-pure-white border-t-transparent rounded-full animate-spin mr-2"></div>
                ) : null}
                <OnestFont weight={700} lineHeight="relaxed" className="text-lg">
                  Verify & Sign Up
                </OnestFont>
              </button>
            </form>
          )}

          <div className="text-center">
            <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey">
              Already have an account? <a href='/auth/login' className="text-logo-blue hover:underline">Log in</a>
            </OnestFont>
          </div>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:flex flex-1 items-center justify-center m-10">
        <div className="max-w-2xl max-h-[80vh] flex items-center justify-center">
          <img
            src={SignupImage}
            alt="Home ownership journey image"
            className="max-w-full max-h-full object-cover rounded-2xl"
          />
        </div>
      </div>
    </div>
  )
}

export default SignupPage