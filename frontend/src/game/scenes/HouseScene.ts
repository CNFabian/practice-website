import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { scale, scaleFontSize } from '../utils/scaleHelper';
import { SCENE_KEYS } from '../constants/SceneKeys';
import { ASSET_KEYS } from '../constants/AssetKeys';
import { COLORS } from '../constants/Colors';
import { ButtonBuilder } from '../ui/ButtonBuilder';
import { BirdCharacter } from '../characters/BirdCharacter';
import { createTextStyle } from '../constants/Typography';
import { SceneTransitionManager } from '../managers/SceneTransitionManager';
import {
  getFreeRoamQuestions,
  getFreeRoamState,
  transformGYNQuestionsForMinigame,
} from '../../services/growYourNestAPI';
import type { GYNMinigameInitData } from '../../types/growYourNest.types';

interface Lesson {
  id: number;
  title: string;
  description?: string;
  type: string;
  completed: boolean;
  locked: boolean;
  x?: number;
  y?: number;
}

interface Module {
  id: number;
  title: string;
  lessons: Lesson[];
}

interface HouseSceneData {
  houseId?: string;
  moduleId?: number;
  moduleBackendId?: string;
}

interface BirdTravelInfo {
  previousHouseIndex: number;
  currentHouseIndex: number;
  traveled: boolean;
}

interface ModuleLessonsData {
  id: number;
  title: string;
  lessons: Lesson[];
}

export default class HouseScene extends BaseScene {
  // ═══════════════════════════════════════════════════════════
  // PROPERTIES
  // ═══════════════════════════════════════════════════════════
  private module: Module | null = null;
  private moduleBackendId?: string;
  private isTransitioning: boolean = false;
  private backButton?: Phaser.GameObjects.Container;
  private minigameButton?: Phaser.GameObjects.Container;
  private minigameButtonGlowTween?: Phaser.Tweens.Tween;
  private lessonContainers: Phaser.GameObjects.Container[] = [];
  private minigameShutdownHandler?: () => void;
  private isRefreshingTreeState: boolean = false;
  private resizeDebounceTimer?: Phaser.Time.TimerEvent;
  private transitionManager!: SceneTransitionManager;
  private loadingText?: Phaser.GameObjects.Text;

  // Stored original positions for slide-in restoration
  private originalComponentPositions: Map<Phaser.GameObjects.GameObject, number> = new Map();

  // Hover tooltip
  private hoverTooltip?: Phaser.GameObjects.Container;
  private hoverTooltipLessonId?: number;
  private tooltipDestroyTimer?: Phaser.Time.TimerEvent;
  private isPointerOverTooltip: boolean = false;

  // Free roam locked tooltip
  private freeRoamLockedTooltip?: Phaser.GameObjects.Container;
  private freeRoamTooltipDestroyTimer?: Phaser.Time.TimerEvent;

  // Environment
  private lessonHouse?: Phaser.GameObjects.Image;

  // Bird character
  private bird?: BirdCharacter;

  // ═══════════════════════════════════════════════════════════
  // CONSTRUCTOR
  // ═══════════════════════════════════════════════════════════
  constructor() {
    super({ key: SCENE_KEYS.HOUSE });
  }

  // ═══════════════════════════════════════════════════════════
  // LIFECYCLE METHODS
  // ═══════════════════════════════════════════════════════════

  init(data: HouseSceneData) {
    this.isTransitioning = false;
    this.isRefreshingTreeState = false;
    this.lessonContainers = [];
    this.hoverTooltip = undefined;
    this.hoverTooltipLessonId = undefined;
    this.tooltipDestroyTimer = undefined;
    this.isPointerOverTooltip = false;
    this.freeRoamLockedTooltip = undefined;
    this.freeRoamTooltipDestroyTimer = undefined;
    this.moduleBackendId = data.moduleBackendId;

    const moduleLessonsData: Record<string, ModuleLessonsData> =
      this.registry.get('moduleLessonsData') || {};

    console.log('🏠 HouseScene init - moduleBackendId:', this.moduleBackendId);

    if (this.moduleBackendId && moduleLessonsData[this.moduleBackendId]) {
      this.module = moduleLessonsData[this.moduleBackendId];
      console.log('✅ Loaded module from backend:', this.module);
    } else {
      console.warn('⚠️ No module data found for backend ID:', this.moduleBackendId);
      this.module = { id: data.moduleId || 0, title: 'Loading...', lessons: [] };
    }

    if (this.bird) {
      this.bird.destroy();
      this.bird = undefined;
    }
  }

  create() {
    super.create();
    this.transitionManager = new SceneTransitionManager(this);
    this.transitionManager.enterHouse();
    this.createEnvironment();
    this.createUI();
    this.createBirdWithEntrance();
    this.setupEventListeners();
    this.checkForLessonsUpdate();
    this.registry.events.on('changedata-moduleLessonsData', this.onLessonsDataChanged, this);

    // Data is often already in registry by the time HouseScene starts —
    // run the free roam check immediately to update the button with accurate tree state
    this.checkFreeRoamUnlockCondition();
  }

  shutdown() {
    super.shutdown();
    this.transitionManager.cleanup();

    if (this.minigameButtonGlowTween) {
      this.minigameButtonGlowTween.stop();
      this.minigameButtonGlowTween = undefined;
    }

    if (this.minigameShutdownHandler) {
      const minigameScene = this.scene.get('GrowYourNestMinigame');
      if (minigameScene) {
        minigameScene.events.off('minigameCompleted', this.minigameShutdownHandler);
        this.minigameShutdownHandler = undefined;
      }
    }

    this.cleanupResizeHandler();
    this.registry.events.off('changedata-moduleLessonsData', this.onLessonsDataChanged, this);
    this.cancelTooltipDestroyTimer();
    this.destroyBird();
    this.destroyHoverTooltip(true);
    this.destroyFreeRoamLockedTooltip();
    this.lessonContainers = [];
  }

  // ═══════════════════════════════════════════════════════════
  // ENVIRONMENT CREATION METHODS
  // ═══════════════════════════════════════════════════════════

