import { fetchWithAuth } from './authAPI';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ════════════════════════════════════════════════════════════════
// TYPESCRIPT INTERFACES
// ════════════════════════════════════════════════════════════════

/** User's own progress metrics (non-sensitive) — from GET /api/analytics/my-progress */
export interface UserProgressResponse {
  user_id: string;
  engagement_level: string; // "Low" | "Medium" | "High"
  progress_percentage: number;
  lessons_completed: number;
  modules_completed: number;
  badges_earned: number;
  coins_balance: number;
  recent_achievements: string[];
}

/** Lead score details — admin only */
export interface LeadScoreResponse {
  user_id: string;
  engagement_score: number;
  timeline_urgency_score: number;
  help_seeking_score: number;
  learning_velocity_score: number;
  rewards_score: number;
  composite_score: number;
  lead_temperature: string | null;
  intent_band: string | null;
  profile_completion_pct: number;
  available_signals_count: number;
  total_signals_count: number;
  last_calculated_at: string;
  last_activity_at: string | null;
}

/** Simplified lead summary for list views — admin only */
export interface LeadSummary {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  composite_score: number;
  lead_temperature: string | null;
  temperature_label: string | null;
  intent_band: string | null;
  intent_label: string | null;
  profile_completion_pct: number;
  last_activity_at: string | null;
  created_at: string;
}

/** Detailed lead information — admin only */
export interface LeadDetailResponse {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  created_at: string;
  last_login_at: string | null;
  scores: LeadScoreResponse;
  temperature: string | null;
  temperature_label: string | null;
  intent_band: string | null;
  intent_label: string | null;
  classification_reasoning: string | null;
  recommended_actions: Record<string, any> | null;
  onboarding_data: Record<string, any> | null;
}

/** Historical lead score snapshot — admin only */
export interface LeadScoreHistoryResponse {
  snapshot_date: string;
  composite_score: number;
  lead_temperature: string | null;
  intent_band: string | null;
  metrics: Record<string, any> | null;
}

/** Aggregate analytics insights — admin only */
export interface AnalyticsInsightsResponse {
  total_leads: number;
  temperature_distribution: Record<string, any>;
  intent_distribution: Record<string, any>;
  average_composite_score: number;
  average_profile_completion: number;
  high_priority_leads: number;
  actionable_leads: number;
}

/** Recalculation request — admin only */
export interface RecalculationRequest {
  user_ids?: string[] | null; // null = all users
  force?: boolean;
}

/** Recalculation response — admin only */
export interface RecalculationResponse {
  success: boolean;
  message: string;
  total_users: number;
  successful: number;
  failed: number;
  execution_time_seconds: number;
}

/** Generic success response */
export interface AnalyticsSuccessResponse {
  success: boolean;
  message: string;
  data?: Record<string, any>;
}

/** Lead filter options — admin only */
export interface LeadFilters {
  temperature?: string;
  intent?: string;
  min_score?: number;
  max_score?: number;
  min_completion?: number;
  limit?: number;
  offset?: number;
}

// ════════════════════════════════════════════════════════════════
// USER-FACING ENDPOINTS
// ════════════════════════════════════════════════════════════════

/**
 * GET /api/analytics/my-progress
 * Get current user's own progress metrics (non-sensitive).
 * Does not expose lead scores, only engagement metrics.
 */
