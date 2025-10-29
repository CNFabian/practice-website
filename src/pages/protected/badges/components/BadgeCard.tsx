// Individual badge card component - displays badge info with rarity-based styling
// Handles earned/locked states and shows badge requirements

import { RobotoFont } from '../../../../assets';
import type { Badge } from '../../../../services';
import { 
  BADGE_ICONS, 
  RARITY_COLORS, 
  RARITY_TAG_STYLES, 
  RARITY_CARD_STYLES, 
  TYPE_COLORS, 
  TYPE_STYLES 
} from '../constants';

interface BadgeCardProps {
  badge: Badge;
}

export const BadgeCard = ({ badge }: BadgeCardProps) => {
  // Styling helper functions - maps badge properties to visual styles
  const getRarityColor = (rarity: Badge['rarity']) => {
    // Use black text for common badges, default colors for others
    if (rarity === 'common') {
      return 'text-black';
    }
    return RARITY_COLORS[rarity] || 'bg-gray-400';
  };

  const getRarityTagStyle = (rarity: Badge['rarity']) => {
    // For common badges, ensure black text
    if (rarity === 'common') {
      return {
        backgroundColor: '#10b981',
        color: 'black'
      };
    }
    return RARITY_TAG_STYLES[rarity] || {};
  };

  const getRarityStyle = (rarity: Badge['rarity'], isEarned: boolean) => {
    if (rarity === 'common') {
      const baseStyle = isEarned ? RARITY_CARD_STYLES.common.earned : RARITY_CARD_STYLES.common.unearned;
      // Add gray opacity overlay for achievement type badges
      if (badge.type === 'achievement') {
        return {
          ...baseStyle,
          backgroundColor: baseStyle.backgroundColor,
          backgroundImage: 'linear-gradient(rgba(128, 128, 128, 0.2), rgba(128, 128, 128, 0.2))'
        };
      }
      return baseStyle;
    }
    return RARITY_CARD_STYLES[rarity] || {};
  };

  const getTypeColor = (type: Badge['type']) => {
    // Use black text for common badges, white for others
    if (badge.rarity === 'common') {
      return 'text-black';
    }
    return TYPE_COLORS[type] || 'text-gray-800';
  };

  const getTypeStyle = (type: Badge['type']) => {
    // For common badges, use different styling
    if (badge.rarity === 'common') {
      return {
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        color: 'black'
      };
    }
    return TYPE_STYLES[type] || {};
  };

  // Dynamic CSS classes based on badge state
  const cardClasses = `
    relative rounded-xl p-4 min-h-96 w-full flex flex-col justify-between transition-all duration-300 cursor-pointer
    hover:shadow-xl hover:-translate-y-1 hover:scale-105
    ${badge.isEarned 
      ? `${getRarityColor(badge.rarity)} shadow-lg` 
      : badge.rarity === 'rare' || badge.rarity === 'legendary' || badge.rarity === 'uncommon'
        ? 'text-white shadow-lg' 
        : badge.rarity === 'common'
          ? 'shadow-lg'
          : 'bg-gray-300 text-gray-500'
    }
  `;

  const cardStyle = getRarityStyle(badge.rarity, badge.isEarned);

  return (
    <div className={cardClasses} style={cardStyle}>
      {/* Lock icon for unavailable badges */}
      {badge.isLocked && !badge.isEarned && (
        <div className="absolute top-3 right-3 w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}

      {/* Check mark for earned badges */}
      {badge.isEarned && (
        <div className="absolute top-3 right-3 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}

      {/* Badge icon - dimmed if not earned */}
      <div className="flex items-center justify-center flex-shrink-0 mb-4">
        <img 
          src={BADGE_ICONS[badge.icon as keyof typeof BADGE_ICONS]} 
          alt={badge.name}
          className={`w-24 h-24 sm:w-28 sm:h-28 lg:w-40 lg:h-40 object-contain ${!badge.isEarned ? 'opacity-50 grayscale' : ''}`}
        />
      </div>

      {/* Badge information */}
      <div className="text-center flex flex-col justify-between flex-grow min-h-0">
        <div className="flex-grow">
          <RobotoFont 
            as="h3" 
            weight={700} 
            className={`text-base sm:text-lg mb-2 leading-tight break-words ${badge.rarity === 'rare' || badge.rarity === 'legendary' || badge.rarity === 'uncommon' ? 'text-white' : badge.rarity === 'common' ? 'text-black' : !badge.isEarned ? 'text-gray-600' : ''}`}
            style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
          >
            {badge.name}
          </RobotoFont>
          <RobotoFont 
            as="p" 
            weight={400} 
            className={`text-xs sm:text-sm mb-3 leading-tight break-words ${badge.rarity === 'rare' || badge.rarity === 'legendary' || badge.rarity === 'uncommon' ? 'text-white text-opacity-90' : badge.rarity === 'common' ? 'text-gray-800' : !badge.isEarned ? 'text-gray-500' : 'text-white text-opacity-90'}`}
            style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
          >
            {badge.description}
          </RobotoFont>
        </div>

        {/* Badge tags and requirements */}
        <div className="space-y-2 flex-shrink-0 mt-auto">
          <div className="flex justify-center gap-1 sm:gap-2 flex-wrap">
            <RobotoFont 
              as="span" 
              weight={700} 
              className={`px-2 sm:px-3 py-1 rounded-full text-xs uppercase tracking-wide ${getTypeColor(badge.type)}`} 
              style={getTypeStyle(badge.type)}
            >
              {badge.type}
            </RobotoFont>
            <RobotoFont 
              as="span" 
              weight={700} 
              className={`px-2 sm:px-3 py-1 rounded-full text-xs uppercase tracking-wide ${getRarityColor(badge.rarity)}`} 
              style={getRarityTagStyle(badge.rarity)}
            >
              {badge.rarity}
            </RobotoFont>
          </div>
          
          <div className={`text-xs ${badge.rarity === 'rare' || badge.rarity === 'legendary' || badge.rarity === 'uncommon' ? 'text-white text-opacity-80' : badge.rarity === 'common' ? 'text-gray-700' : badge.isEarned ? 'text-white text-opacity-80' : 'text-gray-600'}`}>
            <div className="flex items-center justify-start gap-0 mb-1">
              <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <RobotoFont 
                as="span" 
                weight={400} 
                className="leading-tight break-words flex-1"
                style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
              >
                {badge.requirement}
              </RobotoFont>
            </div>
            {badge.earnedDate && (
              <div className={`flex items-center justify-center gap-1 flex-wrap ${badge.rarity === 'rare' || badge.rarity === 'legendary' || badge.rarity === 'uncommon' ? 'text-white text-opacity-70' : badge.rarity === 'common' ? 'text-gray-600' : 'text-gray-500'}`}>
                <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <RobotoFont as="span" weight={400} className="break-words" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                  Earned on {badge.earnedDate}
                </RobotoFont>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};