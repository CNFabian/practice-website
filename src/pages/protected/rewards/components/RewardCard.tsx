import React from 'react';
import { CoinIcon, RobotoFont } from '../../../../assets/index';
import { RewardOffer } from '../types/rewards.types';

interface RewardCardProps {
  offer: RewardOffer;
  onClick?: () => void;
}

const RewardCard: React.FC<RewardCardProps> = ({ offer, onClick }) => {
  const isFeatured = offer.category === 'featured';

  return (
    <div
      className={`bg-white rounded-3xl shadow-sm relative overflow-hidden hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer flex flex-col ${
        isFeatured ? 'border-2 border-orange-300' : 'border border-gray-200'
      }`}
      onClick={onClick}
    >
      {/* Background area - responsive height */}
      <div className="relative aspect-[16/11] sm:aspect-[18/10] md:aspect-[19/9] rounded-t-3xl bg-gray-100">
        {/* Featured badge - top left */}
        {isFeatured && (
          <span className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-orange-400 text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium z-10">
            ⭐ Featured
          </span>
        )}

        {/* Company icon - top right */}
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
          <span 
            className="font-bold text-base sm:text-lg" 
            style={{ color: offer.iconBackgroundColor }}
          >
            {offer.icon}
          </span>
        </div>
      </div>

      {/* White content section with flexible layout */}
      <div className="bg-white p-4 sm:p-5 md:p-6 relative rounded-b-3xl flex-1 flex flex-col">
        {/* Coin reward - positioned in top right of content area */}
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 flex items-center gap-1 bg-yellow-100 rounded-full px-2 py-1">
          <RobotoFont 
            as="span" 
            weight={600} 
            className="text-xs sm:text-sm font-semibold text-gray-900"
          >
            {offer.cost}
          </RobotoFont>
          <img 
            src={CoinIcon} 
            alt="Coins" 
            className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" 
          />
        </div>

        {/* Main content area with proper spacing */}
        <div className="flex-1 flex flex-col">
          {/* Title and description container */}
          <div className="pr-12 sm:pr-16 md:pr-20 mb-3 sm:mb-4">
            <RobotoFont 
              as="h3" 
              weight={700} 
              className="text-sm sm:text-base md:text-lg font-bold text-gray-800 mb-1 sm:mb-2 line-clamp-2 break-words"
            >
              {offer.title}
            </RobotoFont>
            <RobotoFont 
              as="p" 
              weight={400} 
              className="text-xs sm:text-sm text-gray-600 line-clamp-2 sm:line-clamp-3 break-words"
            >
              {offer.description}
            </RobotoFont>
          </div>

          {/* Spacer to push bottom elements down */}
          <div className="flex-1 min-h-[1rem] sm:min-h-[1.5rem]" />

          {/* Bottom elements - vendor and discount */}
          <div className="flex justify-between items-center gap-2 mt-auto">
            <RobotoFont 
              as="div" 
              weight={600} 
              className="text-xs sm:text-sm text-white bg-gradient-to-r from-blue-500 to-purple-600 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full truncate flex-shrink min-w-0 max-w-[60%] shadow-sm"
            >
              {offer.vendor}
            </RobotoFont>
            <RobotoFont 
              as="div" 
              weight={600} 
              className="text-xs sm:text-sm font-semibold text-blue-600 whitespace-nowrap flex-shrink-0"
            >
              {offer.discount}
            </RobotoFont>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RewardCard;