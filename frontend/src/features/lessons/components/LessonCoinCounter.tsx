import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CoinCounterIcon, BirdCelebration } from '../../../assets';
import { useCoinBalance } from '../../../hooks/queries/useCoinBalance';

/**
 * LessonCoinCounter — React replica of the Phaser BaseScene coin counter.
 *
 * Visuals are pixel-matched to UIComponents.createCoinCounterWithTooltip():
 *  • Pill: 120×40, white bg, 12px radius, subtle shadow + thin border
 *  • Coin icon 30×30 on the left, #3658EC bold 18px text on the right
 *  • Tooltip 320px wide, 20px radius, bird 54px, text 15px
 *  • Bounce animation on coin value change (150ms scale 1→1.15→1)
 *  • 300ms grace period before tooltip hides
 */

const LessonCoinCounter: React.FC = () => {
  const { data: coinBalance } = useCoinBalance();
  const totalCoins = typeof coinBalance === 'object' && coinBalance !== null
    ? (coinBalance as { current_balance?: number }).current_balance ?? 0
    : (coinBalance ?? 0);

  const [showTooltip, setShowTooltip] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevCoinsRef = useRef<number>(totalCoins);

  // Bounce animation when coin count changes (mirrors Phaser 150ms scale tween)
  useEffect(() => {
    if (prevCoinsRef.current !== totalCoins && prevCoinsRef.current !== 0) {
      setIsBouncing(true);
      const timer = setTimeout(() => setIsBouncing(false), 300);
      prevCoinsRef.current = totalCoins;
      return () => clearTimeout(timer);
    }
    prevCoinsRef.current = totalCoins;
  }, [totalCoins]);

  const handleShowTooltip = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setShowTooltip(true);
  }, []);

  const handleScheduleHide = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setShowTooltip(false);
      hideTimerRef.current = null;
    }, 300); // 300ms grace period — matches Phaser HIDE_DELAY
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const handleRewardsClick = useCallback(() => {
    window.dispatchEvent(new CustomEvent('navigate-to', { detail: '/app/rewards' }));
  }, []);

  return (
    <div className="relative">
      {/* Coin Counter Pill */}
      <div
        onMouseEnter={handleShowTooltip}
        onMouseLeave={handleScheduleHide}
        className="flex items-center justify-center cursor-pointer select-none"
        style={{
          width: 120,
          height: 40,
          borderRadius: 12,
          backgroundColor: '#FFFFFF',
          border: '1px solid rgba(167, 180, 212, 0.15)',
          boxShadow: '2px 2px 4px rgba(167, 180, 212, 0.25)',
          transform: isBouncing ? 'scale(1.15)' : 'scale(1)',
          transition: 'transform 150ms ease',
        }}
      >
        {/* Coin Icon — left side, 30×30 to match Phaser scale(30) */}
        <img
          src={CoinCounterIcon}
          alt="Coins"
          style={{ width: 30, height: 30, marginLeft: 6 }}
          draggable={false}
        />

        {/* Coin Text — right side, Logo Blue bold 18px (matches Phaser) */}
        <span
          style={{
            fontFamily: 'Onest, Arial, sans-serif',
            fontWeight: 700,
            fontSize: 18,
            color: '#3658EC',
            marginLeft: 6,
            marginRight: 12,
            lineHeight: 1.25,
          }}
        >
          {totalCoins}
        </span>
      </div>

      {/* Tooltip — appears below pill, matches Phaser createTooltip() */}
      <div
        onMouseEnter={handleShowTooltip}
        onMouseLeave={handleScheduleHide}
        className="absolute right-0 z-50"
        style={{
          top: 46,
          width: 320,
          opacity: showTooltip ? 1 : 0,
          pointerEvents: showTooltip ? 'auto' : 'none',
          transition: 'opacity 200ms ease',
        }}
      >
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '2px solid rgba(181, 179, 185, 0.3)',
            borderRadius: 20,
            padding: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {/* Bird celebration icon — 54px to match Phaser birdSize */}
          <img
            src={BirdCelebration}
            alt=""
            style={{ width: 54, height: 54, flexShrink: 0 }}
            draggable={false}
          />

          {/* Text content — 15px to match Phaser scaleFontSize(15) */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontFamily: 'Onest, Arial, sans-serif',
                fontSize: 15,
                color: '#585561',
                lineHeight: 1.4,
                margin: 0,
              }}
            >
              Earn coins as you learn and redeem them for rewards in the{' '}
            </p>
            <button
              onClick={handleRewardsClick}
              style={{
                fontFamily: 'Onest, Arial, sans-serif',
                fontSize: 15,
                fontWeight: 700,
                color: '#3658EC',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                marginTop: 4,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
            >
              rewards shop!
            </button>
          </div>
        </div>
      </div>

      {/* Bounce keyframe — injected once */}
      <style>{`
        @keyframes coinBounce {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default LessonCoinCounter;
