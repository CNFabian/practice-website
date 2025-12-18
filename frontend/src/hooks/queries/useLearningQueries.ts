import { useQuery } from '@tanstack/react-query';
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

export const useLessonQuiz = (lessonId: string | number) => {
  return useQuery({
    queryKey: queryKeys.learning.lessonQuiz(lessonId),
    queryFn: () => getLessonQuiz(String(lessonId)),

    staleTime: 5 * 60 * 1000,

    gcTime: 10 * 60 * 1000,

    enabled: !!lessonId && !/^\d+$/.test(String(lessonId)),

    retry: 1,
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
