import Phaser from 'phaser';
import { createGameConfig } from '../config/gameConfig';
import type { Module, Lesson } from '../../../../../types/modules';
import type { HousePosition, ModuleLessonsData } from '../types';
import { transformModulesToHouses, transformBackendLessonsToFrontend } from '../utils/DataTransformers';

class GameManager {
  private static instance: GameManager;
  private game: Phaser.Game | null = null;
  private assetsLoaded: boolean = false;
  private isPhaserReady: boolean = false;
  private savedNavState: any = null;
  private housesData: Record<string, HousePosition[]> = { downtown: [] };
  private moduleLessonsData: Record<string, ModuleLessonsData> = {};
  private currentSidebarOffset: number = 192;
  private resizeDebounceTimer: NodeJS.Timeout | null = null;
  private dpiMediaQuery: MediaQueryList | null = null;
  private dpiChangeHandler: (() => void) | null = null;

  private constructor() {}

  static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  /**
   * Save navigation state before component unmounts
   */
  saveNavState(navState: any): void {
    this.savedNavState = navState;
    localStorage.setItem('moduleNavState', JSON.stringify(navState));
    console.log('=== SAVING NAV STATE TO LOCALSTORAGE ===', navState);
  }

  /**
   * Restore navigation state when component remounts
   */
  restoreNavState(): any | null {
    console.log('=== RESTORING NAV STATE ===', this.savedNavState);
    return this.savedNavState;
  }

  /**
   * Clear saved navigation state
   */
  clearNavState(): void {
    this.savedNavState = null;
  }

  /**
   * Initialize or retrieve existing game instance
   */
  initializeGame(container: HTMLElement, sidebarOffset: number = 192): Phaser.Game {
    this.currentSidebarOffset = sidebarOffset;

    // If game already exists, reattach to new container
    if (this.game) {
      console.log('=== USING EXISTING PHASER GAME INSTANCE ===');
      
      // CRITICAL: Reattach the canvas to the new container
      const canvas = this.game.canvas;
      if (canvas && canvas.parentElement !== container) {
        console.log('=== REATTACHING CANVAS TO NEW CONTAINER ===');
        container.appendChild(canvas);
      }
      
      // Update the parent reference
      this.game.scale.parent = container;
      
      // Make sure the canvas is visible and properly sized
      if (canvas) {
        canvas.style.display = 'block';
      }
      
      // Trigger a resize to ensure proper scaling
      this.performCanvasResize();
      
      return this.game;
    }

    // Create new game instance
    console.log('=== CREATING NEW PHASER GAME INSTANCE ===');
    const config = createGameConfig(container, sidebarOffset);
    this.game = new Phaser.Game(config);

    this.game.events.once('ready', () => {
      console.log('=== PHASER GAME READY ===');
      this.isPhaserReady = true;
      
      // Set up DPI change monitoring
      this.setupDPIMonitoring();
      
      // Only start PreloaderScene if assets haven't been loaded yet
      if (!this.assetsLoaded && this.game) {
        console.log('=== STARTING PRELOADER SCENE (FIRST TIME) ===');
        this.game.scene.start('PreloaderScene');
        
        // Poll for assets loaded
        const checkInterval = setInterval(() => {
          if (this.game) {
            const flag = this.game.registry.get('assetsLoaded');
            if (flag) {
              console.log('=== ASSETS LOADED AND READY ===');
              this.assetsLoaded = true;
              clearInterval(checkInterval);
            }
          }
        }, 50);
        
        setTimeout(() => clearInterval(checkInterval), 10000);
      } else {
        console.log('=== ASSETS ALREADY LOADED, SKIPPING PRELOADER ===');
        // Set the registry flag immediately so components know assets are ready
        if (this.game) {
          this.game.registry.set('assetsLoaded', true);
        }
      }
    });

    return this.game;
  }

  /**
   * Update sidebar offset and resize game
   * Debounced to prevent too many resize calls during animation
   */
  updateSidebarOffset(sidebarOffset: number): void {
    if (!this.game || this.currentSidebarOffset === sidebarOffset) return;

    console.log(`=== UPDATING SIDEBAR OFFSET: ${this.currentSidebarOffset} → ${sidebarOffset} ===`);
    this.currentSidebarOffset = sidebarOffset;

    if (this.resizeDebounceTimer) {
      clearTimeout(this.resizeDebounceTimer);
    }

    // Perform immediate resize
    this.performCanvasResize();

    // Also schedule a debounced resize for safety
    this.resizeDebounceTimer = setTimeout(() => {
      this.performCanvasResize();
      this.resizeDebounceTimer = null;
    }, 150);
  }

  /**
   * Get current sidebar offset
   */
  getCurrentSidebarOffset(): number {
    return this.currentSidebarOffset;
  }

