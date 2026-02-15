import React, { useState, useEffect, useRef, useCallback } from 'react';
import { OnestFont, NoticeBirdIcon } from '../../../assets';

// ═══════════════════════════════════════════════════════════════
// GYNLessonButton — 3-state persistent button for lesson minigame
// ═══════════════════════════════════════════════════════════════
//
// State 1 — Inactive:  Lesson not completed yet (muted/grayed)
// State 2 — Active:    Lesson complete, GYN not played (vibrant, pulse)
// State 3 — Completed: GYN already played (green checkmark)
//
// Replaces the GYN prompt modal interception system with a
// user-initiated, always-visible button in LessonView.
// ═══════════════════════════════════════════════════════════════

type ButtonState = 'inactive' | 'active' | 'completed';

interface GYNLessonButtonProps {
  /** Whether the lesson video/reading has been completed (from backendLessonData.is_completed) */
  lessonCompleted: boolean;
  /** Whether the GYN minigame has been played for this lesson (from backendLessonData.grow_your_nest_played) */
  gynPlayed: boolean;
  /** Callback to launch the lesson-mode minigame */
  onPlay: () => void;
  /** True while lesson data is still being fetched from backend */
  isLoading: boolean;
}

/** Derive the button state from server-driven fields */
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

  // ── Cleanup tooltip timer on unmount ──
  useEffect(() => {
    return () => {
      if (tooltipTimerRef.current) {
        clearTimeout(tooltipTimerRef.current);
        tooltipTimerRef.current = null;
      }
    };
  }, []);

  // ── Hide tooltip when button state changes ──
  useEffect(() => {
    setShowTooltip(false);
    if (tooltipTimerRef.current) {
      clearTimeout(tooltipTimerRef.current);
      tooltipTimerRef.current = null;
    }
  }, [buttonState]);

  /** Show tooltip for inactive/completed states, auto-dismiss after 4s */
  const showTooltipBriefly = useCallback(() => {
    // Clear any existing timer
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
        // Dismiss tooltip if open, then launch
        setShowTooltip(false);
        if (tooltipTimerRef.current) {
          clearTimeout(tooltipTimerRef.current);
          tooltipTimerRef.current = null;
        }
        onPlay();
        break;
    }
  }, [isLoading, buttonState, showTooltipBriefly, onPlay]);

  // ── Tooltip messages per state ──
  const tooltipMessage = buttonState === 'inactive'
    ? 'Complete this lesson by watching the video or clicking Finish Lesson in the reading view to unlock the minigame.'
    : 'You\'ve already completed this lesson\'s minigame! Move on to the next lesson.';

  // ── Loading skeleton ──
  if (isLoading) {
    return (
      <div className="w-full rounded-xl p-3 bg-light-background-blue/50 flex items-center gap-3 animate-pulse">
        <div className="w-10 h-10 rounded-full bg-unavailable-button/30" />
        <div className="flex-1">
          <div className="h-3 w-24 bg-unavailable-button/30 rounded mb-1.5" />
          <div className="h-2 w-32 bg-unavailable-button/20 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* ── Main Button ── */}
      <button
        onClick={handleClick}
        className={`
          w-full rounded-xl p-3 flex items-center gap-3 transition-all duration-200
          ${buttonState === 'inactive'
            ? 'bg-light-background-blue/50 cursor-default opacity-60'
            : buttonState === 'active'
              ? 'bg-light-background-blue hover:bg-tab-active cursor-pointer shadow-sm'
              : 'bg-light-background-blue/50 cursor-default'
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
        {/* Icon container */}
        <div
          className={`
            relative w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
            ${buttonState === 'inactive'
              ? 'bg-unavailable-button/20'
              : buttonState === 'active'
                ? 'bg-logo-blue/10 gyn-pulse-ring'
                : 'bg-status-green/15'
            }
          `}
        >
          {buttonState === 'completed' ? (
            /* Checkmark icon */
            <svg className="w-5 h-5 text-status-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            /* Bird icon */
            <img
              src={NoticeBirdIcon}
              alt=""
              className={`w-7 h-7 object-contain ${buttonState === 'inactive' ? 'grayscale opacity-50' : ''}`}
            />
          )}
        </div>

        {/* Text content */}
        <div className="flex-1 text-left min-w-0">
          <OnestFont
            as="span"
            weight={buttonState === 'active' ? 700 : 500}
            lineHeight="tight"
            className={`text-sm block truncate ${
              buttonState === 'inactive'
                ? 'text-unavailable-button'
                : buttonState === 'active'
                  ? 'text-text-blue-black'
                  : 'text-status-green'
            }`}
          >
            {buttonState === 'inactive'
              ? 'Grow Your Nest'
              : buttonState === 'active'
                ? 'Play Minigame'
                : 'Minigame Complete'
            }
          </OnestFont>
          <OnestFont
            as="span"
            weight={300}
            lineHeight="relaxed"
            className={`text-xs block truncate ${
              buttonState === 'inactive'
                ? 'text-unavailable-button'
                : buttonState === 'active'
                  ? 'text-text-grey'
                  : 'text-status-green/70'
            }`}
          >
            {buttonState === 'inactive'
              ? 'Complete lesson to unlock'
              : buttonState === 'active'
                ? 'Answer 3 questions to grow the tree'
                : 'Great job!'
            }
          </OnestFont>
        </div>

        {/* Right arrow / indicator */}
        {buttonState === 'active' && (
          <svg className="w-5 h-5 text-logo-blue flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </button>

      {/* ── Tooltip (inactive / completed clicks) ── */}
      {showTooltip && (
        <div
          className="absolute left-0 right-0 top-full mt-2 z-20 animate-fade-in"
          role="tooltip"
        >
          <div className="bg-pure-white rounded-lg shadow-lg border border-unavailable-button/20 p-3 mx-1">
            <OnestFont
              as="p"
              weight={300}
              lineHeight="relaxed"
              className="text-xs text-text-blue-black"
            >
              {tooltipMessage}
            </OnestFont>
          </div>
          {/* Tooltip arrow */}
          <div className="absolute left-6 -top-1.5 w-3 h-3 bg-pure-white border-l border-t border-unavailable-button/20 rotate-45" />
        </div>
      )}

      {/* ── Scoped CSS for pulse animation ── */}
      <style>{`
        .gyn-pulse-ring {
          animation: gynPulse 2s ease-in-out infinite;
        }
        @keyframes gynPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(54, 88, 236, 0.3); }
          50% { box-shadow: 0 0 0 6px rgba(54, 88, 236, 0); }
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