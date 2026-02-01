import React, { useState, useEffect } from 'react'
import { LoadingIcon } from '../../assets'
import OnestFont from './OnestFont'

interface LoadingSpinnerProps {
  minDisplayTime?: number
  onMinTimeComplete?: () => void
  onReadyToShow?: boolean
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  minDisplayTime = 2000,
  onMinTimeComplete,
  onReadyToShow = false
}) => {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    console.log('LoadingSpinner: Starting progress animation')
    
    const startTime = Date.now()
    
    const progressTimer = setInterval(() => {
      const elapsed = Date.now() - startTime
      const timeProgress = Math.min((elapsed / minDisplayTime) * 100, 100)
      
      setProgress(timeProgress)
      
      if (elapsed >= minDisplayTime && onReadyToShow) {
        console.log('LoadingSpinner: Completing - min time reached and content ready')
        clearInterval(progressTimer)
        if (onMinTimeComplete) {
          setTimeout(() => onMinTimeComplete(), 100)
        }
      }
    }, 50)

    return () => {
      clearInterval(progressTimer)
    }
  }, [minDisplayTime, onReadyToShow, onMinTimeComplete])

  return (
    // Full-screen modal overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* White background overlay */}
      <div className="absolute inset-0 bg-pure-white"></div>
      
      <div className="relative z-10 text-center max-w-md mx-auto px-6">
        
        {/* Main Loading Image with Progress Fill */}
        <div className="mb-8 flex justify-center">
          <div className="relative w-24 h-24">
            {/* Background LoadingIcon (Outline/Unfilled) */}
            <img 
              src={LoadingIcon} 
              alt="Loading Background" 
              className="absolute inset-0 w-full h-full opacity-30" 
            />
            
            {/* Foreground LoadingIcon (Filled) with Clip Path for Progress */}
            <div 
              className="absolute inset-0 overflow-hidden transition-all duration-100 ease-out"
              style={{
                clipPath: `inset(0 ${100 - progress}% 0 0)`
              }}
            >
              <img 
                src={LoadingIcon} 
                alt="Loading Progress" 
                className="w-full h-full" 
              />
            </div>
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
        
        {/* Progress Percentage */}
        <div className="mb-6">
          <OnestFont 
            as="span" 
            weight={300} 
            lineHeight="relaxed"
            className="text-[17px] text-text-grey"
          >
            {Math.round(progress)}%
          </OnestFont>
        </div>
        
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