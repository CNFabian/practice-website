import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { NestNavigateLogo, OnestFont } from '../../assets'

const PublicHeader: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  // Determine if user is on the signup page
  const isOnSignupPage = location.pathname === '/auth/signup'

  return (
    <header className="bg-pure-white w-full px-6 py-4 border-b border-unavailable-button/30">
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
            <a
              href="https://nestnavigate.com/about/#how-it-works"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-blue-black hover:text-logo-blue transition-colors duration-200"
            >
              <OnestFont weight={500} lineHeight="relaxed">
                How It Works
              </OnestFont>
            </a>
            <a
              href="https://nestnavigate.com/about/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-blue-black hover:text-logo-blue transition-colors duration-200"
            >
              <OnestFont weight={500} lineHeight="relaxed">
                About Us
              </OnestFont>
            </a>
            <a
              href="https://nestnavigate.com/blog/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-blue-black hover:text-logo-blue transition-colors duration-200"
            >
              <OnestFont weight={500} lineHeight="relaxed">
                Blog
              </OnestFont>
            </a>
          </nav>

          {/* Dynamic CTA Button - switches based on current page */}
          <button
            onClick={() => navigate(isOnSignupPage ? '/auth/login' : '/auth/signup')}
            className="bg-logo-blue text-pure-white px-6 py-2 rounded-full hover:opacity-90 transition-opacity duration-200 shadow-sm uppercase tracking-wide"
          >
            <OnestFont weight={700} lineHeight="relaxed">
              {isOnSignupPage ? 'Log In' : 'Get Started'}
            </OnestFont>
          </button>
        </div>
      </div>
    </header>
  )
}

export default PublicHeader