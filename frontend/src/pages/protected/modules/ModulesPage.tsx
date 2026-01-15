import React, { useState, useMemo, useEffect, useRef } from 'react';
import Phaser from 'phaser';
import LessonView from './LessonView';
import Minigame from './Minigame';
import { Module } from '../../../types/modules';
import { createGameConfig } from './phaser/config/gameConfig';
import { SuburbanBackground } from '../../../assets';

type ViewType = 'map' | 'neighborhood' | 'house' | 'lesson' | 'minigame';

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
    lessonCount: 4,
    status: 'Not Started',
    tags: ['finance', 'basics'],
    illustration: '',
    lessons: [
      {
        id: 101,
        title: 'Renting vs Buying',
        description: 'Understanding the basics of renting vs buying',
        image: '',
        duration: '15 min',
        coins: 50,
        completed: false,
      },
      {
        id: 102,
        title: 'Preparing Your Documents',
        description: 'Essential documents for homebuying',
        image: '',
        duration: '20 min',
        coins: 50,
        completed: false,
      },
      {
        id: 103,
        title: 'Financial Basics',
        description: 'Core financial concepts',
        image: '',
        duration: '25 min',
        coins: 75,
        completed: false,
      },
      {
        id: 104,
        title: 'Setting a Timeline',
        description: 'Planning your homebuying journey',
        image: '',
        duration: '20 min',
        coins: 50,
        completed: false,
      },
    ],
  },
];

