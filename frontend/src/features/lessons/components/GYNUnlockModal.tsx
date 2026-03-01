import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { OnestFont, MinigameIcon } from '../../../assets';
import CloseButton from '../../../components/common/CloseButton';

// ═══════════════════════════════════════════════════════════════
// GYNUnlockModal — Shown when a lesson is completed and the
// lesson minigame (Grow Your Nest) unlocks.
//
// Design: White card with two controller icons connected by a
// dashed line (grey = lesson completed, coloured = minigame
// unlocked), text, and a blue pill "PLAY MINI GAME" button.
// ═══════════════════════════════════════════════════════════════

interface GYNUnlockModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Lesson title to display */
  lessonTitle?: string;
  /** Callback to launch the minigame directly */
  onPlayNow: () => void;
  /** Callback to dismiss modal without launching */
  onDismiss: () => void;
}

const GYNUnlockModal: React.FC<GYNUnlockModalProps> = ({
  isOpen,
  lessonTitle: _lessonTitle,
  onPlayNow,
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

  // Use portal to render at document root so the overlay covers
  // everything including the sidebar (which is z-50)
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-text-blue-black/50 backdrop-blur-sm"
        onClick={onDismiss}
      />

      {/* Modal Card — White background, rounded */}
      <div className="relative w-full max-w-xs rounded-2xl overflow-visible shadow-2xl bg-text-white animate-gyn-modal-bounce">
        {/* Close (X) button — top right */}
        <CloseButton onClick={onDismiss} className="absolute top-4 right-4 z-10" />

        <div className="flex flex-col items-center text-center px-6 pt-8 pb-6">
          {/* Controller icons with dashed connector */}
          <div className="flex items-center gap-0 mb-6">
            {/* Left controller — grey circle (lesson completed, desaturated) */}
            <div className="w-14 h-14 rounded-full bg-unavailable-button/20 flex items-center justify-center">
              <img
                src={MinigameIcon}
                alt="Lesson completed"
                className="w-7 h-7 object-contain grayscale"
              />
            </div>

            {/* Dashed connector line */}
            <div
              className="w-10 border-t-2 border-dashed"
              style={{ borderColor: '#B0B0B0' }}
            />

            {/* Right controller — blue circle (minigame unlocked) */}
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(54, 88, 236, 0.12)' }}
            >
              <img
                src={MinigameIcon}
                alt="Minigame unlocked"
                className="w-7 h-7 object-contain"
              />
            </div>
          </div>

          {/* Title — "Lesson completed" */}
          <OnestFont
            weight={700}
            lineHeight="tight"
            className="text-base text-text-blue-black mb-1"
          >
            Lesson completed
          </OnestFont>

          {/* Subtitle — "Your minigame - Grow Your Tree is now unlocked" */}
          <OnestFont
            weight={300}
            lineHeight="relaxed"
            className="text-sm text-text-grey mb-6"
          >
            Your minigame - Grow Your Tree is now unlocked
          </OnestFont>

          {/* Play Mini Game button — blue pill */}
          <button
            onClick={onPlayNow}
            className="w-full max-w-[220px] py-3.5 rounded-full hover:opacity-90 transition-opacity shadow-lg"
            style={{
              background: 'linear-gradient(180deg, #3658EC 0%, #4A6CF7 100%)',
            }}
          >
            <OnestFont
              weight={700}
              lineHeight="relaxed"
              className="text-base text-pure-white tracking-wide"
            >
              PLAY MINI GAME
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

export default GYNUnlockModal;
