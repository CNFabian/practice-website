import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { trackMaterialDownload } from '../../services/materialsAPI';

interface TrackMaterialDownloadParams {
  resourceId: string;
}

export const useTrackMaterialDownload = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, TrackMaterialDownloadParams>({
    mutationFn: ({ resourceId }) => trackMaterialDownload(resourceId),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.materials.resources(),
      });
    },
  });
};
