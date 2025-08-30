import React from 'react'
import { Link, useNavigate } from 'react-router-dom'

const PublicHeader: React.FC = () => {
  const navigate = useNavigate()

  return (
    <header className="bg-white w-full px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Link to="/splash" className="flex items-center space-x-2">
            {/* Nest Navigate Logo - you'll need to add the actual logo */}
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">NN</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">Nest Navigate</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link to="/how-it-works" className="text-gray-700 hover:text-blue-600 font-medium">
            How It Works
          </Link>
          <Link to="/about" className="text-gray-700 hover:text-blue-600 font-medium">
            About
          </Link>
          <Link to="/rewards" className="text-gray-700 hover:text-blue-600 font-medium">
            Rewards
          </Link>
          <Link to="/contact" className="text-gray-700 hover:text-blue-600 font-medium">
            Contact
          </Link>
        </nav>

        {/* Sign Up Button */}
        <button
          onClick={() => navigate('/signup')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Sign Up
        </button>
      </div>
    </header>
  )
}

export default PublicHeader