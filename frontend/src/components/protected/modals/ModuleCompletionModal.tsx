import React from 'react';
import { OnestFont, CelebrationImage, CoinStack } from '../../../assets';

// ═══════════════════════════════════════════════════════════════
// ModuleCompletionModal — Celebratory modal for module completion
//
// Displays when a user completes all lessons + passes the module
// quiz, triggering the 250-coin module completion award.
// Styled consistently with FreeroamUnlockModal (LinearBlue1 gradient).
//
// Step 11 placeholder — wire this into the module quiz result flow
// once the module quiz UI is built.
// ═══════════════════════════════════════════════════════════════

interface ModuleCompletionModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Module title to display */
  moduleTitle?: string;
  /** Coins earned (from backend MiniGameResult.coins_earned) */
  coinsEarned?: number;
  /** Callback to return to neighborhood/module list */
  onContinue: () => void;
  /** Callback to dismiss without navigating */
  onDismiss: () => void;
}

const ModuleCompletionModal: React.FC<ModuleCompletionModalProps> = ({
  isOpen,
  moduleTitle,
  coinsEarned = 250,
  onContinue,
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

      {/* Modal — LinearBlue1 gradient, matching celebratory style */}
      <div
        className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-modal-bounce"
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
          {/* Celebration image */}
          <div className="w-28 h-28 mb-4">
            <img
              src={CelebrationImage}
              alt="Module Complete Celebration"
              className="w-full h-full object-contain drop-shadow-lg"
            />
          </div>

          {/* Title */}
          <OnestFont
            as="h2"
            weight={700}
            lineHeight="tight"
            className="text-2xl text-pure-white mb-2"
          >
            Module Complete!
          </OnestFont>

          {/* Module name */}
          {moduleTitle && (
            <OnestFont
              weight={300}
              lineHeight="relaxed"
              className="text-sm text-pure-white/70 mb-4"
            >
              {moduleTitle}
            </OnestFont>
          )}

          {/* Coin reward badge */}
          <div className="flex items-center gap-3 bg-pure-white/15 rounded-2xl px-5 py-3 mb-4">
            <img
              src={CoinStack}
              alt="Nest Coins"
              className="w-10 h-10 object-contain"
            />
            <div className="text-left">
              <OnestFont
                weight={700}
                lineHeight="tight"
                className="text-2xl text-logo-yellow"
              >
                +{coinsEarned}
              </OnestFont>
              <OnestFont
                weight={300}
                lineHeight="tight"
                className="text-xs text-pure-white/80"
              >
                NestCoins Earned
              </OnestFont>
            </div>
          </div>

          {/* Description */}
          <OnestFont
            weight={300}
            lineHeight="relaxed"
            className="text-sm text-pure-white/85 mb-8"
          >
            Congratulations! You've mastered this module. Spend your coins
            in the Reward Shop for real-world perks and discounts.
          </OnestFont>

          {/* CTA Buttons */}
          <div className="space-y-3 w-full">
            <button
              onClick={onContinue}
              className="w-full py-3 bg-pure-white text-logo-blue rounded-full hover:opacity-90 transition-opacity shadow-lg"
            >
              <OnestFont weight={700} lineHeight="relaxed" className="text-base">
                Continue
              </OnestFont>
            </button>

            <button
              onClick={onDismiss}
              className="w-full py-2 text-pure-white/70 hover:text-pure-white transition-colors"
            >
              <OnestFont weight={300} lineHeight="relaxed" className="text-sm">
                Dismiss
              </OnestFont>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleCompletionModal;