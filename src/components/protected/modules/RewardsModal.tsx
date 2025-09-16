import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { BadgeMedal, Confetti, Coin1, Coin2, Coin3, Coin4, Coin5 } from '../../../assets';

interface RewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToRewards: () => void;
  onNavigateToBadges: () => void;
  coinsEarned?: number;
  hasEarnedCoins?: boolean;
  hasEarnedBadge?: boolean;
  lessonId?: number | null;
  quizScore?: number;
  totalQuestions?: number;
  correctAnswers?: number;
}

const RewardsModal: React.FC<RewardsModalProps> = ({
  isOpen,
  onClose,
  onNavigateToRewards,
  onNavigateToBadges,
  coinsEarned = 0,
  hasEarnedCoins = false,
  hasEarnedBadge = false,
  totalQuestions = 0,
  correctAnswers = 0,
}) => {
  // Animation states - ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
  const [coinsAnimated, setCoinsAnimated] = useState(false);
  const [escapeCoins, setEscapeCoins] = useState<Array<{
    id: string;
    startX: number;
    startY: number;
    icon: string;
    delay: number;
  }>>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const staticCoinRefs = useRef<(HTMLDivElement | null)[]>([]);
  const coinIcons = [Coin1, Coin2, Coin3, Coin4, Coin5];

  // Calculate if user earned a badge (100% score)
  const earnedBadge = hasEarnedBadge || (totalQuestions > 0 && correctAnswers === totalQuestions);
  
  // Debug logging to see what's happening
  console.log('RewardsModal Debug:', {
    totalQuestions,
    correctAnswers,
    hasEarnedBadge,
    earnedBadge,
    hasEarnedCoins,
    coinsEarned,
    isOpen
  });

  // Reset animation states when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('RewardsModal opened - resetting animation states');
      setCoinsAnimated(false);
      setEscapeCoins([]);
      
      // Disable scrolling on the body when modal opens
      document.body.style.overflow = 'hidden';
      
      // Add a class to the body to disable all interactions
      document.body.classList.add('modal-open');
      
      // Create and inject CSS to disable all interactions except modal
      const styleElement = document.createElement('style');
      styleElement.id = 'rewards-modal-styles';
      styleElement.innerHTML = `
        body.modal-open * {
          pointer-events: none !important;
        }
        body.modal-open .rewards-modal-content,
        body.modal-open .rewards-modal-content * {
          pointer-events: auto !important;
        }
        body.modal-open .rewards-modal-overlay {
          pointer-events: auto !important;
        }
      `;
      document.head.appendChild(styleElement);
    } else {
      // Re-enable scrolling when modal closes
      document.body.style.overflow = '';
      
      // Remove the modal-open class
      document.body.classList.remove('modal-open');
      
      // Remove the injected styles
      const styleElement = document.getElementById('rewards-modal-styles');
      if (styleElement) {
        document.head.removeChild(styleElement);
      }
    }

    // Cleanup function to restore everything if component unmounts
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
      const styleElement = document.getElementById('rewards-modal-styles');
      if (styleElement) {
        document.head.removeChild(styleElement);
      }
    };
  }, [isOpen]);

  // MOVED EARLY RETURN AFTER ALL HOOKS
  if (!isOpen) return null;

  const triggerCoinAnimation = () => {
    if (!containerRef.current || !hasEarnedCoins || coinsAnimated) return;

    // Get positions of static coins for animation
    const coinPositions = staticCoinRefs.current
      .filter(ref => ref !== null)
      .map(ref => {
        if (ref) {
          const rect = ref.getBoundingClientRect();
          return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
          };
        }
        return null;
      })
      .filter((pos): pos is { x: number; y: number } => pos !== null);

    // Create escape coins animation
    const coins = coinPositions.map((pos, i) => ({
      id: `coin-${i}`,
      startX: pos.x,
      startY: pos.y,
      icon: coinIcons[i % coinIcons.length],
      delay: Math.random() * 0.8
    }));
    
    setEscapeCoins(coins);
    setCoinsAnimated(true);
    
    // Clean up animation
    setTimeout(() => {
      setEscapeCoins([]);
    }, 2200);
  };

  const handleModalClose = () => {
    // Only trigger coin animation for partial scores (not badges)
    if (hasEarnedCoins && !coinsAnimated && !earnedBadge) {
      triggerCoinAnimation();
      // Delay the actual close to allow animation to start
      setTimeout(() => {
        onClose();
      }, 100);
    } else {
      onClose();
    }
  };

  const handleRewardsClick = () => {
    // Only trigger coin animation for partial scores (not badges)
    if (hasEarnedCoins && !coinsAnimated && !earnedBadge) {
      triggerCoinAnimation();
      // Delay navigation to allow animation to start
      setTimeout(() => {
        if (onNavigateToRewards) {
          onNavigateToRewards();
        } else {
          window.location.href = '/app/rewards';
        }
        onClose();
      }, 100);
    } else {
      if (onNavigateToRewards) {
        onNavigateToRewards();
      } else {
        window.location.href = '/app/rewards';
      }
      onClose();
    }
  };

  const handleBadgesClick = () => {
    // Only trigger coin animation for partial scores (not badges)
    if (hasEarnedCoins && !coinsAnimated && !earnedBadge) {
      triggerCoinAnimation();
      // Delay navigation to allow animation to start
      setTimeout(() => {
        if (onNavigateToBadges) {
          onNavigateToBadges();
        } else {
          window.location.href = '/app/badges';
        }
        onClose();
      }, 100);
    } else {
      if (onNavigateToBadges) {
        onNavigateToBadges();
      } else {
        window.location.href = '/app/badges';
      }
      onClose();
    }
  };

  // Escape Coins Component
  const EscapeCoins = () => {
    if (escapeCoins.length === 0) return null;

    const targetX = window.innerWidth * 0.87;
    const targetY = 25;

    return createPortal(
      <div className="fixed inset-0 pointer-events-none z-[70]">
        {escapeCoins.map((coin) => (
          <div
            key={coin.id}
            className="absolute w-6 h-6"
            style={{
              left: `${coin.startX}px`,
              top: `${coin.startY}px`,
              animation: `coinEscape-${coin.id} 1.8s cubic-bezier(0.4, 0.0, 0.2, 1) ${coin.delay}s forwards`,
            }}
          >
            <img 
              src={coin.icon}
              alt="Coin"
              className="w-full h-full"
            />
          </div>
        ))}
        
        <style dangerouslySetInnerHTML={{
          __html: `
            ${escapeCoins.map(coin => `
              @keyframes coinEscape-${coin.id} {
                0% {
                  opacity: 1;
                  transform: scale(1) rotate(0deg);
                }
                100% {
                  opacity: 0;
                  transform: translateX(${targetX - coin.startX}px) 
                             translateY(${targetY - coin.startY}px) 
                             scale(0.5) 
                             rotate(720deg);
                }
              }
            `).join('')}
          `
        }} />
      </div>,
      document.body
    );
  };

  return createPortal(
    <>
      <EscapeCoins />
      
      {/* Full-screen overlay that blocks ALL background interactions */}
      <div 
        className="rewards-modal-overlay fixed inset-0 z-[9999]" 
        style={{ 
          backgroundColor: 'transparent',
          pointerEvents: 'all'
        }}
        onClick={handleModalClose}
      />
      
      {/* Modal Container - Centered in viewport */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
        {/* Modal with bouncy scale animation - Re-enable pointer events for modal content */}
        <div 
          ref={containerRef}
          className="rewards-modal-content relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-modal-bounce pointer-events-auto"
          style={{
            // Ensure modal stays centered and above everything
            zIndex: 10000
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close X Button */}
          <button
            onClick={handleModalClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <svg 
              className="w-5 h-5 text-gray-600" 
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
          <div className="px-8 py-8 text-center">
            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {earnedBadge ? 'Badge Earned!' : 'Coins Earned!'}
            </h2>

            {/* Confetti and Badge/Coins Container */}
            <div className="relative flex items-center justify-center mb-8 h-32">
              {/* Confetti in background - ONLY FOR BADGE */}
              {earnedBadge && (
                <div className="absolute inset-0 flex items-center justify-center animate-confetti-burst">
                  <img src={Confetti} alt="Confetti" className="w-40 h-40 opacity-70" />
                </div>
              )}
              
              {/* PERFECT SCORE (100%) - Badge ONLY centered (NO coin container) */}
              {earnedBadge && (
                <div className="relative z-10 w-full h-full flex items-center justify-center">
                  {/* Badge in center - LARGE and prominent for 100% */}
                  <div className="animate-badge-bounce">
                    <div className="w-32 h-32 flex items-center justify-center animate-badge-icon">
                      <img src={BadgeMedal} alt="Perfect Score Badge" className="w-full h-full" />
                    </div>
                  </div>
                </div>
              )}

              {/* PARTIAL SCORE - Only single coin centered (no multiple jumping coins) */}
              {!earnedBadge && hasEarnedCoins && (
                <div className="relative z-10 flex items-center justify-center">
                  {/* Single static coin with minimal jump animation */}
                  <div
                    ref={el => staticCoinRefs.current[0] = el}
                    className="flex items-center justify-center gap-1 bg-yellow-100 rounded-full px-6 py-3 border-2 border-yellow-300 animate-coin-jump"
                  >
                    <img 
                      src={coinIcons[0]} 
                      alt="Coin" 
                      className="w-12 h-12 "
                    />
                    <span className="text-2xl font-bold text-yellow-700">+{coinsEarned}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button 
                onClick={earnedBadge ? handleBadgesClick : handleRewardsClick}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors transform hover:scale-105"
              >
                {earnedBadge ? 'View Badges' : 'Go to rewards'}
              </button>
              
              <button 
                onClick={handleModalClose}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-medium hover:bg-gray-200 transition-colors transform hover:scale-105"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes modalBounce {
            0% { 
              opacity: 0;
              transform: scale(0.3) rotate(-10deg);
            }
            50% { 
              opacity: 1;
              transform: scale(1.05) rotate(2deg);
            }
            70% { 
              transform: scale(0.9) rotate(-1deg);
            }
            100% { 
              opacity: 1;
              transform: scale(1) rotate(0deg);
            }
          }
          
          @keyframes badgeBounce {
            0%, 20%, 50%, 80%, 100% { 
              transform: translateY(0) rotate(0deg); 
            }
            40% { 
              transform: translateY(-20px) rotate(5deg); 
            }
            60% { 
              transform: translateY(-10px) rotate(-3deg); 
            }
          }
          
          @keyframes confettiBurst {
            0% { 
              opacity: 0; 
              transform: scale(0.5) rotate(-180deg); 
            }
            50% { 
              opacity: 1; 
              transform: scale(1.1) rotate(10deg); 
            }
            100% { 
              opacity: 1; 
              transform: scale(1) rotate(0deg); 
            }
          }
          
          @keyframes medalShine {
            0%, 100% { 
              box-shadow: 0 0 20px rgba(255, 193, 7, 0.3); 
            }
            50% { 
              box-shadow: 0 0 30px rgba(255, 193, 7, 0.6), 0 0 40px rgba(255, 193, 7, 0.4); 
            }
          }
          
          @keyframes badgeIcon {
            0%, 100% { 
              transform: scale(1); 
            }
            50% { 
              transform: scale(1.1); 
            }
          }
          
          @keyframes ribbonWave {
            0%, 100% { 
              transform: translateY(0) rotate(0deg); 
            }
            25% { 
              transform: translateY(-2px) rotate(1deg); 
            }
            75% { 
              transform: translateY(2px) rotate(-1deg); 
            }
          }

          @keyframes coinJump {
            0%, 100% { 
              transform: translateY(0); 
            }
            50% { 
              transform: translateY(-8px); 
            }
          }
          
          .animate-fade-in {
            animation: fadeIn 0.3s ease-out;
          }
          
          .animate-modal-bounce {
            animation: modalBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          }
          
          .animate-badge-bounce {
            animation: badgeBounce 2s ease-in-out 0.3s;
          }
          
          .animate-confetti-burst {
            animation: confettiBurst 0.8s ease-out 0.2s both;
          }
          
          .animate-medal-shine {
            animation: medalShine 2s ease-in-out 0.5s infinite;
          }
          
          .animate-badge-icon {
            animation: badgeIcon 1.5s ease-in-out 0.7s infinite;
          }
          
          .animate-ribbon-wave {
            animation: ribbonWave 3s ease-in-out 1s infinite;
          }

          .animate-coin-jump {
            animation: coinJump 1.5s ease-in-out infinite;
          }
        `
      }} />
    </>,
    document.body
  );
};

export default RewardsModal;