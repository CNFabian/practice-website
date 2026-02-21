import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { rewardsAPI } from '../services/rewardsAPI';

interface CouponsParams {
  category?: string;
  min_coins?: number;
  max_coins?: number;
}

interface RedemptionsParams {
  limit?: number;
  offset?: number;
  active_only?: boolean;
}

export const useCoupons = (params?: CouponsParams) => {
  return useQuery({
    queryKey: queryKeys.rewards.coupons(params),
    queryFn: () => rewardsAPI.getCoupons(params),

    staleTime: 5 * 60 * 1000,

    gcTime: 10 * 60 * 1000,

    refetchOnWindowFocus: true,

    retry: 1,
  });
};

export const useCoupon = (couponId: string) => {
  return useQuery({
    queryKey: queryKeys.rewards.coupon(couponId),
    queryFn: () => rewardsAPI.getCouponDetails(couponId),

    staleTime: 5 * 60 * 1000,

    gcTime: 10 * 60 * 1000,

    enabled: !!couponId,

    retry: 1,
  });
};

export const useMyRedemptions = (params?: RedemptionsParams) => {
  return useQuery({
    queryKey: queryKeys.rewards.redemptions(params),
    queryFn: () => rewardsAPI.getMyRedemptions(params),

    staleTime: 2 * 60 * 1000,

    gcTime: 5 * 60 * 1000,

    refetchOnWindowFocus: true,

    retry: 1,
  });
};

export const useRedemption = (redemptionId: string) => {
  return useQuery({
    queryKey: queryKeys.rewards.redemption(redemptionId),
    queryFn: () => rewardsAPI.getRedemptionDetails(redemptionId),

    staleTime: 5 * 60 * 1000,

    gcTime: 10 * 60 * 1000,

    enabled: !!redemptionId,

    retry: 1,
  });
};

export const useRewardCategories = () => {
  return useQuery({
    queryKey: queryKeys.rewards.categories(),
    queryFn: () => rewardsAPI.getRewardCategories(),

    staleTime: 30 * 60 * 1000,

    gcTime: 60 * 60 * 1000,

    refetchOnWindowFocus: false,

    retry: 1,
  });
};

export const useRewardStatistics = () => {
  return useQuery({
    queryKey: queryKeys.rewards.statistics(),
    queryFn: () => rewardsAPI.getRewardStatistics(),

    staleTime: 5 * 60 * 1000,

    gcTime: 10 * 60 * 1000,

    refetchOnWindowFocus: true,

    retry: 1,
  });
};
