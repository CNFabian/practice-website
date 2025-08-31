import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { NestNavigateLogo } from '../../assets'

const PublicHeader: React.FC = () => {
  const navigate = useNavigate()

  return (
    <header className="bg-white w-full px-6 py-4 border-b border-gray-100">
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

          {/* Sign Up Button - Only one with blue background */}
          <button
            onClick={() => navigate('/auth/signup')}
            className="bg-blue-600 text-white px-6 py-2 rounded-full font-medium hover:bg-blue-700 transition-colors duration-200 shadow-sm"
          >
            Sign Up
          </button>

          {/* Mobile menu button (hidden on desktop) */}
          <button className="md:hidden p-2 text-gray-700 hover:text-gray-900">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}

export default PublicHeader