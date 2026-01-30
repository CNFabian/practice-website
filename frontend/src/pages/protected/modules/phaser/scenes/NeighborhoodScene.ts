import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { scale, scaleFontSize } from '../../../../../utils/scaleHelper';
import { SCENE_KEYS } from '../constants/SceneKeys';
import { ASSET_KEYS } from '../constants/AssetKeys';
import { COLORS, OPACITY } from '../constants/Colors';
import { CardBuilder } from '../ui/CardBuilder';
import { ButtonBuilder } from '../ui/ButtonBuilder';
import { UIComponents } from '../ui/UIComponents';
import { BirdCharacter } from '../characters/BirdCharacter';
import { SceneTransitionManager } from '../managers/SceneTransitionManager';
import { createTextStyle } from '../constants/Typography';
import { HouseProgressCard, HouseProgressData } from '../ui/HouseProgressCard';

interface HousePosition {
  id: string;
  name: string;
  x?: number; // Optional - backend provided
  y?: number; // Optional - backend provided
  isLocked?: boolean;
  houseType?: string;
  moduleId?: number;
  moduleBackendId?: string;
  description?: string;
  coinReward?: number;
}

interface NeighborhoodSceneData {
  neighborhoodId?: string;
  houses?: HousePosition[];
  currentHouseIndex?: number;
}

export default class NeighborhoodScene extends BaseScene {
  // ═══════════════════════════════════════════════════════════
  // PROPERTIES
  // ═══════════════════════════════════════════════════════════
  private neighborhoodId?: string;
  private houses: HousePosition[] = [];
  private isTransitioning: boolean = false;
  private houseSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private backButton?: Phaser.GameObjects.Container;
  private placeholderCard?: Phaser.GameObjects.Container;
  private roads: Phaser.GameObjects.Graphics[] = [];
  private idleAnimationTimer?: Phaser.Time.TimerEvent;
  private houseImages: Phaser.GameObjects.Image[] = [];
  private isShuttingDown: boolean = false;
  private resizeDebounceTimer?: Phaser.Time.TimerEvent;
  private cloudOverlays: Phaser.GameObjects.Image[] = []; // Track cloud overlays separately
  private transitionManager: SceneTransitionManager;
  private progressCards: Phaser.GameObjects.Container[] = [];
  private moduleProgressMap?: Map<string, any>;

  // Bird character properties
  private bird?: BirdCharacter;
  private currentHouseIndex: number = 0;
  private previousHouseIndex: number = 0;

  // ═══════════════════════════════════════════════════════════
  // CONSTRUCTOR
  // ═══════════════════════════════════════════════════════════
  constructor() {
    super({ key: SCENE_KEYS.NEIGHBORHOOD });
    this.transitionManager = new SceneTransitionManager(this);
  }

