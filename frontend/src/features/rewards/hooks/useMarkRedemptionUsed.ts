import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { rewardsAPI, type ApiResponse } from '../services/rewardsAPI';

export const useMarkRedemptionUsed = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse, Error, string>({
    mutationFn: (redemptionId: string) =>
      rewardsAPI.markRedemptionUsed(redemptionId),

    onSettled: () => {
      // Refresh redemption list so badge changes from Active → Used
      queryClient.invalidateQueries({
        queryKey: queryKeys.rewards.redemptions(),
      });
      // Refresh reward statistics (active count changes)
      queryClient.invalidateQueries({
        queryKey: queryKeys.rewards.statistics(),
      });
      // Refresh recent activity feed
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.activity(),
      });
    },
  });
};