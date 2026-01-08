// ═══════════════════════════════════════════════════════════════
// ROUTING CONFIGURATION for Gamified Learning Platform
// ═══════════════════════════════════════════════════════════════

import { RouteObject } from 'react-router-dom';
import { lazy, createElement } from 'react';

// Lazy load components for better performance
const MapView = lazy(() => import('../pages/protected/modules/MapView'));
const NeighborhoodView = lazy(() => import('../pages/protected/modules/NeighborhoodView'));
const HouseView = lazy(() => import('../pages/protected/modules/HouseView'));

// Keep existing components for now (during transition)
const LessonView = lazy(() => import('../pages/protected/modules/LessonView'));
const ModuleQuizView = lazy(() => import('../pages/protected/modules/ModuleQuizView'));

// ═══════════════════════════════════════════════════════════════
// ROUTE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

export const gamifiedRoutes: RouteObject[] = [
  // Main map view (replaces current module grid)
  {
    path: '/modules',
    element: createElement(MapView),
    children: [
      // Default route shows map
      {
        index: true,
        element: createElement(MapView),
      },
      
      // Neighborhood-specific routes
      {
        path: 'neighborhood/:neighborhoodId',
        element: createElement(NeighborhoodView),
        children: [
          // House-specific routes within neighborhood
          {
            path: 'house/:houseId',
            element: createElement(HouseView),
            children: [
              // Module/lesson routes within house
              {
                path: 'module/:moduleId',
                element: createElement(HouseView), // Shows module selection within house
              },
              {
                path: 'module/:moduleId/lesson/:lessonId',
                element: createElement(LessonView),
              },
              {
                path: 'module/:moduleId/quiz',
                element: createElement(ModuleQuizView),
              },
            ],
          },
        ],
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// ROUTE CONSTANTS
// ═══════════════════════════════════════════════════════════════

export const ROUTES = {
  // Main navigation
  MAP: '/modules',
  
  // Neighborhood routes
  NEIGHBORHOOD: (neighborhoodId: string) => `/modules/neighborhood/${neighborhoodId}`,
  
  // House routes
  HOUSE: (neighborhoodId: string, houseId: string) => 
    `/modules/neighborhood/${neighborhoodId}/house/${houseId}`,
  
  // Module routes within house
  MODULE: (neighborhoodId: string, houseId: string, moduleId: number) => 
    `/modules/neighborhood/${neighborhoodId}/house/${houseId}/module/${moduleId}`,
  
  // Lesson routes
  LESSON: (neighborhoodId: string, houseId: string, moduleId: number, lessonId: number) => 
    `/modules/neighborhood/${neighborhoodId}/house/${houseId}/module/${moduleId}/lesson/${lessonId}`,
  
  // Quiz routes
  MODULE_QUIZ: (neighborhoodId: string, houseId: string, moduleId: number) => 
    `/modules/neighborhood/${neighborhoodId}/house/${houseId}/module/${moduleId}/quiz`,
} as const;

// ═══════════════════════════════════════════════════════════════
// NAVIGATION HELPERS
// ═══════════════════════════════════════════════════════════════

export interface NavigationContext {
  neighborhoodId?: string;
  houseId?: string;
  moduleId?: number;
  lessonId?: number;
}

export const buildRoute = {
  map: () => ROUTES.MAP,
  
  neighborhood: (context: { neighborhoodId: string }) => 
    ROUTES.NEIGHBORHOOD(context.neighborhoodId),
  
  house: (context: { neighborhoodId: string; houseId: string }) => 
    ROUTES.HOUSE(context.neighborhoodId, context.houseId),
  
  module: (context: { neighborhoodId: string; houseId: string; moduleId: number }) => 
    ROUTES.MODULE(context.neighborhoodId, context.houseId, context.moduleId),
  
  lesson: (context: { neighborhoodId: string; houseId: string; moduleId: number; lessonId: number }) => 
    ROUTES.LESSON(context.neighborhoodId, context.houseId, context.moduleId, context.lessonId),
  
  quiz: (context: { neighborhoodId: string; houseId: string; moduleId: number }) => 
    ROUTES.MODULE_QUIZ(context.neighborhoodId, context.houseId, context.moduleId),
};

// ═══════════════════════════════════════════════════════════════
// BREADCRUMB CONFIGURATION
// ═══════════════════════════════════════════════════════════════

export interface Breadcrumb {
  label: string;
  route?: string;
  isActive?: boolean;
}

export const generateBreadcrumbs = (
  context: NavigationContext,
  data: {
    neighborhoods?: { [id: string]: { name: string } };
    houses?: { [id: string]: { name: string } };
    modules?: { [id: string]: { title: string } };
    lessons?: { [id: string]: { title: string } };
  }
): Breadcrumb[] => {
  const breadcrumbs: Breadcrumb[] = [
    { label: 'Learning Map', route: ROUTES.MAP }
  ];

  if (context.neighborhoodId) {
    const neighborhoodName = data.neighborhoods?.[context.neighborhoodId]?.name || 'Neighborhood';
    breadcrumbs.push({
      label: neighborhoodName,
      route: ROUTES.NEIGHBORHOOD(context.neighborhoodId)
    });
  }

  if (context.houseId && context.neighborhoodId) {
    const houseName = data.houses?.[context.houseId]?.name || 'House';
    breadcrumbs.push({
      label: houseName,
      route: ROUTES.HOUSE(context.neighborhoodId, context.houseId)
    });
  }

  if (context.moduleId && context.houseId && context.neighborhoodId) {
    const moduleName = data.modules?.[context.moduleId]?.title || 'Module';
    breadcrumbs.push({
      label: moduleName,
      route: ROUTES.MODULE(context.neighborhoodId, context.houseId, context.moduleId)
    });
  }

  if (context.lessonId) {
    const lessonName = data.lessons?.[context.lessonId]?.title || 'Lesson';
    breadcrumbs.push({
      label: lessonName,
      isActive: true
    });
  }

  return breadcrumbs;
};

// ═══════════════════════════════════════════════════════════════
// ROUTE GUARDS & VALIDATION
// ═══════════════════════════════════════════════════════════════

export const validateRouteParams = (params: any): boolean => {
  // Validate that required IDs exist and are in correct format
  if (params.neighborhoodId && typeof params.neighborhoodId !== 'string') {
    return false;
  }
  
  if (params.houseId && typeof params.houseId !== 'string') {
    return false;
  }
  
  if (params.moduleId && isNaN(Number(params.moduleId))) {
    return false;
  }
  
  if (params.lessonId && isNaN(Number(params.lessonId))) {
    return false;
  }
  
  return true;
};

export const checkUnlockStatus = (
  context: NavigationContext,
  unlockedContent: {
    neighborhoods: string[];
    houses: string[];
    modules: number[];
  }
): boolean => {
  // Check if user has access to requested content
  if (context.neighborhoodId && !unlockedContent.neighborhoods.includes(context.neighborhoodId)) {
    return false;
  }
  
  if (context.houseId && !unlockedContent.houses.includes(context.houseId)) {
    return false;
  }
  
  if (context.moduleId && !unlockedContent.modules.includes(context.moduleId)) {
    return false;
  }
  
  return true;
};

// ═══════════════════════════════════════════════════════════════
// TRANSITION CONFIGURATION
// ═══════════════════════════════════════════════════════════════

export const TRANSITION_CONFIGS = {
  // Zoom in when entering a more detailed view
  MAP_TO_NEIGHBORHOOD: {
    duration: 600,
    easing: 'easeInOut',
    type: 'zoom-in'
  },
  
  NEIGHBORHOOD_TO_HOUSE: {
    duration: 500,
    easing: 'easeInOut',
    type: 'zoom-in'
  },
  
  HOUSE_TO_MODULE: {
    duration: 400,
    easing: 'ease',
    type: 'slide-right'
  },
  
  // Slide transitions for same-level navigation
  HOUSE_TO_HOUSE: {
    duration: 400,
    easing: 'ease',
    type: 'slide-horizontal'
  },
  
  MODULE_TO_MODULE: {
    duration: 300,
    easing: 'ease',
    type: 'slide-horizontal'
  },
  
  // Zoom out when going back to higher level view
  NEIGHBORHOOD_TO_MAP: {
    duration: 600,
    easing: 'easeInOut',
    type: 'zoom-out'
  },
  
  HOUSE_TO_NEIGHBORHOOD: {
    duration: 500,
    easing: 'easeInOut',
    type: 'zoom-out'
  }
} as const;

export default gamifiedRoutes;