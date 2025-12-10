import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { NestNavigateLogo } from '../../assets'

const PublicHeader: React.FC = () => {
  const navigate = useNavigate()

  return (
    <header className="bg-white w-full px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Link to="/splash" className="flex items-center">
            <img 
              src={NestNavigateLogo} 
              alt="Nest Navigate" 
              className="h-8 w-auto" 
            />
          </Link>
        </div>

        {/* Right-aligned Navigation */}
        <div className="flex items-center space-x-8">
          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              to="/how-it-works" 
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
            >
              How It Works
            </Link>
            <Link 
              to="/about" 
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
            >
              About
            </Link>
            <Link 
              to="/rewards" 
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
            >
              Rewards
            </Link>
            <Link 
              to="/contact" 
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
            >
              Contact
            </Link>
          </nav>

          {/* Sign Up Button */}
          <button
            onClick={() => navigate('/auth/signup')}
            className="bg-blue-600 text-white px-6 py-2 rounded-full font-medium hover:bg-blue-700 transition-colors duration-200 shadow-sm"
            style={{ backgroundColor: '#3F6CB9' }}

          >
            Sign Up
          </button>
        </div>
      </div>
    </header>
  )
}

export default PublicHeader