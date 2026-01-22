import Phaser from 'phaser';
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
  x?: number; // Position as percentage of viewport width
  y?: number; // Position as percentage of viewport height
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

export default class HouseScene extends Phaser.Scene {
  // ═══════════════════════════════════════════════════════════
  // PROPERTIES
  // ═══════════════════════════════════════════════════════════
  private module: Module | null = null;
  private moduleBackendId?: string;
  private isTransitioning: boolean = false;
  private backButton?: Phaser.GameObjects.Container;
  private minigameButton?: Phaser.GameObjects.Container;
  private lessonContainers: Phaser.GameObjects.Container[] = [];
  
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
    
    // Get module lessons data from registry
    const moduleLessonsData: Record<string, ModuleLessonsData> = this.registry.get('moduleLessonsData') || {};
    
    console.log('🏠 HouseScene init - moduleBackendId:', this.moduleBackendId);
    console.log('🏠 HouseScene init - available module lessons data:', moduleLessonsData);
    
    // Find the module data for this backend ID
    if (this.moduleBackendId && moduleLessonsData[this.moduleBackendId]) {
      this.module = moduleLessonsData[this.moduleBackendId];
      console.log('✅ Loaded module from backend:', this.module);
    } else {
      console.warn('⚠️ No module data found for backend ID:', this.moduleBackendId);
      // Fallback to empty module
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
    this.createEnvironment();
    this.createUI();
    this.createBirdWithEntrance();
    this.setupEventListeners();
  }

  shutdown() {
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

    // Single house image - responsive scaling
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
      // this.createHeaderCard(); // COMMENTED OUT
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
    
    // Make button position and size responsive
    const buttonX = width * 0.08; // 8% from left
    const buttonY = height * 0.05; // 5% from top
    const buttonWidth = width * 0.1; // 10% of width
    const buttonHeight = height * 0.05; // 5% of height
    
    this.backButton = ButtonBuilder.createIconButton({
      scene: this,
      x: buttonX,
      y: buttonY,
      width: buttonWidth,
      height: buttonHeight,
      text: 'Back',
      icon: '←',
      iconSize: Math.min(width, height) * 0.025, // Responsive icon size
      fontSize: Math.min(width, height) * 0.016, // Responsive font size
      backgroundColor: COLORS.GRAY_700,
      hoverColor: COLORS.GRAY_800,
      onClick: () => this.handleBackToNeighborhood(),
    });
    this.backButton.setDepth(10);
  }

  private createMinigameButton(): void {
    const { width, height } = this.scale;

    // Make button position and size responsive
    const buttonWidth = width * 0.12; // 12% of width
    const buttonHeight = height * 0.05; // 5% of height
    const buttonX = width - (width * 0.08); // 8% from right
    const buttonY = height * 0.05; // 5% from top
    
    this.minigameButton = ButtonBuilder.createButton({
      scene: this,
      x: buttonX,
      y: buttonY,
      width: buttonWidth,
      height: buttonHeight,
      text: 'Minigame',
      fontSize: Math.min(width, height) * 0.016, // Responsive font size
      backgroundColor: COLORS.BLUE_500,
      hoverColor: COLORS.BLUE_600,
      onClick: () => this.handleMinigameSelect(),
    });
    this.minigameButton.setDepth(10);
  }

  // COMMENTED OUT - Header Card
  // private createHeaderCard(): void {
  //   if (!this.module) return;

  //   const { width, height } = this.scale;

  //   this.headerCard = this.add.container(width / 2, height * 0.15);
  //   this.headerCard.setDepth(10);

  //   // Card background - responsive sizing
  //   const cardWidth = width * 0.6; // 60% of viewport width
  //   const cardHeight = height * 0.15; // 15% of viewport height
  //   const card = this.add.rectangle(0, 0, cardWidth, cardHeight, COLORS.WHITE, OPACITY.HIGH);
  //   const strokeWidth = Math.max(2, width * 0.002); // Responsive stroke
  //   card.setStrokeStyle(strokeWidth, COLORS.GRAY_200);
  //   this.headerCard.add(card);

