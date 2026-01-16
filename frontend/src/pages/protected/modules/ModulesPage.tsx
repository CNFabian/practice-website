import { useState, useEffect, useRef } from 'react';
import { SuburbanBackground } from '../../../assets';
import GameManager from './GameManager';
import LessonView from './LessonView';
import ModuleQuizView from './ModuleQuizView';
import type { Module, Lesson } from '../../../types/modules';

interface ModulesPageProps {}

interface NavState {
  currentView: 'map' | 'neighborhood' | 'house' | 'lesson' | 'minigame';
  neighborhoodId: string | null;
  houseId: string | null;
  moduleId: number | null;
  lessonId: number | null;
}

const ModulesPage: React.FC<ModulesPageProps> = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPhaserReady, setIsPhaserReady] = useState(false);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  
  // Initialize navState from GameManager's saved state or default to 'map'
  const [navState, setNavState] = useState<NavState>(() => {
     const saved = localStorage.getItem('moduleNavState');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved nav state:', e);
      }
    }
    // Default state if nothing saved
    return {
      currentView: 'map',
      neighborhoodId: null,
      houseId: null,
      moduleId: null,
      lessonId: null,
    };
  });

  // Save navState to GameManager whenever it changes
  useEffect(() => {
    GameManager.saveNavState(navState);
  }, [navState]);

  // Mock data that matches the full Module and Lesson interfaces
  // This needs to match the SAMPLE_MODULE data in HouseScene.ts
  const SAMPLE_LESSONS: Lesson[] = [
    {
      id: 101,
      backendId: 'lesson-101',
      image: '/placeholder-lesson.jpg',
      title: 'Renting vs Buying',
      duration: '10 min',
      description: 'Learn the key differences between renting and buying a home.',
      coins: 25,
      completed: false,
      videoUrl: ''
    },
    {
      id: 102,
      backendId: 'lesson-102',
      image: '/placeholder-lesson.jpg',
      title: 'Preparing Your Documents',
      duration: '15 min',
      description: 'Get organized with the essential documents you need.',
      coins: 30,
      completed: true,
      videoUrl: ''
    },
    {
      id: 103,
      backendId: 'lesson-103',
      image: '/placeholder-lesson.jpg',
      title: 'Financial Basics',
      duration: '20 min',
      description: 'Understand the financial fundamentals of homebuying.',
      coins: 35,
      completed: true,
      videoUrl: ''
    },
    {
      id: 104,
      backendId: 'lesson-104',
      image: '/placeholder-lesson.jpg',
      title: 'Setting a Timeline',
      duration: '12 min',
      description: 'Create a realistic timeline for your homebuying journey.',
      coins: 25,
      completed: false,
      videoUrl: ''
    },
  ];

  const mockModule: Module | null = navState.moduleId ? {
    id: navState.moduleId,
    backendId: `module-${navState.moduleId}`,
    image: '/placeholder-module.jpg',
    title: navState.moduleId === 1 ? 'Homebuying Foundations' : `Module ${navState.moduleId}`,
    description: 'Module description',
    lessonCount: 4,
    status: 'In Progress' as const,
    tags: ['Learning'],
    illustration: 'default',
    lessons: SAMPLE_LESSONS
  } : null;

  const currentModule = mockModule;
  const currentLesson = currentModule?.lessons.find(l => l.id === navState.lessonId) || null;

  const neighborhoodHouses: Record<string, any> = {
    downtown: [
      { 
        id: 'house1', 
        name: 'House 1', 
        x: 20,  // Position from left (percentage)
        y: 40,  // Position from top (percentage)
        moduleId: 1, 
        isLocked: false,
        houseType: 'house1'  // Which house texture to use
      },
      { 
        id: 'house2', 
        name: 'House 2', 
        x: 45, 
        y: 45, 
        moduleId: 2, 
        isLocked: false,
        houseType: 'house2'
      },
      { 
        id: 'house3', 
        name: 'House 3', 
        x: 70, 
        y: 50, 
        moduleId: 3, 
        isLocked: false,
        houseType: 'house3'
      },
      { 
        id: 'house4', 
        name: 'House 4', 
        x: 85, 
        y: 55, 
        moduleId: 4, 
        isLocked: false,
        houseType: 'house4'
      },
    ],
  };

  // Navigation handlers
  const handleNeighborhoodSelect = (neighborhoodId: string) => {
    setNavState(prev => ({
      ...prev,
      currentView: 'neighborhood',
      neighborhoodId,
      houseId: null,
      moduleId: null,
      lessonId: null,
    }));
  };

  const handleHouseSelect = (houseId: string, moduleId: number) => {
    setNavState(prev => ({
      ...prev,
      currentView: 'house',
      houseId,
      moduleId,
      lessonId: null,
    }));
  };

  const handleLessonSelect = (lessonId: number) => {
    const actualLessonId = lessonId;
    setNavState(prev => ({
      ...prev,
      currentView: 'lesson',
      lessonId: actualLessonId,
      moduleId: prev.moduleId || (prev.houseId ? neighborhoodHouses['downtown'].find((h: any) => h.id === prev.houseId)?.moduleId : null)
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

  // Initialize Phaser game using GameManager
  useEffect(() => {
    if (!containerRef.current) return;

    const game = GameManager.initializeGame(containerRef.current);
    
    // Check if already ready
    if (GameManager.isReady()) {
      setIsPhaserReady(true);
      
      if (GameManager.areAssetsLoaded()) {
        console.log('=== ASSETS ALREADY LOADED ===');
        setAssetsLoaded(true);
      } else {
        // Poll for assets if not loaded yet
        const checkInterval = setInterval(() => {
          const game = GameManager.getGame();
          if (game) {
            const flag = game.registry.get('assetsLoaded');
            if (flag) {
              console.log('=== ASSETS LOADED AND READY ===');
              setAssetsLoaded(true);
              clearInterval(checkInterval);
            }
          }
        }, 50);
        
        setTimeout(() => clearInterval(checkInterval), 10000);
      }
    } else {
      // Wait for ready event
      game.events.once('ready', () => {
        console.log('=== PHASER READY IN COMPONENT ===');
        setIsPhaserReady(true);
        
        // Poll for assets
        const checkInterval = setInterval(() => {
          const game = GameManager.getGame();
          if (game) {
            const flag = game.registry.get('assetsLoaded');
            if (flag) {
              console.log('=== ASSETS LOADED AND READY ===');
              setAssetsLoaded(true);
              clearInterval(checkInterval);
            }
          }
        }, 50);
        
        setTimeout(() => clearInterval(checkInterval), 10000);
      });
    }

    return () => {
      console.log('=== COMPONENT UNMOUNT - GAME PERSISTS ===');
    };
  }, []);

  // Pause/resume game based on view
  useEffect(() => {
    const game = GameManager.getGame();
    if (!game || !isPhaserReady) return;
    
    const isPhaserView = ['map', 'neighborhood', 'house'].includes(navState.currentView);
    
    if (isPhaserView) {
      game.resume();
    } else {
      game.pause();
    }
  }, [navState.currentView, isPhaserReady]);

  // Set navigation handlers
  useEffect(() => {
    const game = GameManager.getGame();
    if (!game || !isPhaserReady || !assetsLoaded) return;

    const scenes = game.scene.getScenes(false);
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
  }, [isPhaserReady, assetsLoaded]);

  // Handle scene transitions
  useEffect(() => {
    const game = GameManager.getGame();
    if (!game || !isPhaserReady || !assetsLoaded) return;

    switch (navState.currentView) {
      case 'map':
        if (game.scene.isActive('NeighborhoodScene')) game.scene.sleep('NeighborhoodScene');
        if (game.scene.isActive('HouseScene')) game.scene.sleep('HouseScene');
        if (!game.scene.isActive('MapScene')) game.scene.start('MapScene');
        break;

      case 'neighborhood':
        if (game.scene.isActive('MapScene')) game.scene.sleep('MapScene');
        if (game.scene.isActive('HouseScene')) game.scene.sleep('HouseScene');
        if (game.scene.isActive('NeighborhoodScene')) game.scene.stop('NeighborhoodScene');
        
        // Get stored house index from registry
        const scenes = game.scene.getScenes(false);
        const currentHouseIndex = scenes.length > 0 ? scenes[0].registry.get('currentHouseIndex') : undefined;
        
        game.scene.start('NeighborhoodScene', {
          neighborhoodId: navState.neighborhoodId,
          houses: neighborhoodHouses['downtown'],
          currentHouseIndex: currentHouseIndex
        });
      break;

      case 'house':
        if (game.scene.isActive('MapScene')) game.scene.sleep('MapScene');
        if (game.scene.isActive('NeighborhoodScene')) game.scene.sleep('NeighborhoodScene');
        if (game.scene.isActive('HouseScene')) game.scene.stop('HouseScene');
        
        game.scene.start('HouseScene', {
          houseId: navState.houseId,
          moduleId: navState.moduleId
        });
        break;

      case 'lesson':
      case 'minigame':
        if (game.scene.isActive('MapScene')) game.scene.sleep('MapScene');
        if (game.scene.isActive('NeighborhoodScene')) game.scene.sleep('NeighborhoodScene');
        if (game.scene.isActive('HouseScene')) game.scene.sleep('HouseScene');
        break;
    }
  }, [navState, isPhaserReady, assetsLoaded, neighborhoodHouses]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const game = GameManager.getGame();
      if (game) {
        const dpr = window.devicePixelRatio || 1;
        const newWidth = (window.innerWidth - 192) * dpr;
        const newHeight = window.innerHeight * dpr;
        game.scale.resize(newWidth, newHeight);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Save navigation state to localStorage
    localStorage.setItem('moduleNavState', JSON.stringify(navState));
  }, [navState]);

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
              <p>Lesson not found</p>
            </div>
          )}
        </div>
      )}

      {navState.currentView === 'minigame' && (
        <div className="absolute inset-0 bg-white z-20">
          {currentModule ? (
            <ModuleQuizView
              module={currentModule}
              onBack={handleCloseMinigame}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p>Module not found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ModulesPage;