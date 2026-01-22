import Phaser from 'phaser';
import { scaleFontSize } from '../../../../../utils/scaleHelper';
import { SCENE_KEYS } from '../constants/SceneKeys';
import { ASSET_KEYS } from '../constants/AssetKeys';
import { COLORS, OPACITY } from '../constants/Colors';
import { ButtonBuilder } from '../ui/ButtonBuilder';
import { BirdCharacter } from '../characters/BirdCharacter';

interface Lesson {
  id: number;
  title: string;
  type: string;
  completed: boolean;
  locked: boolean;
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
  private headerCard?: Phaser.GameObjects.Container;
  private lessonContainers: Phaser.GameObjects.Container[] = [];
  
  // Environment
  private leftHouse?: Phaser.GameObjects.Image;
  private rightHouse?: Phaser.GameObjects.Image;
  
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

    // Left house cutout - responsive scaling
    this.leftHouse = this.add.image(width * 0.25, height / 2, ASSET_KEYS.LEFT_CUT_HOUSE);
    this.leftHouse.setDepth(1);
    // Reduced to 0.001 (67% smaller than original)
    const houseScale = Math.min(width, height) * 0.00121;
    this.leftHouse.setScale(houseScale);

    // Right house cutout - responsive scaling
    this.rightHouse = this.add.image(width * 0.76, height / 2, ASSET_KEYS.RIGHT_CUT_HOUSE);
    this.rightHouse.setDepth(1);
    this.rightHouse.setScale(houseScale);
  }

  // ═══════════════════════════════════════════════════════════
  // UI CREATION METHODS
  // ═══════════════════════════════════════════════════════════
  private createUI(): void {
    this.createBackButton();
    this.createMinigameButton();
    
    if (this.module && this.module.lessons.length > 0) {
      this.createHeaderCard();
      this.createLessonGrid();
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

  private createHeaderCard(): void {
    if (!this.module) return;

    const { width, height } = this.scale;

    this.headerCard = this.add.container(width / 2, height * 0.15);
    this.headerCard.setDepth(10);

    // Card background - responsive sizing
    const cardWidth = width * 0.6; // 60% of viewport width
    const cardHeight = height * 0.15; // 15% of viewport height
    const card = this.add.rectangle(0, 0, cardWidth, cardHeight, COLORS.WHITE, OPACITY.HIGH);
    const strokeWidth = Math.max(2, width * 0.002); // Responsive stroke
    card.setStrokeStyle(strokeWidth, COLORS.GRAY_200);
    this.headerCard.add(card);

    // Module title - responsive sizing
    const titleSize = Math.min(width, height) * 0.032; // Responsive title size
    const titleOffsetY = -cardHeight * 0.15; // Position relative to card height
    const title = this.add.text(0, titleOffsetY, this.module.title, {
      fontSize: `${titleSize}px`,
      fontFamily: 'Arial, sans-serif',
      color: COLORS.TEXT_PRIMARY,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.headerCard.add(title);

    // Progress text - responsive sizing
    const completedCount = this.module.lessons.filter(l => l.completed).length;
    const totalCount = this.module.lessons.length;
    const progressSize = Math.min(width, height) * 0.018; // Responsive progress size
    const progressOffsetY = cardHeight * 0.2; // Position relative to card height
    const progressText = this.add.text(
      0,
      progressOffsetY,
      `${completedCount}/${totalCount} Rooms Completed`,
      {
        fontSize: `${progressSize}px`,
        fontFamily: 'Arial, sans-serif',
        color: COLORS.TEXT_SECONDARY,
      }
    ).setOrigin(0.5);
    this.headerCard.add(progressText);
  }

  private createLessonGrid(): void {
    if (!this.module) return;

    const { width, height } = this.scale;

    const gridCenterX = width / 2;
    const gridCenterY = height * 0.65;
    
    // Make card dimensions responsive
    const cardWidth = width * 0.25; // 25% of viewport width
    const cardHeight = height * 0.25; // 25% of viewport height
    const gapX = width * 0.04; // 4% of width for horizontal gap
    const gapY = height * 0.08; // 8% of height for vertical gap

    this.module.lessons.forEach((lesson, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);

      const offsetX = col === 0 ? -(cardWidth / 2 + gapX / 2) : cardWidth / 2 + gapX / 2;
      const offsetY = row === 0 ? -(cardHeight / 2 + gapY / 2) : cardHeight / 2 + gapY / 2;

      const x = gridCenterX + offsetX;
      const y = gridCenterY + offsetY;

      this.createLessonCard(lesson, x, y, cardWidth, cardHeight);
    });
  }

  private createLessonCard(
    lesson: Lesson,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    const lessonContainer = this.add.container(x, y);
    lessonContainer.setDepth(10);
    this.lessonContainers.push(lessonContainer);

    // Card background - responsive positioning and stroke
    const cardOffsetY = -height * 0.1; // Position relative to card height
    const card = this.add.rectangle(0, cardOffsetY, width, height, COLORS.WHITE, 0.7);
    const strokeWidth = Math.max(2, this.scale.width * 0.002);
    card.setStrokeStyle(strokeWidth, COLORS.GRAY_200);
    lessonContainer.add(card);

    // Lesson title - responsive sizing and positioning
    const titleSize = Math.min(this.scale.width, this.scale.height) * 0.022;
    const titleOffsetY = -height * 0.3;
    const titleText = this.add.text(0, titleOffsetY, lesson.title, {
      fontSize: `${titleSize}px`,
      fontFamily: 'Arial, sans-serif',
      color: COLORS.TEXT_PRIMARY,
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: width * 0.9 }, // 90% of card width
    }).setOrigin(0.5);
    lessonContainer.add(titleText);

    // Lesson type - responsive sizing and positioning
    const typeSize = Math.min(this.scale.width, this.scale.height) * 0.016;
    const typeOffsetY = -height * 0.1;
    const typeText = this.add.text(0, typeOffsetY, lesson.type, {
      fontSize: `${typeSize}px`,
      fontFamily: 'Arial, sans-serif',
      color: COLORS.TEXT_SECONDARY,
      align: 'center',
    }).setOrigin(0.5);
    lessonContainer.add(typeText);

    // Lock overlay for locked lessons
    if (lesson.locked) {
      const lockOverlay = this.add.rectangle(0, cardOffsetY, width, height, COLORS.GRAY_200, 0.5);
      lessonContainer.add(lockOverlay);
    }

    // Action button
    this.createLessonButton(lessonContainer, lesson, width, height);
  }

  private createLessonButton(
    container: Phaser.GameObjects.Container, 
    lesson: Lesson,
    cardWidth: number,
    cardHeight: number
  ): void {
    const buttonY = cardHeight * 0.3; // Position relative to card height
    const buttonWidth = cardWidth * 0.6; // 60% of card width
    const buttonHeight = cardHeight * 0.25; // 25% of card height
    const fontSize = Math.min(this.scale.width, this.scale.height) * 0.016;

    const button = ButtonBuilder.createLessonButton({
      scene: this,
      x: 0,
      y: buttonY,
      width: buttonWidth,
      height: buttonHeight,
      text: lesson.locked ? 'Locked' : lesson.completed ? 'Review' : 'Start',
      fontSize: fontSize,
      completed: lesson.completed,
      locked: lesson.locked,
      onClick: () => this.handleLessonClick(lesson.id),
    });

    container.add(button);
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
    if (this.leftHouse) this.leftHouse.destroy();
    if (this.rightHouse) this.rightHouse.destroy();
    if (this.backButton) this.backButton.destroy();
    if (this.minigameButton) this.minigameButton.destroy();
    if (this.headerCard) this.headerCard.destroy();
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