  /**
   * Perform canvas resize with current DPI
   */
  private performCanvasResize(): void {
    if (!this.game) return;

    const canvas = this.game.canvas;
    const dpr = window.devicePixelRatio || 1;
    const baseWidth = window.innerWidth - this.currentSidebarOffset;
    const baseHeight = window.innerHeight;
    
    console.log(`=== CANVAS RESIZE: ${baseWidth}x${baseHeight} @ DPR ${dpr} ===`);
    
    // Update canvas element pixel buffer
    canvas.width = baseWidth * dpr;
    canvas.height = baseHeight * dpr;
    
    // Update canvas CSS display size
    canvas.style.width = `${baseWidth}px`;
    canvas.style.height = `${baseHeight}px`;
    
    // Update Phaser internals
    this.game.scale.setZoom(1 / dpr);
    this.game.scale.resize(baseWidth * dpr, baseHeight * dpr);
    
    // CRITICAL FIX: Manually emit resize event to ensure scenes update
    const gameSize = { width: baseWidth * dpr, height: baseHeight * dpr };
    this.game.scale.emit('resize', gameSize);
  }

  /**
   * Set up DPI change monitoring for monitor switches
   */
  private setupDPIMonitoring(): void {
    if (this.dpiMediaQuery) return;

    const dpr = window.devicePixelRatio || 1;
    this.dpiMediaQuery = window.matchMedia(`(resolution: ${dpr}dppx)`);
    
    this.dpiChangeHandler = () => {
      console.log('=== GAME MANAGER: DPI CHANGE DETECTED ===');
      
      // Immediate resize
      setTimeout(() => {
        this.performCanvasResize();
      }, 50);
      
      // Follow-up resize after DPI stabilizes
      setTimeout(() => {
        this.performCanvasResize();
      }, 200);
    };

    this.dpiMediaQuery.addEventListener('change', this.dpiChangeHandler);
  }

  /**
   * Clean up DPI monitoring
   */
  private cleanupDPIMonitoring(): void {
    if (!this.dpiMediaQuery || !this.dpiChangeHandler) return;

    this.dpiMediaQuery.removeEventListener('change', this.dpiChangeHandler);
    this.dpiMediaQuery = null;
    this.dpiChangeHandler = null;
  }

  /**
   * Get current game instance
   */
  getGame(): Phaser.Game | null {
    return this.game;
  }

  /**
   * Check if game is ready
   */
  isReady(): boolean {
    return this.isPhaserReady;
  }

  /**
   * Check if assets are loaded
   */
  areAssetsLoaded(): boolean {
    return this.assetsLoaded;
  }

  /**
   * Destroy game instance (only call on app unmount)
   */
  destroy(): void {
    if (this.game) {
      console.log('=== DESTROYING PHASER GAME INSTANCE ===');
      
      // Clean up DPI monitoring
      this.cleanupDPIMonitoring();
      
      // Clear any pending debounce timer
      if (this.resizeDebounceTimer) {
        clearTimeout(this.resizeDebounceTimer);
        this.resizeDebounceTimer = null;
      }

      this.game.destroy(true);
      this.game = null;
      this.assetsLoaded = false;
      this.isPhaserReady = false;
      this.currentSidebarOffset = 192;
    }
  }

  /**
   * Pause all scenes
   */
  pause(): void {
    if (this.game) {
      this.game.scene.getScenes(true).forEach(scene => {
        if (scene.scene.isActive()) {
          scene.scene.pause();
        }
      });
    }
  }

  /**
   * Resume all paused scenes
   */
  resume(): void {
    if (this.game) {
      this.game.scene.getScenes(true).forEach(scene => {
        if (scene.scene.isPaused()) {
          scene.scene.resume();
        }
      });
    }
  }

  /**
   * Set navigation handlers in registry
   */
  setNavigationHandlers(handlers: {
    handleNeighborhoodSelect: (neighborhoodId: string) => void;
    handleHouseSelect: (houseId: string, moduleId: number, moduleBackendId: string) => void;
    handleLessonSelect: (lessonId: number) => void;
    handleMinigameSelect: () => void;
    handleBackToMap: () => void;
    handleBackToNeighborhood: () => void;
    handlePrefetchLessons?: (moduleBackendId: string) => void;
  }): void {
    if (!this.game) return;

    const scenes = this.game.scene.getScenes(false);
    if (scenes.length > 0) {
      const scene = scenes[0];
      scene.registry.set('handleNeighborhoodSelect', handlers.handleNeighborhoodSelect);
      scene.registry.set('handleHouseSelect', handlers.handleHouseSelect);
      scene.registry.set('handleLessonSelect', handlers.handleLessonSelect);
      scene.registry.set('handleMinigameSelect', handlers.handleMinigameSelect);
      scene.registry.set('handleBackToMap', handlers.handleBackToMap);
      scene.registry.set('handleBackToNeighborhood', handlers.handleBackToNeighborhood);
      scene.registry.set('handlePrefetchLessons', handlers.handlePrefetchLessons);
      
      console.log('✅ Navigation handlers set in registry');
    }
  }

  /**
   * Update modules data and transform to houses
   */
  updateModulesData(modulesData: any[]): void {
    this.housesData = transformModulesToHouses(modulesData);
    
    if (!this.game) return;
    
    const scenes = this.game.scene.getScenes(false);
    if (scenes.length > 0) {
      const scene = scenes[0];
      scene.registry.set('neighborhoodHouses', this.housesData);
      console.log('✅ Set neighborhood houses in registry:', this.housesData);
    }
  }