  // ═══════════════════════════════════════════════════════════
  // LIFECYCLE METHODS
  // ═══════════════════════════════════════════════════════════
  init(data: NeighborhoodSceneData) {
    this.neighborhoodId = data.neighborhoodId;
    
    // Always ensure we have exactly 5 houses
    if (!data.houses || data.houses.length === 0) {
      console.log('⚠️ No houses data provided, using 5 mock houses');
      this.houses = this.createMockHouses();
    } else if (data.houses.length < 5) {
      console.log(`⚠️ Only ${data.houses.length} houses provided, filling to 5 with mock data`);
      this.houses = this.fillToFiveHouses(data.houses);
    } else {
      console.log(`✅ Using ${data.houses.length} houses from backend`);
      this.houses = data.houses.slice(0, 5); // Take only first 5 if more provided
    }
    
    this.isTransitioning = false;
    this.isShuttingDown = false;
    this.currentHouseIndex = data.currentHouseIndex ?? 0;
    this.previousHouseIndex = this.currentHouseIndex;
    
    console.log('🏘️ NeighborhoodScene init with houses:', this.houses);
    console.log(`📊 Total houses: ${this.houses.length}`);
    
    // Clear existing data
    this.houseSprites.clear();
    this.houseImages = [];
    this.roads = [];
    
    // Cleanup existing bird
    if (this.bird) {
      this.bird.destroy();
      this.bird = undefined;
    }
    
    // Clear any existing idle animation timer
    if (this.idleAnimationTimer) {
      this.idleAnimationTimer.remove();
      this.idleAnimationTimer = undefined;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // MOCK DATA METHODS
  // ═══════════════════════════════════════════════════════════
  private fillToFiveHouses(existingHouses: HousePosition[]): HousePosition[] {
    const mockHouses = this.createMockHouses();
    const result = [...existingHouses];
    
    // Add mock houses to fill up to 5
    let mockIndex = 0;
    while (result.length < 5 && mockIndex < mockHouses.length) {
      // Modify mock house ID to avoid conflicts
      const mockHouse = {
        ...mockHouses[mockIndex],
        id: `filler-house-${result.length + 1}`,
        name: `Module ${result.length + 1}`,
      };
      result.push(mockHouse);
      mockIndex++;
    }
    
    return result;
  }

  private createMockHouses(): HousePosition[] {
    return [
      {
        id: 'mock-house-1',
        name: 'Home-buying Foundations',
        houseType: ASSET_KEYS.HOUSE_1,
        isLocked: false,
        moduleId: 1,
        moduleBackendId: 'mock-module-1',
        description: 'Learn the basics of home buying',
        coinReward: 100,
      },
      {
        id: 'mock-house-2',
        name: 'Financial Planning',
        houseType: ASSET_KEYS.HOUSE_2,
        isLocked: false,
        moduleId: 2,
        moduleBackendId: 'mock-module-2',
        description: 'Master your finances for home ownership',
        coinReward: 150,
      },
      {
        id: 'mock-house-3',
        name: 'Property Search',
        houseType: ASSET_KEYS.HOUSE_3,
        isLocked: false,
        moduleId: 3,
        moduleBackendId: 'mock-module-3',
        description: 'Find your perfect home',
        coinReward: 200,
      },
      {
        id: 'mock-house-4',
        name: 'Making an Offer',
        houseType: ASSET_KEYS.HOUSE_4,
        isLocked: false,
        moduleId: 4,
        moduleBackendId: 'mock-module-4',
        description: 'Negotiate and secure your home',
        coinReward: 250,
      },
      {
        id: 'mock-house-5',
        name: 'Closing Process',
        houseType: ASSET_KEYS.HOUSE_5,
        isLocked: false,
        moduleId: 5,
        moduleBackendId: 'mock-module-5',
        description: 'Complete your home purchase',
        coinReward: 300,
      },
    ];
  }

  create() {
    super.create();
    this.transitionManager = new SceneTransitionManager(this);
    this.transitionManager.enterNeighborhood();
    
    // Setup camera for horizontal scrolling
    this.setupCamera();

    const dashboardModules = this.registry.get('dashboardModules') || [];
    
    if (dashboardModules && dashboardModules.length > 0) {
      // Create lookup map: moduleId (UUID) -> progress data
      this.moduleProgressMap = new Map(
        dashboardModules.map((dm: any) => [dm.module.id, dm])
      );
      console.log('📊 Module progress map created with', this.moduleProgressMap.size, 'modules');
    } else {
      console.warn('⚠️ No dashboard modules found in registry');
    }
    
    // Now create houses with progress data
    this.createHouses();
    
    this.createUI();
    this.fadeInScene();
    this.setupEventListeners();
    this.prefetchAllHouseLessons(); 
  }

  // ═══════════════════════════════════════════════════════════
  // CAMERA SETUP FOR SCROLLING
  // ═══════════════════════════════════════════════════════════
  private setupCamera(): void {
    const { width, height } = this.scale;
    const worldWidth = width * 2.5;
    const worldHeight = height;
    
    // Set world bounds
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    
    // Enable camera drag scrolling
    this.cameras.main.setScroll(0, 0); // Start at leftmost position
    
    // Setup mouse/touch drag controls for horizontal scrolling
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown && !this.isTransitioning) {
        // Drag camera horizontally only
        const dragSpeedX = pointer.velocity.x * 0.1;
        const newScrollX = this.cameras.main.scrollX - dragSpeedX;
        
        // Clamp scroll within bounds
        const maxScrollX = worldWidth - width;
        const clampedScrollX = Phaser.Math.Clamp(newScrollX, 0, maxScrollX);
        
        this.cameras.main.setScroll(clampedScrollX, 0);
      }
    });
    
