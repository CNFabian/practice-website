import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { scaleFontSize } from '../../../../../utils/scaleHelper';
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

    // Layer 1 (depth 0): Gradient background
    const gradient = this.add.graphics();
    gradient.fillGradientStyle(0xEEF1FF, 0xEEF1FF, 0xFAFBFF, 0xFAFBFF, 1);
    gradient.fillRect(0, 0, width, height);
    gradient.setDepth(0);

    // Layer 2 (depth 1): Scene background image with transparent background
    const sceneBackground = this.add.image(width / 2, height / 2, ASSET_KEYS.SUBURBAN_BACKGROUND);
    sceneBackground.setDepth(1);
    const bgScale = Math.max(width / sceneBackground.width, height / sceneBackground.height);
    sceneBackground.setScale(bgScale);

    // Layer 3 (depth 2): Lesson house image with transparent background
    this.lessonHouse = this.add.image(width / 2, height / 2, ASSET_KEYS.LESSON_HOUSE);
    this.lessonHouse.setDepth(2);
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
    
    // BEFORE (Arial):
    // const loadingText = this.add.text(
    //   width / 2,
    //   height / 2,
    //   'Loading lessons...',
    //   {
    //     fontSize: scaleFontSize(24),
    //     fontFamily: 'Arial, sans-serif',
    //     color: COLORS.TEXT_SECONDARY,
    //   }
    // ).setOrigin(0.5);
    
    // AFTER (Onest):
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
    const { width, height } = this.scale;
    
    const buttonX = width * 0.08;
    const buttonY = height * 0.05;
    const buttonWidth = width * 0.1;
    const buttonHeight = height * 0.05;
    
    this.backButton = ButtonBuilder.createIconButton({
      scene: this,
      x: buttonX,
      y: buttonY,
      width: buttonWidth,
      height: buttonHeight,
      text: 'Back',
      icon: '←',
      iconSize: Math.min(width, height) * 0.025,
      fontSize: Math.min(width, height) * 0.016,
      backgroundColor: COLORS.GRAY_700,
      hoverColor: COLORS.GRAY_800,
      onClick: () => this.handleBackToNeighborhood(),
    });
    this.backButton.setDepth(10);
  }

  private createMinigameButton(): void {
    const { width, height } = this.scale;

    const buttonWidth = width * 0.12;
    const buttonHeight = height * 0.05;
    const buttonX = width - (width * 0.08);
    const buttonY = height - (height * 0.05);
    
    this.minigameButton = ButtonBuilder.createButton({
      scene: this,
      x: buttonX,
      y: buttonY,
      width: buttonWidth,
      height: buttonHeight,
      text: 'Minigame',
      fontSize: Math.min(width, height) * 0.016,
      backgroundColor: COLORS.BLUE_500,
      hoverColor: COLORS.BLUE_600,
      onClick: () => this.handleMinigameSelect(),
    });
    this.minigameButton.setDepth(10);
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
      { x: 26, y: 31 },
      { x: 77, y: 31 },
      { x: 31, y: 74 },
      { x: 63, y: 72 },
    ];

    const defaultPos = defaultPositions[index] || { x: 50, y: 50 };

    const x = lesson.x !== undefined ? (lesson.x / 100) * width : (defaultPos.x / 100) * width;
    const y = lesson.y !== undefined ? (lesson.y / 100) * height : (defaultPos.y / 100) * height;

    const cardWidth = width * 0.1875;
    const cardHeight = height * 0.1875;

    const lessonContainer = this.add.container(x, y);
    lessonContainer.setDepth(10);
    this.lessonContainers.push(lessonContainer);

    const cardOffsetY = -cardHeight * 0.1;
    const card = this.add.rectangle(0, cardOffsetY, cardWidth, cardHeight, COLORS.WHITE, 0.7);
    const strokeWidth = Math.max(2, width * 0.002);
    card.setStrokeStyle(strokeWidth, COLORS.GRAY_200);
    lessonContainer.add(card);

    const titleSize = Math.min(width, height) * 0.022;
    const titleOffsetY = -cardHeight * 0.3;
    
    // BEFORE (Arial):
    // const titleText = this.add.text(0, titleOffsetY, lesson.title, {
    //   fontSize: `${titleSize}px`,
    //   fontFamily: 'Arial, sans-serif',
    //   color: COLORS.TEXT_PRIMARY,
    //   fontStyle: 'bold',
    //   align: 'center',
    //   wordWrap: { width: cardWidth * 0.9 },
    // }).setOrigin(0.5);
    
    // AFTER (Onest):
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
    
    // BEFORE (Arial):
    // const typeText = this.add.text(0, typeOffsetY, lesson.type, {
    //   fontSize: `${typeSize}px`,
    //   fontFamily: 'Arial, sans-serif',
    //   color: COLORS.TEXT_SECONDARY,
    //   align: 'center',
    // }).setOrigin(0.5);
    
    // AFTER (Onest):
    const typeText = this.add.text(0, typeOffsetY, lesson.type,
      createTextStyle('CAPTION', COLORS.TEXT_SECONDARY, {
        fontSize: `${typeSize}px`,
        align: 'center',
      })
    ).setOrigin(0.5);
    lessonContainer.add(typeText);

    if (lesson.locked) {
      const lockOverlay = this.add.rectangle(0, cardOffsetY, cardWidth, cardHeight, COLORS.GRAY_200, 0.5);
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
      const completedBg = this.add.circle(badgeX, badgeY, badgeSize, COLORS.GREEN_500);
      container.add(completedBg);
      
      const checkmark = this.add.text(badgeX, badgeY, '✓',
        createTextStyle('BADGE', COLORS.TEXT_WHITE, {
          fontSize: `${badgeSize * 1.2}px`
        })
      ).setOrigin(0.5);
      container.add(checkmark);
    } else if (lesson.locked) {
      // Locked badge (red circle with lock)
      const lockedBg = this.add.circle(badgeX, badgeY, badgeSize, COLORS.GRAY_400);
      container.add(lockedBg);
      
      const lockIcon = this.add.text(badgeX, badgeY, '🔒',
        createTextStyle('BADGE', COLORS.TEXT_WHITE, {
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

    this.minigameShutdownHandler = () => {
      this.isTransitioning = false;
    };

    const minigameScene = this.scene.get('GrowYourNestMinigame');
    if (minigameScene) {
      minigameScene.events.on('minigameCompleted', this.minigameShutdownHandler);
    }
    
    this.scene.pause('HouseScene');
    this.scene.launch('GrowYourNestMinigame');
  }

  // ═══════════════════════════════════════════════════════════
  // BIRD CHARACTER METHODS
  // ═══════════════════════════════════════════════════════════
  private createBirdWithEntrance(): void {
    const { width, height } = this.scale;
    const birdTravelInfo: BirdTravelInfo | undefined = this.registry.get('birdTravelInfo');
    const returningFromLesson = this.registry.get('returningFromLesson');

    const finalX = width * 0.2;
    const finalY = height * 0.65;

    this.bird = new BirdCharacter(this);

    if (!birdTravelInfo || !birdTravelInfo.traveled || returningFromLesson) {
      // Static entrance - no travel animation needed
      this.bird.createStatic(finalX, finalY);
      this.bird.startIdleAnimation();
      this.registry.set('returningFromLesson', false);
      return;
    }

    // Determine travel type and direction based on distance
    const distance = Math.abs(birdTravelInfo.currentHouseIndex - birdTravelInfo.previousHouseIndex);
    const comingFromLeft = birdTravelInfo.currentHouseIndex > birdTravelInfo.previousHouseIndex;

    if (distance > 1) {
      // Long distance - use flying entrance
      this.bird.createWithFlyingEntrance(finalX, finalY, comingFromLeft, () => {
        this.bird!.startIdleAnimation();
      });
    } else {
      // Short distance - use hopping entrance
      this.bird.createWithHoppingEntrance(finalX, finalY, comingFromLeft, () => {
        this.bird!.startIdleAnimation();
      });
    }

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
    if (this.backButton) {
      const buttonBg = this.backButton.list[0] as Phaser.GameObjects.Rectangle;
      if (buttonBg) {
        buttonBg.setInteractive({ useHandCursor: true });
      }
    }
    
    if (this.minigameButton) {
      const buttonBg = this.minigameButton.list[0] as Phaser.GameObjects.Rectangle;
      if (buttonBg) {
        buttonBg.setInteractive({ useHandCursor: true });
      }
    }
    
    // Re-enable lesson card buttons
    this.lessonContainers.forEach(container => {
      const card = container.getAt(0) as Phaser.GameObjects.Rectangle;
      if (card) {
        card.setInteractive({ useHandCursor: true });
      }
    });
    
    // Reset transition flag
    this.isTransitioning = false;
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

    // Recreate lesson cards
    this.lessonContainers.forEach(container => container.destroy());
    this.lessonContainers = [];
    
    if (this.module && this.module.lessons.length > 0) {
      this.createLessonCards();
    }

    // Reposition buttons
    if (this.backButton) {
      const { width, height } = this.scale;
      this.backButton.setPosition(width * 0.08, height * 0.05);
    }

    if (this.minigameButton) {
      const { width, height } = this.scale;
      this.minigameButton.setPosition(width - (width * 0.08), height - (height * 0.05));
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