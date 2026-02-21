// ==================== BADGES API ====================
// Phase 1: Standardized to use shared fetchWithAuth from authAPI.ts

import { fetchWithAuth } from '../../../services/authAPI';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ==================== BADGE TYPES ====================

export interface ApiBadge {
  id: string;
  badge: {
    id: string;
    name: string;
    description: string;
    icon_url: string;
    badge_type: string;
    rarity: string;
    created_at: string;
  };
  earned_at: string;
  source_lesson_id: string;
}

export type BadgeType = 'module' | 'achievement';
export type BadgeRarity = 'common' | 'rare' | 'legendary' | 'uncommon';
export type BadgeCategory = 'module' | 'achievement';

export interface Badge {
  id: string;
  name: string;
  description: string;
  type: BadgeType;
  rarity: BadgeRarity;
  requirement: string;
  icon: string;
  isEarned: boolean;
  isLocked: boolean;
  category: BadgeCategory;
  earnedDate?: string;
}

export interface BadgeProgress {
  earned: number;
  total: number;
}

export interface BadgeApiResponse {
  badges: Badge[];
  progress: BadgeProgress;
}

export interface BadgeStyleConfig {
  backgroundColor?: string;
  border?: string;
  color?: string;
  background?: string;
}

// ==================== MOCK DATA ====================

const MOCK_BADGE_DATA: Badge[] = [
  {
    id: 'credit-conqueror',
    name: 'Credit Conqueror',
    description: 'Master your credit score and understanding',
    type: 'module',
    rarity: 'rare',
    requirement: 'Complete: Credit & Financial Readiness',
    icon: 'badge-finance',
    isEarned: false,
    isLocked: true,
    category: 'module'
  },
  {
    id: 'debt-dominator',
    name: 'Debt Dominator',
    description: 'Conquer debt management strategies',
    type: 'module',
    rarity: 'rare',
    requirement: 'Complete: Debt Management & Planning',
    icon: 'badge-finance',
    isEarned: false,
    isLocked: true,
    category: 'module'
  },
  {
    id: 'document-detective',
    name: 'Document Detective',
    description: 'Expert in documentation and paperwork',
    type: 'module',
    rarity: 'rare',
    requirement: 'Complete: Documentation & Paperwork',
    icon: 'badge-research',
    isEarned: false,
    isLocked: true,
    category: 'module'
  },
  {
    id: 'homeowner-hero',
    name: 'Homeowner Hero',
    description: 'Ready to take on homeownership',
    type: 'module',
    rarity: 'legendary',
    requirement: 'Complete: Homeownership Fundamentals',
    icon: 'badge-home',
    isEarned: false,
    isLocked: true,
    category: 'module'
  },
  {
    id: 'decision-maker',
    name: 'Decision Maker',
    description: 'Master of informed decision making',
    type: 'module',
    rarity: 'legendary',
    requirement: 'Complete: Readiness & Decision Making',
    icon: 'badge-navigation',
    isEarned: false,
    isLocked: true,
    category: 'module'
  },
  {
    id: 'first-lesson',
    name: 'First Lesson',
    description: 'Complete your first lesson',
    type: 'achievement',
    rarity: 'common',
    requirement: 'Complete any lesson',
    icon: 'badge-star',
    isEarned: false,
    isLocked: true,
    category: 'achievement'
  },
  {
    id: 'quiz-master',
    name: 'Quiz Master',
    description: 'Ace your first quiz',
    type: 'achievement',
    rarity: 'uncommon',
    requirement: 'Score 100% on any quiz',
    icon: 'badge-trophy',
    isEarned: false,
    isLocked: true,
    category: 'achievement'
  },
  {
    id: 'perfect-scorer',
    name: 'Perfect Scorer',
    description: 'Achieve perfect scores on all assessments',
    type: 'achievement',
    rarity: 'legendary',
    requirement: 'Get 100% on all assessments',
    icon: 'badge-trophy',
    isEarned: false,
    isLocked: true,
    category: 'achievement'
  }
];

// ==================== HELPER FUNCTIONS ====================

const mapApiBadgeToBadge = (apiBadge: ApiBadge): Badge => {
  return {
    id: apiBadge.id,
    name: apiBadge.badge.name,
    description: apiBadge.badge.description,
    type: apiBadge.badge.badge_type as BadgeType,
    rarity: apiBadge.badge.rarity as BadgeRarity,
    requirement: apiBadge.badge.description,
    icon: apiBadge.badge.icon_url,
    isEarned: true,
    isLocked: false,
    category: apiBadge.badge.badge_type as BadgeCategory,
    earnedDate: new Date(apiBadge.earned_at).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  };
};

const getMockBadgeData = (): BadgeApiResponse => {
  const earnedCount = MOCK_BADGE_DATA.filter(badge => badge.isEarned).length;
  const totalCount = MOCK_BADGE_DATA.length;
  
  return {
    badges: MOCK_BADGE_DATA,
    progress: {
      earned: earnedCount,
      total: totalCount
    }
  };
};

// ==================== API FUNCTIONS ====================

// GET /api/dashboard/badges - Get User Badges
export const getBadges = async (): Promise<BadgeApiResponse> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/dashboard/badges`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const apiBadges = await response.json();
    console.log('Badges data received:', apiBadges);

    // If API returns empty array, use mock data for development
    if (apiBadges.length === 0) {
      console.log('No badges from API, using mock data for development');
      return getMockBadgeData();
    }

    // Map API badges to our format
    const mappedBadges = apiBadges.map(mapApiBadgeToBadge);
    
    // Add locked badges from mock data (badges that haven't been earned yet)
    // In the future, backend should provide all badges (earned and locked)
    const earnedBadgeIds = new Set(mappedBadges.map((b: Badge) => b.id));
    const lockedBadges = MOCK_BADGE_DATA.filter(b => !earnedBadgeIds.has(b.id));
    const allBadges = [...mappedBadges, ...lockedBadges];

    return {
      badges: allBadges,
      progress: {
        earned: mappedBadges.length,
        total: allBadges.length
      }
    };
  } catch (error) {
    console.error('Error fetching badges:', error);
    console.log('Using mock badge data due to error');
    return getMockBadgeData();
  }
};

// Get badge progress summary
export const getBadgeProgress = async (): Promise<BadgeProgress> => {
  const { progress } = await getBadges();
  return progress;
};

// Filter badges by category - client-side filtering
export const getBadgesByFilter = async (filter: string): Promise<Badge[]> => {
  const { badges } = await getBadges();
  
  return badges.filter(badge => {
    switch (filter) {
      case 'module': return badge.category === 'module';
      case 'achievement': return badge.category === 'achievement';
      case 'earned': return badge.isEarned;
      case 'locked': return badge.isLocked && !badge.isEarned;
      default: return true;
    }
  });
};