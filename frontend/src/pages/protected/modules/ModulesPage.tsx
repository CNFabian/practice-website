import { useState, useEffect, useRef, useMemo } from 'react';
import { HouseBackground } from '../../../assets';
import GameManager from './phaser/managers/GameManager';
import LessonView from './LessonView';
import Minigame from './Minigame';
import type { Module, Lesson } from '../../../types/modules';
import { useModules, useModuleLessons } from '../../../hooks/queries/useLearningQueries';
import { useCoinBalance } from '../../../hooks/queries/useCoinBalance';

interface ModulesPageProps {}

interface NavState {
  currentView: 'map' | 'neighborhood' | 'house' | 'lesson' | 'minigame';
  neighborhoodId: string | null;
  houseId: string | null;
  moduleId: number | null;
  moduleBackendId: string | null;
  lessonId: number | null;
}

interface HouseData {
  id: string;
  name: string;
  x: number;
  y: number;
  moduleId: number;
  moduleBackendId: string;
  isLocked: boolean;
  houseType: string;
  description?: string;
  coinReward?: number;
}

interface BackendLessonData {
  id: string;
  module_id: string;
  title: string;
  description: string;
  image_url: string;
  video_url: string;
  estimated_duration_minutes: number;
  nest_coins_reward: number;
  is_completed: boolean;
  progress_seconds: number;
}

interface ModuleLessonsData {
  id: number;
  title: string;
  lessons: {
    id: number;
    backendId: string;
    title: string;
    type: string;
    completed: boolean;
    locked: boolean;
    duration: string;
    description: string;
    image: string;
    coins: number;
    videoUrl?: string;
  }[];
}

