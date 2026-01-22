import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { HouseBackground } from '../../../assets';
import GameManager from './phaser/managers/GameManager';
import LessonView from './LessonView';
import Minigame from './Minigame';
import type { Module, Lesson } from '../../../types/modules';
import { useModules, useModuleLessons } from '../../../hooks/queries/useLearningQueries';
import { useCoinBalance } from '../../../hooks/queries/useCoinBalance';

interface NavState {
  currentView: 'map' | 'neighborhood' | 'house' | 'lesson' | 'minigame';
  neighborhoodId: string | null;
  houseId: string | null;
  moduleId: number | null;
  moduleBackendId: string | null;
  lessonId: number | null;
  currentHouseIndex: number;  
}

const ModulesPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPhaserReady, setIsPhaserReady] = useState(false);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const { data: coinBalanceData } = useCoinBalance();
  const totalCoins = coinBalanceData?.current_balance || 0;

  const [navState, setNavState] = useState<NavState>(() => {
    const saved = localStorage.getItem('moduleNavState');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved nav state:', e);
      }
    }
    return {
      currentView: 'map',
      neighborhoodId: null,
      houseId: null,
      moduleId: null,
      moduleBackendId: null,
      lessonId: null,
      currentHouseIndex: 0,
    };
  });

  const { 
    data: modulesData, 
    isLoading: isLoadingModules, 
    error: modulesError 
  } = useModules();

  const { 
    data: lessonsData, 
    isLoading: isLoadingLessons,
    error: lessonsError 
  } = useModuleLessons(navState.moduleBackendId || '');

  // Save nav state to localStorage
  useEffect(() => {
    GameManager.saveNavState(navState);
  }, [navState]);

  // Navigation handlers - memoized with useCallback
  const handleNeighborhoodSelect = useCallback((neighborhoodId: string) => {
    setNavState(prev => ({
      ...prev,
      currentView: 'neighborhood',
      neighborhoodId,
      houseId: null,
      moduleId: null,
      moduleBackendId: null,
      lessonId: null,
    }));
  }, []);

  const handleHouseSelect = useCallback((houseId: string, moduleId: number, moduleBackendId: string) => {
    const game = GameManager.getGame();
    const currentHouseIndex = game?.registry.get('currentHouseIndex') ?? 0;
  
    setNavState(prev => ({
      ...prev,
      currentView: 'house',
      houseId,
      moduleId,
      moduleBackendId,
      lessonId: null,
      currentHouseIndex,
    }));
  }, []);

  const handleLessonSelect = useCallback((lessonId: number) => {
    setNavState(prev => ({
      ...prev,
      currentView: 'lesson',
      lessonId,
    }));
  }, []);

  const handleMinigameSelect = useCallback(() => {
    setNavState(prev => ({
      ...prev,
      currentView: 'minigame',
    }));
  }, []);

  const handleBackToMap = useCallback(() => {
    setNavState({
      currentView: 'map',
      neighborhoodId: null,
      houseId: null,
      moduleId: null,
      moduleBackendId: null,
      lessonId: null,
      currentHouseIndex: 0,
    });
  }, []);

  const handleBackToNeighborhood = useCallback(() => {
    setNavState(prev => ({
      ...prev,
      currentView: 'neighborhood',
      houseId: null,
      moduleId: null,
      moduleBackendId: null,
      lessonId: null,
    }));
  }, []);

  const handleBackToHouse = useCallback(() => {
    setNavState(prev => ({
      ...prev,
      currentView: 'house',
      lessonId: null,
    }));
  }, []);

  const handleCloseMinigame = useCallback(() => {
    setNavState(prev => ({
      ...prev,
      currentView: 'house',
    }));
  }, []);

  // Initialize Phaser game
  useEffect(() => {
    if (!containerRef.current) return;

    const game = GameManager.initializeGame(containerRef.current);
    
    if (GameManager.isReady()) {
      setIsPhaserReady(true);
      
      if (GameManager.areAssetsLoaded()) {
        setAssetsLoaded(true);
      } else {
        const checkInterval = setInterval(() => {
          const game = GameManager.getGame();
          if (game?.registry.get('assetsLoaded')) {
            setAssetsLoaded(true);
            clearInterval(checkInterval);
          }
        }, 50);
        
        setTimeout(() => clearInterval(checkInterval), 10000);
      }
    } else {
      game.events.once('ready', () => {
        setIsPhaserReady(true);
        
        const checkInterval = setInterval(() => {
          const game = GameManager.getGame();
          if (game?.registry.get('assetsLoaded')) {
            setAssetsLoaded(true);
            clearInterval(checkInterval);
          }
        }, 50);
        
        setTimeout(() => clearInterval(checkInterval), 10000);
      });
    }
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

  // Set navigation handlers and sync data with GameManager
  useEffect(() => {
    if (!isPhaserReady || !assetsLoaded || isLoadingModules) return;

    GameManager.setNavigationHandlers({
      handleNeighborhoodSelect,
      handleHouseSelect,
      handleLessonSelect,
      handleMinigameSelect,
      handleBackToMap,
      handleBackToNeighborhood
    });

    if (modulesData) {
      GameManager.updateModulesData(modulesData);
      
      // After houses are created, retry any pending lessons updates
      if (navState.moduleBackendId && lessonsData && !isLoadingLessons) {
        GameManager.updateLessonsData(navState.moduleBackendId, lessonsData);
      }
    }
  }, [isPhaserReady, assetsLoaded, isLoadingModules, modulesData, navState.moduleBackendId, lessonsData, isLoadingLessons, handleNeighborhoodSelect, handleHouseSelect, handleLessonSelect, handleMinigameSelect, handleBackToMap, handleBackToNeighborhood]);

  // Sync lessons data with GameManager
  useEffect(() => {
    if (!navState.moduleBackendId || !lessonsData || isLoadingLessons) return;
    
    GameManager.updateLessonsData(navState.moduleBackendId, lessonsData);
  }, [lessonsData, navState.moduleBackendId, isLoadingLessons]);

  // Handle scene transitions
  useEffect(() => {
    if (!isPhaserReady || !assetsLoaded || isLoadingModules) return;

    switch (navState.currentView) {
      case 'map':
        GameManager.transitionToMap();
        break;

     case 'neighborhood':
      GameManager.transitionToNeighborhood(navState.neighborhoodId, navState.currentHouseIndex);
      break;

      case 'house':
        if (navState.moduleBackendId && !GameManager.hasLessonsData(navState.moduleBackendId)) {
          return;
        }
        
        GameManager.transitionToHouse(
          navState.houseId,
          navState.moduleId,
          navState.moduleBackendId
        );
        break;

      case 'lesson':
      case 'minigame':
        GameManager.pauseAllScenes();
        break;
    }
  }, [navState, isPhaserReady, assetsLoaded, isLoadingModules]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const game = GameManager.getGame();
      if (!game?.scale?.resize || !isPhaserReady || !assetsLoaded) return;
      
      const dpr = window.devicePixelRatio || 1;
      const newWidth = (window.innerWidth - 192) * dpr;
      const newHeight = window.innerHeight * dpr;
      
      game.scale.resize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isPhaserReady, assetsLoaded]);

  // Sync total coins with game registry
  useEffect(() => {
    const game = GameManager.getGame();
    if (game) {
      game.registry.set('totalCoins', totalCoins);
    }
  }, [totalCoins]);

  // Get current module and lesson from GameManager
  const currentModule = useMemo(() => {
    if (!navState.moduleId || !navState.moduleBackendId) return null;
    return GameManager.getCurrentModule(navState.moduleId, navState.moduleBackendId);
  }, [navState.moduleId, navState.moduleBackendId]);

  const currentLesson = useMemo(() => {
    if (!navState.lessonId || !navState.moduleBackendId) return null;
    return GameManager.getCurrentLesson(navState.moduleBackendId, navState.lessonId);
  }, [navState.lessonId, navState.moduleBackendId]);

  const showPhaserCanvas = ['map', 'neighborhood', 'house'].includes(navState.currentView);

  const getBackgroundStyle = () => {
    switch (navState.currentView) {
      case 'map':
        return { backgroundColor: '#38bdf8' };
      case 'neighborhood':
        return { backgroundColor: '#fed7aa' };
      case 'house':
        return {
          backgroundImage: `url(${HouseBackground})`,
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
      {/* Loading indicators */}
      {isLoadingModules && (
        <div className="absolute top-4 right-4 bg-white px-4 py-2 rounded-lg shadow-lg z-50">
          <p className="text-sm text-gray-600">Loading modules...</p>
        </div>
      )}

      {modulesError && (
        <div className="absolute top-4 right-4 bg-red-100 px-4 py-2 rounded-lg shadow-lg z-50">
          <p className="text-sm text-red-600">Failed to load modules</p>
        </div>
      )}

      {isLoadingLessons && navState.currentView === 'house' && (
        <div className="absolute top-16 right-4 bg-white px-4 py-2 rounded-lg shadow-lg z-50">
          <p className="text-sm text-gray-600">Loading lessons...</p>
        </div>
      )}

      {lessonsError && navState.currentView === 'house' && (
        <div className="absolute top-16 right-4 bg-red-100 px-4 py-2 rounded-lg shadow-lg z-50">
          <p className="text-sm text-red-600">Failed to load lessons</p>
        </div>
      )}

      {/* Phaser background */}
      {showPhaserCanvas && (
        <div 
          className="fixed inset-0 z-0"
          style={getBackgroundStyle()}
        />
      )}

      {/* Phaser container */}
      <div
        ref={containerRef}
        className={`w-full h-full relative z-10 transition-opacity duration-300 ${
          showPhaserCanvas ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Lesson view */}
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

      {/* Minigame view */}
      {navState.currentView === 'minigame' && (
        <div className="absolute inset-0 bg-white z-20">
          <Minigame onClose={handleCloseMinigame} />
        </div>
      )}
    </div>
  );
};

export default ModulesPage;