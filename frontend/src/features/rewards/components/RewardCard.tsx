import React from 'react';
import { CoinIcon, OnestFont } from '../../../assets/index';
import { Coupon } from '../services/rewardsAPI';

interface RewardCardProps {
  coupon: Coupon;
  onClick?: () => void;
}

// Helper function to generate consistent icon and color from company name
const getCompanyIconAndColor = (companyName: string) => {
  const icon = companyName.charAt(0).toUpperCase();
  const colors = ['#9333ea', '#2563eb', '#eab308', '#dc2626', '#16a34a', '#ec4899'];
  const colorIndex = companyName.length % colors.length;
  return { icon, color: colors[colorIndex] };
};

// Helper function to extract discount from title/description
const extractDiscount = (title: string, description: string): string => {
  const text = `${title} ${description}`;
  
  const percentMatch = text.match(/(\d+)%\s*off/i);
  if (percentMatch) {
    return `${percentMatch[1]}% OFF`;
  }
  
  const dollarMatch = text.match(/\$(\d+)\s*off/i);
  if (dollarMatch) {
    return `$${dollarMatch[1]} OFF`;
  }
  
  if (text.toLowerCase().includes('free shipping') || text.toLowerCase().includes('free delivery')) {
    return 'FREE SHIPPING';
  }
  
  return 'SPECIAL OFFER';
};

// Helper to determine if coupon is featured
const isFeaturedCoupon = (coupon: Coupon): boolean => {
  return coupon.cost_in_coins >= 150 || (coupon.max_redemptions - coupon.current_redemptions) <= 10;
};

const RewardCard: React.FC<RewardCardProps> = ({ coupon, onClick }) => {
  const isFeatured = isFeaturedCoupon(coupon);
  const { icon, color } = getCompanyIconAndColor(coupon.partner_company);
  const discount = extractDiscount(coupon.title, coupon.description);

  return (
    <div
      className={`bg-white rounded-3xl shadow-sm relative overflow-hidden hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer flex flex-col ${
        isFeatured ? 'border-2 border-status-yellow' : 'border border-light-background-blue'
      }`}
      onClick={onClick}
    >
      {/* Background area - responsive height */}
      <div className="relative aspect-[16/11] sm:aspect-[18/10] md:aspect-[19/9] rounded-t-3xl bg-light-background-blue">
        {/* Featured badge - top left */}
        {isFeatured && (
          <span className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-status-yellow text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium z-10">
            ⭐ Featured
          </span>
        )}

        {/* Company icon - top right */}
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
          <span 
            className="font-bold text-base sm:text-lg" 
            style={{ color }}
          >
            {icon}
          </span>
        </div>
      </div>

      {/* White content section with flexible layout */}
      <div className="bg-white p-4 sm:p-5 md:p-6 relative rounded-b-3xl flex-1 flex flex-col">
        {/* Coin reward - positioned in top right of content area */}
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 flex items-center gap-1 bg-logo-yellow/20 rounded-full px-2 py-1">
          <OnestFont 
            as="span" 
            weight={700} 
            lineHeight="relaxed"
            className="text-xs sm:text-sm font-semibold text-text-blue-black"
          >
            {coupon.cost_in_coins}
          </OnestFont>
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
            <OnestFont 
              as="h3" 
              weight={700} 
              lineHeight="tight"
              className="text-sm sm:text-base md:text-lg font-bold text-text-grey mb-1 sm:mb-2 line-clamp-2 break-words"
            >
              {coupon.title}
            </OnestFont>
            <OnestFont 
              as="p" 
              weight={300} 
              lineHeight="relaxed"
              className="text-xs sm:text-sm text-text-grey line-clamp-2 sm:line-clamp-3 break-words"
            >
              {coupon.description}
            </OnestFont>
          </div>

          {/* Spacer to push bottom elements down */}
          <div className="flex-1 min-h-[1rem] sm:min-h-[1.5rem]" />

          {/* Bottom elements - vendor and discount */}
          <div className="flex justify-between items-center gap-2 mt-auto">
            <OnestFont 
              as="div" 
              weight={500} 
              lineHeight="relaxed"
              className="text-xs sm:text-sm text-white bg-gradient-to-r from-logo-blue to-elegant-blue px-2 py-0.5 sm:px-3 sm:py-1 rounded-full truncate flex-shrink min-w-0 max-w-[60%] shadow-sm"
            >
              {coupon.partner_company}
            </OnestFont>
            <OnestFont 
              as="div" 
              weight={700} 
              lineHeight="relaxed"
              className="text-xs sm:text-sm font-semibold text-logo-blue whitespace-nowrap flex-shrink-0"
            >
              {discount}
            </OnestFont>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RewardCard;