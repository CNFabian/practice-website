import React from 'react'
import { useNavigate } from 'react-router-dom'
import OnestFont from './OnestFont'
import { birdHappy } from '../../assets'

interface ErrorPageProps {
  /** Main heading text */
  title: string
  /** Descriptive body text */
  description: string
  /** Button label — defaults to "Back" */
  buttonLabel?: string
  /** Custom click handler — defaults to navigate(-1) */
  onButtonClick?: () => void
  /** Override the default bird mascot image */
  image?: string
  /** Alt text for the image */
  imageAlt?: string
}

/**
 * Shared full-screen error page layout.
 *
 * Used by both the 404 (NotFoundPage) and 500 (ServerErrorPage)
 * screens. Matches the Figma design: centered bird mascot,
 * heading, description, and a pill-shaped "Back" button on a
 * soft radial-gradient background.
 */
const ErrorPage: React.FC<ErrorPageProps> = ({
  title,
  description,
  buttonLabel = 'Back',
  onButtonClick,
  image,
  imageAlt = 'Nest Navigate bird mascot',
}) => {
  const navigate = useNavigate()

  const handleClick = () => {
    if (onButtonClick) {
      onButtonClick()
    } else {
      navigate(-1)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-light-background-blue px-6">
      {/* Soft radial glow behind the bird */}
      <div className="relative flex items-center justify-center mb-6">
        <div
          className="absolute w-64 h-64 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(107,133,245,0.12) 0%, rgba(235,239,255,0) 70%)',
          }}
        />
        <img
          src={image || birdHappy}
          alt={imageAlt}
          className="relative w-44 h-44 object-contain"
          draggable={false}
        />
      </div>

      {/* Heading */}
      <OnestFont
        as="h1"
        weight={700}
        lineHeight="tight"
        className="text-text-blue-black text-2xl md:text-3xl text-center mb-4"
      >
        {title}
      </OnestFont>

      {/* Description */}
      <OnestFont
        as="p"
        weight={300}
        lineHeight="relaxed"
        className="text-text-grey text-base md:text-lg text-center max-w-lg mb-10"
      >
        {description}
      </OnestFont>

      {/* Action button */}
      <button
        onClick={handleClick}
        className="px-16 py-3.5 rounded-full bg-elegant-blue text-pure-white
                   text-base transition-opacity hover:opacity-90 focus:outline-none
                   focus-visible:ring-2 focus-visible:ring-elegant-blue focus-visible:ring-offset-2"
      >
        <OnestFont weight={500} lineHeight="relaxed">
          {buttonLabel}
        </OnestFont>
      </button>
    </div>
  )
}

export default ErrorPage
