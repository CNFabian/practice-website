// Badge system types - matches API contract for backend integration

export type BadgeType = 'module' | 'achievement';
export type BadgeRarity = 'common' | 'rare' | 'legendary' | 'uncommon';
export type BadgeCategory = 'module' | 'achievement';

// Core badge interface - update icon to URL when using backend images
export interface Badge {
  id: string;
  name: string;
  description: string;
  type: BadgeType;
  rarity: BadgeRarity;
  requirement: string;
  icon: string; // Change to URL for backend: 'https://api.example.com/icons/badge.svg'
  isEarned: boolean;
  isLocked: boolean;
  category: BadgeCategory;
  earnedDate?: string; // Consider ISO format: '2024-01-15T10:30:00Z'
}

// Progress tracking
export interface BadgeProgress {
  earned: number;
  total: number;
}

// UI configuration
export interface FilterButton {
  key: string;
  label: string;
}

// API response structure - should match backend response
export interface BadgeApiResponse {
  badges: Badge[];
  progress: BadgeProgress;
}

// Styling configuration for dynamic badge appearance
export interface BadgeStyleConfig {
  backgroundColor?: string;
  border?: string;
  color?: string;
  background?: string;
}