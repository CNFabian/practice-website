import Phaser from 'phaser';
import { scale, scaleFontSize } from '../../../../../utils/scaleHelper';
import { SCENE_KEYS } from '../constants/SceneKeys';
import { ASSET_KEYS } from '../constants/AssetKeys';
import { COLORS, OPACITY } from '../constants/Colors';
import { ButtonBuilder } from '../ui/ButtonBuilder';

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
  
  // Bird animation
  private birdSprite?: Phaser.GameObjects.Image;
  private birdIdleTimer?: Phaser.Time.TimerEvent;

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
    
    if (this.birdIdleTimer) {
      this.birdIdleTimer.remove();
      this.birdIdleTimer = undefined;
    }
  }

  create() {
    this.setupCamera();
    this.createEnvironment();
    this.createUI();
    this.createBirdWithEntrance();
    this.setupEventListeners();
  }

  shutdown() {
    this.cleanupEventListeners();
    this.cleanupTimers();
    this.lessonContainers = [];
  }

  // ═══════════════════════════════════════════════════════════
  // SETUP METHODS
  // ═══════════════════════════════════════════════════════════
  private setupCamera(): void {
    this.cameras.main.fadeIn(300, 254, 243, 199);
  }

  private setupEventListeners(): void {
    this.scale.on('resize', this.handleResize, this);
  }

  private cleanupEventListeners(): void {
    this.scale.off('resize', this.handleResize, this);
  }

  private cleanupTimers(): void {
    if (this.birdIdleTimer) {
      this.birdIdleTimer.remove();
      this.birdIdleTimer = undefined;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // ENVIRONMENT CREATION METHODS
  // ═══════════════════════════════════════════════════════════
  private createEnvironment(): void {
    const { width, height } = this.scale;

    // Left house cutout
    this.leftHouse = this.add.image(width * 0.25, height / 2, ASSET_KEYS.LEFT_CUT_HOUSE);
    this.leftHouse.setDepth(1);
    this.leftHouse.setScale(2);

    // Right house cutout
    this.rightHouse = this.add.image(width * 0.76, height / 2, ASSET_KEYS.RIGHT_CUT_HOUSE);
    this.rightHouse.setDepth(1);
    this.rightHouse.setScale(2);
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
    this.backButton = ButtonBuilder.createIconButton({
      scene: this,
      x: scale(100),
      y: scale(40),
      width: scale(120),
      height: scale(40),
      text: 'Back',
      icon: '←',
      iconSize: 24,
      fontSize: 16,
      backgroundColor: COLORS.GRAY_700,
      hoverColor: COLORS.GRAY_800,
      onClick: () => this.handleBackToNeighborhood(),
    });
    this.backButton.setDepth(10);
  }

  private createMinigameButton(): void {
    const { width } = this.scale;

    this.minigameButton = ButtonBuilder.createButton({
      scene: this,
      x: width - scale(120),
      y: scale(40),
      width: scale(140),
      height: scale(40),
      text: 'Minigame',
      fontSize: 16,
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

    // Card background
    const cardWidth = scale(700);
    const cardHeight = scale(120);
    const card = this.add.rectangle(0, 0, cardWidth, cardHeight, COLORS.WHITE, OPACITY.HIGH);
    card.setStrokeStyle(scale(2), COLORS.GRAY_200);
    this.headerCard.add(card);

    // Module title
    const title = this.add.text(0, scale(-20), this.module.title, {
      fontSize: scaleFontSize(32),
      fontFamily: 'Arial, sans-serif',
      color: COLORS.TEXT_PRIMARY,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.headerCard.add(title);

    // Progress text
    const completedCount = this.module.lessons.filter(l => l.completed).length;
    const totalCount = this.module.lessons.length;
    const progressText = this.add.text(
      0,
      scale(25),
      `${completedCount}/${totalCount} Rooms Completed`,
      {
        fontSize: scaleFontSize(18),
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
    const cardWidth = scale(320);
    const cardHeight = scale(200);
    const gapX = scale(50);
    const gapY = scale(60);

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

    // Card background
    const card = this.add.rectangle(0, scale(-20), width, height, COLORS.WHITE, 0.7);
    card.setStrokeStyle(scale(2), COLORS.GRAY_200);
    lessonContainer.add(card);

    // Lesson title
    const titleText = this.add.text(0, scale(-60), lesson.title, {
      fontSize: scaleFontSize(22),
      fontFamily: 'Arial, sans-serif',
      color: COLORS.TEXT_PRIMARY,
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: width - scale(40) },
    }).setOrigin(0.5);
    lessonContainer.add(titleText);

    // Lesson type
    const typeText = this.add.text(0, scale(-20), lesson.type, {
      fontSize: scaleFontSize(16),
      fontFamily: 'Arial, sans-serif',
      color: COLORS.TEXT_SECONDARY,
      align: 'center',
    }).setOrigin(0.5);
    lessonContainer.add(typeText);

    // Lock overlay for locked lessons
    if (lesson.locked) {
      const lockOverlay = this.add.rectangle(0, scale(-20), width, height, COLORS.GRAY_200, 0.5);
      lessonContainer.add(lockOverlay);
    }

    // Action button
    this.createLessonButton(lessonContainer, lesson);
  }

  private createLessonButton(container: Phaser.GameObjects.Container, lesson: Lesson): void {
    const buttonY = scale(60);

    const button = ButtonBuilder.createLessonButton({
      scene: this,
      x: 0,
      y: buttonY,
      width: scale(180),
      height: scale(50),
      text: lesson.locked ? 'Locked' : lesson.completed ? 'Review' : 'Start',
      fontSize: 16,
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

    if (!travelInfo || !travelInfo.traveled || returningFromLesson) {
      // No entrance animation
      this.createBirdStatic(finalX, finalY);
      this.registry.set('returningFromLesson', false);
      return;
    }

    // Determine animation type
    const distance = Math.abs(travelInfo.currentHouseIndex - travelInfo.previousHouseIndex);
    const comingFromLeft = travelInfo.currentHouseIndex > travelInfo.previousHouseIndex;

    if (distance > 1) {
      this.animateBirdFlyingEntrance(finalX, finalY, comingFromLeft);
    } else {
      this.animateBirdHoppingEntrance(finalX, finalY, comingFromLeft);
    }
  }

  private createBirdStatic(x: number, y: number): void {
    this.birdSprite = this.add.image(x, y, ASSET_KEYS.BIRD_IDLE);
    this.birdSprite.setDisplaySize(scale(80), scale(80));
    this.birdSprite.setDepth(1000);
    this.startBirdIdleAnimation();
  }

  private animateBirdFlyingEntrance(finalX: number, finalY: number, fromLeft: boolean): void {
    const { width, height } = this.scale;

    const startX = fromLeft ? -scale(100) : width + scale(100);
    const startY = height * 0.5;

    // Create bird in flying texture
    this.birdSprite = this.add.image(startX, startY, ASSET_KEYS.BIRD_FLY);
    const flyTexture = this.textures.get(ASSET_KEYS.BIRD_FLY);
    const flyWidth = flyTexture.getSourceImage().width;
    const flyHeight = flyTexture.getSourceImage().height;
    const flyAspectRatio = flyWidth / flyHeight;
    this.birdSprite.setDisplaySize(scale(100) * flyAspectRatio, scale(100));
    this.birdSprite.setDepth(1000);
    this.birdSprite.setFlipX(!fromLeft);

    // Fly animation
    this.tweens.add({
      targets: this.birdSprite,
      x: finalX,
      y: finalY,
      duration: 1500,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.birdSprite!.setTexture(ASSET_KEYS.BIRD_IDLE);
        this.birdSprite!.setDisplaySize(scale(80), scale(80));
        this.birdSprite!.setFlipX(false);
        this.startBirdIdleAnimation();
      },
    });
  }

  private animateBirdHoppingEntrance(finalX: number, finalY: number, fromLeft: boolean): void {
    const { width } = this.scale;

    const startX = fromLeft ? -scale(100) : width + scale(100);

    this.birdSprite = this.add.image(startX, finalY, ASSET_KEYS.BIRD_IDLE);
    this.birdSprite.setDisplaySize(scale(80), scale(80));
    this.birdSprite.setDepth(1000);
    this.birdSprite.setFlipX(!fromLeft);

    // Calculate hop path
    const distance = Math.abs(finalX - startX);
    const numHops = Math.max(5, Math.floor(distance / scale(80)));
    const hopHeight = scale(10);
    const hopDuration = 200;

    const path: { x: number; y: number }[] = [];
    for (let i = 0; i <= numHops; i++) {
      const t = i / numHops;
      path.push({
        x: Phaser.Math.Linear(startX, finalX, t),
        y: finalY,
      });
    }

    let currentHop = 0;

    const performNextHop = () => {
      if (currentHop >= path.length - 1) {
        this.birdSprite!.setFlipX(false);
        this.startBirdIdleAnimation();
        return;
      }

      const startPoint = path[currentHop];
      const endPoint = path[currentHop + 1];
      const midX = (startPoint.x + endPoint.x) / 2;
      const midY = (startPoint.y + endPoint.y) / 2 - hopHeight;

      this.tweens.add({
        targets: this.birdSprite,
        x: midX,
        y: midY,
        duration: hopDuration / 2,
        ease: 'Sine.easeOut',
        onStart: () => {
          this.tweens.add({
            targets: this.birdSprite,
            angle: currentHop % 2 === 0 ? -5 : 5,
            duration: hopDuration / 2,
            ease: 'Sine.easeInOut',
            yoyo: true,
          });
        },
        onComplete: () => {
          this.tweens.add({
            targets: this.birdSprite,
            x: endPoint.x,
            y: endPoint.y,
            duration: hopDuration / 2,
            ease: 'Sine.easeIn',
            onComplete: () => {
              currentHop++;
              performNextHop();
            },
          });
        },
      });
    };

    performNextHop();
  }

  private startBirdIdleAnimation(): void {
    const scheduleNextIdleHop = () => {
      const randomDelay = Phaser.Math.Between(5000, 8000);

      this.birdIdleTimer = this.time.delayedCall(randomDelay, () => {
        if (this.birdSprite && !this.isTransitioning) {
          this.playBirdIdleHop();
        }
        scheduleNextIdleHop();
      });
    };

    scheduleNextIdleHop();
  }

  private playBirdIdleHop(): void {
    if (!this.birdSprite || this.isTransitioning) return;

    const originalY = this.birdSprite.y;
    const originalX = this.birdSprite.x;

    const moveX = Phaser.Math.Between(-scale(10), scale(10));
    const targetX = Phaser.Math.Clamp(originalX + moveX, scale(100), this.scale.width - scale(100));

    if (Math.abs(moveX) > scale(5)) {
      this.birdSprite.setFlipX(moveX < 0);
    }

    const hopHeight = scale(5);
    const duration = 400;

    this.tweens.add({
      targets: this.birdSprite,
      x: targetX,
      y: originalY - hopHeight,
      duration: duration,
      ease: 'Sine.easeOut',
      yoyo: true,
      onStart: () => {
        this.tweens.add({
          targets: this.birdSprite,
          angle: -3,
          duration: duration / 2,
          ease: 'Sine.easeInOut',
          yoyo: true,
        });
      },
    });
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
    if (this.isTransitioning) return;

    this.isTransitioning = true;

    const handleMinigameSelect = this.registry.get('handleMinigameSelect');

    if (handleMinigameSelect && typeof handleMinigameSelect === 'function') {
      handleMinigameSelect();
      this.isTransitioning = false;
    }
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    const { width, height } = gameSize;

    // Reposition environment
    if (this.leftHouse) {
      this.leftHouse.setPosition(width * 0.25, height / 2);
    }
    if (this.rightHouse) {
      this.rightHouse.setPosition(width * 0.76, height / 2);
    }

    // Reposition buttons
    if (this.backButton) {
      this.backButton.setPosition(scale(100), scale(40));
    }
    if (this.minigameButton) {
      this.minigameButton.setPosition(width - scale(120), scale(40));
    }

    // Reposition header
    if (this.headerCard) {
      this.headerCard.setPosition(width / 2, height * 0.15);
    }

    // Reposition bird
    if (this.birdSprite) {
      this.birdSprite.setPosition(width / 2, height * 0.85);
    }

    // Recreate lesson grid
    this.lessonContainers.forEach(container => container.destroy());
    this.lessonContainers = [];
    this.createLessonGrid();
  }

  // ═══════════════════════════════════════════════════════════
  // TRANSITION METHODS
  // ═══════════════════════════════════════════════════════════
  private transitionToNeighborhood(callback: () => void): void {
    this.cameras.main.fadeOut(300, 254, 243, 199);
    this.cameras.main.once('camerafadeoutcomplete', callback);
  }
}