import React, { useState, useEffect } from 'react'

interface LoadingSpinnerProps {
  minDisplayTime?: number // in milliseconds, default 2000ms (2 seconds)
  onMinTimeComplete?: () => void // callback when minimum time is reached
  onReadyToShow?: boolean // external signal that content is ready
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  minDisplayTime = 2000,
  onMinTimeComplete,
  onReadyToShow = false
}) => {
  const [hasMetMinTime, setHasMetMinTime] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    // Start the minimum time countdown
    const minTimer = setTimeout(() => {
      setHasMetMinTime(true)
    }, minDisplayTime)

    return () => clearTimeout(minTimer)
  }, [minDisplayTime])

  useEffect(() => {
    // Update progress based on time and readiness
    let progressInterval: NodeJS.Timeout

    if (!isComplete) {
      progressInterval = setInterval(() => {
        setProgress(prev => {
          // Progress moves faster in the beginning, slower near the end
          const timeBasedProgress = Math.min(prev + (100 / (minDisplayTime / 50)), 85)
          
          // If content is ready and min time is met, complete the progress
          if (onReadyToShow && hasMetMinTime && timeBasedProgress >= 85) {
            setIsComplete(true)
            if (onMinTimeComplete) {
              onMinTimeComplete()
            }
            return 100
          }
          
          return timeBasedProgress
        })
      }, 50)
    }

    return () => {
      if (progressInterval) {
        clearInterval(progressInterval)
      }
    }
  }, [hasMetMinTime, onReadyToShow, minDisplayTime, onMinTimeComplete, isComplete])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-6">
        
        {/* Main Loading Image Placeholder */}
        <div className="mb-8 flex justify-center">
          {/* Replace this div with your main loading image */}
          <div className="w-48 h-48 bg-gray-200 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-gray-500 text-sm">Main Loading Image Here</span>
          </div>
        </div>
        
        {/* Loading Text */}
        <p className="text-gray-700 text-xl font-medium mb-8">Loading...</p>
        
        {/* Bird Progress Bar */}
        <div className="w-full max-w-xs mx-auto">
          {/* Progress Bar Container */}
          <div className="relative h-12 flex items-center justify-center">
            
            {/* Bird Icon with Progress Fill */}
            <div className="relative w-10 h-10">
              {/* Background Bird (Outline) - Replace with your bird outline icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-blue-400 rounded-full flex items-center justify-center bg-transparent">
                  <span className="text-blue-400 text-xs">🐦</span>
                </div>
              </div>
              
              {/* Foreground Bird (Filled) with Clip Path - Replace with your filled bird icon */}
              <div 
                className="absolute inset-0 flex items-center justify-center overflow-hidden"
                style={{
                  clipPath: `inset(0 ${100 - progress}% 0 0)`
                }}
              >
                <div className="w-8 h-8 bg-blue-500 border-2 border-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">🐦</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Progress Percentage (Optional - remove if not needed) */}
          <div className="mt-2 text-center">
            <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
          </div>
        </div>
        
        {/* Additional animated dots for extra polish */}
        <div className="mt-6">
          <div className="flex space-x-1 justify-center">
            <div 
              className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: '0s' }}
            ></div>
            <div 
              className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: '0.2s' }}
            ></div>
            <div 
              className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: '0.4s' }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoadingSpinner