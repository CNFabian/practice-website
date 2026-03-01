import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { OnestFont, birdStandingNest } from '../../../assets';
import CloseButton from '../../../components/common/CloseButton';

// ═══════════════════════════════════════════════════════════════
// GYNWelcomeModal — Shown once at the start of the Grow Your
// Tree minigame to introduce the concept before gameplay begins.
//
// Design: Light-blue card with bird-in-nest image, welcome title,
// descriptive text, and a blue pill "Let's go" button.
// ═══════════════════════════════════════════════════════════════

interface GYNWelcomeModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Callback when user clicks "Let's go" or dismisses */
  onDismiss: () => void;
}

const GYNWelcomeModal: React.FC<GYNWelcomeModalProps> = ({
  isOpen,
  onDismiss,
}) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-text-blue-black/50 backdrop-blur-sm"
        onClick={onDismiss}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-sm rounded-2xl overflow-visible shadow-2xl animate-gyn-modal-bounce"
        style={{ background: 'linear-gradient(180deg, #EDF0FF 0%, #DDE3FF 100%)' }}
      >
        {/* Close (X) button — inside top right */}
        <CloseButton onClick={onDismiss} className="absolute top-4 right-4 z-10" />

        <div className="flex flex-col items-center text-center px-8 pt-8 pb-8">
          {/* Bird in nest image */}
          <div className="mb-4">
            <img
              src={birdStandingNest}
              alt="Bird standing in nest"
              className="w-28 h-28 object-contain"
            />
          </div>

          {/* Title */}
          <OnestFont
            weight={700}
            lineHeight="tight"
            className="text-xl text-logo-blue mb-3"
          >
            Welcome to Grow Your Tree
          </OnestFont>

          {/* Description */}
          <OnestFont
            weight={300}
            lineHeight="relaxed"
            className="text-sm text-text-grey mb-6"
          >
            This bird needs a home{'\n'}
            Help grow a strong tree so it can build its nest.{'\n'}
            Answer questions, earn rewards,{'\n'}
            and watch your tree grow.
          </OnestFont>

          {/* Let's go button — blue pill */}
          <button
            onClick={onDismiss}
            className="w-full max-w-[260px] py-3.5 rounded-full hover:opacity-90 transition-opacity shadow-lg"
            style={{
              background: 'linear-gradient(180deg, #3658EC 0%, #4A6CF7 100%)',
            }}
          >
            <OnestFont
              weight={700}
              lineHeight="relaxed"
              className="text-base text-pure-white tracking-wide"
            >
              Let's go
            </OnestFont>
          </button>
        </div>
      </div>

      {/* Animation */}
      <style>{`
        .animate-gyn-modal-bounce {
          animation: gynModalBounce 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes gynModalBounce {
          from { opacity: 0; transform: scale(0.9) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>,
    document.body
  );
};

export default GYNWelcomeModal;
