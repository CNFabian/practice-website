import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  NestNavigateLogo,
  FacebookIcon,
  TwitterIcon,
  InstagramIcon,
  LinkedInIcon,
  YouTubeIcon
 } from '../../assets'

const PublicFooter: React.FC = () => {
  const navigate = useNavigate()
  
  return (
    <footer className="bg-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Main Footer Content */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-8 lg:space-y-0">
          
          {/* Left Section - Logo and Copyright */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center">
              <Link to="/splash" className="flex items-center">
                <img 
                  src={NestNavigateLogo} 
                  alt="Nest Navigate" 
                  className="h-8 w-auto" 
                />
              </Link>
            </div>
            <p className="text-gray-500 text-sm">
             © 2025 Nest Navigate, Inc. All rights reserved.
            </p>
          </div>

          {/* Center Section - Navigation Links + Sign Up Button */}
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8">
            {/* Navigation Links */}
            <nav className="flex flex-wrap gap-x-8 gap-y-4 justify-center">
              <Link 
                to="/how-it-works" 
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors text-sm"
              >
                How It Works
              </Link>
              <Link 
                to="/about" 
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors text-sm"
              >
                About
              </Link>
              <Link 
                to="/rewards" 
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors text-sm"
              >
                Rewards
              </Link>
              <Link 
                to="/contact" 
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors text-sm"
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

          {/* Right Section - Social Media Icons */}
          <div className="flex items-center space-x-4">
            <a 
              href="#" 
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="YouTube"
            >
              <img src={YouTubeIcon} alt="YouTube" className="w-7 h-7" />
            </a>
            
            <a 
              href="#" 
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Facebook"
            >
              <img src={FacebookIcon} alt="Facebook" className="w-7 h-7" />
            </a>

            <a 
              href="#" 
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Twitter"
            >
              <img src={TwitterIcon} alt="Twitter" className="w-7 h-7" />
            </a>
            
            <a 
              href="#" 
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Instagram"
            >
              <img src={InstagramIcon} alt="Instagram" className="w-7 h-7" />
            </a>
            
            <a 
              href="#" 
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="LinkedIn"
            >
              <img src={LinkedInIcon} alt="LinkedIn" className="w-7 h-7" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default PublicFooter