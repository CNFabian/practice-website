// Badge service layer - handles all badge data operations
// Backend: Replace mock data with actual API calls to your badge endpoints

import type { Badge, BadgeApiResponse, BadgeProgress } from '../types';

// Mock data - replace with backend API calls
const mockBadgeData: Badge[] = [
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
    id: 'savings-specialist',
    name: 'Savings Specialist',
    description: 'Master of savings strategies and financial planning',
    type: 'module',
    rarity: 'rare',
    requirement: 'Complete: Savings & Financial Planning',
    icon: 'badge-savings',
    isEarned: false,
    isLocked: true,
    category: 'module'
  },
  {
    id: 'insurance-expert',
    name: 'Insurance Expert',
    description: 'Understand insurance options and protection strategies',
    type: 'module',
    rarity: 'rare',
    requirement: 'Complete: Insurance & Protection',
    icon: 'badge-insurance',
    isEarned: false,
    isLocked: true,
    category: 'module'
  },
  {
    id: 'welcome-aboard',
    name: 'Welcome Aboard',
    description: 'Completed the onboarding process',
    type: 'achievement',
    rarity: 'common',
    requirement: 'Sign up and complete profile',
    icon: 'badge-rocket',
    isEarned: true,
    isLocked: false,
    earnedDate: 'Sep 10, 2025',
    category: 'achievement'
  },
  {
    id: 'profile-master',
    name: 'Profile Master',
    description: 'Complete all profile information',
    type: 'achievement',
    rarity: 'common',
    requirement: 'Complete all profile info',
    icon: 'temp-profile',
    isEarned: false,
    isLocked: true,
    category: 'achievement'
  },
  {
    id: 'quiz-master',
    name: 'Quiz Master',
    description: 'Complete all available quizzes',
    type: 'achievement',
    rarity: 'uncommon',
    requirement: 'Complete all quizzes',
    icon: 'badge-prize',
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

export class BadgeService {
  // Get all badges with progress - replace with: fetch('/api/badges')
  static async getAllBadges(): Promise<BadgeApiResponse> {
    await this.simulateDelay();
    
    const earnedCount = mockBadgeData.filter(badge => badge.isEarned).length;
    const totalCount = mockBadgeData.length;
    
    return {
      badges: mockBadgeData,
      progress: {
        earned: earnedCount,
        total: totalCount
      }
    };
  }

  // Filter badges by category - can be client-side or server-side filtering
  static async getBadgesByFilter(filter: string): Promise<Badge[]> {
    await this.simulateDelay();
    
    return mockBadgeData.filter(badge => {
      switch (filter) {
        case 'module': return badge.category === 'module';
        case 'achievement': return badge.category === 'achievement';
        case 'earned': return badge.isEarned;
        case 'locked': return badge.isLocked && !badge.isEarned;
        default: return true;
      }
    });
  }

  // Get progress summary - replace with: fetch('/api/badges/progress')
  static async getBadgeProgress(): Promise<BadgeProgress> {
    await this.simulateDelay();
    
    const earnedCount = mockBadgeData.filter(badge => badge.isEarned).length;
    const totalCount = mockBadgeData.length;
    
    return {
      earned: earnedCount,
      total: totalCount
    };
  }

  // Update badge earned status - replace with: PUT '/api/badges/:id'
  static async updateBadgeStatus(badgeId: string, isEarned: boolean, earnedDate?: string): Promise<Badge> {
    await this.simulateDelay();
    
    const badgeIndex = mockBadgeData.findIndex(badge => badge.id === badgeId);
    if (badgeIndex === -1) {
      throw new Error('Badge not found');
    }
    
    mockBadgeData[badgeIndex] = {
      ...mockBadgeData[badgeIndex],
      isEarned,
      isLocked: !isEarned,
      earnedDate: isEarned ? earnedDate : undefined
    };
    
    return mockBadgeData[badgeIndex];
  }

  // Remove this when using real API
  private static async simulateDelay(ms: number = 500): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}