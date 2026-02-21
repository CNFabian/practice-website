import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import {
  getMaterialResources,
  getMaterialResource,
  getAvailableCalculators,
  getMaterialCategories,
  getMaterialChecklists,
  getMaterialsByType,
} from '../services/materialsAPI';

interface MaterialResourcesParams {
  resourceType?: string;
  category?: string;
}

export const useMaterialResources = (params?: MaterialResourcesParams) => {
  return useQuery({
    queryKey: queryKeys.materials.resources(params),
    queryFn: () => getMaterialResources(params?.resourceType, params?.category),

    staleTime: 30 * 60 * 1000,

    gcTime: 24 * 60 * 60 * 1000,

    refetchOnWindowFocus: false,

    retry: 1,
  });
};

export const useMaterialResource = (resourceId: string) => {
  return useQuery({
    queryKey: queryKeys.materials.resource(resourceId),
    queryFn: () => getMaterialResource(resourceId),

    staleTime: 30 * 60 * 1000,

    gcTime: 24 * 60 * 60 * 1000,

    enabled: !!resourceId,

    refetchOnWindowFocus: false,

    retry: 1,
  });
};

export const useAvailableCalculators = () => {
  return useQuery({
    queryKey: queryKeys.materials.calculators(),
    queryFn: getAvailableCalculators,

    staleTime: 30 * 60 * 1000,

    gcTime: 24 * 60 * 60 * 1000,

    refetchOnWindowFocus: false,

    retry: 1,
  });
};

export const useMaterialCategories = () => {
  return useQuery({
    queryKey: queryKeys.materials.categories(),
    queryFn: getMaterialCategories,

    staleTime: 30 * 60 * 1000,

    gcTime: 24 * 60 * 60 * 1000,

    refetchOnWindowFocus: false,

    retry: 1,
  });
};

export const useMaterialChecklists = () => {
  return useQuery({
    queryKey: queryKeys.materials.checklists(),
    queryFn: getMaterialChecklists,

    staleTime: 30 * 60 * 1000,

    gcTime: 24 * 60 * 60 * 1000,

    refetchOnWindowFocus: false,

    retry: 1,
  });
};

export const useMaterialsByType = (type: 'calculators' | 'worksheets' | 'checklists') => {
  return useQuery({
    queryKey: queryKeys.materials.byType(type),
    queryFn: () => getMaterialsByType(type),

    staleTime: 30 * 60 * 1000,

    gcTime: 24 * 60 * 60 * 1000,

    refetchOnWindowFocus: false,

    retry: 1,
  });
};
