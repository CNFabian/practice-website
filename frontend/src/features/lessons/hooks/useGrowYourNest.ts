/**
 * useGrowYourNest.ts
 *
 * React Query hooks for the "Grow Your Nest" minigame API.
 * Provides data fetching, mutations, and helper functions for both
 * lesson mode and free roam mode.
 *
 * 🔴 CRITICAL DEV NOTE: Submit Event Timing
 * - Do NOT fire submit/completion events on button click
 * - Always wait for backend success response (onSuccess) for true measurement
 * - This ensures events only fire when the backend confirms the submission succeeded
 * - Applies to both useGYNLessonSubmit and useGYNFreeRoamAnswer mutations
 * - onSuccess = backend confirmed ✅ | onClick = user intent only ⚠️
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getLessonQuestions,
  submitLessonAnswers,
  getFreeRoamQuestions,
  submitFreeRoamAnswer,
  getFreeRoamState,
  transformGYNQuestionsForMinigame,
} from '../../../services/growYourNestAPI';

import type {
  LessonQuestionsResponse,
  LessonSubmitRequest,
  LessonSubmitResponse,
  FreeRoamQuestionsResponse,
  FreeRoamAnswerRequest,
  FreeRoamAnswerResponse,
  FreeRoamStateResponse,
  GYNMinigameInitData,
  GYNMinigameQuestion,
  TreeState,
} from '../../../types/growYourNest.types';

// ═══════════════════════════════════════════════════════════════
// QUERY KEYS
// ═══════════════════════════════════════════════════════════════

export const GYN_QUERY_KEYS = {
  lessonQuestions: (lessonId: string) => ['gyn', 'lesson', lessonId, 'questions'] as const,
  freeRoamQuestions: (moduleId: string) => ['gyn', 'freeroam', moduleId, 'questions'] as const,
  freeRoamState: (moduleId: string) => ['gyn', 'freeroam', moduleId, 'state'] as const,
};

// ═══════════════════════════════════════════════════════════════
// LESSON MODE HOOKS
// ═══════════════════════════════════════════════════════════════

/**
 * Fetch questions for lesson mode GYN minigame.
 * Only enabled when lessonId is a valid UUID (not a frontend numeric ID).
 */
