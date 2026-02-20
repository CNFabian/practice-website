import React, { useState, useCallback, useRef, useEffect } from 'react';
import { OnestFont, NoticeBirdIcon, CoinStack, TreasureChest } from '../../../assets';
import { updateUserProfile } from '../../../services/authAPI';

// ═══════════════════════════════════════════════════════════════
// FreeRoamUnlockModal — Multi-step celebratory + phone verification
//
// Step 1: Congratulations modal (LinearBlue1 gradient, treasure chest)
//         Matches walkthrough fullscreen step design.
// Step 2: Phone verification prompt (light background, bird mascot)
//         Prompts user to verify phone for rewards.
// Step 3: Phone number input form
//         Collects and saves phone via profile update API.
//
// Rendered by MainLayout via Phaser registry bridge when all
// lesson-mode minigames in a module are completed.
// ═══════════════════════════════════════════════════════════════

type ModalStep = 'congratulations' | 'phone-prompt' | 'phone-input';

interface FreeRoamUnlockModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Module title to display in congratulations */
  moduleTitle?: string;
  /** Coins earned for completing the module */
  coinsEarned?: number;
  /** Callback to launch Free Roam mode directly */
  onLaunchFreeRoam: () => void;
  /** Callback to dismiss the modal without launching */
  onDismiss: () => void;
}

