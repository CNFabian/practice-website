// Badge styling constants and configurations
// Backend: Replace BADGE_ICONS with URLs when using server-hosted images

import {
  BadgeFinance,
  BadgeHome,
  BadgeInsurance,
  BadgeNavigation,
  BadgeResearch,
  BadgeSavings,
  BadgeStar,
  BadgePrize,
  BadgeRocket,
  BadgeTrophy
} from '../../../../assets';
import type { BadgeRarity, BadgeType, BadgeStyleConfig } from '../../../../services';

export interface FilterButton {
  key: string;
  label: string;
}

const tempProfileIcon = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIyMCIgcj0iMTIiIGZpbGw9IiM0RjQ2RTUiLz4KPHBhdGggZD0iTTMyIDM2QzE5IDM2IDggNDcgOCA2MEg1NkM1NiA0NyA0NSAzNiAzMiAzNloiIGZpbGw9IiM0RjQ2RTUiLz4KPC9zdmc+";

// Icon mapping - change to URLs for backend integration
export const BADGE_ICONS = {
  'badge-finance': BadgeFinance,
  'badge-home': BadgeHome,
  'badge-insurance': BadgeInsurance,
  'badge-navigation': BadgeNavigation,
  'badge-research': BadgeResearch,
  'badge-savings': BadgeSavings,
  'badge-star': BadgeStar,
  'badge-prize': BadgePrize,
  'badge-rocket': BadgeRocket,
  'badge-trophy': BadgeTrophy,
  'temp-profile': tempProfileIcon
};

// Rarity-based styling configurations
export const RARITY_COLORS: Record<BadgeRarity, string> = {
  common: '',
  uncommon: 'bg-purple-400',
  rare: '',
  legendary: ''
};

export const RARITY_TAG_STYLES: Record<BadgeRarity, BadgeStyleConfig> = {
  common: { backgroundColor: '#10b981', color: 'black' },
  uncommon: { backgroundColor: '#82c785', color: 'white' },
  rare: { backgroundColor: '#ba68c8', color: 'white' },
  legendary: { backgroundColor: 'rgba(255, 255, 255, 0.3)', color: 'white' }
};

// Card background styles for different rarities
export const RARITY_CARD_STYLES = {
  common: {
    earned: { 
      backgroundColor: '#ffffff', 
      border: '2px solid #10b981',
      color: '#374151'
    },
    unearned: { 
      backgroundColor: '#ffffff', 
      border: '2px solid #d1d5db',
      color: '#6b7280'
    }
  },
  uncommon: { background: 'linear-gradient(135deg, #65b6f6 0%, #5ea0e0 100%)' },
  rare: { background: 'linear-gradient(135deg, #819ed1 0%, #505c9f 100%)' },
  legendary: { background: 'linear-gradient(135deg, #fe8d60 0%, #ffbd4d 100%)' }
};

// Badge type styling
export const TYPE_COLORS: Record<BadgeType, string> = {
  module: 'text-white',
  achievement: 'text-white'
};

export const TYPE_STYLES: Record<BadgeType, BadgeStyleConfig> = {
  module: { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
  achievement: { backgroundColor: 'rgba(128, 128, 128, 0.3)' }
};

// Filter options - consider fetching from backend for dynamic filters
export const FILTER_BUTTONS: FilterButton[] = [
  { key: 'all', label: 'All Badges' },
  { key: 'module', label: 'Module Badges' },
  { key: 'achievement', label: 'Achievement Badges' },
  { key: 'earned', label: 'Earned' },
  { key: 'locked', label: 'Locked' }
];