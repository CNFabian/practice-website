import React from 'react'
import { useNavigate } from 'react-router-dom'
import { OnestFont } from '../../assets'

const SplashPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="text-center">
      
      <div className="space-y-4">
        <button
          onClick={() => navigate('/auth/login')}
          className="w-full bg-logo-blue text-pure-white py-3 px-6 hover:opacity-90 transition-opacity rounded-lg"
        >
          <OnestFont weight={500} lineHeight="relaxed">
            Login
          </OnestFont>
        </button>
        
        <button
          onClick={() => navigate('/auth/signup')}
          className="w-full bg-pure-white text-logo-blue py-3 px-6 border-2 border-logo-blue hover:bg-logo-blue/10 transition-colors rounded-lg"
        >
          <OnestFont weight={500} lineHeight="relaxed">
            Sign Up
          </OnestFont>
        </button>
      </div>

    </div>
  )
}

export default SplashPage