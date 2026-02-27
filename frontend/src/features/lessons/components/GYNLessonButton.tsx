import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MinigameIcon } from '../../../assets';

// ═══════════════════════════════════════════════════════════════
// GYNLessonButton — 3-state circular button for lesson minigame
// ═══════════════════════════════════════════════════════════════
//
// State 1 — Inactive:  Lesson not completed yet (muted/grayed)
// State 2 — Active:    Lesson complete, GYN not played (vibrant, pulse)
// State 3 — Completed: GYN already played (green checkmark)
// ═══════════════════════════════════════════════════════════════

type ButtonState = 'inactive' | 'active' | 'completed';

interface GYNLessonButtonProps {
  /** Whether the lesson video/reading has been completed */
  lessonCompleted: boolean;
  /** Whether the GYN minigame has been played for this lesson */
  gynPlayed: boolean;
  /** Callback to launch the lesson-mode minigame */
  onPlay: () => void;
  /** True while lesson data is still being fetched from backend */
  isLoading: boolean;
}

const deriveButtonState = (lessonCompleted: boolean, gynPlayed: boolean): ButtonState => {
  if (!lessonCompleted) return 'inactive';
  if (gynPlayed) return 'completed';
  return 'active';
};

const GYNLessonButton: React.FC<GYNLessonButtonProps> = ({
  lessonCompleted,
  gynPlayed,
  onPlay,
  isLoading,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buttonState = deriveButtonState(lessonCompleted, gynPlayed);

  useEffect(() => {
    return () => {
      if (tooltipTimerRef.current) {
        clearTimeout(tooltipTimerRef.current);
        tooltipTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    setShowTooltip(false);
    if (tooltipTimerRef.current) {
      clearTimeout(tooltipTimerRef.current);
      tooltipTimerRef.current = null;
    }
  }, [buttonState]);

  const showTooltipBriefly = useCallback(() => {
    if (tooltipTimerRef.current) {
      clearTimeout(tooltipTimerRef.current);
    }
    setShowTooltip(true);
    tooltipTimerRef.current = setTimeout(() => {
      setShowTooltip(false);
      tooltipTimerRef.current = null;
    }, 4000);
  }, []);

  const handleClick = useCallback(() => {
    if (isLoading) return;

    switch (buttonState) {
      case 'inactive':
      case 'completed':
        showTooltipBriefly();
        break;
      case 'active':
        setShowTooltip(false);
        if (tooltipTimerRef.current) {
          clearTimeout(tooltipTimerRef.current);
          tooltipTimerRef.current = null;
        }
        onPlay();
        break;
    }
  }, [isLoading, buttonState, showTooltipBriefly, onPlay]);

  const tooltipMessage = buttonState === 'inactive'
    ? 'Complete this lesson to unlock the minigame.'
    : buttonState === 'completed'
      ? 'Minigame complete! Move on to the next lesson.'
      : 'Play Grow Your Nest';

  if (isLoading) {
    return (
      <div className="w-12 h-12 rounded-full bg-unavailable-button/30 animate-pulse" />
    );
  }

  return (
    <div className="relative inline-flex">
      <button
        onClick={handleClick}
        className={`
          w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200
          ${buttonState === 'inactive'
            ? 'bg-unavailable-button/20 cursor-default opacity-60'
            : buttonState === 'active'
              ? 'bg-logo-blue hover:bg-logo-blue/90 cursor-pointer gyn-pulse-ring shadow-sm'
              : 'bg-status-green/30 cursor-default border border-status-green/40'
          }
        `}
        aria-label={
          buttonState === 'inactive'
            ? 'Minigame locked — complete lesson first'
            : buttonState === 'active'
              ? 'Play Grow Your Nest minigame'
              : 'Minigame completed'
        }
      >
        {buttonState === 'completed' ? (
          <svg className="w-5 h-5 text-status-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <img
            src={MinigameIcon}
            alt=""
            className={`w-7 h-7 object-contain ${buttonState === 'inactive' ? 'grayscale opacity-50' : ''}`}
          />
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div
          className="absolute right-0 top-full mt-2 z-[9998] animate-fade-in whitespace-nowrap"
          role="tooltip"
        >
          <div className="bg-pure-white rounded-lg shadow-lg border border-unavailable-button/20 px-3 py-2">
            <p className="text-xs text-text-blue-black font-medium">
              {tooltipMessage}
            </p>
          </div>
          <div className="absolute right-4 -top-1.5 w-3 h-3 bg-pure-white border-l border-t border-unavailable-button/20 rotate-45" />
        </div>
      )}

      <style>{`
        .gyn-pulse-ring {
          animation: gynPulse 6s ease-in-out infinite;
        }
        @keyframes gynPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(54, 88, 236, 0.3); }
          50% { box-shadow: 0 0 0 8px rgba(54, 88, 236, 0); }
        }
        .animate-fade-in {
          animation: gynFadeIn 0.15s ease-out;
        }
        @keyframes gynFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default GYNLessonButton;
