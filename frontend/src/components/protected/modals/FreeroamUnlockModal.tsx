import React from 'react';
import { OnestFont, NoticeBirdIcon } from '../../../assets';

// ═══════════════════════════════════════════════════════════════
// FreeRoamUnlockModal — Celebratory modal announcing Free Roam
//
// Appears in HouseScene (rendered by MainLayout via registry bridge)
// when all lesson-mode minigames in a module are completed.
// Styled consistently with the walkthrough fullscreen steps
// (LinearBlue1 gradient background).
// ═══════════════════════════════════════════════════════════════

interface FreeRoamUnlockModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Callback to launch Free Roam mode directly */
  onLaunchFreeRoam: () => void;
  /** Callback to dismiss the modal without launching */
  onDismiss: () => void;
}

const FreeRoamUnlockModal: React.FC<FreeRoamUnlockModalProps> = ({
  isOpen,
  onLaunchFreeRoam,
  onDismiss,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-text-blue-black/60 backdrop-blur-sm"
        onClick={onDismiss}
      />

      {/* Modal — LinearBlue1 gradient, matching walkthrough style */}
      <div
        className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
        style={{
          background: 'linear-gradient(137deg, #1D3CC6 6.84%, #837CFF 97.24%)',
        }}
      >
        {/* Close button */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-pure-white/20 hover:bg-pure-white/30 transition-colors flex items-center justify-center"
          aria-label="Close"
        >
          <svg
            className="w-4 h-4 text-pure-white"
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
        <div className="flex flex-col items-center text-center px-8 pt-10 pb-8">
          {/* Bird image */}
          <div className="w-28 h-28 mb-5">
            <img
              src={NoticeBirdIcon}
              alt="Nest Navigate Bird"
              className="w-full h-full object-contain drop-shadow-lg"
            />
          </div>

          {/* Title */}
          <OnestFont
            as="h2"
            weight={700}
            lineHeight="tight"
            className="text-2xl text-pure-white mb-3"
          >
            Free Roam Unlocked!
          </OnestFont>

          {/* Description */}
          <OnestFont
            weight={300}
            lineHeight="relaxed"
            className="text-sm text-pure-white/85 mb-8"
          >
            You've completed all lesson minigames! Now enter Free Roam to keep
            answering questions, grow your tree to full size, and help the bird
            build her nest.
          </OnestFont>

          {/* CTA Buttons */}
          <div className="space-y-3 w-full">
            <button
              onClick={onLaunchFreeRoam}
              className="w-full py-3 bg-pure-white text-logo-blue rounded-full hover:opacity-90 transition-opacity shadow-lg"
            >
              <OnestFont weight={700} lineHeight="relaxed" className="text-base">
                Let's Go!
              </OnestFont>
            </button>

            <button
              onClick={onDismiss}
              className="w-full py-2 text-pure-white/70 hover:text-pure-white transition-colors"
            >
              <OnestFont weight={300} lineHeight="relaxed" className="text-sm">
                Later
              </OnestFont>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreeRoamUnlockModal;