import React, { useState } from 'react'
import { signupWithEmail } from '../../services/auth'
import { useNavigate } from 'react-router-dom'
import { SignupImage } from '../../assets'

const SignupPage: React.FC = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
      const { user, error } = await signupWithEmail({
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      })

      if (error) {
        setError(error)
      } else if (user) {
        navigate('/')
      }
    } catch (err) {
      setError('An unexpected error occurred')
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Lets get started!
            </h1>
            <p className="text-gray-600 text-lg">
              Create an account and begin your journey of<br />
              home ownership today!
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                {error}
              </div>
            )}

          <input
            type="text"
            name="firstName"
            placeholder="first name"
            value={formData.firstName}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border-0 rounded-full text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            style={{ backgroundColor: '#EFF2FF' }}
          />

            <input
              type="text"
              name="lastName"
              placeholder="last name"
              value={formData.lastName}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border-0 rounded-full text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              style={{ backgroundColor: '#EFF2FF' }}
            />

            <input
              type="tel"
              name="phoneNumber"
              placeholder="phone number"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border-0 rounded-full text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              style={{ backgroundColor: '#EFF2FF' }}
            />

            <input
              type="email"
              name="email"
              placeholder="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border-0 rounded-full text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              style={{ backgroundColor: '#EFF2FF' }}
            />

            <input
              type="password"
              name="password"
              placeholder="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full px-4 py-3 border-0 rounded-full text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              style={{ backgroundColor: '#EFF2FF' }}
            />

            <input
              type="password"
              name="confirmPassword"
              placeholder="confirm password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full px-4 py-3 border-0 rounded-full text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              style={{ backgroundColor: '#EFF2FF' }}
            />

            <button
              type="submit"
              disabled={loading}
              className="mx-auto w-48 bg-blue-600 text-white py-3 px-6 rounded-full font-semibold text-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              style={{ backgroundColor: '#3F6CB9' }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : null}
              Sign Up
            </button>
          </form>

          <div className="text-center text-gray-600">
            <p>Over <span className="text-blue-600 font-semibold">300+</span> prospective homebuyers have already joined</p>
          </div>
        </div>
      </div>

      {/* Right Side - Illustration */}
      <div className="hidden lg:flex flex-1 items-center justify-center m-10">
        <div className="w-full h-full flex items-center justify-center">
          <img 
            src={SignupImage} 
            alt="Home ownership journey image" 
            className="w-full h-full object-cover rounded-2xl"
          />
        </div>
      </div>
    </div>
  )
}

export default SignupPage