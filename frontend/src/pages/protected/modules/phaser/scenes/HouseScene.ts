import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { scale, scaleFontSize } from '../../../../../utils/scaleHelper';
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
} from '../../../../../services/growYourNestAPI';
import type { GYNMinigameInitData } from '../../../../../types/growYourNest.types';

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
  private lessonContainers: Phaser.GameObjects.Container[] = [];
  private roomHitZones: Phaser.GameObjects.Rectangle[] = [];
  private minigameShutdownHandler?: () => void;
  private resizeDebounceTimer?: Phaser.Time.TimerEvent;
  private transitionManager!: SceneTransitionManager;

  // Stored original positions for slide-in restoration
  private originalComponentPositions: Map<Phaser.GameObjects.GameObject, number> = new Map();

  // Hover tooltip
  private hoverTooltip?: Phaser.GameObjects.Container;
  private hoverTooltipLessonId?: number;
  private tooltipDestroyTimer?: Phaser.Time.TimerEvent;
  private isPointerOverTooltip: boolean = false;

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
    this.lessonContainers = [];
    this.roomHitZones = [];
    this.hoverTooltip = undefined;
    this.hoverTooltipLessonId = undefined;
    this.tooltipDestroyTimer = undefined;
    this.isPointerOverTooltip = false;
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
  }

  shutdown() {
    super.shutdown();
    this.transitionManager.cleanup();

    if (this.minigameShutdownHandler) {
      const minigameScene = this.scene.get('GrowYourNestMinigame');
      if (minigameScene) {
        minigameScene.events.off('minigameCompleted', this.minigameShutdownHandler);
        this.minigameShutdownHandler = undefined;
      }
    }

    this.cleanupResizeHandler();
    this.cancelTooltipDestroyTimer();
    this.destroyBird();
    this.destroyHoverTooltip(true);
    this.lessonContainers = [];
    this.roomHitZones = [];
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
    this.lessonHouse = this.add.image(width / 2, height / 2, ASSET_KEYS.LESSON_HOUSE);
    this.lessonHouse.setDepth(1);

    const houseScale = Math.min(width, height) * 0.00121;
    this.lessonHouse.setScale(houseScale);
  }

  // ═══════════════════════════════════════════════════════════
  // UI CREATION METHODS
  // ═══════════════════════════════════════════════════════════

  private createUI(): void {
    this.createBackButton();
    this.createMinigameButton();

    if (this.module && this.module.lessons.length > 0) {
      this.createLessonCards();
      this.createRoomHitZones();
    } else {
      this.createLoadingPlaceholder();
    }
  }

  private createLoadingPlaceholder(): void {
    const { width, height } = this.scale;

    const loadingText = this.add
      .text(
        width / 2,
        height / 2,
        'Loading lessons...',
        createTextStyle('H2', COLORS.TEXT_SECONDARY, {
          fontSize: scaleFontSize(24),
        })
      )
      .setOrigin(0.5);
    loadingText.setDepth(10);
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

      // Fetch questions and current state in parallel
      const [questionsResponse, stateResponse] = await Promise.all([
        getFreeRoamQuestions(moduleBackendId),
        getFreeRoamState(moduleBackendId),
      ]);

      if (questionsResponse.questions.length === 0) {
        console.warn('🌳 No free roam questions available');
        this.isTransitioning = false;
        return;
      }

      // Check if tree is already completed
      if (stateResponse.completed) {
        console.log('🌳 Tree is already fully grown!');
        this.isTransitioning = false;
        // Optionally show a "tree completed" message instead of launching
        return;
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
    this.slideAndLaunchMinigame(initData);
  }

  /**
   * Shared slide-out → launch → slide-in logic for both free roam and lesson mode.
   */
  private slideAndLaunchMinigame(initData: GYNMinigameInitData): void {
    // Slide out house components to the left
    this.slideOutHouseComponents();

    // After slide-out completes, pause HouseScene and launch GYN
    this.time.delayedCall(300, () => {
      this.scene.pause('HouseScene');

      // Stop any existing GYN scene first
      if (
        this.scene.isActive('GrowYourNestMinigame') ||
        this.scene.isPaused('GrowYourNestMinigame')
      ) {
        this.scene.stop('GrowYourNestMinigame');
      }

      this.scene.launch('GrowYourNestMinigame', initData);

      // Setup completion listener to slide house components back in
      const minigameScene = this.scene.get('GrowYourNestMinigame');
      if (minigameScene) {
        this.minigameShutdownHandler = () => {
          this.slideInHouseComponents();
          this.isTransitioning = false;
        };
        minigameScene.events.once(
          'minigameCompleted',
          this.minigameShutdownHandler
        );
      }
    });
  }

  private createMinigameButton(): void {
    const { width, height } = this.scale;

    // Position: below and to the right of coin counter
    const buttonX = width - width * 0.08 + scale(20);
    const buttonY = height * 0.05 + scale(60);

    this.minigameButton = this.createCircularMinigameButton(buttonX, buttonY);
    this.minigameButton.setDepth(100);
  }

  private createCircularMinigameButton(
    x: number,
    y: number
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const circleRadius = scale(24);

    // Use tree growth data from the learning modules API (flat structure)
    // or fall back to dashboard modules (nested under .module)
    let progressPercent = 0;
    let treeGrowthPoints = 0;
    let treeTotalStages = 5;
    let treeCurrentStage = 0;
    let treeCompleted = false;
    const pointsPerStage = 50;

    // Try learning modules first (flat: module.tree_growth_points)
    const learningModules: any[] | undefined = this.registry.get('learningModules');
    const dashboardModules: any[] | undefined = this.registry.get('dashboardModules');

    if (learningModules && this.moduleBackendId) {
      const mod = learningModules.find((m: any) => m.id === this.moduleBackendId);
      if (mod) {
        treeGrowthPoints = mod.tree_growth_points ?? 0;
        treeTotalStages = mod.tree_total_stages ?? 5;
        treeCurrentStage = mod.tree_current_stage ?? 0;
        treeCompleted = mod.tree_completed ?? false;
      }
    } else if (dashboardModules && this.moduleBackendId) {
      // Dashboard modules are nested: { module: { id, tree_growth_points, ... }, ... }
      const dashEntry = dashboardModules.find(
        (entry: any) => entry.module?.id === this.moduleBackendId
      );
      if (dashEntry?.module) {
        treeGrowthPoints = dashEntry.module.tree_growth_points ?? 0;
        treeTotalStages = dashEntry.module.tree_total_stages ?? 5;
        treeCurrentStage = dashEntry.module.tree_current_stage ?? 0;
        treeCompleted = dashEntry.module.tree_completed ?? false;
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

    // Progress arc (green)
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

    // Tree stage for display (1-indexed)
    let treeStage = treeCurrentStage + 1;
    if (treeStage > 5) treeStage = 5;
    if (treeStage < 1) treeStage = 1;

    // Tree image
    const treeIcon = this.add.image(0, 0, `tree_stage_${treeStage}`);
    const targetSize = scale(42);
    const treeScale = targetSize / Math.max(treeIcon.width, treeIcon.height);
    treeIcon.setScale(treeScale);
    treeIcon.setOrigin(0.5);
    container.add(treeIcon);

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

    hitArea.on('pointerdown', () => {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    
    if (this.moduleBackendId) {
      // Derive display module number from house position (1-indexed)
      const houses = this.registry.get('neighborhoodHouses')?.['downtown'] || [];
      const houseIndex = houses.findIndex((h: any) => h.moduleBackendId === this.moduleBackendId);
        const moduleNumber = (houseIndex >= 0 ? houseIndex : 0) + 1;
        this.launchFreeRoam(this.moduleBackendId, moduleNumber);
      } else {
        this.isTransitioning = false;
      }
    });

    return container;
  }

  // ═══════════════════════════════════════════════════════════
  // LESSON CARDS (visual only — NO interactivity)
  // ═══════════════════════════════════════════════════════════

  private createLessonCards(): void {
    if (!this.module) return;
    this.module.lessons.forEach((lesson, index) => {
      this.createLessonCard(lesson, index);
    });
  }

  private createLessonCard(lesson: Lesson, index: number): void {
    const { width, height } = this.scale;

    const defaultPositions = [
      { x: 29, y: 32 },
      { x: 76.5, y: 31.5 },
      { x: 29, y: 70 },
      { x: 63, y: 70 },
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

    const cardWidth = width * 0.24;
    const cardHeight = height * 0.175;

    const lessonContainer = this.add.container(x, y);
    lessonContainer.setDepth(10);
    this.lessonContainers.push(lessonContainer);

    const cardOffsetY = -cardHeight * 0.1;

    const card = this.add.rectangle(
      0,
      cardOffsetY,
      cardWidth,
      cardHeight,
      COLORS.PURE_WHITE,
      0.7
    );
    const strokeWidth = Math.max(2, width * 0.002);
    card.setStrokeStyle(strokeWidth, COLORS.UNAVAILABLE_BUTTON);
    lessonContainer.add(card);

    const titleSize = Math.min(width, height) * 0.022;
    const titleOffsetY = -cardHeight * 0.3;
    const titleText = this.add
      .text(
        0,
        titleOffsetY,
        lesson.title,
        createTextStyle('BODY_BOLD', COLORS.TEXT_PRIMARY, {
          fontSize: `${titleSize}px`,
          align: 'center',
          wordWrap: { width: cardWidth * 0.9 },
        })
      )
      .setOrigin(0.5);
    lessonContainer.add(titleText);

    const typeSize = Math.min(width, height) * 0.016;
    const typeOffsetY = -cardHeight * 0.1;
    const typeText = this.add
      .text(
        0,
        typeOffsetY,
        lesson.type,
        createTextStyle('CAPTION', COLORS.TEXT_SECONDARY, {
          fontSize: `${typeSize}px`,
          align: 'center',
        })
      )
      .setOrigin(0.5);
    lessonContainer.add(typeText);

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

    // NOTE: No interactivity added to lesson cards — they are visual only
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
  // ROOM QUADRANT HIT ZONES (transparent hover areas)
  // ═══════════════════════════════════════════════════════════

  private createRoomHitZones(): void {
    if (!this.module || !this.lessonHouse) return;

    const { width, height } = this.scale;

    // Get the actual rendered bounds of the house image
    const houseScale = this.lessonHouse.scaleX;
    const houseDisplayW = this.lessonHouse.width * houseScale;
    const houseDisplayH = this.lessonHouse.height * houseScale;
    const houseLeft = (width - houseDisplayW) / 2;
    const houseTop = (height - houseDisplayH) / 2;

    const roomQuadrants = [
      { left: 0.2, top: 0.25, right: 0.45, bottom: 0.5 }, // Room 0: top-left
      { left: 0.55, top: 0.25, right: 0.825, bottom: 0.45 }, // Room 1: top-right
      { left: 0.2, top: 0.575, right: 0.45, bottom: 0.87 }, // Room 2: bottom-left
      { left: 0.55, top: 0.575, right: 0.825, bottom: 0.87 }, // Room 3: bottom-right
    ];

    this.module.lessons.forEach((lesson, index) => {
      if (index >= roomQuadrants.length) return;

      const quad = roomQuadrants[index];
      const zoneX =
        houseLeft + ((quad.left + quad.right) / 2) * houseDisplayW;
      const zoneY =
        houseTop + ((quad.top + quad.bottom) / 2) * houseDisplayH;
      const zoneW = (quad.right - quad.left) * houseDisplayW;
      const zoneH = (quad.bottom - quad.top) * houseDisplayH;

      // Transparent rectangle covering the room quadrant
      const hitZone = this.add.rectangle(
        zoneX,
        zoneY,
        zoneW,
        zoneH,
        COLORS.ELEGANT_BLUE,
        0.3
      );
      hitZone.setDepth(15); // Above lesson cards (10) so it receives hover
      hitZone.setInteractive({ useHandCursor: !lesson.locked });
      this.roomHitZones.push(hitZone);

      hitZone.on('pointerover', () => {
        this.cancelTooltipDestroyTimer();
        this.showHoverTooltip(lesson, zoneX, zoneY);
      });

      hitZone.on('pointerout', () => {
        this.scheduleTooltipDestroy();
      });
    });
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
    const closeBtnSize = minDim * 0.022;

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

    // ── Close (X) icon (clickable — destroys tooltip) ──
    const closeX = tooltipWidth / 2 - scale(16);
    const closeIconY = offsetY + scale(16);

    const closeBg = this.add.circle(
      closeX,
      closeIconY,
      closeBtnSize,
      COLORS.TEXT_BLUE_BLACK,
      1
    );
    this.hoverTooltip.add(closeBg);

    const closeText = this.add
      .text(
        closeX,
        closeIconY,
        '✕',
        createTextStyle('BADGE', COLORS.TEXT_PURE_WHITE, {
          fontSize: `${closeBtnSize}px`,
        })
      )
      .setOrigin(0.5);
    this.hoverTooltip.add(closeText);

    // Close button hit area
    const closeHit = this.add.circle(
      closeX,
      closeIconY,
      closeBtnSize + scale(4),
      0x000000,
      0
    );
    closeHit.setInteractive({ useHandCursor: true });
    closeHit.on('pointerover', () => {
      this.isPointerOverTooltip = true;
      this.cancelTooltipDestroyTimer();
    });
    closeHit.on('pointerout', () => {
      this.isPointerOverTooltip = false;
      this.scheduleTooltipDestroy();
    });
    closeHit.on('pointerdown', () => {
      this.isPointerOverTooltip = false;
      this.destroyHoverTooltip();
    });
    this.hoverTooltip.add(closeHit);

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

  private slideOutHouseComponents(): void {
    const { width } = this.scale;
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
    this.roomHitZones.forEach((zone) => {
      if (zone) allComponents.push(zone);
    });
    if (this.minigameButton) allComponents.push(this.minigameButton);

    // Store original positions before sliding out
    this.originalComponentPositions.clear();
    allComponents.forEach((component) => {
      this.originalComponentPositions.set(component, (component as any).x);
    });

    const slideDistance = width * 1.5;
    allComponents.forEach((component) => {
      this.tweens.add({
        targets: component,
        x: `-=${slideDistance}`,
        duration: duration,
        ease: ease,
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
    this.roomHitZones.forEach((zone) => {
      if (zone) allComponents.push(zone);
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

    // Re-enable room hit zones
    this.roomHitZones.forEach((zone, index) => {
      if (zone && !zone.input) {
        const lesson = this.module?.lessons[index];
        zone.setInteractive({
          useHandCursor: lesson ? !lesson.locked : false,
        });
      }
    });

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
        this.roomHitZones.forEach((zone) => zone.destroy());
        this.roomHitZones = [];

        this.createLessonCards();
        this.createRoomHitZones();
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

    // Destroy tooltip on resize
    this.destroyHoverTooltip(true);

    // Destroy and recreate lesson cards
    this.lessonContainers.forEach((container) => container.destroy());
    this.lessonContainers = [];

    // Destroy and recreate room hit zones
    this.roomHitZones.forEach((zone) => zone.destroy());
    this.roomHitZones = [];

    if (this.module && this.module.lessons.length > 0) {
      this.createLessonCards();
      this.createRoomHitZones();
    }

    if (this.lessonHouse) {
      const { width, height } = this.scale;
      this.lessonHouse.setPosition(width / 2, height / 2);
      const houseScale = Math.min(width, height) * 0.00121;
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