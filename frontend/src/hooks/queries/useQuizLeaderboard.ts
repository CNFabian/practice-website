// ============================================================
// PHASE 4, STEP 18: NEW FILE — useQuizLeaderboard.ts
// Location: frontend/src/hooks/queries/useQuizLeaderboard.ts
//
// TanStack Query hook for fetching quiz leaderboard data.
// Uses GET /api/quiz/leaderboard (already exists in quizAPI.ts).
// Query key already exists: queryKeys.quiz.leaderboard()
// ============================================================

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { getQuizLeaderboard } from '../../services/quizAPI';

/** Single leaderboard entry from the backend */
export interface QuizLeaderboardEntry {
  rank: number;
  user_id: string;
  name: string;
  average_score: number;
  total_attempts: number;
  total_passed: number;
  is_current_user: boolean;
}

/** Full leaderboard response from the backend */
export interface QuizLeaderboardResponse {
  leaderboard: QuizLeaderboardEntry[];
  current_user_rank: number | null;
}

/**
 * Hook to fetch the quiz leaderboard.
 *
 * Returns ranked users by average quiz score.
 * staleTime: 30 seconds — leaderboard is near-real-time.
 *
 * Usage:
 *   const { data, isLoading, error } = useQuizLeaderboard(5);
 *   // data?.leaderboard, data?.current_user_rank
 */
export const useQuizLeaderboard = (limit: number = 5, enabled: boolean = true) => {
  return useQuery<QuizLeaderboardResponse, Error>({
    queryKey: queryKeys.quiz.leaderboard(limit),
    queryFn: () => getQuizLeaderboard(limit),
    staleTime: 30 * 1000, // 30 seconds
    enabled,
  });
};