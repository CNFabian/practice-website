import React from 'react';
import { OnestFont } from '../../../assets';
import { NoticeBirdIcon } from '../../../assets';

interface GrowYourNestPromptModalProps {
  isOpen: boolean;
  onPlay: () => void;
  onDismiss: () => void;
  lessonTitle?: string;
}

const GrowYourNestPromptModal: React.FC<GrowYourNestPromptModalProps> = ({
  isOpen,
  onPlay,
  onDismiss,
  lessonTitle,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-text-blue-black/60 backdrop-blur-sm"
        onClick={onDismiss}
      />

      {/* Modal */}
      <div className="relative bg-pure-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden animate-modal-bounce">
        {/* Close button */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-light-background-blue hover:bg-tab-active transition-colors"
        >
          <svg
            className="w-5 h-5 text-text-grey"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Content */}
        <div className="flex flex-col items-center text-center px-6 pt-8 pb-6">
          {/* Bird image */}
          <div className="w-28 h-28 mb-4">
            <img
              src={NoticeBirdIcon}
              alt="Nest Navigate Bird"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Title */}
          <OnestFont
            as="h2"
            weight={700}
            lineHeight="tight"
            className="text-xl text-text-blue-black mb-2"
          >
            Time to Grow Your Tree!
          </OnestFont>

          {/* Description */}
          <OnestFont
            weight={300}
            lineHeight="relaxed"
            className="text-sm text-text-grey mb-1"
          >
            Great job finishing{lessonTitle ? ` "${lessonTitle}"` : ' that lesson'}! A little bird needs your help — answer 3 quick questions to water her tree so she can build a nest.
          </OnestFont>

          {/* Mechanic hint */}
          <OnestFont
            weight={300}
            lineHeight="relaxed"
            className="text-xs text-unavailable-button mb-6"
          >
            Correct answers = water 💧 · 3 in a row = fertilizer bonus 🌿
          </OnestFont>

          {/* CTA Buttons */}
          <div className="space-y-3 w-full">
            <button
              onClick={onPlay}
              className="w-full py-3 bg-logo-blue text-pure-white rounded-full hover:opacity-90 transition-opacity"
            >
              <OnestFont weight={700} lineHeight="relaxed" className="text-base">
                Let's Grow!
              </OnestFont>
            </button>

            <button
              onClick={onDismiss}
              className="w-full py-2 text-text-grey hover:text-text-blue-black transition-colors"
            >
              <OnestFont weight={300} lineHeight="relaxed" className="text-sm">
                Maybe Later
              </OnestFont>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrowYourNestPromptModal;