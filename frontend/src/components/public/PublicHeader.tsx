import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { NestNavigateLogo, OnestFont } from '../../assets'

const PublicHeader: React.FC = () => {
  const navigate = useNavigate()

  return (
    <header className="bg-pure-white w-full px-6 py-4">
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
              className="text-text-blue-black hover:text-logo-blue transition-colors duration-200"
            >
              <OnestFont weight={500} lineHeight="relaxed">
                How It Works
              </OnestFont>
            </Link>
            <Link 
              to="/about" 
              className="text-text-blue-black hover:text-logo-blue transition-colors duration-200"
            >
              <OnestFont weight={500} lineHeight="relaxed">
                About
              </OnestFont>
            </Link>
            <Link 
              to="/rewards" 
              className="text-text-blue-black hover:text-logo-blue transition-colors duration-200"
            >
              <OnestFont weight={500} lineHeight="relaxed">
                Rewards
              </OnestFont>
            </Link>
            <Link 
              to="/contact" 
              className="text-text-blue-black hover:text-logo-blue transition-colors duration-200"
            >
              <OnestFont weight={500} lineHeight="relaxed">
                Contact
              </OnestFont>
            </Link>
          </nav>

          {/* Sign Up Button */}
          <button
            onClick={() => navigate('/auth/signup')}
            className="bg-logo-blue text-pure-white px-6 py-2 rounded-full hover:opacity-90 transition-opacity duration-200 shadow-sm"
          >
            <OnestFont weight={500} lineHeight="relaxed">
              Sign Up
            </OnestFont>
          </button>
        </div>
      </div>
    </header>
  )
}

export default PublicHeader