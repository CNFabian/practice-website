import React from 'react'
import { useNavigate } from 'react-router-dom'

const SplashPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="text-center">
      {/* Logo/Brand Section */}
      <div className="mb-8">
        <div className="mx-auto w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
          <span className="text-white text-2xl font-bold">NN</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          NestNavigate
        </h1>
        <p className="text-lg text-gray-600 max-w-sm mx-auto">
          Video-based learning platform with gamification. Start your journey today!
        </p>
      </div>

      {/* CTA Buttons */}
      <div className="space-y-4">
        <button
          onClick={() => navigate('/login')}
          className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold text-lg hover:bg-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
        >
          Login
        </button>
        
        <button
          onClick={() => navigate('/signup')}
          className="w-full bg-white text-indigo-600 py-3 px-6 rounded-lg font-semibold text-lg border-2 border-indigo-600 hover:bg-indigo-50 transform hover:scale-105 transition-all duration-200 shadow-lg"
        >
          Sign Up
        </button>
      </div>

      {/* Footer Text */}
      <div className="mt-8 text-sm text-gray-500">
        <p>Join thousands of learners already on their journey</p>
      </div>
    </div>
  )
}

export default SplashPage