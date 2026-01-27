import React from 'react';
import { OnestFont } from '../../../assets';

interface ProfileCompletionModalProps {
  onClose: () => void;
}

const ProfileCompletionModal: React.FC<ProfileCompletionModalProps> = ({ onClose }) => {
  const handleUpgradeToPremium = () => {
    // Add your premium upgrade logic here
    console.log('Upgrade to Premium clicked');
    onClose();
  };

  const handleGoToDashboard = () => {
    // Add your dashboard navigation logic here
    console.log('Go to Dashboard clicked');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-auto overflow-hidden relative">
        {/* Close button (X) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6">
          {/* Header with celebration emoji */}
          <div className="text-center mb-6">
            <div className="text-5xl mb-4">🎉</div>
            <OnestFont as="h1" weight={700} lineHeight="tight" className="text-xl text-gray-900 mb-2">
              Congratulations on completing your profile!
            </OnestFont>
            <OnestFont weight={300} lineHeight="relaxed" className="text-gray-600 text-sm">
              You've taken the first important step toward homeownership
            </OnestFont>
          </div>

          {/* Rewards Section */}
          <div className="mb-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center">
              {/* Coin Stack Image */}
              <div className="flex justify-center mb-3">
                <div className="text-4xl">💰</div>
              </div>
              
              <OnestFont as="h2" weight={500} lineHeight="relaxed" className="text-lg text-gray-900 mb-2">
                +25 Nest Coins Earned!
              </OnestFont>
              <OnestFont weight={500} lineHeight="relaxed" className="text-gray-600 text-sm">
                Great job completing your profile setup
              </OnestFont>
            </div>
          </div>

          {/* Action Buttons - Side by side layout */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={handleUpgradeToPremium}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <span className="text-base">👑</span>
              <OnestFont weight={500} lineHeight="relaxed" className="text-sm">
                Upgrade to Premium
              </OnestFont>
            </button>
            
            <button
              onClick={handleGoToDashboard}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <span className="text-base">🏠</span>
              <OnestFont weight={500} lineHeight="relaxed" className="text-sm">
                Go to Dashboard
              </OnestFont>
            </button>
          </div>

          {/* Bottom Text */}
          <div className="text-center">
            <OnestFont weight={300} lineHeight="relaxed" className="text-xs text-gray-500">
              Ready to start your homeownership journey? Explore our lessons and earn more rewards!
            </OnestFont>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletionModal;