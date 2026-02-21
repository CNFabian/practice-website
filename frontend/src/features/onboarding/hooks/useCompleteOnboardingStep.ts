import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import {
  completeOnboardingAllSteps,
  type CompleteOnboardingData
} from '../services/onboardingAPI';

export const useCompleteOnboardingStep = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, CompleteOnboardingData>({
    mutationFn: (onboardingData) => completeOnboardingAllSteps(onboardingData),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.onboarding.status(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.onboarding.data(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.overview(),
      });
    },
  });
};
