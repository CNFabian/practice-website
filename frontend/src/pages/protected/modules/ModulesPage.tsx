import { useState, useEffect, useRef } from 'react';
import { SuburbanBackground } from '../../../assets';
import GameManager from './phaser/managers/GameManager';
import LessonView from './LessonView';
import Minigame from './Minigame';
import type { Module, Lesson } from '../../../types/modules';
import { getModules } from '../../../services/learningAPI';

interface ModulesPageProps {}

interface NavState {
  currentView: 'map' | 'neighborhood' | 'house' | 'lesson' | 'minigame';
  neighborhoodId: string | null;
  houseId: string | null;
  moduleId: number | null;
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

const ModulesPage: React.FC<ModulesPageProps> = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPhaserReady, setIsPhaserReady] = useState(false);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [neighborhoodHousesData, setNeighborhoodHousesData] = useState<Record<string, HouseData[]>>({});
  const [isLoadingHouses, setIsLoadingHouses] = useState(true);
  
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

  // Fetch modules from backend and transform to house structure
  useEffect(() => {
    const fetchModulesAndMapToHouses = async () => {
      setIsLoadingHouses(true);
      try {
        console.log('🏠 Fetching modules from backend to map to houses...');
        const modules = await getModules();
        
        if (!modules || !Array.isArray(modules)) {
          console.warn('⚠️ No modules returned from backend');
          setIsLoadingHouses(false);
          return;
        }

        console.log(`✅ Fetched ${modules.length} modules from backend`);
        
        // Transform modules into house structure
        const housesData: Record<string, HouseData[]> = {
          downtown: modules.map((module: any, index: number) => {
            const position = calculateHousePosition(index);
            const houseType = `house${(index % 4) + 1}`;
            
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

        console.log('🏠 House data created:', housesData);
        setNeighborhoodHousesData(housesData);
        setIsLoadingHouses(false);
      } catch (error) {
        console.error('❌ Failed to fetch modules for houses:', error);
        
        // Fallback to empty or sample data
        setNeighborhoodHousesData({
          downtown: []
        });
        setIsLoadingHouses(false);
      }
    };

    fetchModulesAndMapToHouses();
  }, []);

  // Mock data that matches the full Module and Lesson interfaces
  const mockModule: Module | null = navState.moduleId ? {
    id: navState.moduleId,
    backendId: `module-${navState.moduleId}`,
    image: '/placeholder-module.jpg',
    title: `Module ${navState.moduleId}`,
    description: 'Module description',
    lessonCount: 5,
    status: 'In Progress' as const,
    tags: ['Learning'],
    illustration: 'default',
    lessons: []
  } : null;

  const mockLesson: Lesson | null = navState.lessonId ? {
    id: navState.lessonId,
    backendId: `lesson-${navState.lessonId}`,
    image: '/placeholder-lesson.jpg',
    title: `Lesson ${navState.lessonId}`,
    duration: '10 min',
    description: 'Lesson description',
    coins: 25,
    completed: false,
    videoUrl: ''
  } : null;

  const currentModule = mockModule;
  const currentLesson = mockLesson;

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
      moduleId: prev.moduleId || (prev.houseId ? neighborhoodHousesData['downtown']?.find((h: any) => h.id === prev.houseId)?.moduleId ?? null : null)
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

  // Set navigation handlers and house data in registry
  useEffect(() => {
    const game = GameManager.getGame();
    if (!game || !isPhaserReady || !assetsLoaded || isLoadingHouses) return;

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
      
      console.log('✅ Set neighborhood houses in registry:', neighborhoodHousesData);
    }
  }, [isPhaserReady, assetsLoaded, neighborhoodHousesData, isLoadingHouses]);

  // Handle scene transitions
  useEffect(() => {
    const game = GameManager.getGame();
    if (!game || !isPhaserReady || !assetsLoaded || isLoadingHouses) return;

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
  }, [navState, isPhaserReady, assetsLoaded, neighborhoodHousesData, isLoadingHouses]);

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
      {/* Loading indicator for houses */}
      {isLoadingHouses && (
        <div className="absolute top-4 right-4 bg-white px-4 py-2 rounded-lg shadow-lg z-50">
          <p className="text-sm text-gray-600">Loading modules...</p>
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