  //   // Module title - responsive sizing
  //   const titleSize = Math.min(width, height) * 0.032; // Responsive title size
  //   const titleOffsetY = -cardHeight * 0.15; // Position relative to card height
  //   const title = this.add.text(0, titleOffsetY, this.module.title, {
  //     fontSize: `${titleSize}px`,
  //     fontFamily: 'Arial, sans-serif',
  //     color: COLORS.TEXT_PRIMARY,
  //     fontStyle: 'bold',
  //   }).setOrigin(0.5);
  //   this.headerCard.add(title);

  //   // Progress text - responsive sizing
  //   const completedCount = this.module.lessons.filter(l => l.completed).length;
  //   const totalCount = this.module.lessons.length;
  //   const progressSize = Math.min(width, height) * 0.018; // Responsive progress size
  //   const progressOffsetY = cardHeight * 0.2; // Position relative to card height
  //   const progressText = this.add.text(
  //     0,
  //     progressOffsetY,
  //     `${completedCount}/${totalCount} Rooms Completed`,
  //     {
  //       fontSize: `${progressSize}px`,
  //       fontFamily: 'Arial, sans-serif',
  //       color: COLORS.TEXT_SECONDARY,
  //     }
  //   ).setOrigin(0.5);
  //   this.headerCard.add(progressText);
  // }

  private createLessonCards(): void {
    if (!this.module) return;

    this.module.lessons.forEach((lesson, index) => {
      this.createLessonCard(lesson, index);
    });
  }

  private createLessonCard(lesson: Lesson, index: number): void {
    const { width, height } = this.scale;

    // Default positions based on index (2x2 grid pattern)
    const defaultPositions = [
      { x: 26, y: 31 },  // Top-left
      { x: 77, y: 31 },  // Top-right
      { x: 31, y: 74 },  // Bottom-left
      { x: 63, y: 72 },  // Bottom-right
    ];

    // Get default position for this lesson index, or use center if index exceeds defaults
    const defaultPos = defaultPositions[index] || { x: 50, y: 50 };

    // Calculate position based on percentage (use lesson's x/y if provided, otherwise use defaults)
    const x = lesson.x !== undefined ? (lesson.x / 100) * width : (defaultPos.x / 100) * width;
    const y = lesson.y !== undefined ? (lesson.y / 100) * height : (defaultPos.y / 100) * height;

    // Card dimensions - responsive sizing (reduced by 25%)
    const cardWidth = width * 0.1875; // 18.75% of viewport width (was 25%)
    const cardHeight = height * 0.1875; // 18.75% of viewport height (was 25%)

    const lessonContainer = this.add.container(x, y);
    lessonContainer.setDepth(10);
    this.lessonContainers.push(lessonContainer);

    // Card background - responsive positioning and stroke
    const cardOffsetY = -cardHeight * 0.1; // Position relative to card height
    const card = this.add.rectangle(0, cardOffsetY, cardWidth, cardHeight, COLORS.WHITE, 0.7);
    const strokeWidth = Math.max(2, this.scale.width * 0.002);
    card.setStrokeStyle(strokeWidth, COLORS.GRAY_200);
    lessonContainer.add(card);

    // Lesson title - responsive sizing and positioning
    const titleSize = Math.min(this.scale.width, this.scale.height) * 0.022;
    const titleOffsetY = -cardHeight * 0.3;
    const titleText = this.add.text(0, titleOffsetY, lesson.title, {
      fontSize: `${titleSize}px`,
      fontFamily: 'Arial, sans-serif',
      color: COLORS.TEXT_PRIMARY,
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: cardWidth * 0.9 }, // 90% of card width
    }).setOrigin(0.5);
    lessonContainer.add(titleText);