const FreeRoamUnlockModal: React.FC<FreeRoamUnlockModalProps> = ({
  isOpen,
  moduleTitle = 'Homebuying Foundations',
  coinsEarned = 250,
  onLaunchFreeRoam,
  onDismiss,
}) => {
  const [step, setStep] = useState<ModalStep>('congratulations');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('congratulations');
      setPhoneNumber('');
      setIsSubmitting(false);
      setSubmitError('');
      setSubmitSuccess(false);
    }
  }, [isOpen]);

  // Auto-focus phone input when step changes
  useEffect(() => {
    if (step === 'phone-input' && phoneInputRef.current) {
      phoneInputRef.current.focus();
    }
  }, [step]);

  const handleContinueToPhonePrompt = useCallback(() => {
    setStep('phone-prompt');
  }, []);

  const handleLetsGo = useCallback(() => {
    setStep('phone-input');
  }, []);

  const handleSkipPhone = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  const formatPhoneNumber = useCallback((value: string): string => {
    // Strip non-digits
    const digits = value.replace(/\D/g, '');
    // Format as (XXX) XXX-XXXX
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }, []);

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
    setSubmitError('');
  }, [formatPhoneNumber]);

  const handleSubmitPhone = useCallback(async () => {
    // Extract digits only for validation
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length < 10) {
      setSubmitError('Please enter a valid 10-digit phone number.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      await updateUserProfile({ phone: digits });
      setSubmitSuccess(true);
      // Auto-dismiss after showing success
      setTimeout(() => {
        onLaunchFreeRoam();
      }, 1500);
    } catch (err) {
      console.error('❌ Failed to save phone number:', err);
      setSubmitError('Failed to save phone number. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [phoneNumber, onLaunchFreeRoam]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSubmitting) {
      handleSubmitPhone();
    }
  }, [handleSubmitPhone, isSubmitting]);

  if (!isOpen) return null;

  // ─── Step 1: Congratulations ─────────────────────────────
  const renderCongratulations = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-text-blue-black/60 backdrop-blur-sm" />

      {/* Modal — LinearBlue1 gradient, matching walkthrough style */}
      <div
        className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-modal-bounce"
        style={{
          background: 'linear-gradient(137deg, #1D3CC6 6.84%, #837CFF 97.24%)',
        }}
      >
        <div className="flex flex-col items-center text-center px-8 pt-10 pb-8">
          {/* Treasure chest + coin stack — same layout as walkthrough welcome-gift */}
          <div className="relative mb-8 w-48 h-40">
            <img
              src={TreasureChest}
              alt=""
              className="absolute right-0 top-0 w-36 h-36 object-contain"
            />
            <img
              src={CoinStack}
              alt=""
              className="absolute left-0 bottom-0 w-28 h-28 object-contain z-10"
            />
          </div>

          {/* Title */}
          <OnestFont
            as="h2"
            weight={700}
            lineHeight="tight"
            className="text-2xl text-pure-white mb-3"
          >
            Congratulations on completing {moduleTitle}!
          </OnestFont>

          {/* Description */}
          <OnestFont
            weight={300}
            lineHeight="relaxed"
            className="text-sm text-pure-white/85 mb-8"
          >
            You have earned{' '}
            <span className="font-bold text-pure-white">{coinsEarned} coins</span>{' '}
            for completing this module! You have unlocked Free Roam mode and you can now reach the final stage in Grow Your Tree!
          </OnestFont>

          {/* Continue button */}
          <button
            onClick={handleContinueToPhonePrompt}
            className="w-full max-w-xs py-3 bg-pure-white rounded-full hover:opacity-90 transition-opacity shadow-lg"
          >
            <OnestFont weight={700} lineHeight="relaxed" className="text-base text-elegant-blue tracking-wide">
              CONTINUE
            </OnestFont>
          </button>
        </div>
      </div>
    </div>
  );

  // ─── Step 2: Phone Verification Prompt ───────────────────
  const renderPhonePrompt = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-text-blue-black/60 backdrop-blur-sm" />

      {/* Modal — Light background */}
      <div className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl bg-text-white">
        {/* Close button */}
        <button
          onClick={handleSkipPhone}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-unavailable-button/20 hover:bg-unavailable-button/30 transition-colors flex items-center justify-center"
          aria-label="Close"
        >
          <svg
            className="w-4 h-4 text-text-grey"
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

        <div className="flex flex-col items-center text-center px-8 pt-10 pb-8">
          {/* Bird mascot */}
          <div className="w-36 h-36 mb-6">
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
            className="text-2xl text-logo-blue mb-4"
          >
            You've completed the first module!
          </OnestFont>

          {/* Description */}
          <OnestFont
            weight={500}
            lineHeight="relaxed"
            className="text-base text-text-blue-black mb-8"
          >
            You have earned {coinsEarned} coins for completing this module!
            {'\n'}To proceed onto the next lesson, we'd like to verify your phone number so we can make sure rewards are sent to you when we officially launch and coins go live!
          </OnestFont>

          {/* LET'S GO button */}
          <button
            onClick={handleLetsGo}
            className="w-full max-w-xs py-4 rounded-full hover:opacity-90 transition-opacity shadow-lg"
            style={{
              background: 'linear-gradient(137deg, #1D3CC6 6.84%, #837CFF 97.24%)',
            }}
          >
            <OnestFont weight={700} lineHeight="relaxed" className="text-lg text-pure-white tracking-wide">
              LET'S GO
            </OnestFont>
          </button>
        </div>
      </div>
    </div>
  );

  // ─── Step 3: Phone Number Input ──────────────────────────
  const renderPhoneInput = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-text-blue-black/60 backdrop-blur-sm" />

      {/* Modal — Light background */}
      <div className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl bg-text-white">
        {/* Close / Skip button */}
        <button
          onClick={handleSkipPhone}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-unavailable-button/20 hover:bg-unavailable-button/30 transition-colors flex items-center justify-center"
          aria-label="Close"
        >
          <svg
            className="w-4 h-4 text-text-grey"
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

        <div className="flex flex-col items-center text-center px-8 pt-10 pb-8">
          {/* Bird mascot */}
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
            className="text-2xl text-logo-blue mb-2"
          >
            Verify Your Phone Number
          </OnestFont>

          {/* Description */}
          <OnestFont
            weight={500}
            lineHeight="relaxed"
            className="text-sm text-text-grey mb-6"
          >
            Enter your phone number below so we can send you rewards when we officially launch.
          </OnestFont>

          {/* Phone input */}
          <div className="w-full max-w-xs mb-4">
            <input
              ref={phoneInputRef}
              type="tel"
              value={phoneNumber}
              onChange={handlePhoneChange}
              onKeyDown={handleKeyDown}
              placeholder="(555) 123-4567"
              className="w-full px-4 py-3 rounded-xl border-2 border-unavailable-button/40 bg-pure-white text-text-blue-black text-center text-lg focus:border-logo-blue focus:outline-none transition-colors"
              maxLength={14}
              disabled={isSubmitting || submitSuccess}
            />
          </div>

          {/* Error message */}
          {submitError && (
            <OnestFont
              weight={500}
              lineHeight="relaxed"
              className="text-sm text-status-red mb-3"
            >
              {submitError}
            </OnestFont>
          )}

          {/* Success message */}
          {submitSuccess && (
            <OnestFont
              weight={700}
              lineHeight="relaxed"
              className="text-sm text-status-green mb-3"
            >
              Phone number saved! Launching Free Roam...
            </OnestFont>
          )}

          {/* Submit button */}
          <button
            onClick={handleSubmitPhone}
            disabled={isSubmitting || submitSuccess}
            className={`w-full max-w-xs py-3 rounded-full transition-opacity shadow-lg ${
              isSubmitting || submitSuccess
                ? 'opacity-60 cursor-not-allowed'
                : 'hover:opacity-90'
            }`}
            style={{
              background: 'linear-gradient(137deg, #1D3CC6 6.84%, #837CFF 97.24%)',
            }}
          >
            <OnestFont weight={700} lineHeight="relaxed" className="text-base text-pure-white tracking-wide">
              {isSubmitting ? 'Saving...' : submitSuccess ? 'Saved!' : 'VERIFY'}
            </OnestFont>
          </button>

          {/* Skip link */}
          {!submitSuccess && (
            <button
              onClick={handleSkipPhone}
              className="mt-3 py-2 text-text-grey hover:text-text-blue-black transition-colors"
            >
              <OnestFont weight={300} lineHeight="relaxed" className="text-sm">
                Skip for now
              </OnestFont>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Render based on current step
  switch (step) {
    case 'congratulations':
      return renderCongratulations();
    case 'phone-prompt':
      return renderPhonePrompt();
    case 'phone-input':
      return renderPhoneInput();
    default:
      return null;
  }
};

export default FreeRoamUnlockModal;