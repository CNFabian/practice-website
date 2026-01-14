import React, { useState, useMemo, useEffect, useRef } from 'react';
import Phaser from 'phaser';
import LessonView from './LessonView';
import Minigame from './Minigame';
import { Module } from '../../../types/modules';

// Import Phaser scenes
import MapScene from './phaser/scenes/MapScene';
import NeighborhoodScene from './phaser/scenes/NeighborhoodScene';
import HouseScene from './phaser/scenes/HouseScene';

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

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: '#38bdf8',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false
        }
      },
      scene: [MapScene, NeighborhoodScene, HouseScene],
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
      }
    };

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
          houses: neighborhoodHouses[navState.neighborhoodId || 'downtown']
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

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (gameRef.current) {
        gameRef.current.scale.resize(window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showPhaserCanvas = ['map', 'neighborhood', 'house'].includes(navState.currentView);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Phaser Game Container */}
      <div
        ref={containerRef}
        className={`absolute inset-0 transition-opacity duration-300 ${
          showPhaserCanvas ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* React UI Overlays */}
      {navState.currentView === 'lesson' && currentLesson && currentModule && (
        <div className="absolute inset-0 bg-white z-10">
          <LessonView
            lesson={currentLesson}
            module={currentModule}
            onBack={handleBackToHouse}
          />
        </div>
      )}

      {navState.currentView === 'minigame' && (
        <div className="absolute inset-0 bg-white z-10">
          <Minigame onClose={handleCloseMinigame} />
        </div>
      )}
    </div>
  );
};

export default ModulesPage;