const ModulesPage: React.FC = () => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPhaserReady, setIsPhaserReady] = useState(false);

  const [navState, setNavState] = useState<NavigationState>({
    currentView: 'map',
    neighborhoodId: null,
    houseId: null,
    moduleId: null,
    lessonId: null,
  });

  // Define houses for each neighborhood
  const neighborhoodHouses = {
    downtown: [
      { 
        id: 'start_house', 
        name: 'Start House', 
        x: 20, 
        y: 40, 
        isLocked: false,
        houseType: 'house1'
      },
      { 
        id: 'math_manor', 
        name: 'Math Manor', 
        x: 45, 
        y: 45, 
        isLocked: false,
        houseType: 'house2'
      },
      { 
        id: 'science_lab', 
        name: 'Science Lab', 
        x: 70, 
        y: 50, 
        isLocked: false,
        houseType: 'house3'
      },
    ],
  };

  // Find the current lesson and module based on state
  const currentModule = useMemo(() => {
    if (!navState.moduleId) return null;
    return MOCK_MODULES.find(m => m.id === navState.moduleId) || null;
  }, [navState.moduleId]);

  const currentLesson = useMemo(() => {
    if (!currentModule || !navState.lessonId) return null;
    return currentModule.lessons.find(l => l.id === navState.lessonId) || null;
  }, [currentModule, navState.lessonId]);

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
      moduleId: 1, // TODO: Map house to actual module
    }));
  };

  const handleLessonSelect = (lessonString: string) => {
    // Parse lessonId from string format "lesson-1"
    const lessonNumber = parseInt(lessonString.replace('lesson-', ''));
    const actualLessonId = 100 + lessonNumber; // Maps lesson-1 to 101, lesson-2 to 102, etc.
    
    console.log('handleLessonSelect called with:', lessonString);
    console.log('Converted to lessonId:', actualLessonId);
    
    setNavState(prev => ({
      ...prev,
      currentView: 'lesson',
      lessonId: actualLessonId,
    }));
  };

  const handleMinigameSelect = () => {
    setNavState(prev => ({
      ...prev,
      currentView: 'minigame',
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

  const handleCloseMinigame = () => {
    setNavState(prev => ({
      ...prev,
      currentView: 'house',
    }));
  };

  // Initialize Phaser game
  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const config = createGameConfig(containerRef.current);

    gameRef.current = new Phaser.Game(config);

    // Set up event listeners for scene communication
    gameRef.current.events.on('ready', () => {
      setIsPhaserReady(true);
    });

    // Cleanup on unmount
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  // Pass navigation handlers to Phaser scenes
  useEffect(() => {
    if (!gameRef.current || !isPhaserReady) return;

    const currentScene = gameRef.current.scene.getScenes(true)[0];
    
    if (currentScene) {
      // Store navigation handlers in scene registry for access from Phaser
      currentScene.registry.set('handleNeighborhoodSelect', handleNeighborhoodSelect);
      currentScene.registry.set('handleHouseSelect', handleHouseSelect);
      currentScene.registry.set('handleLessonSelect', handleLessonSelect);
      currentScene.registry.set('handleMinigameSelect', handleMinigameSelect);
      currentScene.registry.set('handleBackToMap', handleBackToMap);
      currentScene.registry.set('handleBackToNeighborhood', handleBackToNeighborhood);
      currentScene.registry.set('neighborhoodHouses', neighborhoodHouses);
    }
  }, [isPhaserReady, neighborhoodHouses]);

  // Handle scene transitions based on navigation state
  useEffect(() => {
    if (!gameRef.current || !isPhaserReady) return;

    const game = gameRef.current;

    console.log('Navigation state changed:', navState);

    switch (navState.currentView) {
      case 'map':
        if (game.scene.isActive('NeighborhoodScene')) {
          game.scene.stop('NeighborhoodScene');
        }
        if (game.scene.isActive('HouseScene')) {
          game.scene.stop('HouseScene');
        }
        game.scene.start('MapScene');
        break;

      case 'neighborhood':
        game.scene.stop('MapScene');
        if (game.scene.isActive('HouseScene')) {
          game.scene.stop('HouseScene');
        }
        game.scene.start('NeighborhoodScene', {
          neighborhoodId: navState.neighborhoodId,
          houses: neighborhoodHouses['downtown']
        });
        break;

      case 'house':
        game.scene.stop('MapScene');
        game.scene.stop('NeighborhoodScene');
        game.scene.start('HouseScene', {
          houseId: navState.houseId,
          moduleId: navState.moduleId
        });
        break;

      case 'lesson':
      case 'minigame':
        // Stop all Phaser scenes when in lesson or minigame view
        game.scene.stop('MapScene');
        game.scene.stop('NeighborhoodScene');
        game.scene.stop('HouseScene');
        break;
    }
  }, [navState, isPhaserReady, neighborhoodHouses]);

  // Handle window resize with high DPI support
  useEffect(() => {
    const handleResize = () => {
      if (gameRef.current) {
        const dpr = window.devicePixelRatio || 1;
        const newWidth = (window.innerWidth - 192) * dpr;
        const newHeight = window.innerHeight * dpr;
        
        // Resize the game canvas
        gameRef.current.scale.resize(newWidth, newHeight);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showPhaserCanvas = ['map', 'neighborhood', 'house'].includes(navState.currentView);

  // Get background color/gradient based on current view
  const getBackgroundStyle = () => {
    switch (navState.currentView) {
      case 'map':
        return { backgroundColor: '#38bdf8' }; // Sky blue
      case 'neighborhood':
        return { backgroundColor: '#fed7aa' }; // Orange
      case 'house':
        return {
          backgroundImage: `url(${SuburbanBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        };
      default:
        return { backgroundColor: '#ffffff' };
    }
  };

  // Debug logging
  useEffect(() => {
    console.log('Current view:', navState.currentView);
    console.log('Current module:', currentModule);
    console.log('Current lesson:', currentLesson);
  }, [navState.currentView, currentModule, currentLesson]);

  return (
    <div className="w-full h-screen overflow-hidden relative">
      {/* CSS Background Layer - fixed to viewport, extends behind sidebar */}
      {showPhaserCanvas && (
        <div 
          className="fixed inset-0 z-0"
          style={getBackgroundStyle()}
        />
      )}

      {/* Phaser Game Container - transparent canvas over background */}
      <div
        ref={containerRef}
        className={`w-full h-full relative z-10 transition-opacity duration-300 ${
          showPhaserCanvas ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* React UI Overlays */}
      {navState.currentView === 'lesson' && (
        <div className="absolute inset-0 bg-white z-20">
          {currentLesson && currentModule ? (
            <LessonView
              lesson={currentLesson}
              module={currentModule}
              onBack={handleBackToHouse}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Loading lesson...</h2>
                <p className="text-gray-600">Module ID: {navState.moduleId}</p>
                <p className="text-gray-600">Lesson ID: {navState.lessonId}</p>
                <button 
                  onClick={handleBackToHouse}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Back to House
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {navState.currentView === 'minigame' && (
        <div className="absolute inset-0 bg-white z-20">
          <Minigame onClose={handleCloseMinigame} />
        </div>
      )}
    </div>
  );
};

export default ModulesPage;