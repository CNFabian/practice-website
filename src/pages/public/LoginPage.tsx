import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { loginUser, getCurrentUser } from '../../services/authAPI'
import { setUser } from '../../store/slices/authSlice'
import { LoginImage } from '../../assets'

const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
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
      console.log('LoginPage: Starting login process...');
      
      // Call login API (tokens are handled automatically)
      await loginUser({
        email: formData.email,
        password: formData.password
      });
      console.log('LoginPage: Login successful, fetching user profile...');
      
      // Get current user profile from backend (already mapped by authAPI)
      const userProfile = await getCurrentUser();
      console.log('LoginPage: User profile fetched:', userProfile);
      
      // FIXED: userProfile is already in Redux format from authAPI utility
      dispatch(setUser(userProfile));
      
      console.log('LoginPage: Redux updated, navigating to /app');
      navigate('/app');
      
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

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-6 lg:px-8 my-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome Back!
            </h1>
            <p className="text-gray-600 text-lg">
              Sign in to continue your learning journey
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                {error}
              </div>
            )}

            <input
              type="email"
              name="email"
              placeholder="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border-0 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              style={{ backgroundColor: '#EFF2FF' }}
            />

            <input
              type="password"
              name="password"
              placeholder="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border-0 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              style={{ backgroundColor: '#EFF2FF' }}
            />

            <div className="flex items-center">
              <input
                id="stayLoggedIn"
                name="stayLoggedIn"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="stayLoggedIn" className="ml-2 block text-sm text-gray-700">
                Stay logged in
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mx-auto w-48 bg-blue-600 text-white py-3 px-6 rounded-full font-semibold text-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              style={{ backgroundColor: '#3F6CB9' }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : null}
              Log In
            </button>
          </form>

          <div className="text-center text-gray-600">
            <p>No account yet? Register <a href='/auth/signup' className="text-blue-600 hover:underline">here</a></p>
          </div>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:flex flex-1 items-center justify-center m-10">
        <div className="w-full h-full flex items-center justify-center">
          <img 
            src={LoginImage} 
            alt="Home ownership journey image" 
            className="w-full h-full object-cover rounded-2xl"
          />
        </div>
      </div>
    </div>
  )
}

export default LoginPage