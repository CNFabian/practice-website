import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { queryKeys } from '../../lib/queryKeys';
import {
  getModules,
  getModule,
  getModuleLessons,
  getLesson,
  getLessonQuiz,
  getLearningProgressSummary,
} from '../../services/learningAPI';

export const useModules = () => {
  return useQuery({
    queryKey: queryKeys.learning.modules(),
    queryFn: getModules,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 1,
  });
};

export const useModule = (moduleId: string | number) => {
  return useQuery({
    queryKey: queryKeys.learning.module(moduleId),
    queryFn: () => getModule(String(moduleId)),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!moduleId,
    retry: 1,
  });
};

export const useModuleLessons = (moduleId: string | number) => {
  return useQuery({
    queryKey: queryKeys.learning.moduleLessons(moduleId),
    queryFn: () => getModuleLessons(String(moduleId)),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!moduleId,
    retry: 1,
  });
};

export const useLesson = (lessonId: string | number) => {
  return useQuery({
    queryKey: queryKeys.learning.lesson(lessonId),
    queryFn: () => getLesson(String(lessonId)),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!lessonId && !/^\d+$/.test(String(lessonId)),
    retry: 1,
  });
};

export const useLessonQuizOptimized = (
  lessonId: string | number,
  options?: {
    prefetch?: boolean;
    background?: boolean;
  }
) => {
  const queryClient = useQueryClient();
  const { prefetch = false, background = true } = options || {};

  const query = useQuery({
    queryKey: queryKeys.learning.lessonQuiz(lessonId),
    queryFn: () => getLessonQuiz(String(lessonId)),

    // Caching strategy
    staleTime: 10 * 60 * 1000, // 10 minutes - quiz data doesn't change frequently
    gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache longer

    enabled: !!lessonId && !/^\d+$/.test(String(lessonId)),
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000), // Exponential backoff

    // Network optimization
    refetchOnWindowFocus: false, // Quiz data is stable
    refetchOnReconnect: true, // But refresh on network reconnect
    
    // Performance optimization
    notifyOnChangeProps: ['data', 'error', 'isLoading', 'isFetching'],
  });

  // Prefetch quiz data when component mounts (if enabled)
  useEffect(() => {
    if (prefetch && lessonId && !/^\d+$/.test(String(lessonId))) {
      console.log('🔄 Prefetching quiz data for lesson:', lessonId);
      
      queryClient.prefetchQuery({
        queryKey: queryKeys.learning.lessonQuiz(lessonId),
        queryFn: () => getLessonQuiz(String(lessonId)),
        staleTime: 10 * 60 * 1000,
      });
    }
  }, [prefetch, lessonId, queryClient]);

  // Background data refresh (if enabled)
  useEffect(() => {
    if (background && query.data && lessonId) {
      const interval = setInterval(() => {
        // Silently refresh data in background without affecting UI
        queryClient.invalidateQueries({
          queryKey: queryKeys.learning.lessonQuiz(lessonId),
          refetchType: 'none', // Don't trigger refetch immediately
        });
      }, 5 * 60 * 1000); // Every 5 minutes

      return () => clearInterval(interval);
    }
  }, [background, query.data, lessonId, queryClient]);

  return query;
};

export const useLessonQuiz = (lessonId: string | number) => {
  return useLessonQuizOptimized(lessonId, {
    prefetch: true,
    background: true,
  });
};

export const useLearningProgressSummary = () => {
  return useQuery({
    queryKey: queryKeys.learning.progress.summary(),
    queryFn: getLearningProgressSummary,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 1,
  });
};

// Prefetching utility for module lessons
export const usePrefetchModuleLessonQuizzes = (lessons: Array<{ id: number; backendId?: string }>) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const prefetchQuizzes = async () => {
      console.log('🔄 Prefetching quiz data for all module lessons');
      
      const prefetchPromises = lessons
        .filter(lesson => lesson.backendId && !/^\d+$/.test(lesson.backendId))
        .map(lesson => 
          queryClient.prefetchQuery({
            queryKey: queryKeys.learning.lessonQuiz(lesson.backendId!),
            queryFn: () => getLessonQuiz(lesson.backendId!),
            staleTime: 10 * 60 * 1000,
          })
        );

      try {
        await Promise.allSettled(prefetchPromises);
        console.log('✅ Module quiz prefetching completed');
      } catch (error) {
        console.warn('⚠️ Some quiz prefetching failed:', error);
      }
    };

    // Debounce prefetching to avoid excessive requests
    const timeoutId = setTimeout(prefetchQuizzes, 1000);
    return () => clearTimeout(timeoutId);
  }, [lessons, queryClient]);
};