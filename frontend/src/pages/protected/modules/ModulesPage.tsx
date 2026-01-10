import React, { useState, useMemo } from 'react';
import MapView from './MapView';
import NeighborhoodView from './NeighborhoodView';
import HouseView from './HouseView';
import LessonView from './LessonView';
import { Module } from '../../../types/modules';

type ViewType = 'map' | 'neighborhood' | 'house' | 'lesson';

interface NavigationState {
  currentView: ViewType;
  neighborhoodId: string | null;
  houseId: string | null;
  moduleId: number | null;
  lessonId: number | null;
}

// Mock data for testing - replace with real data from your backend/context
const MOCK_MODULES: Module[] = [
  {
    id: 1,
    title: 'Finance Fundamentals',
    description: 'Learn the basics of personal finance',
    image: '',
    lessonCount: 3,
    status: 'Not Started',
    tags: ['finance', 'basics'],
    illustration: '',
    lessons: [
      {
        id: 101,
        title: 'Introduction to Financial Literacy',
        description: 'Understanding the basics of personal finance',
        image: '',
        duration: '15 min',
        coins: 50,
        completed: false,
      },
      {
        id: 102,
        title: 'Core Financial Concepts',
        description: 'Essential knowledge for managing your finances',
        image: '',
        duration: '20 min',
        coins: 50,
        completed: false,
      },
      {
        id: 103,
        title: 'Practical Application',
        description: 'Applying financial principles to real life',
        image: '',
        duration: '25 min',
        coins: 75,
        completed: false,
      },
    ],
  },
];

const ModulesPage: React.FC = () => {
  const [navState, setNavState] = useState<NavigationState>({
    currentView: 'map',
    neighborhoodId: null,
    houseId: null,
    moduleId: null,
    lessonId: null,
  });

  // Define houses for each neighborhood
  const neighborhoodHouses: Record<string, Array<{id: string; name: string; x: number; y: number; isLocked: boolean}>> = {
    'downtown': [
      { id: 'house_1', name: 'Starter House', x: 25, y: 40, isLocked: false },
      { id: 'house_2', name: 'Math Manor', x: 50, y: 30, isLocked: false },
      { id: 'house_3', name: 'Science Lab', x: 75, y: 45, isLocked: true }
    ],
    'suburbs': [
      { id: 'house_4', name: 'Reading Room', x: 30, y: 50, isLocked: false },
      { id: 'house_5', name: 'History Hall', x: 70, y: 60, isLocked: false }
    ]
  };

  // Get current module and lesson from state
  const currentModule = useMemo(() => {
    if (!navState.moduleId) return null;
    return MOCK_MODULES.find(m => m.id === navState.moduleId) || null;
  }, [navState.moduleId]);

  const currentLesson = useMemo(() => {
    if (!navState.lessonId || !currentModule) return null;
    return currentModule.lessons.find(l => l.id === navState.lessonId) || null;
  }, [navState.lessonId, currentModule]);

  // Navigation handlers
  const handleNeighborhoodSelect = (neighborhoodId: string) => {
    setNavState({
      currentView: 'neighborhood',
      neighborhoodId,
      houseId: null,
      moduleId: null,
      lessonId: null,
    });
  };

  const handleHouseSelect = (houseId: string) => {
    setNavState(prev => ({
      ...prev,
      currentView: 'house',
      houseId,
      moduleId: 1, // Set to first module for now - replace with actual mapping
      lessonId: null,
    }));
  };

  const handleLessonSelect = (lessonId: string) => {
    // Parse lessonId as number
    const numericLessonId = parseInt(lessonId.replace('lesson-', ''));
    const actualLessonId = 100 + numericLessonId; // Maps lesson-1 to 101, lesson-2 to 102, etc.
    
    setNavState(prev => ({
      ...prev,
      currentView: 'lesson',
      lessonId: actualLessonId,
    }));
  };

  const handleBackToMap = () => {
    setNavState({
      currentView: 'map',
      neighborhoodId: null,
      houseId: null,
      moduleId: null,
      lessonId: null,
    });
  };

  const handleBackToNeighborhood = () => {
    setNavState(prev => ({
      ...prev,
      currentView: 'neighborhood',
      houseId: null,
      moduleId: null,
      lessonId: null,
    }));
  };

  const handleBackToHouse = () => {
    setNavState(prev => ({
      ...prev,
      currentView: 'house',
      lessonId: null,
    }));
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {navState.currentView === 'map' && (
        <MapView onNeighborhoodSelect={handleNeighborhoodSelect} />
      )}

      {navState.currentView === 'neighborhood' && (
        <NeighborhoodView
          neighborhoodId={navState.neighborhoodId || undefined}
          houses={neighborhoodHouses[navState.neighborhoodId || 'downtown']}
          onHouseSelect={handleHouseSelect}
          onBackToMap={handleBackToMap}
        />
      )}

      {navState.currentView === 'house' && (
        <HouseView
          houseId={navState.houseId || undefined}
          onLessonSelect={handleLessonSelect}
          onBackToNeighborhood={handleBackToNeighborhood}
        />
      )}

      {navState.currentView === 'lesson' && currentLesson && currentModule && (
        <LessonView
          lesson={currentLesson}
          module={currentModule}
          onBack={handleBackToHouse}
        />
      )}
    </div>
  );
};

export default ModulesPage;