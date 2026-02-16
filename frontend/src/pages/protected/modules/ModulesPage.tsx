import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  HouseBackground,
  NeighborhoodMap,
  NeighborhoodBackground
} from '../../../assets';
import GameManager from './phaser/managers/GameManager';
import LessonView from './LessonView';
import { useDashboardModules } from '../../../hooks/queries/useDashboardModules';
import { useModuleLessons } from '../../../hooks/queries/useLearningQueries';
import { useCoinBalance } from '../../../hooks/queries/useCoinBalance';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { getModuleLessons } from '../../../services/learningAPI';
import { useSidebar } from '../../../contexts/SidebarContext';
import { useWalkthrough } from '../../../contexts/WalkthroughContext';
import { useBatchProgressSync } from '../../../hooks/queries/useBatchProgressSync';

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
  const [secondaryAssetsLoaded, setSecondaryAssetsLoaded] = useState(false);
  const location = useLocation();
  const walkthroughTriggered = useRef(false);
  const { data: dashboardModules } = useDashboardModules();
  const { data: coinBalanceData } = useCoinBalance();
  const totalCoins = coinBalanceData?.current_balance || 0;
  const queryClient = useQueryClient();
  const { isCollapsed } = useSidebar();
  const { isWalkthroughActive, startWalkthrough, hasCompletedWalkthrough } = useWalkthrough();
  const { addProgressItem, flushProgress } = useBatchProgressSync();

  // Calculate sidebar offset based on collapsed state
  const sidebarOffset = isCollapsed ? 80 : 192;

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

  // When walkthrough becomes active, reset navState to map so background updates
  useEffect(() => {
    if (isWalkthroughActive && navState.currentView !== 'map') {
      setNavState({
        currentView: 'map',
        neighborhoodId: null,
        houseId: null,
        moduleId: null,
        moduleBackendId: null,
        lessonId: null,
        currentHouseIndex: 0,
      });
    }
  }, [isWalkthroughActive]);

  // Auto-trigger walkthrough immediately after onboarding completion
  useEffect(() => {
    const fromOnboarding = (location.state as any)?.fromOnboarding === true;
    if (
      fromOnboarding &&
      !walkthroughTriggered.current &&
      !hasCompletedWalkthrough &&
      isPhaserReady &&
      assetsLoaded
    ) {
      walkthroughTriggered.current = true;
      // Clear the navigation state so refresh doesn't re-trigger
      window.history.replaceState({}, document.title);
      // Small delay to ensure Phaser scene is fully rendered
      setTimeout(() => {
        startWalkthrough();
      }, 800);
    }
  }, [location.state, isPhaserReady, assetsLoaded, hasCompletedWalkthrough, startWalkthrough]);

  // OPT-04: Derive modules from dashboard response instead of making a separate API call
  // Dashboard response shape: [{ module: {...}, lessons_completed, total_lessons, ... }]
  // We extract just the module objects to match what useModules() previously returned
  const modulesData = useMemo(() => {
    if (!dashboardModules) return undefined;
    return dashboardModules.map((item: any) => item.module);
  }, [dashboardModules]);
  const isLoadingModules = !dashboardModules;
  const modulesError = null;

  // OPT-07: Proactively prefetch lessons for first 2 modules when data arrives
  // This ensures lesson data is in TanStack Query cache before user clicks a house
  useEffect(() => {
    if (!dashboardModules || dashboardModules.length === 0) return;

    const modulesToPrefetch = dashboardModules.slice(0, 2);
    modulesToPrefetch.forEach((item: any) => {
      const backendId = item.module?.backend_id;
      if (backendId) {
        queryClient.prefetchQuery({
          queryKey: queryKeys.learning.moduleLessons(backendId),
          queryFn: () => getModuleLessons(backendId),
          staleTime: 10 * 60 * 1000, // 10 minutes
        });
      }
    });
  }, [dashboardModules, queryClient]);

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

  const handleHouseSelect = useCallback((houseId: string, moduleBackendId?: string) => {
    const game = GameManager.getGame();
    const currentHouseIndex = game?.registry.get('currentHouseIndex') ?? 0;

    setNavState(prev => ({
      ...prev,
      currentView: 'house',
      houseId,
      moduleId: null,
      moduleBackendId: moduleBackendId || null,
      lessonId: null,
      currentHouseIndex,
    }));
  }, []);

  const handlePrefetchLessons = useCallback((moduleBackendId: string) => {
    if (!moduleBackendId) return;
    
    console.log(`🔄 Prefetching lessons for module: ${moduleBackendId}`);
    
    queryClient.prefetchQuery({
      queryKey: queryKeys.learning.moduleLessons(moduleBackendId),
      queryFn: () => getModuleLessons(moduleBackendId),
      staleTime: 10 * 60 * 1000,
    });
  }, [queryClient]);

  const handleLessonSelect = useCallback((lessonId: number, moduleBackendId?: string) => {
    const game = GameManager.getGame();
    const houses = game?.registry.get('neighborhoodHouses')?.['downtown'] || [];
    const backendId = moduleBackendId || navState.moduleBackendId;
    const house = houses.find((h: any) => h.moduleBackendId === backendId);
    
    setNavState(prev => ({
      ...prev,
      currentView: 'lesson',
      lessonId,
      moduleBackendId: backendId || prev.moduleBackendId,
      moduleId: house?.moduleId || prev.moduleId,
    }));
  }, [navState.moduleBackendId]);

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

  // Initialize Phaser game
  useEffect(() => {
    if (!containerRef.current) return;

    let checkInterval: NodeJS.Timeout | undefined;
    let timeoutId: NodeJS.Timeout | undefined;
    
    const game = GameManager.initializeGame(containerRef.current, sidebarOffset);
    
    if (GameManager.isReady()) {
      setIsPhaserReady(true);
      
      if (GameManager.areAssetsLoaded()) {
        setAssetsLoaded(true);
      } else {
        checkInterval = setInterval(() => {
          const game = GameManager.getGame();
          if (game?.registry.get('assetsLoaded')) {
            setAssetsLoaded(true);
            if (checkInterval) clearInterval(checkInterval);
          }
        }, 50);
        
        timeoutId = setTimeout(() => {
          if (checkInterval) clearInterval(checkInterval);
        }, 10000);
      }
    } else {
      game.events.once('ready', () => {
        setIsPhaserReady(true);
        
        checkInterval = setInterval(() => {
          const game = GameManager.getGame();
          if (game?.registry.get('assetsLoaded')) {
            setAssetsLoaded(true);
            if (checkInterval) clearInterval(checkInterval);
          }
        }, 50);
        
        timeoutId = setTimeout(() => {
          if (checkInterval) clearInterval(checkInterval);
        }, 10000);
      });
    }

    return () => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  useEffect(() => {
    if (modulesData && !isLoadingModules) {
      console.log('🔄 EARLY SYNC: Updating modules data to GameManager');
      GameManager.updateModulesData(modulesData);
    }
  }, [modulesData, isLoadingModules]);

  useEffect(() => {
    if (!navState.moduleBackendId || !lessonsData || isLoadingLessons) return;
    
    console.log('🔄 EARLY SYNC: Updating lessons data to GameManager for:', navState.moduleBackendId);
    GameManager.updateLessonsData(navState.moduleBackendId, lessonsData);
  }, [lessonsData, navState.moduleBackendId, isLoadingLessons]);

  // Trigger Tier 2 (Secondary) background asset loading after map is visible
  useEffect(() => {
    if (!isPhaserReady || !assetsLoaded) return;

    const game = GameManager.getGame();
    if (!game) return;

    // If already loaded (e.g. game instance persisted across remount), set immediately
    if (game.registry.get('secondaryAssetsLoaded')) {
      setSecondaryAssetsLoaded(true);
      return;
    }

    // Start Tier 2 loading
    GameManager.loadSecondaryAssets();

    // Listen for completion via Phaser registry's specific change event
    // Phaser emits 'changedata-KEY' (not generic 'changedata' with key arg)
    const eventName = 'changedata-secondaryAssetsLoaded';
    const onSecondaryLoaded = () => {
      console.log('✅ [ModulesPage] Tier 2 secondary assets loaded — scenes ready');
      setSecondaryAssetsLoaded(true);
      game.registry.events.off(eventName, onSecondaryLoaded);
    };
    game.registry.events.on(eventName, onSecondaryLoaded);

    // Also poll as a safety net in case the event fired between
    // the check above and the listener registration (race condition)
    const pollInterval = setInterval(() => {
      if (game.registry.get('secondaryAssetsLoaded')) {
        setSecondaryAssetsLoaded(true);
        clearInterval(pollInterval);
        game.registry.events.off(eventName, onSecondaryLoaded);
      }
    }, 100);

    return () => {
      clearInterval(pollInterval);
      game.registry.events.off(eventName, onSecondaryLoaded);
    };
  }, [isPhaserReady, assetsLoaded]);

  // Trigger Tier 2 (Secondary) background asset loading after map is visible
  useEffect(() => {
    if (!isPhaserReady || !assetsLoaded) return;
    GameManager.loadSecondaryAssets();
  }, [isPhaserReady, assetsLoaded]);

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
      handleBackToNeighborhood,
      handlePrefetchLessons,
      handleBackToHouse,
    });

    if (modulesData) {
      GameManager.updateModulesData(modulesData);
      
      if (navState.moduleBackendId && lessonsData && !isLoadingLessons) {
        GameManager.updateLessonsData(navState.moduleBackendId, lessonsData);
      }
    }

    if (dashboardModules) {
      const game = GameManager.getGame();
      if (game) {
        game.registry.set('dashboardModules', dashboardModules);
        console.log('✅ Passed dashboard modules to Phaser:', dashboardModules);
      }
    }
  }, [
    isPhaserReady, 
    assetsLoaded, 
    isLoadingModules, 
    modulesData, 
    navState.moduleBackendId, 
    lessonsData, 
    isLoadingLessons, 
    handleNeighborhoodSelect, 
    handleHouseSelect, 
    handleLessonSelect, 
    handleMinigameSelect, 
    handleBackToMap, 
    handleBackToNeighborhood,
    handlePrefetchLessons,
    dashboardModules
  ]);

  // Handle scene transitions
  useEffect(() => {
    if (!isPhaserReady || !assetsLoaded || isLoadingModules) return;

    switch (navState.currentView) {
      case 'map':
        GameManager.transitionToMap();
        break;

      case 'neighborhood':
        // Tier 2 assets required — wait for them before transitioning
        if (!secondaryAssetsLoaded) {
          console.log('⏳ [Scene Transition] Waiting for Tier 2 assets before entering neighborhood...');
          return;
        }
        GameManager.transitionToNeighborhood(navState.neighborhoodId, navState.currentHouseIndex);
        break;

      case 'house':
        // Tier 2 assets required — wait for them before transitioning
        if (!secondaryAssetsLoaded) {
          console.log('⏳ [Scene Transition] Waiting for Tier 2 assets before entering house...');
          return;
        }
        GameManager.transitionToHouse(
          navState.houseId,
          navState.moduleBackendId
        );
        break;

      case 'lesson':
      case 'minigame':
        GameManager.pauseAllScenes();
        // OPT-02: Trigger Tier 3 (Deferred) asset loading on first minigame navigation
        if (navState.currentView === 'minigame') {
          GameManager.loadDeferredAssets();
        }
        break;
    }
  }, [navState, isPhaserReady, assetsLoaded, isLoadingModules, secondaryAssetsLoaded]);

  // Handle window resize
  useEffect(() => {
    let resizeDebounceTimer: NodeJS.Timeout | null = null;
    let finalResizeTimer: NodeJS.Timeout | null = null;

    const performResize = () => {
      const game = GameManager.getGame();
      if (!game?.scale?.resize || !isPhaserReady || !assetsLoaded) return;
      
      const dpr = window.devicePixelRatio || 1;
      const currentOffset = GameManager.getCurrentSidebarOffset();
      const baseWidth = window.innerWidth - currentOffset;
      const baseHeight = window.innerHeight;
      
      console.log(`=== RESIZE EVENT: ${baseWidth}x${baseHeight} @ DPR ${dpr} ===`);
      
      game.scale.setZoom(1 / dpr);
      game.scale.resize(baseWidth * dpr, baseHeight * dpr);
    };

    const handleResize = () => {
      if (resizeDebounceTimer) {
        clearTimeout(resizeDebounceTimer);
      }
      if (finalResizeTimer) {
        clearTimeout(finalResizeTimer);
      }

      performResize();

      resizeDebounceTimer = setTimeout(() => {
        performResize();
        resizeDebounceTimer = null;
      }, 100);

      finalResizeTimer = setTimeout(() => {
        performResize();
        finalResizeTimer = null;
      }, 300);
    };

    const handleFullscreenChange = () => {
      console.log('=== FULLSCREEN CHANGE DETECTED ===');
      console.log('Is fullscreen:', document.fullscreenElement !== null);
      
      if (resizeDebounceTimer) clearTimeout(resizeDebounceTimer);
      if (finalResizeTimer) clearTimeout(finalResizeTimer);
      
      setTimeout(() => {
        console.log('=== FULLSCREEN RESIZE - PASS 1 ===');
        performResize();
      }, 100);
      
      setTimeout(() => {
        console.log('=== FULLSCREEN RESIZE - PASS 2 ===');
        performResize();
      }, 250);
      
      setTimeout(() => {
        console.log('=== FULLSCREEN RESIZE - FINAL ===');
        performResize();
      }, 500);
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    const currentDPR = window.devicePixelRatio || 1;
    const mediaQueryList = window.matchMedia(`(resolution: ${currentDPR}dppx)`);
    
    const handleDPIChange = () => {
      console.log('=== DPI CHANGE DETECTED ===');
      setTimeout(() => {
        handleResize();
      }, 50);
    };

    mediaQueryList.addEventListener('change', handleDPIChange);

    return () => {
      if (resizeDebounceTimer) clearTimeout(resizeDebounceTimer);
      if (finalResizeTimer) clearTimeout(finalResizeTimer);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      mediaQueryList.removeEventListener('change', handleDPIChange);
    };
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
    console.log('🔍 Computing currentModule:', {
      moduleId: navState.moduleId,
      moduleBackendId: navState.moduleBackendId,
      isLoadingModules,
      hasModulesData: modulesData?.length || 0
    });
    
    if (!navState.moduleId || !navState.moduleBackendId) {
      console.log('❌ Missing moduleId or moduleBackendId');
      return null;
    }
    
    if (isLoadingModules) {
      console.log('⏳ Still loading modules data');
      return null;
    }
    
    if (modulesData && modulesData.length > 0) {
      GameManager.updateModulesData(modulesData);
    }
    
    const module = GameManager.getCurrentModule(navState.moduleId, navState.moduleBackendId);
    console.log('🔍 Found module:', module ? 'YES' : 'NO');
    
    return module;
  }, [navState.moduleId, navState.moduleBackendId, isLoadingModules, modulesData, lessonsData]);

  const currentLesson = useMemo(() => {
    console.log('🔍 Computing currentLesson:', {
      lessonId: navState.lessonId,
      moduleBackendId: navState.moduleBackendId,
      isLoadingLessons,
      hasLessonsData: GameManager.hasLessonsData(navState.moduleBackendId || '')
    });
    
    if (!navState.lessonId || !navState.moduleBackendId) {
      console.log('❌ Missing lessonId or moduleBackendId');
      return null;
    }
    
    if (isLoadingLessons) {
      console.log('⏳ Still loading lessons data');
      return null;
    }
    
    if (lessonsData && lessonsData.length > 0 && modulesData && modulesData.length > 0) {
      GameManager.updateModulesData(modulesData); // Need this for house lookup
      GameManager.updateLessonsData(navState.moduleBackendId, lessonsData);
    }
    
    const lesson = GameManager.getCurrentLesson(navState.moduleBackendId, navState.lessonId);
    console.log('🔍 Found lesson:', lesson ? 'YES' : 'NO');
    
    return lesson;
  }, [navState.lessonId, navState.moduleBackendId, isLoadingLessons, lessonsData, modulesData]);

  const showPhaserCanvas = ['map', 'neighborhood', 'house'].includes(navState.currentView);

  const getBackgroundStyle = () => {
    switch (navState.currentView) {
      case 'map':
        return {
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.6)),
            url(${NeighborhoodMap})
          `,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        };
      case 'neighborhood':
        return {
          backgroundImage: `url(${NeighborhoodBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        };
      case 'house':
        return {
          backgroundImage: `url(${HouseBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        };
      default:
        return {};
    }
  };

  return (
    <div className="w-full h-screen overflow-hidden relative">
      {/* Loading indicators */}
      {isLoadingModules && (
        <div className="absolute top-4 right-4 bg-white px-4 py-2 rounded-lg shadow-lg z-50">
          <p className="text-sm text-text-grey">Loading modules...</p>
        </div>
      )}

      {modulesError && (
        <div className="absolute top-4 right-4 bg-status-red/10 px-4 py-2 rounded-lg shadow-lg z-50">
          <p className="text-sm text-status-red">Failed to load modules</p>
        </div>
      )}

      {isLoadingLessons && navState.currentView === 'house' && (
        <div className="absolute top-16 right-4 bg-white px-4 py-2 rounded-lg shadow-lg z-50">
          <p className="text-sm text-text-grey">Loading lessons...</p>
        </div>
      )}

      {lessonsError && navState.currentView === 'house' && (
        <div className="absolute top-16 right-4 bg-status-red/10 px-4 py-2 rounded-lg shadow-lg z-50">
          <p className="text-sm text-status-red">Failed to load lessons</p>
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
        data-walkthrough="phaser-container"
        className={`w-full h-full relative z-10 transition-opacity duration-300 ${
          showPhaserCanvas ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Lesson view */}
      {navState.currentView === 'lesson' && (
        <div className="absolute inset-0 z-20">
          {(isLoadingModules || isLoadingLessons) ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin h-12 w-12 border-4 border-logo-blue border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-text-grey">
                  {isLoadingModules ? 'Loading module data...' : 'Loading lesson data...'}
                </p>
              </div>
            </div>
          ) : currentLesson && currentModule ? (
            <LessonView
              lesson={currentLesson}
              module={currentModule}
              onBack={handleBackToHouse}
              onNextLesson={handleLessonSelect}
              addProgressItem={addProgressItem}
              flushProgress={flushProgress}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8">
              <p className="text-2xl font-bold text-status-red mb-4">Lesson not found</p>
              <div className="bg-light-background-blue p-4 rounded text-left space-y-1 text-sm">
                <p><strong>navState.lessonId:</strong> {navState.lessonId}</p>
                <p><strong>navState.moduleId:</strong> {navState.moduleId}</p>
                <p><strong>navState.moduleBackendId:</strong> {navState.moduleBackendId}</p>
                <p><strong>currentLesson:</strong> {currentLesson ? 'EXISTS' : 'NULL'}</p>
                <p><strong>currentModule:</strong> {currentModule ? 'EXISTS' : 'NULL'}</p>
                <p><strong>isLoadingModules:</strong> {isLoadingModules ? 'YES' : 'NO'}</p>
                <p><strong>isLoadingLessons:</strong> {isLoadingLessons ? 'YES' : 'NO'}</p>
                <p><strong>modulesData count:</strong> {modulesData?.length || 0}</p>
                <p><strong>GameManager has lessons:</strong> {GameManager.hasLessonsData(navState.moduleBackendId || '') ? 'YES' : 'NO'}</p>
              </div>
              <button
                onClick={handleBackToMap}
                className="mt-4 px-6 py-2 bg-logo-blue text-white rounded-lg hover:bg-elegant-blue"
              >
                Back to Map
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ModulesPage;