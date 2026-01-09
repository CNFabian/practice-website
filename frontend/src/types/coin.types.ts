export interface CoinTransaction {
  id: string;
  amount: number;
  type: 'earned' | 'spent';
  source: 'lesson_complete' | 'quiz_complete' | 'module_complete' | 'daily_task' | 'minigame' | 'purchase' | 'streak_bonus' | 'achievement' | 'house_complete' | 'neighborhood_complete';
  description: string;
  timestamp: string;
  metadata?: {
    lessonId?: number;
    moduleId?: number;
    houseId?: string;
    neighborhoodId?: string;
    taskId?: string;
    achievementId?: string;
    purchaseId?: string;
  };
}

export interface CoinBalance {
  current: number;
  lifetime_earned: number;
  lifetime_spent: number;
  daily_earned: number;
  daily_limit: number;
  streak_multiplier: number;
}

export interface CoinReward {
  base_amount: number;
  bonus_amount?: number;
  streak_multiplier: number;
  final_amount: number;
  reason: string;
  conditions_met?: string[];
}

export interface CoinPurchase {
  id: string;
  item_id: string;
  item_name: string;
  item_type: 'avatar_customization' | 'house_decoration' | 'power_up' | 'unlock_bonus_content' | 'extra_hints';
  cost: number;
  description: string;
  is_consumable: boolean;
  purchase_limit?: number;
  times_purchased: number;
  is_available: boolean;
  unlock_conditions?: {
    min_level?: number;
    required_achievements?: string[];
    required_modules?: number[];
  };
}

export interface CoinShop {
  categories: CoinShopCategory[];
  featured_items: CoinPurchase[];
  daily_deals: CoinPurchase[];
  user_purchases: string[]; // IDs of purchased items
}

export interface CoinShopCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  items: CoinPurchase[];
  sort_order: number;
}

export interface CoinEarningRates {
  lesson_complete: number;
  quiz_perfect_score: number;
  quiz_good_score: number; // 80-99%
  quiz_passing_score: number; // 70-79%
  module_complete: number;
  house_complete: number;
  neighborhood_complete: number;
  daily_task_complete: number;
  streak_bonus_multiplier: number;
  perfect_lesson_bonus: number;
  first_try_bonus: number;
}

export interface DailyCoinLimits {
  max_daily_earnings: number;
  max_from_lessons: number;
  max_from_quizzes: number;
  max_from_tasks: number;
  unlimited_sources: string[]; // Sources that don't count toward daily limit
}