const ModulesPage: React.FC<ModulesPageProps> = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPhaserReady, setIsPhaserReady] = useState(false);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [moduleLessonsData, setModuleLessonsData] = useState<Record<string, ModuleLessonsData>>({});
  const { data: coinBalanceData } = useCoinBalance();
  const totalCoins = coinBalanceData?.current_balance || 0;

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
      moduleBackendId: null,
      lessonId: null,
    };
  });

  // REFACTOR: Use existing hooks instead of manual API calls
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

  // Save navState to GameManager whenever it changes
  useEffect(() => {
    GameManager.saveNavState(navState);
  }, [navState]);

  // Helper function to calculate house positions
  const calculateHousePosition = (index: number) => {
    const positions = [
      { x: 20, y: 40 },
      { x: 45, y: 45 },
      { x: 70, y: 50 },
      { x: 85, y: 55 }
    ];
    return positions[index % positions.length];
  };

  // REFACTOR: Transform modules data to house structure using useMemo instead of useEffect
  const neighborhoodHousesData = useMemo(() => {
    if (!modulesData || !Array.isArray(modulesData)) {
      console.warn('⚠️ No modules data available');
      return { downtown: [] };
    }

    console.log(`✅ Transforming ${modulesData.length} modules to house structure`);

    // Generate a stable frontend ID from the backend UUID
    const generateFrontendId = (uuid: string): number => {
      let hash = 0;
      for (let i = 0; i < uuid.length; i++) {
        const char = uuid.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash) + 10000;
    };

    const housesData: Record<string, HouseData[]> = {
      downtown: modulesData.map((module: any, index: number) => {
        const position = calculateHousePosition(index);
        const houseType = `house${(index % 4) + 1}`;
        const frontendId = generateFrontendId(module.id || `module-${index}`);
        
        return {
          id: `house${index + 1}`,
          name: module.title || `Module ${index + 1}`,
          x: position.x,
          y: position.y,
          moduleId: frontendId,
          moduleBackendId: module.id,
          isLocked: module.is_locked !== undefined ? module.is_locked : false,
          houseType: houseType,
          description: module.description || '',
          coinReward: module.nest_coins_reward || 0
        };
      })
    };

    console.log('🏠 House data created from modules hook:', housesData);
    return housesData;
  }, [modulesData]);

  // Transform lessons data when it's available from the hook
  useEffect(() => {
    if (!navState.moduleBackendId || !navState.moduleId || !lessonsData) return;

    // Check if we already have lessons for this module
    if (moduleLessonsData[navState.moduleBackendId]) {
      console.log(`✅ Lessons already loaded for module ${navState.moduleBackendId}`);
      return;
    }

    if (!Array.isArray(lessonsData)) {
      console.warn('⚠️ Invalid lessons data from backend');
      return;
    }

    console.log(`✅ Fetched ${lessonsData.length} lessons from backend via hook`);

    // Transform backend lessons to HouseScene format
    const transformedLessons: ModuleLessonsData = {
      id: navState.moduleId,
      title: neighborhoodHousesData['downtown']?.find(h => h.moduleBackendId === navState.moduleBackendId)?.name || `Module ${navState.moduleId}`,
      lessons: lessonsData.map((lesson: BackendLessonData, index: number) => {
        // Generate a stable frontend ID from the backend UUID
        const generateFrontendId = (uuid: string): number => {
          let hash = 0;
          for (let i = 0; i < uuid.length; i++) {
            const char = uuid.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
          }
          return Math.abs(hash) + 20000; // Different offset for lessons
        };

        const frontendId = generateFrontendId(lesson.id || `lesson-${index}`);

        return {
          id: frontendId,
          backendId: lesson.id, // ✅ Store the real backend UUID
          title: lesson.title || `Lesson ${index + 1}`,
          type: 'Video/Reading',
          completed: lesson.is_completed || false,
          locked: false, // You can add lock logic based on prerequisites
          duration: `${lesson.estimated_duration_minutes || 10} min`,
          description: lesson.description || '',
          image: lesson.image_url || '/placeholder-lesson.jpg',
          coins: lesson.nest_coins_reward || 0,
          videoUrl: lesson.video_url || ''
        };
      })
    };

    setModuleLessonsData(prev => ({
      ...prev,
      [navState.moduleBackendId!]: transformedLessons
    }));

    console.log('📚 Transformed lessons data:', transformedLessons);
  }, [lessonsData, navState.moduleBackendId, navState.moduleId, neighborhoodHousesData, moduleLessonsData]);

  // Get real module data instead of mock data
  const currentModule: Module | null = useMemo(() => {
    if (!navState.moduleId || !navState.moduleBackendId) return null;
    
    const house = neighborhoodHousesData['downtown']?.find(h => h.moduleBackendId === navState.moduleBackendId);
    const moduleData = moduleLessonsData[navState.moduleBackendId];
    
    return {
      id: navState.moduleId,
      backendId: navState.moduleBackendId,
      image: '/placeholder-module.jpg',
      title: house?.name || `Module ${navState.moduleId}`,
      description: house?.description || 'Module description',
      lessonCount: moduleData?.lessons?.length || 0,
      status: 'In Progress' as const,
      tags: ['Learning'],
      illustration: 'default',
      lessons: moduleData?.lessons || []
    };
  }, [navState.moduleId, navState.moduleBackendId, neighborhoodHousesData, moduleLessonsData]);

  // Get real lesson data instead of mock data
  const currentLesson: Lesson | null = useMemo(() => {
    if (!navState.lessonId || !navState.moduleBackendId) return null;
    
    // Get the actual lessons data for this module
    const moduleData = moduleLessonsData[navState.moduleBackendId];
    if (!moduleData || !moduleData.lessons) return null;
    
    // Find the actual lesson by frontend ID
    const lessonData = moduleData.lessons.find(l => l.id === navState.lessonId);
    if (!lessonData) return null;
    
    // Return the lesson with the REAL backendId
    return {
      id: lessonData.id,
      backendId: lessonData.backendId,
      image: lessonData.image || '/placeholder-lesson.jpg',
      title: lessonData.title,
      duration: lessonData.duration,
      description: lessonData.description || '',
      coins: lessonData.coins || 25,
      completed: lessonData.completed || false,
      videoUrl: lessonData.videoUrl || ''
    };
  }, [navState.lessonId, navState.moduleBackendId, moduleLessonsData]);

  // Navigation handlers
  const handleNeighborhoodSelect = (neighborhoodId: string) => {
    setNavState(prev => ({
      ...prev,
      currentView: 'neighborhood',
      neighborhoodId,
      houseId: null,
      moduleId: null,
      moduleBackendId: null,
      lessonId: null,
    }));
  };

  const handleHouseSelect = (houseId: string, moduleId: number) => {
    // Find the house to get the backend module ID
    const house = neighborhoodHousesData['downtown']?.find(h => h.id === houseId);
    const moduleBackendId = house?.moduleBackendId || null;

    setNavState(prev => ({
      ...prev,
      currentView: 'house',
      houseId,
      moduleId,
      moduleBackendId,
      lessonId: null,
    }));
  };

  const handleLessonSelect = (lessonId: number) => {
    const actualLessonId = lessonId;
    setNavState(prev => ({
      ...prev,
      currentView: 'lesson',
      lessonId: actualLessonId,
      moduleId: prev.moduleId || (prev.houseId ? neighborhoodHousesData['downtown']?.find((h: any) => h.id === prev.houseId)?.moduleId ?? null : null),
      moduleBackendId: prev.moduleBackendId || (prev.houseId ? neighborhoodHousesData['downtown']?.find((h: any) => h.id === prev.houseId)?.moduleBackendId ?? null : null)
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
      moduleBackendId: null,
      lessonId: null,
    });
  };

  const handleBackToNeighborhood = () => {
    setNavState(prev => ({
      ...prev,
      currentView: 'neighborhood',
      houseId: null,
      moduleId: null,
      moduleBackendId: null,
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

  // Set navigation handlers, house data, and module lessons data in registry
  useEffect(() => {
    const game = GameManager.getGame();
    if (!game || !isPhaserReady || !assetsLoaded || isLoadingModules) return;

    const scenes = game.scene.getScenes(false);
    if (scenes.length > 0) {
      const scene = scenes[0];
      scene.registry.set('handleNeighborhoodSelect', handleNeighborhoodSelect);
      scene.registry.set('handleHouseSelect', handleHouseSelect);
      scene.registry.set('handleLessonSelect', handleLessonSelect);
      scene.registry.set('handleMinigameSelect', handleMinigameSelect);
      scene.registry.set('handleBackToMap', handleBackToMap);
      scene.registry.set('handleBackToNeighborhood', handleBackToNeighborhood);
      scene.registry.set('neighborhoodHouses', neighborhoodHousesData);
      scene.registry.set('moduleLessonsData', moduleLessonsData);
      
      console.log('✅ Set neighborhood houses in registry:', neighborhoodHousesData);
      console.log('✅ Set module lessons data in registry:', moduleLessonsData);
    }
  }, [isPhaserReady, assetsLoaded, neighborhoodHousesData, isLoadingModules, moduleLessonsData]);

  // Handle scene transitions
  useEffect(() => {
    const game = GameManager.getGame();
    if (!game || !isPhaserReady || !assetsLoaded || isLoadingModules) return;

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
          houses: neighborhoodHousesData['downtown'] || [],
          currentHouseIndex: currentHouseIndex
        });
      break;

      case 'house':
        // CRITICAL FIX: Wait for lessons to be loaded before starting HouseScene
        if (navState.moduleBackendId && !moduleLessonsData[navState.moduleBackendId]) {
          console.log('⏳ Waiting for lessons to load before starting HouseScene...');
          return; // Don't start scene yet, wait for lessons
        }
        
        if (game.scene.isActive('MapScene')) game.scene.sleep('MapScene');
        if (game.scene.isActive('NeighborhoodScene')) game.scene.sleep('NeighborhoodScene');
        if (game.scene.isActive('HouseScene')) game.scene.stop('HouseScene');
        
        console.log('✅ Lessons loaded, starting HouseScene with data:', moduleLessonsData[navState.moduleBackendId!]);
        
        game.scene.start('HouseScene', {
          houseId: navState.houseId,
          moduleId: navState.moduleId,
          moduleBackendId: navState.moduleBackendId
        });
        break;

      case 'lesson':
      case 'minigame':
        if (game.scene.isActive('MapScene')) game.scene.sleep('MapScene');
        if (game.scene.isActive('NeighborhoodScene')) game.scene.sleep('NeighborhoodScene');
        if (game.scene.isActive('HouseScene')) game.scene.sleep('HouseScene');
        break;
    }
  }, [navState, isPhaserReady, assetsLoaded, neighborhoodHousesData, isLoadingModules, moduleLessonsData]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const game = GameManager.getGame();
      if (game) {
        const dpr = window.devicePixelRatio || 1;
        const newWidth = (window.innerWidth - 192) * dpr;
        const newHeight = window.innerHeight * dpr;
        game.scale.resize(newWidth, newHeight);
        game.scale.emit('resize', game.scale.gameSize);
        
       
        // Minigame will handle resize via its own handleResize method
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Save navigation state to localStorage
    localStorage.setItem('moduleNavState', JSON.stringify(navState));
  }, [navState]);

  useEffect(() => {
    const game = GameManager.getGame();
    if (game) {
      // Update the registry value - this will trigger the coin counter update in all scenes
      game.registry.set('totalCoins', totalCoins);
    }
  }, [totalCoins]);

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
      {/* Loading indicator for modules - REFACTOR: Use hook loading state */}
      {isLoadingModules && (
        <div className="absolute top-4 right-4 bg-white px-4 py-2 rounded-lg shadow-lg z-50">
          <p className="text-sm text-gray-600">Loading modules...</p>
        </div>
      )}

      {/* Error indicator for modules - REFACTOR: Use hook error state */}
      {modulesError && (
        <div className="absolute top-4 right-4 bg-red-100 px-4 py-2 rounded-lg shadow-lg z-50">
          <p className="text-sm text-red-600">Failed to load modules</p>
        </div>
      )}

      {/* Loading indicator for lessons */}
      {isLoadingLessons && navState.currentView === 'house' && (
        <div className="absolute top-16 right-4 bg-white px-4 py-2 rounded-lg shadow-lg z-50">
          <p className="text-sm text-gray-600">Loading lessons...</p>
        </div>
      )}

      {/* Error indicator for lessons */}
      {lessonsError && navState.currentView === 'house' && (
        <div className="absolute top-16 right-4 bg-red-100 px-4 py-2 rounded-lg shadow-lg z-50">
          <p className="text-sm text-red-600">Failed to load lessons</p>
        </div>
      )}

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
          <Minigame
            onClose={handleCloseMinigame}
          />
        </div>
      )}
    </div>
  );
};

export default ModulesPage;