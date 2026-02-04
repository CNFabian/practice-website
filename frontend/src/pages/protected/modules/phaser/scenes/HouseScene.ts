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

interface Lesson {
  id: number;
  title: string;
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
  private minigameShutdownHandler?: () => void;
  private resizeDebounceTimer?: Phaser.Time.TimerEvent;
  private transitionManager!: SceneTransitionManager;
  
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
    this.moduleBackendId = data.moduleBackendId;
    
    const moduleLessonsData: Record<string, ModuleLessonsData> = this.registry.get('moduleLessonsData') || {};
    
    console.log('🏠 HouseScene init - moduleBackendId:', this.moduleBackendId);
    
    if (this.moduleBackendId && moduleLessonsData[this.moduleBackendId]) {
      this.module = moduleLessonsData[this.moduleBackendId];
      console.log('✅ Loaded module from backend:', this.module);
    } else {
      console.warn('⚠️ No module data found for backend ID:', this.moduleBackendId);
      this.module = {
        id: data.moduleId || 0,
        title: 'Loading...',
        lessons: []
      };
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
    this.setupEventListeners()
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
    this.destroyBird();
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
    } else {
      this.createLoadingPlaceholder();
    }
  }

  private createLoadingPlaceholder(): void {
    const { width, height } = this.scale;
    
    const loadingText = this.add.text(
      width / 2,
      height / 2,
      'Loading lessons...',
      createTextStyle('H2', COLORS.TEXT_SECONDARY, { 
        fontSize: scaleFontSize(24)
      })
    ).setOrigin(0.5);
    loadingText.setDepth(10);
  }

  private createBackButton(): void {
    this.backButton = ButtonBuilder.createBackButton(
      this,
      () => this.handleBackToNeighborhood()
    );
    this.backButton.setDepth(10);
  }

  private createMinigameButton(): void {
    const { width, height } = this.scale;

    // Position: below and to the right of coin counter
    // Coin counter is at: width - (width * 0.08), height * 0.05
    const buttonX = width - (width * 0.08) + scale(20); // 20px to the right of coin counter
    const buttonY = height * 0.05 + scale(60); // 60px below coin counter
    
    this.minigameButton = this.createCircularMinigameButton(buttonX, buttonY);
    this.minigameButton.setDepth(100); // Same depth as coin counter
  }

  private createCircularMinigameButton(x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    
    const circleRadius = scale(24); // Slightly larger than HouseProgressCard's scale(16)
    
    // Calculate progress based on completed lessons
    const completedLessons = this.module?.lessons.filter(l => l.completed).length || 0;
    const totalLessons = this.module?.lessons.length || 0;
    let progressPercent = 0;
    
    if (totalLessons > 0 && completedLessons > 0) {
      progressPercent = (completedLessons / totalLessons) * 100;
    }
    
    // Background circle (light gray)
    const bgCircle = this.add.graphics();
    bgCircle.lineStyle(scale(4), COLORS.UNAVAILABLE_BUTTON, 1);
    bgCircle.strokeCircle(0, 0, circleRadius);
    container.add(bgCircle);
    
    // Progress arc (green) - drawn clockwise from top
    if (progressPercent > 0) {
      const progressArc = this.add.graphics();
      progressArc.lineStyle(scale(4), COLORS.STATUS_GREEN, 1);
      
      const startAngle = Phaser.Math.DegToRad(270); // Start from top
      const endAngle = Phaser.Math.DegToRad(270 + (360 * progressPercent / 100));
      
      progressArc.beginPath();
      progressArc.arc(0, 0, circleRadius, startAngle, endAngle, false);
      progressArc.strokePath();
      container.add(progressArc);
    }
    
    // Determine tree stage (1-7) based on progress
    let treeStage: number;
    if (progressPercent === 0) {
      treeStage = 1;
    } else if (progressPercent === 100) {
      treeStage = 7;
    } else {
      treeStage = Math.floor((progressPercent / 100) * 5) + 2;
      treeStage = Math.min(treeStage, 6);
    }
    
    // Tree image
    const treeIcon = this.add.image(0, 0, `tree_stage_${treeStage}`);
    const targetSize = scale(42); // Fit tree inside circle
    const treeScale = targetSize / Math.max(treeIcon.width, treeIcon.height);
    treeIcon.setScale(treeScale);
    treeIcon.setOrigin(0.5);
    container.add(treeIcon);
    
    // Invisible hit area for interaction (slightly larger than visible circle)
    const hitArea = this.add.circle(0, 0, circleRadius + scale(5), 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    container.add(hitArea);
    
    // Hover effects
    hitArea.on('pointerover', () => {
      this.tweens.add({
        targets: container,
        scale: 1.1,
        duration: 200,
        ease: 'Power2'
      });
    });
    
    hitArea.on('pointerout', () => {
      this.tweens.add({
        targets: container,
        scale: 1,
        duration: 200,
        ease: 'Power2'
      });
    });
    
    hitArea.on('pointerdown', () => {
      this.handleMinigameSelect();
    });
    
    return container;
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
      { x: 29, y: 32 },
      { x: 76.5, y: 31.5 },
      { x: 29, y: 70 },
      { x: 63, y: 70 },
    ];

    const defaultPos = defaultPositions[index] || { x: 50, y: 50 };

    const x = lesson.x !== undefined ? (lesson.x / 100) * width : (defaultPos.x / 100) * width;
    const y = lesson.y !== undefined ? (lesson.y / 100) * height : (defaultPos.y / 100) * height;

    const cardWidth = width * 0.24;
    const cardHeight = height * 0.175;

    const lessonContainer = this.add.container(x, y);
    lessonContainer.setDepth(10);
    this.lessonContainers.push(lessonContainer);

    const cardOffsetY = -cardHeight * 0.1;
    const card = this.add.rectangle(0, cardOffsetY, cardWidth, cardHeight, COLORS.PURE_WHITE, 0.7);
    const strokeWidth = Math.max(2, width * 0.002);
    card.setStrokeStyle(strokeWidth, COLORS.UNAVAILABLE_BUTTON);
    lessonContainer.add(card);

    const titleSize = Math.min(width, height) * 0.022;
    const titleOffsetY = -cardHeight * 0.3;
    
    const titleText = this.add.text(0, titleOffsetY, lesson.title,
      createTextStyle('BODY_BOLD', COLORS.TEXT_PRIMARY, {
        fontSize: `${titleSize}px`,
        align: 'center',
        wordWrap: { width: cardWidth * 0.9 },
      })
    ).setOrigin(0.5);
    lessonContainer.add(titleText);

    const typeSize = Math.min(width, height) * 0.016;
    const typeOffsetY = -cardHeight * 0.1;
    
    const typeText = this.add.text(0, typeOffsetY, lesson.type,
      createTextStyle('CAPTION', COLORS.TEXT_SECONDARY, {
        fontSize: `${typeSize}px`,
        align: 'center',
      })
    ).setOrigin(0.5);
    lessonContainer.add(typeText);

    if (lesson.locked) {
      const lockOverlay = this.add.rectangle(0, cardOffsetY, cardWidth, cardHeight, COLORS.UNAVAILABLE_BUTTON, 0.5);
      lessonContainer.add(lockOverlay);
    }

    this.createStatusBadge(lessonContainer, lesson, cardWidth, cardHeight);
    this.makeCardInteractive(lessonContainer, card, lesson);
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
      // Completed badge (green circle with checkmark)
      const completedBg = this.add.circle(badgeX, badgeY, badgeSize, COLORS.STATUS_GREEN);
      container.add(completedBg);
      
      const checkmark = this.add.text(badgeX, badgeY, '✓',
        createTextStyle('BADGE', COLORS.TEXT_WHITE_HEX, {
          fontSize: `${badgeSize * 1.2}px`
        })
      ).setOrigin(0.5);
      container.add(checkmark);
    } else if (lesson.locked) {
      // Locked badge (gray circle with lock)
      const lockedBg = this.add.circle(badgeX, badgeY, badgeSize, COLORS.UNAVAILABLE_BUTTON);
      container.add(lockedBg);
      
      const lockIcon = this.add.text(badgeX, badgeY, '🔒',
        createTextStyle('BADGE', COLORS.TEXT_WHITE_HEX, {
          fontSize: `${badgeSize}px`
        })
      ).setOrigin(0.5);
      container.add(lockIcon);
    }
  }

  private makeCardInteractive(
    container: Phaser.GameObjects.Container,
    card: Phaser.GameObjects.Rectangle,
    lesson: Lesson
  ): void {
    if (lesson.locked) return;

    card.setInteractive({ useHandCursor: true });
    
    card.on('pointerover', () => {
      this.tweens.add({
        targets: container,
        scale: 1.05,
        duration: 200,
        ease: 'Power2',
      });
    });

    card.on('pointerout', () => {
      this.tweens.add({
        targets: container,
        scale: 1,
        duration: 200,
        ease: 'Power2',
      });
    });

    card.on('pointerdown', () => {
      if (!this.isTransitioning) {
        this.handleLessonSelect(lesson);
      }
    });
  }

  // ═══════════════════════════════════════════════════════════
  // EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════
  private handleBackToNeighborhood(): void {
    if (this.isTransitioning) return;

    const handleNeighborhoodSelect = this.registry.get('handleNeighborhoodSelect');
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
      handleLessonSelect(lesson.id, this.moduleBackendId || '');
    }
  }

  private handleMinigameSelect(): void {
    if (this.isTransitioning) return;

    this.isTransitioning = true;
    
    // Launch minigame FIRST (before sliding out)
    this.scene.launch('GrowYourNestMinigame');
    
    // Start sliding out HouseScene components immediately
    this.slideOutHouseComponents();
    
    // Pause this scene AFTER animations complete (not during)
    this.time.delayedCall(850, () => {
      this.scene.pause('HouseScene');
      
      const minigameScene = this.scene.get('GrowYourNestMinigame');
      if (minigameScene) {
        this.minigameShutdownHandler = () => {
          // Slide components back in when returning
          this.slideInHouseComponents();
          this.isTransitioning = false;
        };
        minigameScene.events.once('minigameCompleted', this.minigameShutdownHandler);
      }
    });
  }

  private slideOutHouseComponents(): void {
    const { width } = this.scale;
    const duration = 800;
    const ease = 'Power2';
    
    const allComponents: Phaser.GameObjects.GameObject[] = [];
    
    // Collect all components to slide
    if (this.backButton) allComponents.push(this.backButton);
    
    const birdSprite = this.bird?.getSprite();
    if (birdSprite) allComponents.push(birdSprite);
    
    if (this.lessonHouse) allComponents.push(this.lessonHouse);
    
    this.lessonContainers.forEach(container => {
      if (container) allComponents.push(container);
    });
    
    if (this.minigameButton) allComponents.push(this.minigameButton);
    
    // Move components FAR off-screen to the left
    // Use 1.5x width to ensure everything is completely hidden
    const slideDistance = width * 1.5;
    
    // Animate all to the left (negative x direction)
    allComponents.forEach(component => {
      this.tweens.add({
        targets: component,
        x: `-=${slideDistance}`,
        duration: duration,
        ease: ease
      });
    });
  }

  private slideInHouseComponents(): void {
    const { width } = this.scale;
    const duration = 800;
    const ease = 'Power2';
    
    const allComponents: Phaser.GameObjects.GameObject[] = [];
    
    // Collect all components to slide
    if (this.backButton) allComponents.push(this.backButton);
    
    const birdSprite = this.bird?.getSprite();
    if (birdSprite) allComponents.push(birdSprite);
    
    if (this.lessonHouse) allComponents.push(this.lessonHouse);
    
    this.lessonContainers.forEach(container => {
      if (container) allComponents.push(container);
    });
    
    if (this.minigameButton) allComponents.push(this.minigameButton);
    
    // Move components back from far left
    // Use same 1.5x width to match slideOut
    const slideDistance = width * 1.5;
    
    // Animate all back to their original position
    allComponents.forEach(component => {
      this.tweens.add({
        targets: component,
        x: `+=${slideDistance}`,
        duration: duration,
        ease: ease
      });
    });
  }

  // ═══════════════════════════════════════════════════════════
  // BIRD CHARACTER METHODS
  // ═══════════════════════════════════════════════════════════
  private createBirdWithEntrance(): void {
    const { width, height } = this.scale;
    const birdTravelInfo: BirdTravelInfo | undefined = this.registry.get('birdTravelInfo');
    const returningFromLesson = this.registry.get('returningFromLesson');

    const finalX = width * 0.1;
    const finalY = height * 0.92;

    this.bird = new BirdCharacter(this);

    if (!birdTravelInfo || !birdTravelInfo.traveled || returningFromLesson) {
      // Static entrance - no travel animation needed
      this.bird.createStatic(finalX, finalY);
      this.bird.forceVisible();
      this.bird.startIdleAnimation();
      this.registry.set('returningFromLesson', false);
      return;
    }

    // Determine direction based on house indices
    const comingFromLeft = birdTravelInfo.currentHouseIndex > birdTravelInfo.previousHouseIndex;

    // Always use flying entrance (removed hopping logic)
    this.bird.createWithFlyingEntrance(finalX, finalY, comingFromLeft, () => {
      this.bird!.startIdleAnimation();
    });

    // Clear travel info after use
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
    // Re-enable button interactivity after resume from pause
    console.log('🔄 Re-enabling buttons after resume');
    
    // For back button (created by ButtonBuilder.createBackButton)
    // The interactive zone is the last child in the container
    if (this.backButton && this.backButton.list.length > 0) {
      const interactiveZone = this.backButton.list[this.backButton.list.length - 1];
      if (interactiveZone && !interactiveZone.input) {
        interactiveZone.setInteractive({ useHandCursor: true });
      }
    }
    
    // For minigame button (circular button)
    // The hit area (circle) is in the container - find it
    if (this.minigameButton && this.minigameButton.list.length > 0) {
      this.minigameButton.list.forEach(child => {
        if (child instanceof Phaser.GameObjects.Arc || child instanceof Phaser.GameObjects.Ellipse) {
          if (!child.input) {
            child.setInteractive({ useHandCursor: true });
          }
        }
      });
    }
    
    // For lesson card buttons
    // The interactive rectangle is at getAt(0)
    this.lessonContainers.forEach(container => {
      if (container && container.list.length > 0) {
        const card = container.getAt(0) as Phaser.GameObjects.Rectangle;
        if (card && !card.input) {
          card.setInteractive({ useHandCursor: true });
        }
      }
    });
    
    // Reset transition flag
    this.isTransitioning = false;
    
    console.log('✅ Buttons re-enabled, isTransitioning:', this.isTransitioning);
  }

  private checkForLessonsUpdate(): void {
    // Check if lessons were loaded after init
    if (this.moduleBackendId && (!this.module || this.module.lessons.length === 0)) {
      const moduleLessonsData: Record<string, ModuleLessonsData> = this.registry.get('moduleLessonsData') || {};
      
      if (moduleLessonsData[this.moduleBackendId]) {
        this.module = moduleLessonsData[this.moduleBackendId];
        console.log('✅ Loaded delayed module data:', this.module);
        
        // Recreate UI with new lesson data
        this.lessonContainers.forEach(container => container.destroy());
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
    // Handle coin counter resize (inherited from BaseScene)
    this.handleCoinCounterResize();

    // Destroy and recreate back button (like NeighborhoodScene does)
    if (this.backButton) {
      this.backButton.destroy();
    }
    this.createBackButton();

    // Destroy and recreate minigame button
    if (this.minigameButton) {
      this.minigameButton.destroy();
    }
    this.createMinigameButton();

    // Recreate lesson cards
    this.lessonContainers.forEach(container => container.destroy());
    this.lessonContainers = [];
    
    if (this.module && this.module.lessons.length > 0) {
      this.createLessonCards();
    }

    // Reposition environment
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