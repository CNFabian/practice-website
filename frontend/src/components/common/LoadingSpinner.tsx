import React from 'react'
import { LoadingIcon } from '../../assets'
import OnestFont from './OnestFont'

const LoadingSpinner: React.FC = () => {
  return (
    // Full-screen modal overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* White background overlay */}
      <div className="absolute inset-0 bg-pure-white"></div>

      <div className="relative z-10 text-center max-w-md mx-auto px-6">
        {/* Main Loading Image */}
        <div className="mb-8 flex justify-center">
          <div className="relative w-24 h-24">
            <img
              src={LoadingIcon}
              alt="Loading"
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Loading Text */}
        <OnestFont
          as="p"
          weight={500}
          lineHeight="relaxed"
          className="text-text-blue-black text-[30px] mb-8"
        >
          Loading...
        </OnestFont>

        {/* Animated dots */}
        <div className="mt-6">
          <div className="flex space-x-1 justify-center">
            <div
              className="w-2 h-2 bg-elegant-blue rounded-full animate-bounce"
              style={{ animationDelay: '0s' }}
            ></div>
            <div
              className="w-2 h-2 bg-elegant-blue rounded-full animate-bounce"
              style={{ animationDelay: '0.2s' }}
            ></div>
            <div
              className="w-2 h-2 bg-elegant-blue rounded-full animate-bounce"
              style={{ animationDelay: '0.4s' }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoadingSpinner