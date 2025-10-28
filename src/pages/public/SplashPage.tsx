import React from 'react'
import { useNavigate } from 'react-router-dom'

const SplashPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="text-center">
      
      <div className="space-y-4">
        <button
          onClick={() => navigate('/login')}
          className="w-full bg-indigo-600 text-white py-3 px-6"
        >
          Login
        </button>
        
        <button
          onClick={() => navigate('/signup')}
          className="w-full bg-white text-indigo-600 py-3 px-6 "
        >
          Sign Up
        </button>
      </div>

    </div>
  )
}

export default SplashPage