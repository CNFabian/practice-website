import { useState, useEffect, type ReactNode } from 'react'
import { OnestFont } from '../../assets'

interface MobileGateProps {
  children: ReactNode
}

const DESKTOP_MIN_WIDTH = 1024

export default function MobileGate({ children }: MobileGateProps) {
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    return window.innerWidth >= DESKTOP_MIN_WIDTH
  })

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= DESKTOP_MIN_WIDTH)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (isDesktop) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-light-background-blue flex items-center justify-center p-6">
      <div className="bg-pure-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        {/* Icon */}
        <div className="w-16 h-16 bg-light-background-blue rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-8 h-8 text-logo-blue"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>

        {/* Title */}
        <OnestFont
          as="h1"
          weight={700}
          className="text-text-blue-black text-2xl mb-3"
        >
          Desktop Only
        </OnestFont>

        {/* Message */}
        <OnestFont
          as="p"
          weight={500}
          className="text-text-grey text-base mb-6 leading-relaxed"
        >
          NestNavigate Beta is currently optimized for desktop browsers. 
          Please visit us from a laptop or desktop computer for the best experience.
        </OnestFont>

        {/* Divider */}
        <div className="border-t border-unavailable-button/30 my-6" />

        {/* Footer hint */}
        <OnestFont
          as="p"
          weight={500}
          className="text-unavailable-button text-sm"
        >
          Mobile support is coming soon!
        </OnestFont>
      </div>
    </div>
  )
}