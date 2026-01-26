import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { scaleFontSize } from '../../../../../utils/scaleHelper';
import { SCENE_KEYS } from '../constants/SceneKeys';
import { ASSET_KEYS } from '../constants/AssetKeys';
import { COLORS } from '../constants/Colors';
import { ButtonBuilder } from '../ui/ButtonBuilder';
import { BirdCharacter } from '../characters/BirdCharacter';

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
    this.createEnvironment();
    this.createUI();
    this.createBirdWithEntrance();
    this.setupEventListeners();
  }

  shutdown() {
    super.shutdown();
    
    if (this.minigameShutdownHandler) {
      const minigameScene = this.scene.get('GrowYourNestMinigame');
      if (minigameScene) {
        minigameScene.events.off('shutdown', this.minigameShutdownHandler);
      }
      this.minigameShutdownHandler = undefined;
    }
    
    if (this.backButton) {
      const buttonBg = this.backButton.list[0] as Phaser.GameObjects.Rectangle;
      if (buttonBg && buttonBg.input) {
        buttonBg.removeAllListeners();
        buttonBg.disableInteractive();
      }
    }
    
    if (this.minigameButton) {
      const buttonBg = this.minigameButton.list[0] as Phaser.GameObjects.Rectangle;
      if (buttonBg && buttonBg.input) {
        buttonBg.removeAllListeners();
        buttonBg.disableInteractive();
      }
    }
    
    this.lessonContainers.forEach(container => {
      const cardBackground = container.list[0] as Phaser.GameObjects.Rectangle;
      if (cardBackground && cardBackground.input) {
        cardBackground.removeAllListeners();
        cardBackground.disableInteractive();
      }
    });
    
    this.tweens.killAll();
    this.cleanupEventListeners();
    this.cleanupBird();
    this.lessonContainers = [];
  }

  // ═══════════════════════════════════════════════════════════
  // SETUP METHODS
  // ═══════════════════════════════════════════════════════════
  private setupEventListeners(): void {
    this.scale.on('resize', this.handleResize, this);
  }

  private cleanupEventListeners(): void {
    this.scale.off('resize', this.handleResize, this);
    
    if (this.resizeDebounceTimer) {
      this.resizeDebounceTimer.remove();
      this.resizeDebounceTimer = undefined;
    }
  }

  private cleanupBird(): void {
    if (this.bird) {
      this.bird.destroy();
      this.bird = undefined;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // ENVIRONMENT CREATION METHODS
  // ═══════════════════════════════════════════════════════════
  private createEnvironment(): void {
    const { width, height } = this.scale;

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
      {
        fontSize: scaleFontSize(24),
        fontFamily: 'Arial, sans-serif',
        color: COLORS.TEXT_SECONDARY,
      }
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
    const titleText = this.add.text(0, titleOffsetY, lesson.title, {
      fontSize: `${titleSize}px`,
      fontFamily: 'Arial, sans-serif',
      color: COLORS.TEXT_PRIMARY,
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: cardWidth * 0.9 },
    }).setOrigin(0.5);
    lessonContainer.add(titleText);

    const typeSize = Math.min(width, height) * 0.016;
    const typeOffsetY = -cardHeight * 0.1;
    const typeText = this.add.text(0, typeOffsetY, lesson.type, {
      fontSize: `${typeSize}px`,
      fontFamily: 'Arial, sans-serif',
      color: COLORS.TEXT_SECONDARY,
      align: 'center',
    }).setOrigin(0.5);
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
    
    const badgeY = cardHeight * 0.3;
    const badgeWidth = cardWidth * 0.6;
    const badgeHeight = cardHeight * 0.25;
    const fontSize = Math.min(width, height) * 0.016;
    const borderRadius = badgeHeight * 0.3;

    let backgroundColor: number;
    let text: string;

    if (lesson.locked) {
      backgroundColor = COLORS.GRAY_400;
      text = 'Locked';
    } else if (lesson.completed) {
      backgroundColor = COLORS.GREEN_500;
      text = 'Review';
    } else {
      backgroundColor = COLORS.BLUE_500;
      text = 'Start';
    }

    const badgeGraphics = this.add.graphics();
    badgeGraphics.fillStyle(backgroundColor, 1);
    badgeGraphics.fillRoundedRect(
      -badgeWidth / 2, 
      badgeY - badgeHeight / 2, 
      badgeWidth, 
      badgeHeight, 
      borderRadius
    );
    container.add(badgeGraphics);

    const badgeText = this.add.text(0, badgeY, text, {
      fontSize: `${fontSize}px`,
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add(badgeText);
  }

  private makeCardInteractive(
    container: Phaser.GameObjects.Container,
    cardBackground: Phaser.GameObjects.Rectangle,
    lesson: Lesson
  ): void {
    cardBackground.setInteractive({ useHandCursor: !lesson.locked });

    const originalScaleX = container.scaleX;
    const originalScaleY = container.scaleY;

    if (!lesson.locked) {
      const handlePointerOver = () => {
        this.tweens.add({
          targets: container,
          scaleX: originalScaleX * 1.05,
          scaleY: originalScaleY * 1.05,
          duration: 200,
          ease: 'Power2',
        });
      };

      const handlePointerOut = () => {
        this.tweens.add({
          targets: container,
          scaleX: originalScaleX,
          scaleY: originalScaleY,
          duration: 200,
          ease: 'Power2',
        });
      };

      const handlePointerDown = () => {
        this.handleLessonClick(lesson.id);
      };

      cardBackground.on('pointerover', handlePointerOver);
      cardBackground.on('pointerout', handlePointerOut);
      cardBackground.on('pointerdown', handlePointerDown);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // BIRD CHARACTER METHODS
  // ═══════════════════════════════════════════════════════════
  private createBirdWithEntrance(): void {
    const { width, height } = this.scale;

    const travelInfo: BirdTravelInfo | undefined = this.registry.get('birdTravelInfo');
    const returningFromLesson = this.registry.get('returningFromLesson');

    const finalX = width / 2;
    const finalY = height * 0.85;

    this.bird = new BirdCharacter(this);

    if (!travelInfo || !travelInfo.traveled || returningFromLesson) {
      this.bird.createStatic(finalX, finalY);
      this.bird.startIdleAnimation();
      this.registry.set('returningFromLesson', false);
      return;
    }

    const distance = Math.abs(travelInfo.currentHouseIndex - travelInfo.previousHouseIndex);
    const comingFromLeft = travelInfo.currentHouseIndex > travelInfo.previousHouseIndex;

    if (distance > 1) {
      this.bird.createWithFlyingEntrance(finalX, finalY, comingFromLeft, () => {
        this.bird!.startIdleAnimation();
      });
    } else {
      this.bird.createWithHoppingEntrance(finalX, finalY, comingFromLeft, () => {
        this.bird!.startIdleAnimation();
      });
    }
  }

  // ═══════════════════════════════════════════════════════════
  // EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════
  private handleLessonClick(lessonId: number): void {
    if (this.isTransitioning) return;

    this.isTransitioning = true;
    this.registry.set('returningFromLesson', true);

    const handleLessonSelect = this.registry.get('handleLessonSelect');

    if (handleLessonSelect && typeof handleLessonSelect === 'function') {
      handleLessonSelect(lessonId);
      this.isTransitioning = false;
    }
  }

  private handleBackToNeighborhood(): void {
    if (this.isTransitioning) return;

    this.isTransitioning = true;

    const handleBackToNeighborhood = this.registry.get('handleBackToNeighborhood');

    if (handleBackToNeighborhood && typeof handleBackToNeighborhood === 'function') {
      this.transitionToNeighborhood(() => {
        handleBackToNeighborhood();
        this.isTransitioning = false;
      });
    }
  }

  private handleMinigameSelect(): void {
    this.scene.launch('GrowYourNestMinigame', {
      questions: this.getMinigameQuestions()
    });
    
    this.scene.pause();
    
    this.minigameShutdownHandler = () => {
      this.scene.resume();
    };
    
    const minigameScene = this.scene.get('GrowYourNestMinigame');
    if (minigameScene) {
      minigameScene.events.once('shutdown', this.minigameShutdownHandler);
    }
  }

  private getMinigameQuestions() {
    return undefined;
  }

  // ═══════════════════════════════════════════════════════════
  // RESIZE HANDLING
  // ═══════════════════════════════════════════════════════════
  private handleResize(): void {
    // Debounce to prevent rapid successive resizes
    if (this.resizeDebounceTimer) {
      this.resizeDebounceTimer.remove();
      this.resizeDebounceTimer = undefined;
    }
    
    this.resizeDebounceTimer = this.time.delayedCall(100, () => {
      this.performResize();
      this.resizeDebounceTimer = undefined;
    });
  }

  private performResize(): void {
    const { width, height } = this.scale;
    
    console.log(`🔄 HouseScene performResize: ${width}x${height}`);
    
    // Kill all tweens FIRST
    this.tweens.killAll();
    
    // Clean up interactive elements before destroying
    if (this.backButton) {
      const buttonBg = this.backButton.list[0] as Phaser.GameObjects.Rectangle;
      if (buttonBg && buttonBg.input) {
        buttonBg.removeAllListeners();
        buttonBg.disableInteractive();
      }
      this.backButton.destroy();
      this.backButton = undefined;
    }
    
    if (this.minigameButton) {
      const buttonBg = this.minigameButton.list[0] as Phaser.GameObjects.Rectangle;
      if (buttonBg && buttonBg.input) {
        buttonBg.removeAllListeners();
        buttonBg.disableInteractive();
      }
      this.minigameButton.destroy();
      this.minigameButton = undefined;
    }
    
    this.lessonContainers.forEach(container => {
      const cardBackground = container.list[0] as Phaser.GameObjects.Rectangle;
      if (cardBackground && cardBackground.input) {
        cardBackground.removeAllListeners();
        cardBackground.disableInteractive();
      }
      container.destroy();
    });
    this.lessonContainers = [];
    
    if (this.lessonHouse) {
      this.lessonHouse.destroy();
      this.lessonHouse = undefined;
    }

    this.handleCoinCounterResize();
    
    if (this.bird) {
      this.bird.setPosition(width / 2, height * 0.85);
      this.bird.handleResize();
    }
    
    // Recreate with new dimensions (this.scale is now correct)
    this.createEnvironment();
    this.createUI();
  }

  // ═══════════════════════════════════════════════════════════
  // TRANSITION METHODS
  // ═══════════════════════════════════════════════════════════
  private transitionToNeighborhood(callback: () => void): void {
    callback();
  }
}