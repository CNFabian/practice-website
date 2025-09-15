import React from 'react';

import { BadgeMedal, Confetti } from '../../assets'

interface RewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToRewards: () => void;
  onNavigateToBadges: () => void;
  coinsEarned?: number; // Add this prop to pass the actual coins earned
  hasEarnedCoins?: boolean; // Add this prop to indicate if coins were earned
}

const RewardsModal: React.FC<RewardsModalProps> = ({
  isOpen,
  onClose,
  onNavigateToRewards,
  onNavigateToBadges,
  // FIXED: Removed unused destructured props that were causing TS errors
  // coinsEarned = 0,
  // hasEarnedCoins = false
}) => {
  if (!isOpen) return null;

  const handleModalClose = () => {
    // Only close the modal, don't trigger quiz completion
    onClose();
  };

  const handleRewardsClick = () => {
    if (onNavigateToRewards) {
      onNavigateToRewards();
    } else {
      // Fallback navigation
      window.location.href = '/app/rewards';
    }
    // Don't automatically close modal - let user stay on quiz results if they want
  };

  const handleBadgesClick = () => {
    if (onNavigateToBadges) {
      onNavigateToBadges();
    } else {
      // Fallback navigation
      window.location.href = '/app/badges';
    }
    // Don't automatically close modal - let user stay on quiz results if they want
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
     
      {/* Modal with bouncy scale animation */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-modal-bounce">
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
            Rewards Earned!
          </h2>

          {/* Confetti and Badge Container */}
          <div className="relative flex items-center justify-center mb-8 h-32">
            {/* Confetti in background */}
            <div className="absolute inset-0 flex items-center justify-center animate-confetti-burst">
              <img src={Confetti} alt="Confetti" className="w-40 h-40 opacity-70" />
            </div>
            
            {/* Badge in front of confetti */}
            <div className="relative z-10 animate-badge-bounce">
              <div className="w-16 h-16 flex items-center justify-center animate-badge-icon">
                <img src={BadgeMedal} alt="Badge" className="w-full h-full" />
              </div>
            </div>
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
    </div>
  );
};

export default RewardsModal;