export const useGYNLessonQuestions = (lessonId: string) => {
  return useQuery<LessonQuestionsResponse>({
    queryKey: GYN_QUERY_KEYS.lessonQuestions(lessonId),
    queryFn: () => getLessonQuestions(lessonId),
    enabled: !!lessonId && !/^\d+$/.test(lessonId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Don't retry 400 errors — these are validation errors
    // ("Please complete the lesson video first", "already been played")
    // not transient failures. Only retry on 5xx / network errors.
    retry: (failureCount: number, error: Error) => {
      if (failureCount >= 2) return false;
      const msg = error?.message || '';
      if (msg.includes('status: 400') || msg.includes('status: 404')) return false;
      return true;
    },
  });
};

/**
 * Submit lesson mode answers (all 3 at once).
 * Invalidates relevant queries on success.
 */
export const useGYNLessonSubmit = (lessonId: string) => {
  const queryClient = useQueryClient();

  return useMutation<LessonSubmitResponse, Error, LessonSubmitRequest>({
    mutationFn: (submission) => submitLessonAnswers(lessonId, submission),
    // ✅ onSuccess fires ONLY after backend confirms — correct place for analytics events
    onSuccess: () => {
      // Invalidate lesson questions (since GYN is one-time per lesson)
      queryClient.invalidateQueries({ queryKey: GYN_QUERY_KEYS.lessonQuestions(lessonId) });
      // Invalidate learning data to refresh grow_your_nest_played field
      queryClient.invalidateQueries({ queryKey: ['learning'] });
    },
    onError: (error) => {
      console.error('🌳 Lesson submit mutation error:', error);
    },
  });
};

// ═══════════════════════════════════════════════════════════════
// FREE ROAM MODE HOOKS
// ═══════════════════════════════════════════════════════════════

/**
 * Fetch all questions for free roam mode.
 * Only enabled when moduleId is a valid UUID and free roam is available.
 */
export const useGYNFreeRoamQuestions = (moduleId: string, enabled: boolean = true) => {
  return useQuery<FreeRoamQuestionsResponse>({
    queryKey: GYN_QUERY_KEYS.freeRoamQuestions(moduleId),
    queryFn: () => getFreeRoamQuestions(moduleId),
    enabled: enabled && !!moduleId && !/^\d+$/.test(moduleId),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};

/**
 * Submit free roam answer with server-side validation.
 * Invalidates the free roam state query on success.
 */
export const useGYNFreeRoamAnswer = (moduleId: string) => {
  const queryClient = useQueryClient();

  return useMutation<FreeRoamAnswerResponse, Error, FreeRoamAnswerRequest>({
    mutationFn: (answerData) => submitFreeRoamAnswer(moduleId, answerData),
    // ✅ onSuccess fires ONLY after backend confirms — correct place for analytics events
    onSuccess: () => {
      // Invalidate free roam state to reflect updated tree
      queryClient.invalidateQueries({ queryKey: GYN_QUERY_KEYS.freeRoamState(moduleId) });
      // Invalidate learning data to refresh tree_growth_points etc.
      queryClient.invalidateQueries({ queryKey: ['learning'] });
    },
    onError: (error) => {
      console.error('🌳 Free roam answer mutation error:', error);
    },
  });
};

/**
 * Fetch current tree state for resuming free roam mode.
 * Used when entering free roam to restore the tree's previous state.
 */
export const useGYNFreeRoamState = (moduleId: string, enabled: boolean = true) => {
  return useQuery<FreeRoamStateResponse>({
    queryKey: GYN_QUERY_KEYS.freeRoamState(moduleId),
    queryFn: () => getFreeRoamState(moduleId),
    enabled: enabled && !!moduleId && !/^\d+$/.test(moduleId),
    staleTime: 30 * 1000, // 30 seconds (tree state changes frequently)
    retry: 2,
  });
};

// ═══════════════════════════════════════════════════════════════
// HELPER: BUILD MINIGAME INIT DATA
// ═══════════════════════════════════════════════════════════════

/**
 * Build the GYNMinigameInitData to pass to the Phaser scene for lesson mode.
 * Call this after fetching lesson questions.
 */
export const buildLessonModeInitData = (
  lessonId: string,
  moduleNumber: number,
  questionsResponse: LessonQuestionsResponse,
  moduleId?: string
): GYNMinigameInitData => {
  const transformedQuestions: GYNMinigameQuestion[] = transformGYNQuestionsForMinigame(
    questionsResponse.questions
  );

  return {
    mode: 'lesson',
    lessonId,
    moduleId,
    questions: transformedQuestions,
    treeState: questionsResponse.tree_state,
    moduleNumber,
    showStartScreen: true,
  };
};

/**
 * Build the GYNMinigameInitData to pass to the Phaser scene for free roam mode.
 * Call this after fetching free roam questions and state.
 */
export const buildFreeRoamInitData = (
  moduleId: string,
  moduleNumber: number,
  questionsResponse: FreeRoamQuestionsResponse,
  stateResponse?: FreeRoamStateResponse
): GYNMinigameInitData => {
  const transformedQuestions: GYNMinigameQuestion[] = transformGYNQuestionsForMinigame(
    questionsResponse.questions
  );

  // Use state response for tree state if available (more current), fallback to questions response
  const treeState: TreeState = stateResponse
    ? {
        growth_points: stateResponse.growth_points,
        current_stage: stateResponse.current_stage,
        total_stages: stateResponse.total_stages,
        points_per_stage: stateResponse.points_per_stage,
        completed: stateResponse.completed,
      }
    : questionsResponse.tree_state;

  return {
    mode: 'freeroam',
    moduleId,
    questions: transformedQuestions,
    treeState,
    moduleNumber,
    showStartScreen: true,
  };
};