  private createEnvironment(): void {
    const { width, height } = this.scale;

    // Set background image on DOM element (like MapScene does)
    if (this.textures.exists(ASSET_KEYS.SUBURBAN_BACKGROUND)) {
      this.setBackgroundImage(ASSET_KEYS.SUBURBAN_BACKGROUND);
    } else {
      // Fallback: Set gradient background on DOM
      const bgElement = document.getElementById('section-background');
      if (bgElement) {
        bgElement.style.setProperty(
          'background',
          'linear-gradient(133.93deg, #EEF1FF 24.22%, #FAFBFF 79%)',
          'important'
        );
      }
    }

    // Layer 1 (depth 2): Lesson house image with transparent background
    // OPT-02: Check texture exists (Tier 2 may still be loading)
    if (this.textures.exists(ASSET_KEYS.LESSON_HOUSE)) {
      this.lessonHouse = this.add.image(width / 2, height, ASSET_KEYS.LESSON_HOUSE);
      this.lessonHouse.setOrigin(0.5, 1);      this.lessonHouse.setDepth(1);
      const houseScale = Math.min(width, height) * 0.001375
      this.lessonHouse.setScale(houseScale);
    } else {
      // Listen for secondary assets and create house when ready
      const onLoaded = () => {
        this.registry.events.off('changedata-secondaryAssetsLoaded', onLoaded);
        if (this.textures.exists(ASSET_KEYS.LESSON_HOUSE)) {
          const { width, height } = this.scale;
          this.lessonHouse = this.add.image(width / 2, height, ASSET_KEYS.LESSON_HOUSE);
          this.lessonHouse.setOrigin(0.5, 1);
          this.lessonHouse.setDepth(1);
          const houseScale = Math.min(width, height) * 0.001375
          this.lessonHouse.setScale(houseScale);
        }
      };
      this.registry.events.on('changedata-secondaryAssetsLoaded', onLoaded);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // UI CREATION METHODS
  // ═══════════════════════════════════════════════════════════

  private createUI(): void {
    this.createBackButton();
    this.createMinigameButton();

    if (this.module && this.module.lessons.length > 0) {
      this.createLessonCards();
    } else {
      this.createLoadingPlaceholder();
    }
  }

  private createLoadingPlaceholder(): void {
    const { width, height } = this.scale;

    this.loadingText = this.add
      .text(
        width / 2,
        height / 2,
        'Loading lessons...',
        createTextStyle('H2', COLORS.TEXT_SECONDARY, {
          fontSize: scaleFontSize(24),
        })
      )
      .setOrigin(0.5);
    this.loadingText.setDepth(10);
  }

  private createBackButton(): void {
    this.backButton = ButtonBuilder.createBackButton(this, () =>
      this.handleBackToNeighborhood()
    );
    this.backButton.setDepth(10);
  }

  private async launchFreeRoam(
    moduleBackendId: string,
    moduleNumber: number
  ): Promise<void> {
    try {
      console.log('🌳 Launching Free Roam for module:', moduleBackendId);

      // Ensure Tier 3 (deferred) assets are loaded before launching
      const deferredLoaded = this.registry.get('deferredAssetsLoaded');

      if (!deferredLoaded) {
        const preloader = this.scene.get('PreloaderScene') as any;
        if (preloader?.loadDeferredAssets) {
          preloader.loadDeferredAssets();
          // loadDeferredAssets may complete synchronously if assets are cached —
          // check registry again before awaiting the event
          if (!this.registry.get('deferredAssetsLoaded')) {
            await new Promise<void>((resolve) => {
              const timeout = setTimeout(() => {
                this.registry.events.off('changedata-deferredAssetsLoaded', handler);
                resolve();
              }, 5000);
              const handler = (_parent: any, _key: string, value: any) => {
                if (value) {
                  clearTimeout(timeout);
                  this.registry.events.off('changedata-deferredAssetsLoaded', handler);
                  resolve();
                }
              };
              this.registry.events.on('changedata-deferredAssetsLoaded', handler);
            });
          }
        }
      }

      // Fetch state first to check if tree is already completed
      const stateResponse = await getFreeRoamState(moduleBackendId);
      const treeAlreadyCompleted = stateResponse.completed === true;

      // Fetch questions
      const questionsResponse = await getFreeRoamQuestions(moduleBackendId);

      if (questionsResponse.questions.length === 0) {
        console.warn('🌳 No free roam questions available');
        this.isTransitioning = false;
        return;
      }

      if (treeAlreadyCompleted) {
        console.log('🌳 Tree is already fully grown — entering practice mode');
      }

      const transformedQuestions = transformGYNQuestionsForMinigame(
        questionsResponse.questions
      );

      const initData: GYNMinigameInitData = {
        mode: 'freeroam',
        moduleId: moduleBackendId,
        questions: transformedQuestions,
        treeState: {
          growth_points: stateResponse.growth_points,
          current_stage: stateResponse.current_stage,
          total_stages: stateResponse.total_stages,
          points_per_stage: stateResponse.points_per_stage,
          completed: stateResponse.completed,
        },
        moduleNumber,
        showStartScreen: true,
      };

      this.slideAndLaunchMinigame(initData);
    } catch (error) {
      console.error('🌳 Error launching free roam:', error);
      this.isTransitioning = false;
    }
  }

  /**
   * PUBLIC: Launch lesson-mode minigame with slide transition.
   * Called from LessonView via registry after navigating back to HouseScene.
   */
  public launchLessonMinigame(initData: GYNMinigameInitData): void {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    // When called from LessonView the user never saw the house sitting still,
    // so run slide-out and GYN slide-in concurrently instead of sequentially.
    this.slideAndLaunchMinigame(initData, true);
  }

  /**
   * PUBLIC: Launch free roam mode from React (FreeRoamUnlockModal).
   * Derives module number from house position and delegates to private launchFreeRoam.
   */
  public launchFreeRoamFromReact(): void {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    if (!this.moduleBackendId) {
      console.error('🌳 [FreeRoam] No moduleBackendId available');
      this.isTransitioning = false;
      return;
    }

    const houses = this.registry.get('neighborhoodHouses')?.['downtown'] || [];
    const houseIndex = houses.findIndex((h: any) => h.moduleBackendId === this.moduleBackendId);
    const moduleNumber = (houseIndex >= 0 ? houseIndex : 0) + 1;

    this.launchFreeRoam(this.moduleBackendId, moduleNumber);
  }

  /**
   * Shared slide-out → launch → slide-in logic for both free roam and lesson mode.
   * @param concurrent — when true, launch GYN immediately so its slide-in runs
   *   at the same time as the house slide-out (used for the LessonView → GYN path
   *   where the user doesn't need to watch the house exit first).
   */
  private slideAndLaunchMinigame(initData: GYNMinigameInitData, concurrent = false): void {

    const launchGYN = () => {
      // Stop any existing GYN scene first
      if (
        this.scene.isActive('GrowYourNestMinigame') ||
        this.scene.isPaused('GrowYourNestMinigame')
      ) {
        this.scene.stop('GrowYourNestMinigame');
      }

      this.scene.launch('GrowYourNestMinigame', initData);

      // Signal the walkthrough system that we're in the minigame view
      // Write directly to localStorage (read by MainLayout polling) instead of calling
      // handleMinigameSelect() which triggers React state updates that pause scenes and
      // change backgrounds. Delay allows GYN scene to fully create and slide in.
      setTimeout(() => {
        try {
          const saved = localStorage.getItem('moduleNavState');
          if (saved) {
            const parsed = JSON.parse(saved);
            parsed.currentView = 'minigame';
            localStorage.setItem('moduleNavState', JSON.stringify(parsed));
          }
        } catch { /* ignore */ }
      }, 1200);

      // Setup completion listener to slide house components back in
      const minigameScene = this.scene.get('GrowYourNestMinigame');
      if (minigameScene) {
        this.minigameShutdownHandler = () => {
          this.slideInHouseComponents();
          this.isTransitioning = false;

          // After slide-in completes (800ms), rebuild lesson cards with fresh data
          // so newly unlocked lessons appear without requiring a scene restart
          this.time.delayedCall(850, () => {
            this.rebuildLessonCards();
          });

          // Only check free roam unlock after LESSON mode minigame completions
          // Free roam completions should not re-trigger the unlock modal
          if (initData.mode === 'lesson') {
            this.time.delayedCall(900, () => {
              this.checkFreeRoamUnlockCondition(true);
            });
          } else if (initData.mode === 'freeroam') {
            // After free roam, fetch fresh tree state from API before recreating button
            this.time.delayedCall(900, () => {
              this.refreshTreeStateAndRecreateButton();
            });
          }
        };
        minigameScene.events.once(
          'minigameCompleted',
          this.minigameShutdownHandler
        );
      }
    };

    if (concurrent) {
      // Run both animations at the same time — house slides left while GYN slides in from right
      this.slideOutHouseComponents().then(() => {
        this.scene.pause('HouseScene');
      });
      launchGYN();
    } else {
      // Sequential: wait for house to fully exit before launching GYN
      this.slideOutHouseComponents().then(() => {
        this.scene.pause('HouseScene');
        launchGYN();
      });
    }
  }

  // ═══════════════════════════════════════════════════════════
  // FREE ROAM UNLOCK — Client-side check (Option B from plan)
  //
  // After a lesson-mode minigame completes, check if ALL lessons
  // in this module now have grow_your_nest_played === true.
  // If so, signal React via registry to show the unlock modal.
  // ═══════════════════════════════════════════════════════════
  private checkFreeRoamUnlockCondition(fromMinigameCompletion: boolean = false): void {
    if (!this.moduleBackendId) return;

    const moduleLessonsData: Record<string, any> =
      this.registry.get('moduleLessonsData') || {};
    const moduleData = moduleLessonsData[this.moduleBackendId];

    if (!moduleData?.lessons || moduleData.lessons.length === 0) {
      console.log('🌳 [FreeRoam Check] No lessons data available — skipping');
      return;
    }

    const allGYNCompleted = moduleData.lessons.every(
      (lesson: any) => lesson.grow_your_nest_played === true
    );

    console.log(
      '🌳 [FreeRoam Check] All GYN completed:',
      allGYNCompleted,
      `(${moduleData.lessons.filter((l: any) => l.grow_your_nest_played).length}/${moduleData.lessons.length})`
    );

    if (allGYNCompleted) {
      // Fetch fresh tree state then recreate the minigame button with accurate data
      this.refreshTreeStateAndRecreateButton();

      // Preload Tier 3 (deferred) assets in the background so they're ready
      // when the user clicks the free roam button — eliminates launch lag
      if (!this.registry.get('deferredAssetsLoaded')) {
        const preloader = this.scene.get('PreloaderScene') as any;
        if (preloader?.loadDeferredAssets) {
          preloader.loadDeferredAssets();
        }
      }

      // Only show the modal ONCE — when triggered by the minigame completion callback
      if (fromMinigameCompletion) {
        // Use direct game event instead of registry changedata (more reliable)
        this.game.events.emit('freeRoamUnlocked', this.moduleBackendId);
        console.log('🌳 [FreeRoam Check] ✅ All lesson minigames complete — signaling React via game event');

        // Add highlight glow to the button after a small delay for recreation
        this.time.delayedCall(500, () => {
          this.highlightMinigameButton();
        });
      }
    }
  }

  private createMinigameButton(): void {
    const { width, height } = this.scale;

    // Position: below and to the right of coin counter
    const buttonX = width - width * 0.08 + scale(20);
    const buttonY = height * 0.05 + scale(60);

    this.minigameButton = this.createCircularMinigameButton(buttonX, buttonY);
    this.minigameButton.setDepth(100);
  }

  /**
   * Fetch fresh tree state from the backend API and update the learningModules
   * registry so the minigame button reflects accurate progression/stage.
   * Guarded against concurrent calls to prevent multiple API requests and button flicker.
   */
  private async refreshTreeStateAndRecreateButton(): Promise<void> {
    if (this.isRefreshingTreeState) return;
    if (!this.moduleBackendId) {
      this.recreateMinigameButton();
      return;
    }

    this.isRefreshingTreeState = true;

    try {
      const stateResponse = await getFreeRoamState(this.moduleBackendId);

      // Update learningModules in registry with fresh tree state
      const learningModules: any[] | undefined = this.registry.get('learningModules');
      if (learningModules) {
        const mod = learningModules.find((m: any) => m.id === this.moduleBackendId);
        if (mod) {
          mod.tree_growth_points = stateResponse.growth_points;
          mod.tree_current_stage = stateResponse.current_stage;
          mod.tree_total_stages = stateResponse.total_stages;
          mod.tree_completed = stateResponse.completed;
        }
      }

      // Also update dashboardModules if present
      const dashboardModules: any[] | undefined = this.registry.get('dashboardModules');
      if (dashboardModules) {
        const dashEntry = dashboardModules.find(
          (entry: any) => entry.module?.id === this.moduleBackendId
        );
        if (dashEntry?.module) {
          dashEntry.module.tree_growth_points = stateResponse.growth_points;
          dashEntry.module.tree_current_stage = stateResponse.current_stage;
          dashEntry.module.tree_total_stages = stateResponse.total_stages;
          dashEntry.module.tree_completed = stateResponse.completed;
        }
      }
    } catch (error) {
      console.warn('🌳 Failed to fetch fresh tree state, button may show stale data:', error);
    }

    this.isRefreshingTreeState = false;
    this.recreateMinigameButton();
  }

  private recreateMinigameButton(): void {
    if (this.minigameButton) {
      this.minigameButton.destroy();
      this.minigameButton = undefined;
    }
    this.createMinigameButton();
  }

  private highlightMinigameButton(): void {
    if (!this.minigameButton) return;

    // Stop any existing glow tween
    if (this.minigameButtonGlowTween) {
      this.minigameButtonGlowTween.stop();
      this.minigameButtonGlowTween = undefined;
    }

    // Add a glowing ring behind the button
    const glowCircle = this.add.graphics();
    const glowRadius = scale(32);
    glowCircle.fillStyle(COLORS.STATUS_GREEN, 0.3);
    glowCircle.fillCircle(0, 0, glowRadius);
    this.minigameButton.addAt(glowCircle, 0); // behind everything

    // Pulsing scale animation on the glow
    this.minigameButtonGlowTween = this.tweens.add({
      targets: glowCircle,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 1000,
      ease: 'Sine.easeOut',
      repeat: -1,
    });

    // Also pulse the whole button slightly
    this.tweens.add({
      targets: this.minigameButton,
      scale: 1.15,
      duration: 600,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: 3,
    });
  }

  private createCircularMinigameButton(
    x: number,
    y: number
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const circleRadius = scale(24);

    // ── Check Free Roam unlock condition ──
    // Button is only active when ALL lessons have grow_your_nest_played === true
    let freeRoamUnlocked = false;
    const moduleLessonsData: Record<string, any> =
      this.registry.get('moduleLessonsData') || {};
    const moduleData = this.moduleBackendId
      ? moduleLessonsData[this.moduleBackendId]
      : null;

    if (moduleData?.lessons && moduleData.lessons.length > 0) {
      freeRoamUnlocked = moduleData.lessons.every(
        (lesson: any) => lesson.grow_your_nest_played === true
      );
    }

    // Always read tree growth data so the button reflects the current state
    // regardless of unlock status (matches NeighborhoodScene HouseProgressCard)
    let progressPercent = 0;
    let treeGrowthPoints = 0;
    let treeTotalStages = 5;
    let treeCurrentStage = 0;
    let treeCompleted = false;
    const pointsPerStage = 50;

    // Primary: dashboardModules (nested under .module) — same source as HouseProgressCard
    const dashboardModules: any[] | undefined = this.registry.get('dashboardModules');
    const learningModules: any[] | undefined = this.registry.get('learningModules');

    if (dashboardModules && this.moduleBackendId) {
      const dashEntry = dashboardModules.find(
        (entry: any) => entry.module?.id === this.moduleBackendId
      );
      if (dashEntry?.module) {
        treeGrowthPoints = dashEntry.module.tree_growth_points ?? 0;
        treeTotalStages = dashEntry.module.tree_total_stages ?? 5;
        treeCurrentStage = dashEntry.module.tree_current_stage ?? 0;
        treeCompleted = dashEntry.module.tree_completed ?? false;
      }
    } else if (learningModules && this.moduleBackendId) {
      // Fallback: learningModules (flat structure)
      const mod = learningModules.find((m: any) => m.id === this.moduleBackendId);
      if (mod) {
        treeGrowthPoints = mod.tree_growth_points ?? 0;
        treeTotalStages = mod.tree_total_stages ?? 5;
        treeCurrentStage = mod.tree_current_stage ?? 0;
        treeCompleted = mod.tree_completed ?? false;
      }
    }

    const treeTotalPoints = treeTotalStages * pointsPerStage;
    if (treeCompleted) {
      progressPercent = 100;
    } else if (treeTotalPoints > 0) {
      progressPercent = (treeGrowthPoints / treeTotalPoints) * 100;
    }

    // Background circle (light gray)
    const bgCircle = this.add.graphics();
    bgCircle.lineStyle(scale(4), COLORS.UNAVAILABLE_BUTTON, 1);
    bgCircle.strokeCircle(0, 0, circleRadius);
    container.add(bgCircle);

    // Progress arc (green) — show progress regardless of unlock status
    if (progressPercent > 0) {
      const progressArc = this.add.graphics();
      progressArc.lineStyle(scale(4), COLORS.STATUS_GREEN, 1);
      const startAngle = Phaser.Math.DegToRad(270);
      const endAngle = Phaser.Math.DegToRad(
        270 + (360 * progressPercent) / 100
      );
      progressArc.beginPath();
      progressArc.arc(0, 0, circleRadius, startAngle, endAngle, false);
      progressArc.strokePath();
      container.add(progressArc);
    }

    // Tree stage for display (1-indexed); always show actual stage
    let treeStage = treeCurrentStage + 1;
    if (treeStage > 5) treeStage = 5;
    if (treeStage < 1) treeStage = 1;

    // Tree image — only add if texture is loaded
    const treeTextureKey = `tree_stage_${treeStage}`;
    if (this.textures.exists(treeTextureKey)) {
      const treeIcon = this.add.image(0, 0, treeTextureKey);
      const targetSize = scale(42);
      const treeScale = targetSize / Math.max(treeIcon.width, treeIcon.height);
      treeIcon.setScale(treeScale);
      treeIcon.setOrigin(0.5);
      // Desaturate tree when locked
      if (!freeRoamUnlocked) {
        treeIcon.setAlpha(0.5);
      }
      container.add(treeIcon);
    }

    // Completed state: checkmark overlay (only when unlocked)
    if (freeRoamUnlocked && treeCompleted) {
      const overlay = this.add.graphics();
      overlay.fillStyle(COLORS.STATUS_GREEN, 0.25);
      overlay.fillCircle(0, 0, circleRadius);
      container.add(overlay);

      const checkmark = this.add.text(0, 0, '✓', {
        fontSize: `${scaleFontSize(18)}px`,
        fontFamily: "'Onest', sans-serif",
        color: '#76DC94',
      });
      checkmark.setOrigin(0.5);
      container.add(checkmark);
    }

    // Invisible hit area
    const hitArea = this.add.circle(
      0,
      0,
      circleRadius + scale(5),
      0x000000,
      0
    );
    hitArea.setInteractive({ useHandCursor: true });
    container.add(hitArea);

    hitArea.on('pointerover', () => {
      this.tweens.add({
        targets: container,
        scale: 1.1,
        duration: 200,
        ease: 'Power2',
      });
    });

    hitArea.on('pointerout', () => {
      this.tweens.add({
        targets: container,
        scale: 1,
        duration: 200,
        ease: 'Power2',
      });
    });

    if (freeRoamUnlocked) {
      // Unlocked: click launches free roam
      hitArea.on('pointerdown', () => {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        if (this.moduleBackendId) {
          const houses = this.registry.get('neighborhoodHouses')?.['downtown'] || [];
          const houseIndex = houses.findIndex((h: any) => h.moduleBackendId === this.moduleBackendId);
          const moduleNumber = (houseIndex >= 0 ? houseIndex : 0) + 1;
          this.launchFreeRoam(this.moduleBackendId, moduleNumber);
        } else {
          this.isTransitioning = false;
        }
      });
    } else {
      // Locked: click shows tooltip explaining how to unlock
      hitArea.on('pointerdown', () => {
        this.showFreeRoamLockedTooltip(container.x, container.y, circleRadius);
      });
    }

    return container;
  }

  /**
   * Called when moduleLessonsData is updated in the registry after scene creation.
   * Rebuilds lesson cards if this module's data has arrived.
   */
  private onLessonsDataChanged(_parent: any, _key: string, data: Record<string, any>): void {
    if (!this.moduleBackendId || !data[this.moduleBackendId]) return;

    // Always update the stored module reference with fresh data
    const freshData = data[this.moduleBackendId];

    // If lessons haven't been loaded yet, do the full rebuild
    if (!this.module || this.module.lessons.length === 0) {
      console.log('📋 HouseScene: Late-arriving lessons data detected, rebuilding UI');
      this.module = freshData;

      // Destroy loading placeholder
      if (this.loadingText) {
        this.loadingText.destroy();
        this.loadingText = undefined;
      }

      this.lessonContainers.forEach((container) => container.destroy());
      this.lessonContainers = [];

      if (this.module && this.module.lessons.length > 0) {
        this.createLessonCards();
      }
    } else {
      // Lessons already loaded — update reference silently for fresh grow_your_nest_played values
      this.module = freshData;
    }

    // Re-check free roam unlock with the fresh data
    // Skip if GYN minigame is currently active — the check will run after the user exits
    const gynActive = this.scene.isActive('GrowYourNestMinigame') || this.scene.isPaused('GrowYourNestMinigame');
    if (!gynActive) {
      this.checkFreeRoamUnlockCondition();
    }
  }

  // ═══════════════════════════════════════════════════════════
  // LESSON CARDS (visual only — NO interactivity)
  // ═══════════════════════════════════════════════════════════

  /**
   * Destroys existing lesson card containers and recreates them
   * with the latest data from this.module. Used after minigame
   * completion to reflect newly unlocked lessons.
   */
  private rebuildLessonCards(): void {
    if (!this.module || this.module.lessons.length === 0) return;

    // Destroy old lesson containers
    this.lessonContainers.forEach((container) => container.destroy());
    this.lessonContainers = [];

    // Recreate with fresh data
    this.createLessonCards();
  }

  private createLessonCards(): void {
    if (!this.module) return;
    this.module.lessons.forEach((lesson, index) => {
      this.createLessonCard(lesson, index);
    });
  }

  private createLessonCard(lesson: Lesson, index: number): void {
    const { width, height } = this.scale;

    const defaultPositions = [
      { x: 31, y: 33 },   // Top-left room (bedroom screen)
      { x: 66, y: 33 },   // Top-right room (dining screen)
      { x: 28, y: 70 },   // Bottom-left room (living room screen)
      { x: 69, y: 70 },   // Bottom-right room (kitchen screen)
    ];

    const defaultPos = defaultPositions[index] || { x: 50, y: 50 };

    const x =
      lesson.x !== undefined
        ? (lesson.x / 100) * width
        : (defaultPos.x / 100) * width;
    const y =
      lesson.y !== undefined
        ? (lesson.y / 100) * height
        : (defaultPos.y / 100) * height;

    const cardWidth = width * 0.27;
    const cardHeight = height * 0.19;

    const lessonContainer = this.add.container(x, y);
    lessonContainer.setDepth(10);
    this.lessonContainers.push(lessonContainer);

    const cardOffsetY = -cardHeight * 0.1;

    let card: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
    if (this.textures.exists(ASSET_KEYS.LESSON_CARD)) {
      const cardImage = this.add.image(0, cardOffsetY, ASSET_KEYS.LESSON_CARD);
      cardImage.setDisplaySize(cardWidth, cardHeight);
      card = cardImage;
    } else {
      const cardRect = this.add.rectangle(
        0,
        cardOffsetY,
        cardWidth,
        cardHeight,
        COLORS.PURE_WHITE,
        1
      );
      const strokeWidth = Math.max(2, width * 0.002);
      cardRect.setStrokeStyle(strokeWidth, COLORS.UNAVAILABLE_BUTTON);
      card = cardRect;
    }
    lessonContainer.add(card);

    // Lesson number badge (top-left of card)
    const lessonNumber = index + 1;
    const badgeRadius = Math.min(width, height) * 0.018;
    const numberBadgeX = -cardWidth * 0.4;
    const numberBadgeY = -cardHeight * 0.35;
    const numberBadgeBg = this.add.circle(
      numberBadgeX,
      numberBadgeY,
      badgeRadius,
      COLORS.LOGO_BLUE
    );
    lessonContainer.add(numberBadgeBg);

    const numberSize = Math.min(width, height) * 0.018;
    const numberText = this.add
      .text(
        numberBadgeX,
        numberBadgeY,
        `${lessonNumber}`,
        createTextStyle('BADGE', COLORS.TEXT_WHITE_HEX, {
          fontSize: `${numberSize}px`,
        })
      )
      .setOrigin(0.5);
    lessonContainer.add(numberText);

    if (lesson.locked) {
      const lockOverlay = this.add.rectangle(
        0,
        cardOffsetY,
        cardWidth,
        cardHeight,
        COLORS.UNAVAILABLE_BUTTON,
        0.5
      );
      lessonContainer.add(lockOverlay);
    }

    this.createStatusBadge(lessonContainer, lesson, cardWidth, cardHeight);

    card.setInteractive({ useHandCursor: !lesson.locked });
    card.on('pointerover', () => {
      this.cancelTooltipDestroyTimer();
      this.showHoverTooltip(lesson, x, y);
    });
    card.on('pointerout', () => {
      this.scheduleTooltipDestroy();
    });
  }

  private createStatusBadge(
    container: Phaser.GameObjects.Container,
    lesson: Lesson,
    cardWidth: number,
    cardHeight: number
  ): void {
    const { width, height } = this.scale;
    const badgeSize = Math.min(width, height) * 0.025;
    const badgeX = cardWidth * 0.4;
    const badgeY = -cardHeight * 0.35;

    if (lesson.completed) {
      const completedBg = this.add.circle(
        badgeX,
        badgeY,
        badgeSize,
        COLORS.STATUS_GREEN
      );
      container.add(completedBg);

      const checkmark = this.add
        .text(
          badgeX,
          badgeY,
          '✓',
          createTextStyle('BADGE', COLORS.TEXT_WHITE_HEX, {
            fontSize: `${badgeSize * 1.2}px`,
          })
        )
        .setOrigin(0.5);
      container.add(checkmark);
    } else if (lesson.locked) {
      const lockedBg = this.add.circle(
        badgeX,
        badgeY,
        badgeSize,
        COLORS.UNAVAILABLE_BUTTON
      );
      container.add(lockedBg);

      const lockIcon = this.add
        .text(
          badgeX,
          badgeY,
          '🔒',
          createTextStyle('BADGE', COLORS.TEXT_WHITE_HEX, {
            fontSize: `${badgeSize}px`,
          })
        )
        .setOrigin(0.5);
      container.add(lockIcon);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // TOOLTIP DESTROY TIMER (delayed destroy so button is clickable)
  // ═══════════════════════════════════════════════════════════

  private scheduleTooltipDestroy(): void {
    this.cancelTooltipDestroyTimer();
    this.tooltipDestroyTimer = this.time.delayedCall(200, () => {
      if (!this.isPointerOverTooltip) {
        this.destroyHoverTooltip();
      }
      this.tooltipDestroyTimer = undefined;
    });
  }

  private cancelTooltipDestroyTimer(): void {
    if (this.tooltipDestroyTimer) {
      this.tooltipDestroyTimer.remove();
      this.tooltipDestroyTimer = undefined;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // HOVER TOOLTIP (appears anchored near the room quadrant)
  // ═══════════════════════════════════════════════════════════

  private showHoverTooltip(
    lesson: Lesson,
    zoneX: number,
    zoneY: number
  ): void {
    // If already showing for this lesson, skip
    if (this.hoverTooltipLessonId === lesson.id) return;

    // Don't show tooltips during minigame transition
    if (this.isTransitioning) return;

    // Destroy any existing tooltip immediately
    this.destroyHoverTooltip(true);

    this.hoverTooltipLessonId = lesson.id;
    this.isPointerOverTooltip = false;

    const { width, height } = this.scale;
    const minDim = Math.min(width, height);

    // ── Fixed tooltip dimensions (WIDER) ──
    const tooltipWidth = Math.min(width * 0.38, 440);
    const padding = scale(20);
    const innerWidth = tooltipWidth - padding * 2;
    const cornerRadius = scale(16);

    // ── Pre-calculate all font sizes ──
    const titleFontSize = minDim * 0.028;
    const descFontSize = minDim * 0.017;
    const btnFontSize = minDim * 0.018;
    const unlockFontSize = minDim * 0.014;

    // ── Fixed layout slots (top-down, all relative to tooltip top) ──
    const topPad = scale(16);
    const titleSlotY = topPad;
    const titleMaxH = titleFontSize * 2.4; // ~2 lines max

    const descSlotY = titleSlotY + titleMaxH + scale(8);
    const descMaxLines = 2;
    const descLineH = descFontSize * 1.35;
    const descMaxH = descMaxLines * descLineH;

    const btnSlotY = descSlotY + descMaxH + scale(14);
    const btnHeight = scale(36);
    const btnCornerRadius = btnHeight / 2;

    // For locked: add unlock message below button
    const unlockMsgH = lesson.locked ? unlockFontSize * 2.8 + scale(8) : 0;
    const bottomPad = scale(14);

    const tooltipHeight = btnSlotY + btnHeight + unlockMsgH + bottomPad;

    // ── Position: above the room quadrant so user can reach the button ──
    let tooltipX = zoneX;
    let tooltipY = zoneY;

    const padX = tooltipWidth / 2 + scale(8);
    if (tooltipX - padX < 0) tooltipX = padX;
    if (tooltipX + padX > width) tooltipX = width - padX;

    // If tooltip would go above viewport, place it below the zone instead
    if (tooltipY - tooltipHeight / 2 < scale(8)) {
      tooltipY = zoneY + tooltipHeight / 2 + scale(12);
    }

    // Final clamp
    if (tooltipY + tooltipHeight / 2 > height - scale(8)) {
      tooltipY = height - tooltipHeight / 2 - scale(8);
    }

    this.hoverTooltip = this.add.container(tooltipX, tooltipY);
    this.hoverTooltip.setDepth(51);

    // All Y positions are relative to container center, so offset by half height
    const offsetY = -tooltipHeight / 2;

    // ── Tooltip background hit area (keeps tooltip alive when hovered) ──
    const tooltipBgHit = this.add.rectangle(
      0,
      0,
      tooltipWidth + scale(10),
      tooltipHeight + scale(10),
      0x000000,
      0
    );
    tooltipBgHit.setInteractive();
    tooltipBgHit.on('pointerover', () => {
      this.isPointerOverTooltip = true;
      this.cancelTooltipDestroyTimer();
    });
    tooltipBgHit.on('pointerout', () => {
      this.isPointerOverTooltip = false;
      this.scheduleTooltipDestroy();
    });
    this.hoverTooltip.add(tooltipBgHit);

    // ── Card background ──
    const tooltipBg = this.add.graphics();
    tooltipBg.fillStyle(COLORS.PURE_WHITE, 1);
    tooltipBg.fillRoundedRect(
      -tooltipWidth / 2,
      offsetY,
      tooltipWidth,
      tooltipHeight,
      cornerRadius
    );
    tooltipBg.lineStyle(2, COLORS.UNAVAILABLE_BUTTON, 0.6);
    tooltipBg.strokeRoundedRect(
      -tooltipWidth / 2,
      offsetY,
      tooltipWidth,
      tooltipHeight,
      cornerRadius
    );
    this.hoverTooltip.add(tooltipBg);

    // ── Title (max ~2 lines, cropped if overflow) ──
    const titleY = offsetY + titleSlotY;
    const titleTextObj = this.add
      .text(
        0,
        titleY,
        lesson.title,
        createTextStyle('H2', COLORS.TEXT_PRIMARY, {
          fontSize: `${titleFontSize}px`,
          align: 'center',
          wordWrap: { width: innerWidth * 0.9 },
        })
      )
      .setOrigin(0.5, 0);
    if (titleTextObj.height > titleMaxH) {
      titleTextObj.setCrop(0, 0, titleTextObj.width, titleMaxH);
    }
    this.hoverTooltip.add(titleTextObj);

    // ── Description (max 2 lines, truncated with "...") ──
    const descAbsY = offsetY + descSlotY;
    const rawDesc = lesson.description || lesson.type || '';
    const truncatedDesc = this.truncateTextToFit(
      rawDesc,
      innerWidth * 0.85,
      descFontSize,
      descMaxLines
    );

    const tooltipDesc = this.add
      .text(
        0,
        descAbsY,
        truncatedDesc,
        createTextStyle('BODY_LIGHT', COLORS.TEXT_SECONDARY, {
          fontSize: `${descFontSize}px`,
          align: 'center',
          wordWrap: { width: innerWidth * 0.85 },
        })
      )
      .setOrigin(0.5, 0);
    if (tooltipDesc.height > descMaxH + 4) {
      tooltipDesc.setCrop(0, 0, tooltipDesc.width, descMaxH);
    }
    this.hoverTooltip.add(tooltipDesc);

    // ── Action Button (pill shape) ──
    const btnWidth = tooltipWidth * 0.5;
    const btnAbsY = offsetY + btnSlotY;
    const btnCenterY = btnAbsY + btnHeight / 2;

    if (lesson.locked) {
      const lockedBtnBg = this.add.graphics();
      lockedBtnBg.fillStyle(COLORS.ELEGANT_BLUE, 0.5);
      lockedBtnBg.fillRoundedRect(
        -btnWidth / 2,
        btnAbsY,
        btnWidth,
        btnHeight,
        btnCornerRadius
      );
      this.hoverTooltip.add(lockedBtnBg);

      const lockedBtnText = this.add
        .text(
          0,
          btnCenterY,
          'Locked',
          createTextStyle('BODY_BOLD', COLORS.TEXT_SECONDARY, {
            fontSize: `${btnFontSize}px`,
          })
        )
        .setOrigin(0.5);
      this.hoverTooltip.add(lockedBtnText);

      // "Unlock this lesson..." message
      const unlockMsgY = btnAbsY + btnHeight + scale(8);
      const unlockMsg = this.add
        .text(
          0,
          unlockMsgY,
          'Unlock this lesson by watching\nthe previous lessons',
          createTextStyle('CAPTION', COLORS.TEXT_SECONDARY, {
            fontSize: `${unlockFontSize}px`,
            align: 'center',
          })
        )
        .setOrigin(0.5, 0);
      this.hoverTooltip.add(unlockMsg);
    } else {
      const activeBtnBg = this.add.graphics();
      activeBtnBg.fillStyle(COLORS.LOGO_BLUE, 1);
      activeBtnBg.fillRoundedRect(
        -btnWidth / 2,
        btnAbsY,
        btnWidth,
        btnHeight,
        btnCornerRadius
      );
      this.hoverTooltip.add(activeBtnBg);

      const btnLabel = lesson.completed ? 'Review Lesson' : 'Start Lesson';
      const activeBtnText = this.add
        .text(
          0,
          btnCenterY,
          btnLabel,
          createTextStyle('BODY_BOLD', COLORS.TEXT_PURE_WHITE, {
            fontSize: `${btnFontSize}px`,
          })
        )
        .setOrigin(0.5);
      this.hoverTooltip.add(activeBtnText);

      // Button hit area
      const btnHit = this.add.rectangle(
        0,
        btnCenterY,
        btnWidth,
        btnHeight,
        0x000000,
        0
      );
      btnHit.setInteractive({ useHandCursor: true });
      btnHit.on('pointerover', () => {
        this.isPointerOverTooltip = true;
        this.cancelTooltipDestroyTimer();
        activeBtnBg.clear();
        activeBtnBg.fillStyle(COLORS.ELEGANT_BLUE, 1);
        activeBtnBg.fillRoundedRect(
          -btnWidth / 2,
          btnAbsY,
          btnWidth,
          btnHeight,
          btnCornerRadius
        );
      });
      btnHit.on('pointerout', () => {
        this.isPointerOverTooltip = false;
        this.scheduleTooltipDestroy();
        activeBtnBg.clear();
        activeBtnBg.fillStyle(COLORS.LOGO_BLUE, 1);
        activeBtnBg.fillRoundedRect(
          -btnWidth / 2,
          btnAbsY,
          btnWidth,
          btnHeight,
          btnCornerRadius
        );
      });
      btnHit.on('pointerdown', () => {
        if (!this.isTransitioning) {
          this.handleLessonSelect(lesson);
        }
      });
      this.hoverTooltip.add(btnHit);
    }

    // ── Entrance animation ──
    this.hoverTooltip.setScale(0.9);
    this.hoverTooltip.setAlpha(0);
    this.tweens.add({
      targets: this.hoverTooltip,
      scale: 1,
      alpha: 1,
      duration: 180,
      ease: 'Back.easeOut',
    });
  }

  /**
   * Truncate text to fit within a max number of lines.
   * Appends "..." if truncated.
   */
  private truncateTextToFit(
    text: string,
    maxWidth: number,
    fontSize: number,
    maxLines: number
  ): string {
    const charsPerLine = Math.floor(maxWidth / (fontSize * 0.55));
    const maxChars = charsPerLine * maxLines;
    if (text.length <= maxChars) return text;
    const truncated = text.substring(0, maxChars - 3).trimEnd();
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > maxChars * 0.5) {
      return truncated.substring(0, lastSpace) + '...';
    }
    return truncated + '...';
  }

  private destroyHoverTooltip(immediate: boolean = false): void {
    this.cancelTooltipDestroyTimer();

    if (this.hoverTooltip) {
      const tooltip = this.hoverTooltip;
      this.hoverTooltip = undefined;
      this.hoverTooltipLessonId = undefined;
      this.isPointerOverTooltip = false;

      if (immediate) {
        tooltip.destroy();
      } else {
        this.tweens.add({
          targets: tooltip,
          scale: 0.9,
          alpha: 0,
          duration: 120,
          ease: 'Power2',
          onComplete: () => {
            tooltip.destroy();
          },
        });
      }
    } else {
      this.hoverTooltipLessonId = undefined;
      this.isPointerOverTooltip = false;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // FREE ROAM LOCKED TOOLTIP
  // ═══════════════════════════════════════════════════════════

  private showFreeRoamLockedTooltip(buttonX: number, buttonY: number, circleRadius: number): void {
    // If already visible, dismiss it instead (toggle behavior)
    if (this.freeRoamLockedTooltip) {
      this.destroyFreeRoamLockedTooltip();
      return;
    }

    const { width } = this.scale;
    const minDim = Math.min(this.scale.width, this.scale.height);

    // Calculate how many lessons still need minigames completed
    const moduleLessonsData: Record<string, any> = this.registry.get('moduleLessonsData') || {};
    const moduleData = this.moduleBackendId ? moduleLessonsData[this.moduleBackendId] : null;
    let completedCount = 0;
    let totalCount = 0;
    if (moduleData?.lessons && moduleData.lessons.length > 0) {
      totalCount = moduleData.lessons.length;
      completedCount = moduleData.lessons.filter((l: any) => l.grow_your_nest_played === true).length;
    }

    const tooltipContainer = this.add.container(0, 0);
    tooltipContainer.setDepth(200);

    // Tooltip dimensions
    const padding = scale(22);
    const tooltipWidth = Math.min(width * 0.42, 380);
    const cornerRadius = scale(14);

    const titleFontSize = minDim * 0.024;
    const bodyFontSize = minDim * 0.018;
    const progressFontSize = minDim * 0.016;

    const maxTextWidth = tooltipWidth - padding * 2;

    // Title text
    const titleText = this.add.text(0, 0, 'Free Roam Locked', {
      fontSize: `${titleFontSize}px`,
      fontFamily: "'Onest', sans-serif",
      fontStyle: 'bold',
      color: COLORS.TEXT_PRIMARY,
      wordWrap: { width: maxTextWidth },
    }).setOrigin(0.5, 0);

    // Body text
    const bodyText = this.add.text(0, 0, 'Complete all lesson minigames\nto unlock Free Roam mode', {
      fontSize: `${bodyFontSize}px`,
      fontFamily: "'Onest', sans-serif",
      color: COLORS.TEXT_SECONDARY,
      align: 'center',
      lineSpacing: scale(3),
      wordWrap: { width: maxTextWidth },
    }).setOrigin(0.5, 0);

    // Progress text
    const progressText = this.add.text(0, 0, `${completedCount}/${totalCount} completed`, {
      fontSize: `${progressFontSize}px`,
      fontFamily: "'Onest', sans-serif",
      fontStyle: 'bold',
      color: '#3658EC',
      wordWrap: { width: maxTextWidth },
    }).setOrigin(0.5, 0);

    // Calculate total height
    const innerGap = scale(10);
    const totalContentHeight = titleText.height + innerGap + bodyText.height + innerGap + progressText.height;
    const tooltipHeight = totalContentHeight + padding * 2;

    // Position tooltip to the left of the button
    const viewportMargin = scale(8);
    const { height: viewportHeight } = this.scale;
    let tooltipX = buttonX - circleRadius - scale(12) - tooltipWidth / 2;
    let tooltipY = buttonY;

    // If tooltip would go off the left edge, position it below instead
    if (tooltipX - tooltipWidth / 2 < viewportMargin) {
      tooltipX = buttonX;
      tooltipY = buttonY + circleRadius + scale(12) + tooltipHeight / 2;
    }

    // Clamp vertically so the tooltip stays within the viewport
    const topEdge = tooltipY - tooltipHeight / 2;
    const bottomEdge = tooltipY + tooltipHeight / 2;
    if (topEdge < viewportMargin) {
      tooltipY = viewportMargin + tooltipHeight / 2;
    } else if (bottomEdge > viewportHeight - viewportMargin) {
      tooltipY = viewportHeight - viewportMargin - tooltipHeight / 2;
    }

    tooltipContainer.setPosition(tooltipX, tooltipY);

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.PURE_WHITE, 1);
    bg.fillRoundedRect(-tooltipWidth / 2, -tooltipHeight / 2, tooltipWidth, tooltipHeight, cornerRadius);
    bg.lineStyle(2, COLORS.UNAVAILABLE_BUTTON, 0.4);
    bg.strokeRoundedRect(-tooltipWidth / 2, -tooltipHeight / 2, tooltipWidth, tooltipHeight, cornerRadius);
    tooltipContainer.add(bg);

    // Position text elements inside tooltip
    let currentY = -tooltipHeight / 2 + padding;
    titleText.setPosition(0, currentY);
    tooltipContainer.add(titleText);

    currentY += titleText.height + innerGap;
    bodyText.setPosition(0, currentY);
    tooltipContainer.add(bodyText);

    currentY += bodyText.height + innerGap;
    progressText.setPosition(0, currentY);
    tooltipContainer.add(progressText);

    // Entrance animation
    tooltipContainer.setScale(0.9);
    tooltipContainer.setAlpha(0);
    this.tweens.add({
      targets: tooltipContainer,
      scale: 1,
      alpha: 1,
      duration: 180,
      ease: 'Back.easeOut',
    });

    this.freeRoamLockedTooltip = tooltipContainer;

    // Auto-dismiss after 3 seconds
    this.freeRoamTooltipDestroyTimer = this.time.delayedCall(3000, () => {
      this.destroyFreeRoamLockedTooltip();
    });
  }

  private destroyFreeRoamLockedTooltip(): void {
    if (this.freeRoamTooltipDestroyTimer) {
      this.freeRoamTooltipDestroyTimer.remove();
      this.freeRoamTooltipDestroyTimer = undefined;
    }

    if (this.freeRoamLockedTooltip) {
      const tooltip = this.freeRoamLockedTooltip;
      this.freeRoamLockedTooltip = undefined;

      this.tweens.add({
        targets: tooltip,
        scale: 0.9,
        alpha: 0,
        duration: 120,
        ease: 'Power2',
        onComplete: () => {
          tooltip.destroy();
        },
      });
    }
  }

  // ═══════════════════════════════════════════════════════════
  // EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════

  private handleBackToNeighborhood(): void {
    if (this.isTransitioning) return;
    const handleNeighborhoodSelect = this.registry.get(
      'handleNeighborhoodSelect'
    );
    if (handleNeighborhoodSelect) {
      this.isTransitioning = true;
      handleNeighborhoodSelect('downtown');
    }
  }

  private handleLessonSelect(lesson: Lesson): void {
    if (this.isTransitioning) return;
    const handleLessonSelect = this.registry.get('handleLessonSelect');
    if (handleLessonSelect) {
      this.isTransitioning = true;
      this.destroyHoverTooltip(true);
      handleLessonSelect(lesson.id, this.moduleBackendId || '');
    }
  }

  private slideOutHouseComponents(): Promise<void> {
    const { width } = this.scale;
    const duration = 800;
    const ease = 'Power2';

    // Immediately destroy any visible hover tooltips so they don't linger during transition
    this.destroyHoverTooltip(true);
    this.destroyFreeRoamLockedTooltip();

    const allComponents: Phaser.GameObjects.GameObject[] = [];
    if (this.backButton) allComponents.push(this.backButton);
    const birdSprite = this.bird?.getSprite();
    if (birdSprite) allComponents.push(birdSprite);
    if (this.lessonHouse) allComponents.push(this.lessonHouse);
    this.lessonContainers.forEach((container) => {
      if (container) allComponents.push(container);
    });
    if (this.minigameButton) allComponents.push(this.minigameButton);

    // Store original positions before sliding out
    this.originalComponentPositions.clear();
    allComponents.forEach((component) => {
      this.originalComponentPositions.set(component, (component as any).x);
    });

    const slideDistance = width * 1.5;

    return new Promise<void>((resolve) => {
      let completedCount = 0;
      const totalComponents = allComponents.length;

      if (totalComponents === 0) {
        resolve();
        return;
      }

      allComponents.forEach((component) => {
        this.tweens.add({
          targets: component,
          x: `-=${slideDistance}`,
          duration: duration,
          ease: ease,
          onComplete: () => {
            completedCount++;
            if (completedCount >= totalComponents) {
              resolve();
            }
          },
        });
      });
    });
  }

  private slideInHouseComponents(): void {
    const duration = 800;
    const ease = 'Power2';

    const allComponents: Phaser.GameObjects.GameObject[] = [];
    if (this.backButton) allComponents.push(this.backButton);
    const birdSprite = this.bird?.getSprite();
    if (birdSprite) allComponents.push(birdSprite);
    if (this.lessonHouse) allComponents.push(this.lessonHouse);
    this.lessonContainers.forEach((container) => {
      if (container) allComponents.push(container);
    });
    if (this.minigameButton) allComponents.push(this.minigameButton);

    // Tween each component back to its stored original position
    allComponents.forEach((component) => {
      const originalX = this.originalComponentPositions.get(component);
      if (originalX !== undefined) {
        this.tweens.add({
          targets: component,
          x: originalX,
          duration: duration,
          ease: ease,
        });
      }
    });

    // Clear stored positions after use
    this.originalComponentPositions.clear();
  }

  // ═══════════════════════════════════════════════════════════
  // BIRD CHARACTER METHODS
  // ═══════════════════════════════════════════════════════════

  private createBirdWithEntrance(): void {
    const { width, height } = this.scale;

    const birdTravelInfo: BirdTravelInfo | undefined =
      this.registry.get('birdTravelInfo');
    const returningFromLesson = this.registry.get('returningFromLesson');

    const finalX = width * 0.1;
    const finalY = height * 0.92;

    this.bird = new BirdCharacter(this);

    if (!birdTravelInfo || !birdTravelInfo.traveled || returningFromLesson) {
      this.bird.createStatic(finalX, finalY);
      this.bird.forceVisible();
      this.bird.startIdleAnimation();
      this.registry.set('returningFromLesson', false);
      return;
    }

    const comingFromLeft =
      birdTravelInfo.currentHouseIndex > birdTravelInfo.previousHouseIndex;

    this.bird.createWithFlyingEntrance(finalX, finalY, comingFromLeft, () => {
      this.bird!.startIdleAnimation();
    });

    this.registry.set('birdTravelInfo', undefined);
  }

  private destroyBird(): void {
    if (this.bird) {
      this.bird.destroy();
      this.bird = undefined;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // RESIZE HANDLING
  // ═══════════════════════════════════════════════════════════

  private setupEventListeners(): void {
    this.scale.on('resize', this.handleResizeDebounced, this);
    this.events.on('wake', this.reEnableButtons, this);
    this.events.on('resume', this.reEnableButtons, this);
  }

  private reEnableButtons(): void {
    console.log('🔄 Re-enabling buttons after resume');

    if (this.backButton && this.backButton.list.length > 0) {
      const interactiveZone =
        this.backButton.list[this.backButton.list.length - 1];
      if (interactiveZone && !interactiveZone.input) {
        interactiveZone.setInteractive({ useHandCursor: true });
      }
    }

    if (this.minigameButton && this.minigameButton.list.length > 0) {
      this.minigameButton.list.forEach((child) => {
        if (
          child instanceof Phaser.GameObjects.Arc ||
          child instanceof Phaser.GameObjects.Ellipse
        ) {
          if (!child.input) {
            child.setInteractive({ useHandCursor: true });
          }
        }
      });
    }
    
    this.isTransitioning = false;
    console.log(
      '✅ Buttons re-enabled, isTransitioning:',
      this.isTransitioning
    );
  }

  private checkForLessonsUpdate(): void {
    if (
      this.moduleBackendId &&
      (!this.module || this.module.lessons.length === 0)
    ) {
      const moduleLessonsData: Record<string, ModuleLessonsData> =
        this.registry.get('moduleLessonsData') || {};
      if (moduleLessonsData[this.moduleBackendId]) {
        this.module = moduleLessonsData[this.moduleBackendId];
        console.log('✅ Loaded delayed module data:', this.module);

        this.lessonContainers.forEach((container) => container.destroy());
        this.lessonContainers = [];

        this.createLessonCards();
      }
    }
  }

  private handleResizeDebounced(): void {
    if (this.resizeDebounceTimer) {
      this.resizeDebounceTimer.remove();
    }
    this.resizeDebounceTimer = this.time.delayedCall(100, () => {
      this.handleResize();
      this.resizeDebounceTimer = undefined;
    });
  }

  private handleResize(): void {
    this.handleCoinCounterResize();

    if (this.backButton) {
      this.backButton.destroy();
    }
    this.createBackButton();

    if (this.minigameButton) {
      this.minigameButton.destroy();
    }
    this.createMinigameButton();

    // Destroy tooltips on resize
    this.destroyHoverTooltip(true);
    this.destroyFreeRoamLockedTooltip();

    // Destroy and recreate lesson cards
    this.lessonContainers.forEach((container) => container.destroy());
    this.lessonContainers = []

    if (this.module && this.module.lessons.length > 0) {
      this.createLessonCards();
    }

    if (this.lessonHouse) {
      const { width, height } = this.scale;
      this.lessonHouse.setPosition(width / 2, height);
      const houseScale = Math.min(width, height) * 0.001375
      this.lessonHouse.setScale(houseScale);
    }
  }

  private cleanupResizeHandler(): void {
    this.scale.off('resize', this.handleResizeDebounced, this);
    this.events.off('wake', this.reEnableButtons, this);
    this.events.off('resume', this.reEnableButtons, this);
    if (this.resizeDebounceTimer) {
      this.resizeDebounceTimer.remove();
      this.resizeDebounceTimer = undefined;
    }
  }
}