import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { OnestFont, NoticeBirdIcon } from '../../../assets';

interface FreeRoamWalkthroughProps {
  isActive: boolean;
  moduleBackendId: string;
  onDismiss: () => void;
}

const STORAGE_KEY_PREFIX = 'nestnav_freeroam_walkthrough_';
const BIRD_SIZE = 80;

const FreeRoamWalkthrough: React.FC<FreeRoamWalkthroughProps> = ({
  isActive,
  moduleBackendId,
  onDismiss,
}) => {
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [dismissed, setDismissed] = useState(false);

  // Check if already shown for this module
  useEffect(() => {
    if (!moduleBackendId) return;
    const key = `${STORAGE_KEY_PREFIX}${moduleBackendId}`;
    if (localStorage.getItem(key) === 'true') {
      setDismissed(true);
    }
  }, [moduleBackendId]);

  // Calculate highlight position for the minigame button
  useEffect(() => {
    if (!isActive || dismissed) return;

    const updatePosition = () => {
      const container = document.querySelector('[data-walkthrough="phaser-container"]');
      if (!container) return;

      const rect = container.getBoundingClientRect();
      // Minigame button is approximately at: x=84%, y=3%, size ~12%x12%
      const subRect = new DOMRect(
        rect.left + rect.width * 0.84,
        rect.top + rect.height * 0.03,
        rect.width * 0.12,
        rect.height * 0.12
      );
      setHighlightRect(subRect);
    };

    updatePosition();
    const interval = setInterval(updatePosition, 500);
    window.addEventListener('resize', updatePosition);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isActive, dismissed]);

  const handleDismiss = useCallback(() => {
    if (moduleBackendId) {
      const key = `${STORAGE_KEY_PREFIX}${moduleBackendId}`;
      localStorage.setItem(key, 'true');
    }
    setDismissed(true);
    onDismiss();
  }, [moduleBackendId, onDismiss]);

  if (!isActive || dismissed) return null;

  const padding = 16;

  // Bird position: left of the minigame button
  const birdX = highlightRect
    ? highlightRect.left - BIRD_SIZE / 2 - 10
    : window.innerWidth / 2;
  const birdY = highlightRect
    ? highlightRect.top + BIRD_SIZE / 2
    : window.innerHeight / 4;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999]"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
      style={{ pointerEvents: 'all' }}
    >
      {/* Bird pointing at the minigame button */}
      <img
        src={NoticeBirdIcon}
        alt=""
        className="fixed z-[10000] pointer-events-none select-none"
        style={{
          width: BIRD_SIZE,
          height: 'auto',
          left: birdX,
          top: birdY,
          transform: 'translate(-50%, -50%)',
          animation: 'birdFloat 2s ease-in-out infinite',
          filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3))',
        }}
      />

      {/* Tooltip — positioned to the left of the button */}
      <div
        className="absolute z-20 w-[380px] rounded-2xl overflow-hidden shadow-2xl"
        style={{
          top: highlightRect
            ? highlightRect.top + highlightRect.height / 2 - 100
            : '50%',
          right: highlightRect
            ? window.innerWidth - highlightRect.left + padding + 24
            : 'auto',
          background: 'linear-gradient(137deg, #1D3CC6 6.84%, #837CFF 97.24%)',
        }}
      >
        <div className="p-6">
          <OnestFont as="h2" weight={700} lineHeight="tight" className="text-2xl text-pure-white mb-3">
            Free Roam Unlocked!
          </OnestFont>
          <OnestFont weight={300} lineHeight="relaxed" className="text-base text-pure-white/90">
            You've completed all lesson minigames in this module! Click the tree button to enter Free Roam mode — answer questions from every lesson to grow your tree to its final stage and earn bonus coins!
          </OnestFont>
          <div className="mt-6">
            <button
              onClick={handleDismiss}
              className="w-full px-8 py-3 bg-pure-white rounded-full text-elegant-blue hover:bg-text-white transition-colors shadow-lg"
            >
              <OnestFont weight={700} lineHeight="relaxed" className="text-base tracking-wide">
                GOT IT
              </OnestFont>
            </button>
          </div>
        </div>
      </div>

      {/* Floating animation keyframe */}
      <style>{`
        @keyframes birdFloat {
          0%, 100% { transform: translate(-50%, -50%) translateY(0); }
          50% { transform: translate(-50%, -50%) translateY(-6px); }
        }
      `}</style>
    </div>,
    document.body
  );
};

export default FreeRoamWalkthrough;
