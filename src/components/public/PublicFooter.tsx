import React from 'react'
import { Link } from 'react-router-dom'
import { 
  NestNavigateLogo,
  FacebookIcon,
  TwitterIcon,
  InstagramIcon,
  LinkedInIcon,
  YouTubeIcon
 } from '../../assets'

// Import PDF documents as URLs using Vite's explicit URL imports
import AccessibilityDoc from '../../assets/downloadables/Accessibility_Statement.pdf?url'
import PrivacyPolicyDoc from '../../assets/downloadables/Privacy_Policy.pdf?url'
import TermsConditionsDoc from '../../assets/downloadables/Terms_Conditions.pdf?url'

const PublicFooter: React.FC = () => {
  const openWordDocument = (docUrl: string) => {
    window.open(docUrl, '_blank')
  }
  
  return (
    <>
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

          {/* Bottom Section - Legal Links and Blog */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              {/* Legal Links */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <button
                  onClick={() => openWordDocument(AccessibilityDoc)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Accessibility
                </button>
                <button
                  onClick={() => openWordDocument(PrivacyPolicyDoc)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Privacy Policy
                </button>
                <button
                  onClick={() => openWordDocument(TermsConditionsDoc)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Terms & Conditions
                </button>
              </div>

              {/* Discreet Blog Link */}
              <a
                href="#"
                className="text-xs text-gray-400 hover:text-gray-500 transition-colors"
              >
                Blog
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default PublicFooter;