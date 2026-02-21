import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { rewardsAPI, type Redemption, type CoinBalance } from '../services/rewardsAPI';

interface RedeemCouponParams {
  couponId: string;
  costInCoins: number;
}

interface MutationContext {
  previousCoinBalance?: CoinBalance;
}

export const useRedeemCoupon = () => {
  const queryClient = useQueryClient();

  return useMutation<Redemption, Error, RedeemCouponParams, MutationContext>({
    mutationFn: ({ couponId }) => rewardsAPI.redeemCoupon(couponId),

    onMutate: async ({ costInCoins }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.dashboard.coins(),
      });

      const previousCoinBalance = queryClient.getQueryData<CoinBalance>(
        queryKeys.dashboard.coins()
      );

      queryClient.setQueryData<CoinBalance>(
        queryKeys.dashboard.coins(),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            current_balance: old.current_balance - costInCoins,
            lifetime_spent: old.lifetime_spent + costInCoins,
          };
        }
      );

      return { previousCoinBalance };
    },

    onError: (_error, _variables, context) => {
      if (context?.previousCoinBalance) {
        queryClient.setQueryData(
          queryKeys.dashboard.coins(),
          context.previousCoinBalance
        );
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.coins(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.rewards.coupons(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.rewards.redemptions(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.transactions(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.rewards.statistics(),
      });
    },
  });
};
