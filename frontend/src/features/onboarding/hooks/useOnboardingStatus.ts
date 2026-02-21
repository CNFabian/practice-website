import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { getOnboardingStatus } from '../services/onboardingAPI';

export const useOnboardingStatus = () => {
  return useQuery({
    queryKey: queryKeys.onboarding.status(),
    queryFn: getOnboardingStatus,

    staleTime: 0,

    gcTime: 2 * 60 * 1000,

    refetchOnWindowFocus: true,

    retry: 1,
  });
};