export const getMyProgress = async (): Promise<UserProgressResponse> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/analytics/my-progress`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user progress:', error);
    throw error;
  }
};

// ════════════════════════════════════════════════════════════════
// ADMIN-ONLY ENDPOINTS — Lead Management
// ════════════════════════════════════════════════════════════════

/**
 * GET /api/analytics/leads
 * Get all leads with filtering options. Admin only.
 */
export const getAllLeads = async (filters?: LeadFilters): Promise<LeadSummary[]> => {
  try {
    const params = new URLSearchParams();
    if (filters?.temperature) params.append('temperature', filters.temperature);
    if (filters?.intent) params.append('intent', filters.intent);
    if (filters?.min_score !== undefined) params.append('min_score', String(filters.min_score));
    if (filters?.max_score !== undefined) params.append('max_score', String(filters.max_score));
    if (filters?.min_completion !== undefined) params.append('min_completion', String(filters.min_completion));
    if (filters?.limit !== undefined) params.append('limit', String(filters.limit));
    if (filters?.offset !== undefined) params.append('offset', String(filters.offset));

    const queryString = params.toString();
    const url = `${API_BASE_URL}/api/analytics/leads${queryString ? `?${queryString}` : ''}`;

    const response = await fetchWithAuth(url, { method: 'GET' });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching leads:', error);
    throw error;
  }
};

/**
 * GET /api/analytics/leads/hot
 * Quick access to hot leads (score >= 800). Admin only.
 */
export const getHotLeads = async (limit: number = 20): Promise<LeadSummary[]> => {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/analytics/leads/hot?limit=${limit}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching hot leads:', error);
    throw error;
  }
};

/**
 * GET /api/analytics/leads/{user_id}
 * Get detailed lead information for a specific user. Admin only.
 */
export const getLeadDetail = async (userId: string): Promise<LeadDetailResponse> => {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/analytics/leads/${userId}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching lead detail:', error);
    throw error;
  }
};

/**
 * GET /api/analytics/leads/{user_id}/history
 * Get historical lead score snapshots for a user. Admin only.
 */
export const getLeadHistory = async (
  userId: string,
  limit: number = 30
): Promise<LeadScoreHistoryResponse[]> => {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/analytics/leads/${userId}/history?limit=${limit}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching lead history:', error);
    throw error;
  }
};

// ════════════════════════════════════════════════════════════════
// ADMIN-ONLY ENDPOINTS — Insights & Dashboard
// ════════════════════════════════════════════════════════════════

/**
 * GET /api/analytics/insights
 * Get aggregate analytics insights across all leads. Admin only.
 */
export const getAnalyticsInsights = async (): Promise<AnalyticsInsightsResponse> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/analytics/insights`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching analytics insights:', error);
    throw error;
  }
};

/**
 * GET /api/analytics/dashboard
 * Get comprehensive analytics dashboard data. Admin only.
 */
export const getAnalyticsDashboard = async (): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/analytics/dashboard`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching analytics dashboard:', error);
    throw error;
  }
};

// ════════════════════════════════════════════════════════════════
// ADMIN-ONLY ENDPOINTS — Score Management
// ════════════════════════════════════════════════════════════════

/**
 * POST /api/analytics/recalculate
 * Trigger manual recalculation of lead scores. Admin only.
 * Can recalculate specific users or all users.
 */
export const recalculateScores = async (
  request?: RecalculationRequest
): Promise<RecalculationResponse> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/analytics/recalculate`, {
      method: 'POST',
      body: JSON.stringify(request ?? { force: false }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error recalculating scores:', error);
    throw error;
  }
};

/**
 * POST /api/analytics/calculate/{user_id}
 * Calculate/recalculate score for a specific user. Admin only.
 */
export const calculateUserScore = async (userId: string): Promise<AnalyticsSuccessResponse> => {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/analytics/calculate/${userId}`,
      { method: 'POST' }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error calculating user score:', error);
    throw error;
  }
};

// ════════════════════════════════════════════════════════════════
// ADMIN-ONLY ENDPOINTS — Scheduler Operations
// ════════════════════════════════════════════════════════════════

/**
 * POST /api/analytics/scheduler/recalculate-all
 * Manually trigger batch recalculation of all lead scores. Admin only.
 */
export const triggerBatchRecalculation = async (
  maxAgeHours?: number,
  force: boolean = false
): Promise<any> => {
  try {
    const params = new URLSearchParams();
    if (maxAgeHours !== undefined) params.append('max_age_hours', String(maxAgeHours));
    if (force) params.append('force', 'true');

    const queryString = params.toString();
    const url = `${API_BASE_URL}/api/analytics/scheduler/recalculate-all${queryString ? `?${queryString}` : ''}`;

    const response = await fetchWithAuth(url, { method: 'POST' });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error triggering batch recalculation:', error);
    throw error;
  }
};

/**
 * POST /api/analytics/scheduler/create-snapshots
 * Manually trigger creation of daily lead score snapshots. Admin only.
 */
export const triggerSnapshotCreation = async (): Promise<any> => {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/analytics/scheduler/create-snapshots`,
      { method: 'POST' }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error triggering snapshot creation:', error);
    throw error;
  }
};

/**
 * POST /api/analytics/scheduler/cleanup-events
 * Manually trigger cleanup of old behavior events. Admin only.
 */
export const triggerEventCleanup = async (daysToKeep: number = 90): Promise<any> => {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/analytics/scheduler/cleanup-events?days_to_keep=${daysToKeep}`,
      { method: 'POST' }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error triggering event cleanup:', error);
    throw error;
  }
};

/**
 * GET /api/analytics/scheduler/status
 * Get scheduler status and configuration. Admin only.
 */
export const getSchedulerStatus = async (): Promise<any> => {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/analytics/scheduler/status`,
      { method: 'GET' }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching scheduler status:', error);
    throw error;
  }
};