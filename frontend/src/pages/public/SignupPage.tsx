import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { registerUser, getCurrentUser } from '../../services/authAPI'
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

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    setLoading(true)

    try {
      console.log('SignupPage: Starting registration process...');
      
      // Call registration API
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
      
      console.log('SignupPage: Redux updated, navigating to /onboarding');
      navigate('/onboarding');
    } catch (err: any) {
      console.error('SignupPage: Registration error:', err);
      
      if (err.message.includes('400')) {
        setError('Invalid registration data. Please check your information.');
      } else if (err.message.includes('422')) {
        setError('Please check all fields are filled correctly.');
      } else if (err.message.includes('409')) {
        setError('An account with this email already exists.');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-6 lg:px-8 my-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <OnestFont as="h1" weight={700} lineHeight="tight" className="text-4xl text-text-blue-black mb-4">
              Join NestNavigate
            </OnestFont>
            <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-lg">
              Start your journey to homeownership
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

            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-0 rounded-lg bg-light-background-blue text-text-blue-black placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-logo-blue focus:bg-pure-white"
              />

              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-0 rounded-lg bg-light-background-blue text-text-blue-black placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-logo-blue focus:bg-pure-white"
              />
            </div>

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border-0 rounded-lg bg-light-background-blue text-text-blue-black placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-logo-blue focus:bg-pure-white"
            />

            <input
              type="tel"
              name="phone"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 border-0 rounded-lg bg-light-background-blue text-text-blue-black placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-logo-blue focus:bg-pure-white"
            />

            <input
              type="date"
              name="dateOfBirth"
              placeholder="Date of Birth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className="w-full px-4 py-3 border-0 rounded-lg bg-light-background-blue text-text-blue-black placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-logo-blue focus:bg-pure-white"
            />

           <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 pr-12 border-0 rounded-lg bg-light-background-blue text-text-blue-black placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-logo-blue focus:bg-pure-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-unavailable-button hover:text-text-grey focus:outline-none"
              >
                <img 
                  src={showPassword ? Blind : Eye} 
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
                required
                className="w-full px-4 py-3 pr-12 border-0 rounded-lg bg-light-background-blue text-text-blue-black placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-logo-blue focus:bg-pure-white"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-unavailable-button hover:text-text-grey focus:outline-none"
              >
                <img 
                  src={showConfirmPassword ? Blind : Eye} 
                  alt={showConfirmPassword ? "Hide password" : "Show password"}
                  className="w-5 h-5"
                />
              </button>
            </div>

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
              disabled={loading}
              className="mx-auto w-48 bg-logo-blue text-pure-white py-3 px-6 rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-pure-white border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : null}
              <OnestFont weight={700} lineHeight="relaxed" className="text-lg">
                Sign Up
              </OnestFont>
            </button>
          </form>

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