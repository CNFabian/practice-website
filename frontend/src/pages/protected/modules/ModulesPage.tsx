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
  const [assetsLoaded, setAssetsLoaded] = useState(false);

  const [navState, setNavState] = useState<NavigationState>(() => {
    const savedState = localStorage.getItem('modules_nav_state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        console.log('Restored navigation state from localStorage:', parsed);
        return parsed;
      } catch (error) {
        console.error('Failed to parse saved navigation state:', error);
      }
    }
    return {
      currentView: 'map',
      neighborhoodId: null,
      houseId: null,
      moduleId: null,
      lessonId: null,
    };
  });

  useEffect(() => {
    localStorage.setItem('modules_nav_state', JSON.stringify(navState));
    console.log('Saved navigation state to localStorage:', navState);
  }, [navState]);

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
      moduleId: 1,
    }));
  };

  const handleLessonSelect = (lessonString: string) => {
    const lessonNumber = parseInt(lessonString.replace('lesson-', ''));
    const actualLessonId = 100 + lessonNumber;
    
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

    gameRef.current.events.on('ready', () => {
      console.log('Phaser game ready');
      setIsPhaserReady(true);
      
      // Check for assetsLoaded flag in registry
      const checkAssetsLoaded = setInterval(() => {
        if (gameRef.current) {
          const assetsLoadedFlag = gameRef.current.registry.get('assetsLoaded');
          if (assetsLoadedFlag) {
            console.log('Assets loaded flag detected!');
            setAssetsLoaded(true);
            clearInterval(checkAssetsLoaded);
          }
        }
      }, 100);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkAssetsLoaded);
        if (!assetsLoaded) {
          console.error('Assets failed to load within timeout');
        }
      }, 10000);
    });

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  // Pass navigation handlers to Phaser scenes
  useEffect(() => {
    if (!gameRef.current || !isPhaserReady || !assetsLoaded) return;

    // Get the first active scene (might be MapScene or whatever scene is running)
    const scenes = gameRef.current.scene.getScenes(false);
    if (scenes.length > 0) {
      const scene = scenes[0];
      scene.registry.set('handleNeighborhoodSelect', handleNeighborhoodSelect);
      scene.registry.set('handleHouseSelect', handleHouseSelect);
      scene.registry.set('handleLessonSelect', handleLessonSelect);
      scene.registry.set('handleMinigameSelect', handleMinigameSelect);
      scene.registry.set('handleBackToMap', handleBackToMap);
      scene.registry.set('handleBackToNeighborhood', handleBackToNeighborhood);
      scene.registry.set('neighborhoodHouses', neighborhoodHouses);
    }
  }, [isPhaserReady, assetsLoaded, neighborhoodHouses]);

  // Handle scene transitions - ONLY AFTER ASSETS ARE LOADED
  useEffect(() => {
    if (!gameRef.current || !isPhaserReady || !assetsLoaded) {
      console.log('Waiting for game initialization...', { isPhaserReady, assetsLoaded });
      return;
    }

    const game = gameRef.current;
    console.log('Navigation state changed:', navState);

    switch (navState.currentView) {
      case 'map':
        if (game.scene.isActive('NeighborhoodScene')) {
          game.scene.sleep('NeighborhoodScene');
        }
        if (game.scene.isActive('HouseScene')) {
          game.scene.sleep('HouseScene');
        }
        
        if (!game.scene.isActive('MapScene')) {
          game.scene.start('MapScene');
        }
        break;

      case 'neighborhood':
        if (game.scene.isActive('MapScene')) {
          game.scene.sleep('MapScene');
        }
        if (game.scene.isActive('HouseScene')) {
          game.scene.sleep('HouseScene');
        }
        
        // Always restart neighborhood scene with new data
        if (game.scene.isActive('NeighborhoodScene')) {
          game.scene.stop('NeighborhoodScene');
        }
        
        game.scene.start('NeighborhoodScene', {
          neighborhoodId: navState.neighborhoodId,
          houses: neighborhoodHouses['downtown']
        });
        break;

      case 'house':
        if (game.scene.isActive('MapScene')) {
          game.scene.sleep('MapScene');
        }
        if (game.scene.isActive('NeighborhoodScene')) {
          game.scene.sleep('NeighborhoodScene');
        }
        
        // Always restart house scene with new data
        if (game.scene.isActive('HouseScene')) {
          game.scene.stop('HouseScene');
        }
        
        game.scene.start('HouseScene', {
          houseId: navState.houseId,
          moduleId: navState.moduleId
        });
        break;

      case 'lesson':
      case 'minigame':
        if (game.scene.isActive('MapScene')) {
          game.scene.sleep('MapScene');
        }
        if (game.scene.isActive('NeighborhoodScene')) {
          game.scene.sleep('NeighborhoodScene');
        }
        if (game.scene.isActive('HouseScene')) {
          game.scene.sleep('HouseScene');
        }
        break;
    }
  }, [navState, isPhaserReady, assetsLoaded, neighborhoodHouses]);

  useEffect(() => {
    const handleResize = () => {
      if (gameRef.current) {
        const dpr = window.devicePixelRatio || 1;
        const newWidth = (window.innerWidth - 192) * dpr;
        const newHeight = window.innerHeight * dpr;
        gameRef.current.scale.resize(newWidth, newHeight);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showPhaserCanvas = ['map', 'neighborhood', 'house'].includes(navState.currentView);

  const getBackgroundStyle = () => {
    switch (navState.currentView) {
      case 'map':
        return { backgroundColor: '#38bdf8' };
      case 'neighborhood':
        return { backgroundColor: '#fed7aa' };
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

  useEffect(() => {
    console.log('Current view:', navState.currentView);
    console.log('Current module:', currentModule);
    console.log('Current lesson:', currentLesson);
  }, [navState.currentView, currentModule, currentLesson]);

  return (
    <div className="w-full h-screen overflow-hidden relative">
      {showPhaserCanvas && (
        <div 
          className="fixed inset-0 z-0"
          style={getBackgroundStyle()}
        />
      )}

      <div
        ref={containerRef}
        className={`w-full h-full relative z-10 transition-opacity duration-300 ${
          showPhaserCanvas ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

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