    // Add mouse wheel scrolling (horizontal)
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: any[], _deltaX: number, deltaY: number) => {
      if (!this.isTransitioning) {
        const scrollSpeed = 50;
        const newScrollX = this.cameras.main.scrollX + (deltaY * scrollSpeed / 100);
        
        const maxScrollX = worldWidth - width;
        const clampedScrollX = Phaser.Math.Clamp(newScrollX, 0, maxScrollX);
        
        this.cameras.main.setScroll(clampedScrollX, 0);
      }
    });
    
    console.log(`📷 Camera setup: World ${worldWidth}x${worldHeight}, Viewport ${width}x${height}`);
  }

  shutdown() {
    super.shutdown();
    this.transitionManager.cleanup();
    
    this.isShuttingDown = true;
    
    if (this.resizeDebounceTimer) {
      this.resizeDebounceTimer.remove();
      this.resizeDebounceTimer = undefined;
    }
    
    this.houseImages.forEach(image => {
      if (image && image.input) {
        image.removeAllListeners();
        image.disableInteractive();
      }
    });
    
    this.houseImages = [];
    
    if (this.backButton) {
      this.cloudOverlays.forEach(cloud => cloud.destroy());
      this.cloudOverlays = [];
      const buttonBg = this.backButton.list[0] as Phaser.GameObjects.Rectangle;
      if (buttonBg && buttonBg.input) {
        buttonBg.removeAllListeners();
        buttonBg.disableInteractive();
      }
    }
    
    if (this.idleAnimationTimer) {
      this.idleAnimationTimer.remove();
      this.idleAnimationTimer = undefined;
    }
    
    this.tweens.killAll();
    this.progressCards.forEach(card => card.destroy());
    this.progressCards = [];
    this.cleanupEventListeners();
    this.cleanupBird();
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

  private prefetchAllHouseLessons(): void {
  if (this.houses.length === 0) {
    console.log('⏭️ No houses to prefetch');
    return;
  }

  console.log(`🚀 Starting prefetch for ${this.houses.length} houses`);

  const handlePrefetchLessons = this.registry.get('handlePrefetchLessons');

  if (handlePrefetchLessons && typeof handlePrefetchLessons === 'function') {
    this.houses.forEach(house => {
      // Skip mock modules - only prefetch real modules with valid UUIDs
      if (house.moduleBackendId && !house.moduleBackendId.startsWith('mock-')) {
        console.log(`🔄 Prefetching lessons for house: ${house.name} (${house.moduleBackendId})`);
        handlePrefetchLessons(house.moduleBackendId);
      }
    });
  } else {
    console.warn('⚠️ Prefetch handler not found in registry');
  }
}

  // ═══════════════════════════════════════════════════════════
  // UI CREATION METHODS
  // ═══════════════════════════════════════════════════════════
  private createUI(): void {
  this.createBackButton();

  if (this.houses.length > 0) {
    this.createEnvironment();
    this.createHouses();
    this.createBird();
    
    // Set all elements to alpha 0 initially
    this.setAllElementsInvisible();
    
    this.startBirdIdleAnimation();
  } else {
    this.createPlaceholder();
    
    // Set placeholder invisible initially
    if (this.placeholderCard) {
      this.placeholderCard.setAlpha(0);
    }
  }
}

  private createBackButton(): void {
    this.backButton = ButtonBuilder.createBackButton(
      this,
      () => this.handleBackToMap()
    );
  }

  private createEnvironment(): void {
    this.createDottedPaths();
  }

  private createDottedPaths(): void {
    const { width, height } = this.scale;
    
    for (let i = 0; i < this.houses.length - 1; i++) {
      const house1 = this.houses[i];
      const house2 = this.houses[i + 1];
      
      // Calculate positions for houses in 2-row format
      const pos1 = this.calculateHousePosition(i, width, height, house1);
      const pos2 = this.calculateHousePosition(i + 1, width, height, house2);
      
      // Create dotted path - pass the starting house index
      this.createDottedLine(pos1.x, pos1.y, pos2.x, pos2.y, i);
    }
  }

  private createDottedLine(
    x1: number, 
    y1: number, 
    x2: number, 
    y2: number,
    startHouseIndex: number
  ): void {
    // Line styling
    const lineColor = 0x5B9FE3; // Light blue color for path
    const dotSpacing = 100; // Space between dots (increased from 15)
    const dotSize = 48; // Size of each dot (increased from 8)
    
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Determine which section we're in based on starting house
    const sectionIndex = Math.floor(startHouseIndex / 2);
    const isUShapeSection = sectionIndex % 2 === 0;
    const isTransitionPath = startHouseIndex % 2 === 1;
    
    let controlX: number;
    let controlY: number;
    
    const curveDepth = distance * 0.7;
    controlX = midX;
    
    if (isUShapeSection) {
      controlY = midY + curveDepth;
    } else {
      if (isTransitionPath) {
        controlY = midY + curveDepth;
      } else {
        controlY = midY - curveDepth;
      }
    }
    
    // Calculate approximate number of dots along the curve
    const curveLength = this.estimateCurveLength(x1, y1, controlX, controlY, x2, y2);
    const numDots = Math.floor(curveLength / dotSpacing);

    let currentLength = 0;
    let prevX = x1;
    let prevY = y1;
    const steps = 200; // High precision for arc length calculation

    // First, build an array of points with their cumulative arc lengths
    const arcLengthPoints: Array<{ t: number; x: number; y: number; length: number }> = [];
    arcLengthPoints.push({ t: 0, x: x1, y: y1, length: 0 });

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const x = Math.pow(1 - t, 2) * x1 + 2 * (1 - t) * t * controlX + Math.pow(t, 2) * x2;
      const y = Math.pow(1 - t, 2) * y1 + 2 * (1 - t) * t * controlY + Math.pow(t, 2) * y2;
      
      const dx = x - prevX;
      const dy = y - prevY;
      currentLength += Math.sqrt(dx * dx + dy * dy);
      
      arcLengthPoints.push({ t, x, y, length: currentLength });
      
      prevX = x;
      prevY = y;
    }

    const totalLength = currentLength;

    // Create animated dots at equal arc-length intervals
    for (let i = 0; i <= numDots; i++) {
      const targetLength = (i / numDots) * totalLength;
      
      // Find the closest point in our arc-length array
      let closestPoint = arcLengthPoints[0];
      let minDiff = Math.abs(arcLengthPoints[0].length - targetLength);
      
      for (const point of arcLengthPoints) {
        const diff = Math.abs(point.length - targetLength);
        if (diff < minDiff) {
          minDiff = diff;
          closestPoint = point;
        }
      }
      
      // Create a separate graphics object for each dot for individual animation
      const dotGraphic = this.add.graphics();
      dotGraphic.setDepth(1);
      dotGraphic.fillStyle(lineColor, 0.4); // Start at low opacity
      dotGraphic.fillCircle(closestPoint.x, closestPoint.y, dotSize / 2);
      
      // Animate this dot with a delay based on its position
      this.tweens.add({
        targets: dotGraphic,
        alpha: { from: 0.4, to: 0.9 },
        duration: 500,
        delay: i * 120, // Stagger each dot by 120ms
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1, // Infinite loop
        repeatDelay: (numDots * 120) // Wait for all dots to complete before restarting
      });
      
      this.roads.push(dotGraphic as any);
    }
  }

  private setAllElementsInvisible(): void {
    // Set back button invisible
    if (this.backButton) {
      this.backButton.setAlpha(0);
    }
    
    // Set all house sprites invisible
    this.houseSprites.forEach(sprite => {
      sprite.setAlpha(0);
    });
    
    // Set all roads invisible
    this.roads.forEach(road => {
      road.setAlpha(0);
    });
    
    // Set cloud overlays invisible
    this.cloudOverlays.forEach(cloud => {
      cloud.setAlpha(0);
    });
    
    // Set bird invisible - use the proper getSprite() method
    if (this.bird) {
      const birdSprite = this.bird.getSprite();
      if (birdSprite) {
        birdSprite.setAlpha(0);
      }
    }
    
    // Set coin counter invisible (from BaseScene)
    if (this.coinCounter) {
      this.coinCounter.setAlpha(0);
    }

    this.progressCards.forEach(card => {
      card.setAlpha(0);
    });
  }

  // Helper method to estimate curve length
  private estimateCurveLength(
    x1: number, y1: number,
    cx: number, cy: number,
    x2: number, y2: number
  ): number {
    // Use line segments to approximate curve length
    let length = 0;
    let prevX = x1;
    let prevY = y1;
    const steps = 20;
    
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const x = Math.pow(1 - t, 2) * x1 + 2 * (1 - t) * t * cx + Math.pow(t, 2) * x2;
      const y = Math.pow(1 - t, 2) * y1 + 2 * (1 - t) * t * cy + Math.pow(t, 2) * y2;
      
      const dx = x - prevX;
      const dy = y - prevY;
      length += Math.sqrt(dx * dx + dy * dy);
      
      prevX = x;
      prevY = y;
    }
    
    return length;
  }

  private calculateHousePosition(index: number, width: number, height: number, _house: HousePosition): { x: number; y: number } {
    const isTopRow = index % 2 === 0;
    const columnIndex = Math.floor(index / 2);
    
    const startX = 15; // Start at 15% from left edge
    const horizontalSpacing = 80; // 50% spacing between houses
    const bottomRowOffset = 40; // Bottom row shifted to the right by 25%
    const topRowY = 35; // Top row at 30% from top
    const bottomRowY = 70; // Bottom row at 65% from top (35% vertical gap)
    
    // Calculate X position with offset for bottom row
    const defaultX = isTopRow 
      ? startX + (columnIndex * horizontalSpacing)  // Top row: 15%, 65%, 115%...
      : startX + (columnIndex * horizontalSpacing) + bottomRowOffset;  // Bottom row: 40%, 90%, 140%...
    
    const defaultY = isTopRow ? topRowY : bottomRowY;  // Always top or bottom, no progression
    
   
    const x = (defaultX / 100) * width;
    const y = (defaultY / 100) * height;
    
    // ORIGINAL CODE (use backend if available):
    // const x = house.x !== undefined ? (house.x / 100) * width : (defaultX / 100) * width;
    // const y = house.y !== undefined ? (house.y / 100) * height : (defaultY / 100) * height;
    
    console.log(`  - Final position: ${x}px, ${y}px (screen: ${width}x${height})`);
    
    return { x, y };
  }

  private createHouses(): void {
    this.houses.forEach((house, index) => this.createHouse(house, index));
  }

  private createHouse(house: HousePosition, index: number): void {
  const { width, height } = this.scale;
  
  const { x, y } = this.calculateHousePosition(index, width, height, house);

  const houseContainer = this.add.container(x, y);
  houseContainer.setDepth(2);

  // Determine if house has backend data
  const hasBackendData = !!(house.moduleBackendId && !house.moduleBackendId.startsWith('mock-'));

  // Create house icon
  if (house.houseType) {
    this.createHouseIcon(houseContainer, house.houseType, house.isLocked);
  }

  // Add cloud overlay
  if (!hasBackendData && house.houseType) {
    const cloudOverlay = this.add.image(x, y - scale(50), ASSET_KEYS.HOUSE_CLOUD);
    cloudOverlay.setDisplaySize(scale(700), scale(700));
    cloudOverlay.setAlpha(0.9);
    cloudOverlay.setDepth(10);
    this.cloudOverlays.push(cloudOverlay);
  }

  // ADD PROGRESS CARD - positioned to the right-middle of the house
  const progressCardX = x + scale(250); // Right side of house
  const progressCardY = y; // Middle height

  // Get progress data from backend (if available)
  const moduleProgress = this.moduleProgressMap?.get(house.moduleBackendId || '');

  // Log what we found for debugging
  if (house.moduleBackendId) {
    console.log(`🏠 House "${house.name}":`, {
      moduleBackendId: house.moduleBackendId,
      hasProgressData: !!moduleProgress,
      progressPercent: moduleProgress ? parseFloat(moduleProgress.completion_percentage) : 0,
      lessonCount: moduleProgress?.module.lesson_count || 0,
    });
  }

  // Prepare progress data with REAL backend values
  const progressData: HouseProgressData = {
    moduleNumber: index + 1,
    moduleName: house.name,
    // ✅ Real duration from backend
    duration: this.formatDuration(moduleProgress?.module.estimated_duration_minutes || 0),
    // ✅ Real progress status
    hasProgress: moduleProgress ? moduleProgress.lessons_completed > 0 : false,
    // ✅ Real progress percentage (tree will grow based on this!)
    progressPercent: moduleProgress ? parseFloat(moduleProgress.completion_percentage) : 0,
    // ✅ Real lesson count
    lessonCount: moduleProgress?.module.lesson_count || 0,
    // ⚠️ TEMPORARY: Use lesson count as quiz count (backend doesn't provide quiz_count yet)
    quizCount: moduleProgress?.module.lesson_count || 0,
    coinReward: house.coinReward,
  };

  const progressCard = HouseProgressCard.createProgressCard(
    this,
    progressCardX,
    progressCardY,
    progressData,
    () => {
      if (!house.isLocked) {
        this.travelToHouse(index);
      }
    }
  );
  progressCard.setAlpha(0); // Start invisible for fade-in
  progressCard.setDepth(3); // Above houses
  
  // Store the progress card for fade-in animation
  if (!this.progressCards) {
    this.progressCards = [];
  }
  this.progressCards.push(progressCard);

  // Note: nameLabel removed since module name is now in the progress card
  // If you want to keep the nameLabel below the house, uncomment below:
  /*
  const nameLabel = this.add.text(0, scale(90), house.name,
    createTextStyle('CAPTION', COLORS.TEXT_PRIMARY, {
      fontSize: scaleFontSize(14),
      backgroundColor: '#ffffff',
      padding: { x: scale(8), y: scale(4) },
    })
  ).setOrigin(0.5);
  houseContainer.add(nameLabel);
  */

  // Add coin reward badge if available
  if (house.coinReward && house.coinReward > 0) {
    this.createCoinBadge(houseContainer, house.coinReward);
  }

  if (house.isLocked) {
    houseContainer.setAlpha(OPACITY.MEDIUM);
    this.createLockIcon(houseContainer);
  }

  this.houseSprites.set(house.id, houseContainer);
}

  private createHouseIcon(
    container: Phaser.GameObjects.Container, 
    houseType: string, 
    isLocked?: boolean
  ): void {
    const houseImage = this.add.image(0, 0, houseType);
    houseImage.setScale(scale(1));
    
    if (isLocked) {
      houseImage.setTint(0x999999);
    }
    
    container.add(houseImage);
  }

  private createCoinBadge(container: Phaser.GameObjects.Container, coinReward: number): void {
    const badgeBg = this.add.circle(scale(50), scale(-50), scale(20), 0xFFD700);
    badgeBg.setStrokeStyle(scale(2), 0xFFA500);
    container.add(badgeBg);

    // BEFORE (Fredoka):
    // const coinText = this.add.text(scale(50), scale(-50), `${coinReward}`, {
    //   fontSize: scaleFontSize(12),
    //   fontFamily: 'Fredoka, sans-serif',
    //   color: '#000000',
    //   fontStyle: 'bold',
    // }).setOrigin(0.5);
    
    // AFTER (Onest):
    const coinText = this.add.text(scale(50), scale(-50), `${coinReward}`,
      createTextStyle('BADGE', '#000000', {
        fontSize: scaleFontSize(12),
      })
    ).setOrigin(0.5);
    container.add(coinText);
  }

  private createLockIcon(container: Phaser.GameObjects.Container): void {
    const lockBg = this.add.circle(scale(-50), scale(-50), scale(18), 0xFF6B6B);
    lockBg.setStrokeStyle(scale(2), 0xCC0000);
    container.add(lockBg);

    const lockIcon = this.add.text(scale(-50), scale(-50), '🔒', {
      fontSize: scaleFontSize(20),
    }).setOrigin(0.5);
    container.add(lockIcon);
  }

  private fadeInScene(): void {
    const fadeDuration = 600;
    const staggerDelay = 50;
    
    // Fade in back button
    if (this.backButton) {
      this.tweens.add({
        targets: this.backButton,
        alpha: 1,
        duration: fadeDuration,
        ease: 'Cubic.easeOut'
      });
    }

    // Fade in progress cards
    this.progressCards.forEach((card, index) => {
      this.tweens.add({
        targets: card,
        alpha: 1,
        duration: fadeDuration,
        delay: 150 + (index * staggerDelay),
        ease: 'Cubic.easeOut'
      });
    });
    
    // Fade in coin counter
    if (this.coinCounter) {
      this.tweens.add({
        targets: this.coinCounter,
        alpha: 1,
        duration: fadeDuration,
        ease: 'Cubic.easeOut'
      });
    }
    
    // Fade in roads first (background layer)
    this.roads.forEach((road, index) => {
      this.tweens.add({
        targets: road,
        alpha: 1,
        duration: fadeDuration,
        delay: index * staggerDelay,
        ease: 'Cubic.easeOut'
      });
    });
    
    // Fade in house sprites (middle layer)
    const houseSpritesArray = Array.from(this.houseSprites.values());
    houseSpritesArray.forEach((sprite, index) => {
      this.tweens.add({
        targets: sprite,
        alpha: 1,
        duration: fadeDuration,
        delay: 100 + (index * staggerDelay),
        ease: 'Cubic.easeOut'
      });
    });
    
    // Fade in cloud overlays to 0.9 (NOT 1.0)
    this.cloudOverlays.forEach((cloud, index) => {
      this.tweens.add({
        targets: cloud,
        alpha: 0.9,  // CHANGED FROM 1 TO 0.9
        duration: fadeDuration,
        delay: 200 + (index * staggerDelay),
        ease: 'Cubic.easeOut'
      });
    });
    
    // Fade in bird last (top layer)
    if (this.bird) {
      const birdSprite = this.bird.getSprite();
      if (birdSprite) {
        this.tweens.add({
          targets: birdSprite,
          alpha: 1,
          duration: fadeDuration,
          delay: 300,
          ease: 'Cubic.easeOut'
        });
      }
    }
    
    // Fade in placeholder if no houses
    if (this.placeholderCard) {
      this.tweens.add({
        targets: this.placeholderCard,
        alpha: 1,
        duration: fadeDuration,
        ease: 'Cubic.easeOut'
      });
    }
  }


  private createPlaceholder(): void {
    const { width, height } = this.scale;

    this.placeholderCard = CardBuilder.createHeaderCard({
      scene: this,
      x: width / 2,
      y: height / 2,
      width: scale(500),
      height: scale(550),
      iconText: '🏘️',
      titleText: 'Neighborhood View',
      subtitleText: this.neighborhoodId
        ? `Neighborhood: ${this.neighborhoodId}`
        : 'No neighborhood selected',
      iconCircleColor: COLORS.ORANGE_500,
    });

    const description = UIComponents.createSubtitle(
      this,
      'Houses and learning modules\nwill appear here once configured.',
      16,
      COLORS.TEXT_SECONDARY
    );
    description.setPosition(0, scale(-60));
    this.placeholderCard.add(description);

    const featuresText = UIComponents.createSubtitle(
      this,
      'Coming soon:\n• Multiple houses per neighborhood\n• Character navigation\n• Progress tracking\n• Interactive learning paths',
      14,
      COLORS.TEXT_SECONDARY
    );
    featuresText.setPosition(0, scale(60));
    this.placeholderCard.add(featuresText);
  }

  // ═══════════════════════════════════════════════════════════
  // BIRD CHARACTER METHODS
  // ═══════════════════════════════════════════════════════════
  private createBird(): void {
    if (this.houses.length === 0) return;

    const { width, height } = this.scale;
    const currentHouse = this.houses[this.currentHouseIndex];
    
    const { x: houseX, y: houseY } = this.calculateHousePosition(this.currentHouseIndex, width, height, currentHouse);
    
    const birdOffsetX = width * 0.04;
    const birdOffsetY = height * 0.025;
    
    const birdX = houseX + birdOffsetX;
    const birdY = houseY + birdOffsetY;

    this.bird = new BirdCharacter(this);
    this.bird.createStatic(birdX, birdY);
  }

  private startBirdIdleAnimation(): void {
    if (this.idleAnimationTimer) {
      this.idleAnimationTimer.remove();
    }
    
    this.isShuttingDown = false;
    
    const scheduleNextIdleHop = () => {
      if (this.isShuttingDown) return;
      
      const randomDelay = Phaser.Math.Between(5000, 8000);
      
      this.idleAnimationTimer = this.time.delayedCall(randomDelay, () => {
        if (this.isShuttingDown) return;
        if (!this.bird?.getIsAnimating() && !this.isTransitioning) {
          this.playBirdIdleHop();
        }
        scheduleNextIdleHop();
      });
    };
    
    scheduleNextIdleHop();
  }

  private playBirdIdleHop(): void {
    if (!this.bird || this.bird.getIsAnimating() || this.houses.length === 0) return;

    const { width, height } = this.scale;
    const currentHouse = this.houses[this.currentHouseIndex];
    
    const { x: houseX } = this.calculateHousePosition(this.currentHouseIndex, width, height, currentHouse);
    
    const birdOffsetX = width * 0.04;
    const houseCenterX = houseX + birdOffsetX;
    const houseAreaRadius = width * 0.05;

    this.bird.playIdleHopWithBoundary(houseCenterX, houseAreaRadius);
  }

  private travelToHouse(targetHouseIndex: number): void {
    if (!this.bird || this.bird.getIsAnimating() || targetHouseIndex >= this.houses.length) return;

    this.bird.setIsAnimating(true);
    this.previousHouseIndex = this.currentHouseIndex;
    this.currentHouseIndex = targetHouseIndex;

    const { width, height } = this.scale;
    const targetHouse = this.houses[targetHouseIndex];
    
    const { x: targetX, y: targetY } = this.calculateHousePosition(targetHouseIndex, width, height, targetHouse);
    
    const birdOffsetX = width * 0.04;
    const birdOffsetY = height * 0.025;
    
    const finalX = targetX + birdOffsetX;
    const finalY = targetY + birdOffsetY;

    const houseDistance = Math.abs(targetHouseIndex - this.previousHouseIndex);

    if (houseDistance > 1) {
      this.bird.glideToPosition(finalX, finalY, houseDistance, () => {
        if (!this.isShuttingDown && this.scene.isActive(SCENE_KEYS.NEIGHBORHOOD)) {
          this.handleHouseClick(targetHouse);
        }
      });
    } else {
      this.bird.hopToPosition(finalX, finalY, () => {
        if (!this.isShuttingDown && this.scene.isActive(SCENE_KEYS.NEIGHBORHOOD)) {
          this.handleHouseClick(targetHouse);
        }
      });
    }
  }

  // ═══════════════════════════════════════════════════════════
  // EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════
  private handleHouseClick(house: HousePosition): void {
    if (this.isTransitioning) return;

    this.isTransitioning = true;

    this.registry.set('currentHouseIndex', this.currentHouseIndex);
    this.registry.set('birdTravelInfo', {
      previousHouseIndex: this.previousHouseIndex,
      currentHouseIndex: this.currentHouseIndex,
      traveled: this.previousHouseIndex !== this.currentHouseIndex,
    });

    const handleHouseSelect = this.registry.get('handleHouseSelect');

    if (handleHouseSelect && typeof handleHouseSelect === 'function') {
      this.transitionToHouse(() => {
        // Pass both house.id AND house.moduleBackendId
        handleHouseSelect(house.id, house.moduleBackendId);
        this.isTransitioning = false;
      });
    }
  }

  private handleBackToMap(): void {
    if (this.isTransitioning) return;

    this.isTransitioning = true;

    const handleBackToMap = this.registry.get('handleBackToMap');

    if (handleBackToMap && typeof handleBackToMap === 'function') {
      this.transitionToMap(() => {
        handleBackToMap();
        this.isTransitioning = false;
      });
    }
  }

  private handleResize(): void {
    if (this.resizeDebounceTimer) {
      this.resizeDebounceTimer.remove();
    }
    
    this.resizeDebounceTimer = this.time.delayedCall(100, () => {
      this.performResize();
      this.resizeDebounceTimer = undefined;
    });
  }

  private performResize(): void {
    this.tweens.killAll();
    
    this.progressCards.forEach(card => card.destroy());
    this.progressCards = [];
    
    this.houseImages = [];
    
    if (this.backButton) this.backButton.destroy();
    this.roads.forEach(road => road.destroy());
    this.roads = [];
    this.houseSprites.forEach(sprite => sprite.destroy());
    this.houseSprites.clear();
    if (this.placeholderCard) this.placeholderCard.destroy();
    this.cloudOverlays.forEach(cloud => cloud.destroy());
    this.cloudOverlays = [];

    this.handleCoinCounterResize();
    
    // Recalculate camera bounds for new size
    const { width, height } = this.scale;
    const worldWidth = width * 2.5;
    const worldHeight = height;
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    
    // Reset camera scroll if it's out of new bounds
    const maxScrollX = Math.max(0, worldWidth - width);
    const currentScrollX = this.cameras.main.scrollX;
    if (currentScrollX > maxScrollX) {
      this.cameras.main.setScroll(maxScrollX, 0);
    }
    
    if (this.bird && this.houses.length > 0) {
      const currentHouse = this.houses[this.currentHouseIndex];
      const { x, y } = this.calculateHousePosition(this.currentHouseIndex, width, height, currentHouse);
      const birdOffsetX = width * 0.04;
      const birdOffsetY = height * 0.025;
      const birdX = x + birdOffsetX;
      const birdY = y + birdOffsetY;
      
      this.bird.setPosition(birdX, birdY);
      this.bird.handleResize();
    }
    
    this.createBackButton();
    
    if (this.houses.length > 0) {
      this.createEnvironment();
      this.createHouses();
      
      // Set all elements invisible before fading them in
      this.setAllElementsInvisible();
      // Fade in all elements (including clouds)
      this.fadeInScene();
    } else {
      this.createPlaceholder();
    }
  }

  /**
   * Format duration in minutes to readable string
   */
  private formatDuration(minutes: number): string {
    if (!minutes || minutes === 0) return '0 min';
    
    if (minutes < 60) {
      return `${minutes} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  // ═══════════════════════════════════════════════════════════
  // TRANSITION METHODS
  // ═══════════════════════════════════════════════════════════
  private transitionToHouse(callback: () => void): void {
    this.transitionManager.toHouse(callback); // Use manager
  }

  private transitionToMap(callback: () => void): void {
    this.transitionManager.backToMap(callback); // Use manager
  }
}