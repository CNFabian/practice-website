import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { BadgeMedal, Confetti, Coin1, Coin2, Coin3, Coin4, Coin5 } from '../../assets';

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
    coinsEarned
  });

  // Reset animation states when modal opens
  useEffect(() => {
    if (isOpen) {
      setCoinsAnimated(false);
      setEscapeCoins([]);
    }
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
    // Trigger coin animation when modal closes
    if (hasEarnedCoins && !coinsAnimated) {
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
    // Trigger coin animation when navigating to rewards
    if (hasEarnedCoins && !coinsAnimated) {
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
    // Trigger coin animation when navigating to badges
    if (hasEarnedCoins && !coinsAnimated) {
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

  // Generate coin positions for display
  const generateCoinPositions = () => {
    if (!hasEarnedCoins) return [];
    
    const positions = [];
    const maxRadius = 60;
    const minRadius = 30;
    const numCoins = Math.min(coinsEarned, 8); // Limit visual coins to 8
    
    for (let i = 0; i < numCoins; i++) {
      const angle = (i / numCoins) * 2 * Math.PI;
      const radius = minRadius + Math.random() * (maxRadius - minRadius);
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      positions.push({
        x: x,
        y: y,
        delay: i * 0.1,
        coinType: coinIcons[i % coinIcons.length]
      });
    }
    
    return positions;
  };

  const coinPositions = generateCoinPositions();

  // Escape Coins Component
  const EscapeCoins = () => {
    if (escapeCoins.length === 0) return null;

    const targetX = window.innerWidth * 0.87;
    const targetY = 25;

    return createPortal(
      <div className="fixed inset-0 pointer-events-none z-[60]">
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

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Modal with bouncy scale animation */}
        <div 
          ref={containerRef}
          className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-modal-bounce"
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
              {earnedBadge ? 'Perfect Score!' : 'Rewards Earned!'}
            </h2>

            {/* Confetti and Badge/Coins Container */}
            <div className="relative flex items-center justify-center mb-8 h-32">
              {/* Confetti in background */}
              <div className="absolute inset-0 flex items-center justify-center animate-confetti-burst">
                <img src={Confetti} alt="Confetti" className="w-40 h-40 opacity-70" />
              </div>
              
              {/* PERFECT SCORE (100%) - Badge centered with coins in upper right */}
              {earnedBadge && (
                <div className="relative z-10 w-full h-full flex items-center justify-center">
                  {/* Badge in center - LARGE and prominent for 100% */}
                  <div className="animate-badge-bounce">
                    <div className="w-32 h-32 flex items-center justify-center animate-badge-icon">
                      <img src={BadgeMedal} alt="Perfect Score Badge" className="w-full h-full" />
                    </div>
                  </div>
                  {/* Coins indicator in upper right corner - SMALL */}
                  <div className="absolute -top-2 -right-2 bg-yellow-200 rounded-full px-3 py-2 border-2 border-yellow-400 shadow-lg">
                    <div className="flex items-center gap-1">
                      <img 
                        ref={el => staticCoinRefs.current[0] = el}
                        src={coinIcons[0]} 
                        alt="Coins" 
                        className="w-5 h-5" 
                      />
                      <span className="text-base font-bold text-yellow-800">+{coinsEarned || 0}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* PARTIAL SCORE - Only coins centered (no badge) */}
              {!earnedBadge && hasEarnedCoins && (
                <div className="relative z-10 flex items-center justify-center">
                  {/* Animated coins around center - NORMAL layout for partial scores */}
                  {coinPositions.map((pos, index) => (
                    <div
                      key={index}
                      ref={el => staticCoinRefs.current[index] = el}
                      className="absolute w-8 h-8 animate-bounce"
                      style={{
                        transform: `translate(${pos.x}px, ${pos.y}px)`,
                        animationDelay: `${pos.delay}s`,
                      }}
                    >
                      <img 
                        src={pos.coinType} 
                        alt="Coin" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ))}
                  {/* Center coins count - LARGE display for partial scores */}
                  <div className="flex items-center justify-center gap-3 bg-yellow-100 rounded-full px-6 py-3 border-2 border-yellow-300">
                    <img src={coinIcons[0]} alt="Coins" className="w-12 h-12" />
                    <span className="text-2xl font-bold text-yellow-700">+{coinsEarned}</span>
                  </div>
                </div>
              )}

              {/* NO REWARDS - Motivational message */}
              {!earnedBadge && !hasEarnedCoins && (
                <div className="relative z-10 text-center">
                  <div className="text-6xl mb-4">🎯</div>
                  <p className="text-gray-600">Keep practicing to earn rewards!</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button 
                onClick={handleRewardsClick}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors transform hover:scale-105"
              >
                Go to rewards
              </button>
              
              <button 
                onClick={handleBadgesClick}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-medium hover:bg-gray-200 transition-colors transform hover:scale-105"
              >
                Badges
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Render escape coins */}
      <EscapeCoins />

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes modalBounce {
            0% { 
              opacity: 0;
              transform: translate(-50%, -50%) scale(0.3) rotate(-10deg);
            }
            50% { 
              opacity: 1;
              transform: translate(-50%, -50%) scale(1.05) rotate(2deg);
            }
            70% { 
              transform: translate(-50%, -50%) scale(0.9) rotate(-1deg);
            }
            100% { 
              opacity: 1;
              transform: translate(-50%, -50%) scale(1) rotate(0deg);
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
          
          .animate-fade-in {
            animation: fadeIn 0.3s ease-out;
          }
          
          .animate-modal-bounce {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
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
        `
      }} />
    </>
  );
};

export default RewardsModal;