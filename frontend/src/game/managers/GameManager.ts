/* eslint-disable no-useless-assignment */
import Phaser from 'phaser';
import { createGameConfig } from '../config/gameConfig';
import type PreloaderScene from '../scenes/PreloaderScene';
import type { Module, Lesson } from '../../types/modules';
import type { HousePosition, ModuleLessonsData } from '../types';
import { transformModulesToHouses, transformBackendLessonsToFrontend, generateFrontendId } from '../utils/DataTransformers';

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
  private _isDestroying: boolean = false;

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
      const canvas = this.game.canvas;

      // If the canvas exists but its parent is no longer in the DOM
      // (e.g. React StrictMode double-mount or auth state remount),
      // destroy the stale game and create a fresh one below.
      if (canvas && !canvas.isConnected) {
        console.log('=== STALE CANVAS DETECTED — DESTROYING OLD INSTANCE ===');
        this.destroy();
        // Fall through to create new game below
      } else if (!canvas) {
        // Game is still initializing (canvas not created yet).
        // Destroy and recreate to ensure it targets the current container.
        console.log('=== GAME INITIALIZING WITHOUT CANVAS — DESTROYING TO RECREATE ===');
        this.destroy();
        // Fall through to create new game below
      } else {
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
        console.log('=== PRELOADER SCENE AUTO-STARTED BY PHASER — POLLING FOR COMPLETION ===');

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
   * Trigger Tier 2 (Secondary) background asset loading via PreloaderScene.
   * Call after MapScene is visible and assetsLoaded is true.
   */
  loadSecondaryAssets(): void {
    if (!this.game) return;
    const preloader = this.game.scene.getScene('PreloaderScene') as PreloaderScene | null;
    if (preloader) {
      preloader.loadSecondaryAssets();
    } else {
      console.warn('GameManager.loadSecondaryAssets: PreloaderScene not found');
    }
  }

  /**
   * Trigger Tier 3 (Deferred) background asset loading via PreloaderScene.
   * Call when user first navigates to the minigame.
   */
  loadDeferredAssets(): void {
    if (!this.game) return;
    const preloader = this.game.scene.getScene('PreloaderScene') as PreloaderScene | null;
    if (preloader) {
      preloader.loadDeferredAssets();
    } else {
      console.warn('GameManager.loadDeferredAssets: PreloaderScene not found');
    }
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

      this._isDestroying = true;
      this.game.destroy(true);
      this._isDestroying = false;
      this.game = null;
      this.assetsLoaded = false;
      this.isPhaserReady = false;
      this.currentSidebarOffset = 192;
    }
  }

  /**
   * Check if game is currently being destroyed (used by scenes
   * to skip DOM cleanup like clearing section-background)
   */
  get isDestroying(): boolean {
    return this._isDestroying;
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
    handleHouseSelect: (houseId: string, moduleBackendId?: string) => void;
    handleLessonSelect: (lessonId: number, moduleBackendId?: string) => void;
    handleMinigameSelect: () => void;
    handleBackToMap: () => void;
    handleBackToNeighborhood: () => void;
    handlePrefetchLessons?: (moduleBackendId: string) => void;
    handleBackToHouse?: () => void;
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
      scene.registry.set('handleBackToHouse', handlers.handleBackToHouse);
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
      scene.registry.set('learningModules', modulesData);
      console.log('✅ Set neighborhood houses in registry:', this.housesData);
    }
  }

  /**
   * Update lessons data for a specific module
   */
  updateLessonsData(moduleBackendId: string, lessonsData: any[]): void {
    console.log(`📚 Updating lessons data for module: ${moduleBackendId}`);

    // Check if we have a matching house in housesData
    let house = this.housesData['downtown']?.find(h => h.moduleBackendId === moduleBackendId);

    // If no house found and this is a mock module, create a synthetic house entry
    // so mock lessons can still be stored and rendered
    if (!house && moduleBackendId.startsWith('mock-module-')) {
      console.log(`📋 Creating synthetic house entry for mock module: ${moduleBackendId}`);
      const mockIndex = parseInt(moduleBackendId.replace('mock-module-', ''), 10) - 1;
      const mockHouse: HousePosition = {
        id: `mock-house-${mockIndex + 1}`,
        name: lessonsData.length > 0 ? 'Home-buying Foundations' : `Module ${mockIndex + 1}`,
        x: 20,
        y: 40,
        moduleId: generateFrontendId(moduleBackendId, 10000),
        moduleBackendId: moduleBackendId,
        isLocked: false,
        houseType: `house${(mockIndex % 4) + 1}`,
        description: '',
        coinReward: 0,
      };

      // Add the synthetic house to housesData so HouseScene can find it
      if (!this.housesData['downtown']) {
        this.housesData['downtown'] = [];
      }
      // Only add if not already present
      if (!this.housesData['downtown'].find(h => h.moduleBackendId === moduleBackendId)) {
        this.housesData['downtown'].push(mockHouse);
      }
      house = mockHouse;

      // Update registry with the new houses data
      if (this.game) {
        const scenes = this.game.scene.getScenes(false);
        if (scenes.length > 0) {
          scenes[0].registry.set('neighborhoodHouses', this.housesData);
          console.log(`✅ Updated neighborhood houses registry with mock house`);
        }
      }
    }

    // If still no house found (non-mock module with empty backend), wait for real data
    if (!house) {
      // But if we already have transformed data from a previous successful call, keep it
      if (this.moduleLessonsData[moduleBackendId]) {
        console.log(`📋 Using previously stored lessons data for ${moduleBackendId}`);
        this.syncLessonsToRegistry();
        return;
      }
      console.warn(`⚠️ House not found for module ${moduleBackendId}`);
      return;
    }

    const transformedLessons = transformBackendLessonsToFrontend(
      lessonsData,
      house.moduleId!,
      house.name
    );

    this.moduleLessonsData[moduleBackendId] = transformedLessons;
    console.log(`✅ Transformed lessons for ${house.name}:`, transformedLessons);

    // Update the registry IMMEDIATELY
    this.syncLessonsToRegistry();
  }

  /**
   * Push current moduleLessonsData to the Phaser registry
   */
  private syncLessonsToRegistry(): void {
    if (!this.game) return;
    const scenes = this.game.scene.getScenes(false);
    if (scenes.length > 0) {
      scenes[0].registry.set('moduleLessonsData', { ...this.moduleLessonsData });
      console.log(`✅ Synced moduleLessonsData to registry`);
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

    if (!this.game.scene.isActive('MapScene'))
      this.game.scene.start('MapScene');
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
  transitionToHouse(houseId: string | null, moduleBackendId: string | null): void {
    if (!this.game) return;

    // Check if we should skip the HouseScene restart — set by
    // handleLaunchMinigameFromLesson to avoid destroying the existing HouseScene
    // when launching a GYN minigame from LessonView.
    const skipRestart = this.game.registry.get('skipHouseSceneRestart');
    if (skipRestart) {
      this.game.registry.set('skipHouseSceneRestart', false);
      // HouseScene is already woken by the caller — just return
      return;
    }

    // Find the house to get the moduleId
    let house = this.housesData['downtown']?.find(h => h.id === houseId);

    // For mock modules: also try matching by moduleBackendId if house wasn't found by id
    if (!house && moduleBackendId) {
      house = this.housesData['downtown']?.find(h => h.moduleBackendId === moduleBackendId);
    }

    const moduleId = house?.moduleId || null;

    if (this.game.scene.isActive('MapScene')) this.game.scene.sleep('MapScene');
    if (this.game.scene.isActive('NeighborhoodScene')) this.game.scene.stop('NeighborhoodScene');
    if (this.game.scene.isActive('HouseScene')) this.game.scene.stop('HouseScene');

    // Ensure moduleLessonsData is in the registry before HouseScene.init() reads it
    if (moduleBackendId && this.moduleLessonsData[moduleBackendId]) {
      const scenes = this.game.scene.getScenes(false);
      if (scenes.length > 0) {
        scenes[0].registry.set('moduleLessonsData', { ...this.moduleLessonsData });
      }
    }

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
    const houses = this.housesData['downtown'] || [];
    const houseIndex = houses.findIndex(h => h.moduleBackendId === moduleBackendId);
    const house = houseIndex >= 0 ? houses[houseIndex] : null;
    const moduleData = this.moduleLessonsData[moduleBackendId];

    if (!house) return null;

    return {
      id: moduleId,
      backendId: moduleBackendId,
      orderIndex: houseIndex,
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