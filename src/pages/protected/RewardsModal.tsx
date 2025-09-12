import React from 'react';

interface RewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RewardsModal: React.FC<RewardsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden">
        {/* Confetti/Celebration Background - Space for asset */}
        <div className="relative h-32 bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
          {/* Space for confetti/celebration asset */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Asset will be imported and placed here */}
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
            <div className="relative">
              {/* Badge Circle - Space for medal/badge asset */}
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg">
                {/* Space for reward badge asset */}
                <div className="w-12 h-12 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
                  {/* Credit card icon placeholder - space for asset */}
                  <div className="w-8 h-8 bg-blue-500 rounded opacity-80">
                    {/* Asset will be placed here */}
                  </div>
                </div>
              </div>
              
              {/* Ribbon tails - Using inline styles instead of styled-jsx */}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                <div 
                  className="w-8 h-6 bg-gradient-to-b from-red-500 to-red-600 absolute -left-1"
                  style={{
                    clipPath: 'polygon(0% 0%, 100% 0%, 80% 100%, 0% 80%)'
                  }}
                ></div>
                <div 
                  className="w-8 h-6 bg-gradient-to-b from-orange-500 to-orange-600 absolute -right-1"
                  style={{
                    clipPath: 'polygon(0% 0%, 100% 0%, 100% 80%, 20% 100%)'
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Go to rewards
            </button>
            
            <button 
              onClick={onClose}
              className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Badges
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RewardsModal;