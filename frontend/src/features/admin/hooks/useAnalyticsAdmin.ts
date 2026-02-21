// ============================================================
// PHASE 4, STEP 14: NEW FILE — useAnalyticsAdmin.ts
// Location: frontend/src/hooks/queries/useAnalyticsAdmin.ts
//
// TanStack Query hooks for admin-only analytics endpoints.
// These hooks are for future admin dashboard use.
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import {
  getAllLeads,
  getHotLeads,
  getLeadDetail,
  getLeadHistory,
  getAnalyticsInsights,
  getAnalyticsDashboard,
  recalculateScores,
  calculateUserScore,
  triggerBatchRecalculation,
  triggerSnapshotCreation,
  triggerEventCleanup,
  getSchedulerStatus,
} from '../../../services/analyticsAPI';
import type {
  LeadFilters,
  LeadSummary,
  LeadDetailResponse,
  LeadScoreHistoryResponse,
  AnalyticsInsightsResponse,
  RecalculationRequest,
  RecalculationResponse,
  AnalyticsSuccessResponse,
} from '../../../services/analyticsAPI';

// ════════════════════════════════════════════════════════════════
// QUERY HOOKS — Read Operations
// ════════════════════════════════════════════════════════════════

/**
 * Fetch all leads with optional filters. Admin only.
 * staleTime: 30 seconds (admin needs near-real-time data)
 */
export const useAllLeads = (filters?: LeadFilters, enabled: boolean = true) => {
  return useQuery<LeadSummary[], Error>({
    queryKey: queryKeys.analytics.leads(filters),
    queryFn: () => getAllLeads(filters),
    staleTime: 30 * 1000, // 30 seconds
    enabled,
  });
};

/**
 * Fetch hot leads (score >= 800). Admin only.
 * staleTime: 30 seconds
 */
export const useHotLeads = (limit: number = 20, enabled: boolean = true) => {
  return useQuery<LeadSummary[], Error>({
    queryKey: queryKeys.analytics.hotLeads(limit),
    queryFn: () => getHotLeads(limit),
    staleTime: 30 * 1000,
    enabled,
  });
};

/**
 * Fetch detailed lead information. Admin only.
 * staleTime: 1 minute
 */
export const useLeadDetail = (userId: string, enabled: boolean = true) => {
  return useQuery<LeadDetailResponse, Error>({
    queryKey: queryKeys.analytics.leadDetail(userId),
    queryFn: () => getLeadDetail(userId),
    staleTime: 60 * 1000, // 1 minute
    enabled: enabled && !!userId,
  });
};

/**
 * Fetch lead score history. Admin only.
 * staleTime: 5 minutes (historical data doesn't change often)
 */
export const useLeadHistory = (
  userId: string,
  limit: number = 30,
  enabled: boolean = true
) => {
  return useQuery<LeadScoreHistoryResponse[], Error>({
    queryKey: queryKeys.analytics.leadHistory(userId, limit),
    queryFn: () => getLeadHistory(userId, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: enabled && !!userId,
  });
};

/**
 * Fetch aggregate analytics insights. Admin only.
 * staleTime: 1 minute
 */
export const useAnalyticsInsights = (enabled: boolean = true) => {
  return useQuery<AnalyticsInsightsResponse, Error>({
    queryKey: queryKeys.analytics.insights(),
    queryFn: getAnalyticsInsights,
    staleTime: 60 * 1000,
    enabled,
  });
};

/**
 * Fetch comprehensive analytics dashboard. Admin only.
 * staleTime: 1 minute
 */
export const useAnalyticsDashboard = (enabled: boolean = true) => {
  return useQuery<any, Error>({
    queryKey: queryKeys.analytics.dashboard(),
    queryFn: getAnalyticsDashboard,
    staleTime: 60 * 1000,
    enabled,
  });
};

/**
 * Fetch scheduler status. Admin only.
 * staleTime: 30 seconds
 */
export const useSchedulerStatus = (enabled: boolean = true) => {
  return useQuery<any, Error>({
    queryKey: queryKeys.analytics.schedulerStatus(),
    queryFn: getSchedulerStatus,
    staleTime: 30 * 1000,
    enabled,
  });
};

// ════════════════════════════════════════════════════════════════
// MUTATION HOOKS — Write Operations
// ════════════════════════════════════════════════════════════════

/**
 * Recalculate lead scores (specific users or all). Admin only.
 * Invalidates all analytics queries on success.
 */
export const useRecalculateScores = () => {
  const queryClient = useQueryClient();

  return useMutation<RecalculationResponse, Error, RecalculationRequest | undefined>({
    mutationFn: (request) => recalculateScores(request),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    },
  });
};

/**
 * Calculate score for a specific user. Admin only.
 * Invalidates the specific lead's detail and all leads list.
 */
export const useCalculateUserScore = () => {
  const queryClient = useQueryClient();

  return useMutation<AnalyticsSuccessResponse, Error, string>({
    mutationFn: (userId) => calculateUserScore(userId),
    onSettled: (_data, _error, userId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.leadDetail(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.leads() });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.insights() });
    },
  });
};

/**
 * Trigger batch recalculation of all scores. Admin only.
 * Invalidates all analytics queries.
 */
export const useTriggerBatchRecalculation = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, { maxAgeHours?: number; force?: boolean }>({
    mutationFn: ({ maxAgeHours, force }) => triggerBatchRecalculation(maxAgeHours, force),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    },
  });
};

/**
 * Trigger snapshot creation. Admin only.
 */
export const useTriggerSnapshotCreation = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, void>({
    mutationFn: () => triggerSnapshotCreation(),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.schedulerStatus() });
    },
  });
};

/**
 * Trigger event cleanup. Admin only.
 */
export const useTriggerEventCleanup = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, number | undefined>({
    mutationFn: (daysToKeep) => triggerEventCleanup(daysToKeep),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.schedulerStatus() });
    },
  });
};