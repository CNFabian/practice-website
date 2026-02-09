import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import {
  batchUpdateProgress,
  type BatchProgressItem,
  type BatchProgressResponse,
} from '../../services/learningAPI';

export const useBatchUpdateProgress = () => {
  const queryClient = useQueryClient();

  return useMutation<BatchProgressResponse, Error, BatchProgressItem[]>({
    mutationFn: (items) => batchUpdateProgress(items),

    onSuccess: () => {
      // Invalidate all learning-related queries after batch sync
      queryClient.invalidateQueries({
        queryKey: queryKeys.learning.modules(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.overview(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.coins(),
      });
    },
  });
};