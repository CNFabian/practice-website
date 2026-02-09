// ==================== DASHBOARD API ====================
// Phase 1: Standardized to use shared fetchWithAuth from authAPI.ts
// Phase 2, Step 4: Added missing endpoints (transactions, statistics, activity)

import { fetchWithAuth } from './authAPI';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ==================== TYPES ====================

export interface CoinTransactionResponse {
  id: string;
  transaction_type: string;
  amount: number;
  source_type: string | null;
  description: string | null;
  created_at: string;
}

export interface UserStatisticsResponse {
  total_coins: number;
  lifetime_earned: number;
  lifetime_spent: number;
  total_badges: number;
  modules_completed: number;
  total_modules: number;
  lessons_completed: number;
  total_lessons: number;
  total_quizzes_taken: number;
  quizzes_passed: number;
  average_quiz_score: number;
  lessons_completed_today: number;
  lessons_completed_this_week: number;
  total_time_spent_minutes: number;
  current_streak: number;
  longest_streak: number;
}

export interface RecentActivityItem {
  id: string;
  activity_type: string;
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
}

// ==================== EXISTING ENDPOINTS ====================

// GET /api/dashboard/overview
export const getDashboardOverview = async (): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/dashboard/overview`, {
      method: 'GET'
    });
    
    // Check for the 500 error specifically to give better feedback
    if (response.status === 500) {
      console.error('SERVER ERROR: The backend crashed. Check UUID validation logic.');
      throw new Error('Internal Server Error');
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Dashboard overview data received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    throw error;
  }
};

export const getDashboardModules = async (): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/dashboard/modules`, {
      method: 'GET'
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching dashboard modules:', error);
    throw error;
  }
};

export const getCoinBalance = async (): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/dashboard/coins`, {
      method: 'GET'
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching coin balance:', error);
    throw error;
  }
};

export const getDashboardBadges = async (): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/dashboard/badges`, {
      method: 'GET'
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching dashboard badges:', error);
    throw error;
  }
};

// ==================== NEW ENDPOINTS (Phase 2, Step 4) ====================

// GET /api/dashboard/transactions - Get user's coin transaction history
export const getCoinTransactions = async (
  limit: number = 20,
  offset: number = 0
): Promise<CoinTransactionResponse[]> => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('limit', limit.toString());
    queryParams.append('offset', offset.toString());

    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/dashboard/transactions?${queryParams.toString()}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Coin transactions received:', data.length, 'transactions');
    return data;
  } catch (error) {
    console.error('Error fetching coin transactions:', error);
    throw error;
  }
};

// GET /api/dashboard/statistics - Get comprehensive user statistics
export const getUserStatistics = async (): Promise<UserStatisticsResponse> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/dashboard/statistics`, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('User statistics received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    throw error;
  }
};

// GET /api/dashboard/activity - Get recent user activity
export const getRecentActivity = async (
  limit: number = 10
): Promise<RecentActivityItem[]> => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('limit', limit.toString());

    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/dashboard/activity?${queryParams.toString()}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Recent activity received:', data.length, 'items');
    return data;
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    throw error;
  }
};