    // Lesson type - responsive sizing and positioning
    const typeSize = Math.min(this.scale.width, this.scale.height) * 0.016;
    const typeOffsetY = -cardHeight * 0.1;
    const typeText = this.add.text(0, typeOffsetY, lesson.type, {
      fontSize: `${typeSize}px`,
      fontFamily: 'Arial, sans-serif',
      color: COLORS.TEXT_SECONDARY,
      align: 'center',
    }).setOrigin(0.5);
    lessonContainer.add(typeText);

    // Lock overlay for locked lessons
    if (lesson.locked) {
      const lockOverlay = this.add.rectangle(0, cardOffsetY, cardWidth, cardHeight, COLORS.GRAY_200, 0.5);
      lessonContainer.add(lockOverlay);
    }

    // Status badge (non-clickable visual component)
    this.createStatusBadge(lessonContainer, lesson, cardWidth, cardHeight);

    // Make the entire container interactive (clickable)
    this.makeCardInteractive(lessonContainer, card, lesson);
  }

  private createStatusBadge(
    container: Phaser.GameObjects.Container, 
    lesson: Lesson,
    cardWidth: number,
    cardHeight: number
  ): void {
    const badgeY = cardHeight * 0.3; // Position relative to card height
    const badgeWidth = cardWidth * 0.6; // 60% of card width
    const badgeHeight = cardHeight * 0.25; // 25% of card height
    const fontSize = Math.min(this.scale.width, this.scale.height) * 0.016;
    const borderRadius = badgeHeight * 0.3; // Rounded corners

    // Determine badge color and text based on lesson state
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

    // Create rounded rectangle for badge background
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

    // Badge text
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
    // Make the card background interactive
    cardBackground.setInteractive({ useHandCursor: !lesson.locked });

    // Store original scale for hover effect
    const originalScaleX = container.scaleX;
    const originalScaleY = container.scaleY;

    if (!lesson.locked) {
      // Hover effects
      cardBackground.on('pointerover', () => {
        this.tweens.add({
          targets: container,
          scaleX: originalScaleX * 1.05,
          scaleY: originalScaleY * 1.05,
          duration: 200,
          ease: 'Power2',
        });
      });

      cardBackground.on('pointerout', () => {
        this.tweens.add({
          targets: container,
          scaleX: originalScaleX,
          scaleY: originalScaleY,
          duration: 200,
          ease: 'Power2',
        });
      });

      // Click handler
      cardBackground.on('pointerdown', () => {
        this.handleLessonClick(lesson.id);
      });
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

    // Initialize bird character
    this.bird = new BirdCharacter(this);

    if (!travelInfo || !travelInfo.traveled || returningFromLesson) {
      // No entrance animation - just create static bird
      this.bird.createStatic(finalX, finalY);
      this.bird.startIdleAnimation();
      this.registry.set('returningFromLesson', false);
      return;
    }

    // Determine animation type based on travel distance
    const distance = Math.abs(travelInfo.currentHouseIndex - travelInfo.previousHouseIndex);
    const comingFromLeft = travelInfo.currentHouseIndex > travelInfo.previousHouseIndex;

    if (distance > 1) {
      // Long distance - flying entrance
      this.bird.createWithFlyingEntrance(finalX, finalY, comingFromLeft, () => {
        this.bird!.startIdleAnimation();
      });
    } else {
      // Short distance - hopping entrance
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
    
    this.scene.get('GrowYourNestMinigame').events.once('shutdown', () => {
      this.scene.resume();
    });
  }

  private getMinigameQuestions() {
    return undefined;
  }

  private handleResize(): void {
    // Destroy existing elements
    if (this.lessonHouse) this.lessonHouse.destroy();
    if (this.backButton) this.backButton.destroy();
    if (this.minigameButton) this.minigameButton.destroy();
    this.lessonContainers.forEach(container => container.destroy());
    this.lessonContainers = [];
    
    // Handle bird resize
    if (this.bird) {
      const position = this.bird.getPosition();
      if (position) {
        // Recalculate position based on new viewport
        const { width, height } = this.scale;
        this.bird.setPosition(width / 2, height * 0.85);
        this.bird.handleResize();
      }
    }
    
    // Recreate everything with new dimensions
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