  /**
   * Update lessons data for a specific module
   */
  updateLessonsData(moduleBackendId: string, lessonsData: any[]): void {
    // Wait for houses data to be available
    if (!this.housesData['downtown'] || this.housesData['downtown'].length === 0) {
      console.warn(`⚠️ Houses data not ready yet, skipping lessons update for ${moduleBackendId}`);
      return;
    }

    const house = this.housesData['downtown'].find(h => h.moduleBackendId === moduleBackendId);
    if (!house) {
      console.warn(`⚠️ House not found for module ${moduleBackendId}`);
      return;
    }

    const transformedLessons = transformBackendLessonsToFrontend(
      lessonsData,
      house.moduleId!,
      house.name
    );

    this.moduleLessonsData[moduleBackendId] = transformedLessons;

    if (!this.game) return;

    const scenes = this.game.scene.getScenes(false);
    if (scenes.length > 0) {
      const scene = scenes[0];
      scene.registry.set('moduleLessonsData', this.moduleLessonsData);
      console.log('✅ Set module lessons data in registry:', this.moduleLessonsData);
    }
  }

  /**
   * Check if lessons data exists for a module
   */
  hasLessonsData(moduleBackendId: string): boolean {
    return !!this.moduleLessonsData[moduleBackendId];
  }

  /**
   * Transition to map scene
   */
  transitionToMap(): void {
    if (!this.game) return;

    if (this.game.scene.isActive('NeighborhoodScene')) this.game.scene.sleep('NeighborhoodScene');
    if (this.game.scene.isActive('HouseScene')) this.game.scene.sleep('HouseScene');
    if (!this.game.scene.isActive('MapScene')) this.game.scene.start('MapScene');
  }

  /**
   * Transition to neighborhood scene
   */
  transitionToNeighborhood(neighborhoodId: string | null, savedHouseIndex?: number): void {
    if (!this.game) return;

    let currentHouseIndex = 0;
    if (savedHouseIndex !== undefined) {
      currentHouseIndex = savedHouseIndex;
    } else {
      const scenes = this.game.scene.getScenes(false);
      currentHouseIndex = scenes.length > 0 ? (scenes[0].registry.get('currentHouseIndex') ?? 0) : 0;
    }

    // Now stop/sleep scenes
    if (this.game.scene.isActive('MapScene')) this.game.scene.sleep('MapScene');
    if (this.game.scene.isActive('HouseScene')) this.game.scene.sleep('HouseScene');
    if (this.game.scene.isActive('NeighborhoodScene')) this.game.scene.stop('NeighborhoodScene');
    
    this.game.scene.start('NeighborhoodScene', {
      neighborhoodId: neighborhoodId,
      houses: this.housesData['downtown'] || [],
      currentHouseIndex: currentHouseIndex
    });
  }

  /**
   * Transition to house scene
   */
  transitionToHouse(houseId: string | null, moduleId: number | null, moduleBackendId: string | null): void {
    if (!this.game) return;

    if (this.game.scene.isActive('MapScene')) this.game.scene.sleep('MapScene');
    if (this.game.scene.isActive('NeighborhoodScene')) this.game.scene.stop('NeighborhoodScene');
    if (this.game.scene.isActive('HouseScene')) this.game.scene.stop('HouseScene');
    
    this.game.scene.start('HouseScene', {
      houseId: houseId,
      moduleId: moduleId,
      moduleBackendId: moduleBackendId
    });
  }

  /**
   * Pause all Phaser scenes
   */
  pauseAllScenes(): void {
    if (!this.game) return;

    if (this.game.scene.isActive('MapScene')) this.game.scene.sleep('MapScene');
    if (this.game.scene.isActive('NeighborhoodScene')) this.game.scene.sleep('NeighborhoodScene');
    if (this.game.scene.isActive('HouseScene')) this.game.scene.sleep('HouseScene');
  }

  /**
   * Get current module data
   */
  getCurrentModule(moduleId: number, moduleBackendId: string): Module | null {
    const house = this.housesData['downtown']?.find(h => h.moduleBackendId === moduleBackendId);
    const moduleData = this.moduleLessonsData[moduleBackendId];
    
    if (!house) return null;

    return {
      id: moduleId,
      backendId: moduleBackendId,
      image: '/placeholder-module.jpg',
      title: house.name,
      description: house.description || 'Module description',
      lessonCount: moduleData?.lessons?.length || 0,
      status: 'In Progress' as const,
      tags: ['Learning'],
      illustration: 'default',
      lessons: moduleData?.lessons || []
    };
  }

  /**
   * Get current lesson data
   */
  getCurrentLesson(moduleBackendId: string, lessonId: number): Lesson | null {
    const moduleData = this.moduleLessonsData[moduleBackendId];
    if (!moduleData || !moduleData.lessons) return null;
    
    const lessonData = moduleData.lessons.find(l => l.id === lessonId);
    if (!lessonData) return null;
    
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
  }
}

export default GameManager.getInstance();