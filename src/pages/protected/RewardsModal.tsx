import React from 'react';

import { BadgeMedal, Confetti } from '../../assets'

interface RewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RewardsModal: React.FC<RewardsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with fade in */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal with bouncy scale animation */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden animate-modal-bounce">
        {/* Confetti/Celebration Background - Space for animated asset */}
        <div className="relative h-20 bg-gradient-to-br from-purple-50 to-blue-50 flex items-end justify-center pb-4">
          {/* Space for confetti/celebration asset with animation class */}
          <div className="absolute inset-0 flex items-center justify-center animate-confetti-burst">
            <img src={Confetti} alt="Confetti" className="w-32 h-32 opacity-70" />
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 text-center">
          {/* Title */}
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Rewards Earned!
          </h2>

          {/* Reward Badge */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative animate-badge-bounce">
              {/* Badge Circle - Space for medal/badge asset with animation */}
             
                <div className="w-12 h-12 flex items-center justify-center animate-badge-icon">
                 <img src={BadgeMedal} alt="Badge" className="w-full h-full" />
                </div>
              
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors transform hover:scale-105">
              Go to rewards
            </button>
            
            <button 
              onClick={onClose}
              className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors transform hover:scale-105"
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