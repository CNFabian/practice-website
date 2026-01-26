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
  // REMOVED: private platform?: Phaser.GameObjects.Image;
  private roads: Phaser.GameObjects.Graphics[] = []; // Changed from Image[] to Graphics[]
  private idleAnimationTimer?: Phaser.Time.TimerEvent;
  private houseImages: Phaser.GameObjects.Image[] = [];
  private isShuttingDown: boolean = false;
  private resizeDebounceTimer?: Phaser.Time.TimerEvent;
  private cloudOverlays: Phaser.GameObjects.Image[] = []; // Track cloud overlays separately


  // Bird character properties
  private bird?: BirdCharacter;
  private currentHouseIndex: number = 0;
  private previousHouseIndex: number = 0;

  // ═══════════════════════════════════════════════════════════
  // CONSTRUCTOR
  // ═══════════════════════════════════════════════════════════
  constructor() {
    super({ key: SCENE_KEYS.NEIGHBORHOOD });
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
        houseType: ASSET_KEYS.HOUSE_1, // Reuse house type
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
    
    // Setup camera for horizontal scrolling
    this.setupCamera();
    
    this.createUI();
    this.setupEventListeners();
    this.prefetchAllHouseLessons(); 
  }

  // ═══════════════════════════════════════════════════════════
  // CAMERA SETUP FOR SCROLLING
  // ═══════════════════════════════════════════════════════════
  private setupCamera(): void {
    const { width, height } = this.scale;
    
    // Calculate world width based on houses spread
    // Last house at ~165% of screen width (top row house at index 4)
    const worldWidth = width * 2.5; // Extended world for 5 houses with wide spacing
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
        if (house.moduleBackendId) {
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
      this.startBirdIdleAnimation();
    } else {
      this.createPlaceholder();
    }
  }

  private createBackButton(): void {
    this.backButton = ButtonBuilder.createBackButton(
      this,
      () => this.handleBackToMap()
    );
  }

  private createEnvironment(): void {
    // Platform removed - no longer needed
    this.createDottedPaths();
  }

  // REMOVED: createPlatform() method - no longer needed

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
    const graphics = this.add.graphics();
    graphics.setDepth(1);
    
    // Line styling
    const lineColor = 0x93c5fd; // Light blue color for path
    const dotSpacing = 48; // Space between dots (increased from 15)
    const dotSize = 18; // Size of each dot (increased from 8)
    
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // CONTINUOUS SINE WAVE PATTERN:
    // The wave alternates between U and n shapes every 2 houses
    // But we need to handle transitions smoothly
    //
    // H0→H1→H2: U shape (curve DOWN)
    // H2→H3→H4: n shape (curve UP) - but H3→H4 needs to transition DOWN
    // H4→H5: U shape continues
    
    // Determine which section we're in based on starting house
    const sectionIndex = Math.floor(startHouseIndex / 2);
    const isUShapeSection = sectionIndex % 2 === 0;
    
    // Check if this is a transition path (last path of a section going to next section)
    // Transition paths are: H1→H2, H3→H4, H5→H6, etc. (odd index paths)
    const isTransitionPath = startHouseIndex % 2 === 1;
    
    let controlX: number;
    let controlY: number;
    
    const curveDepth = distance * 0.4;
    controlX = midX;
    
    if (isUShapeSection) {
      // U shape section: curve DOWN
      controlY = midY + curveDepth;
    } else {
      // n shape section: curve UP
      // BUT if this is the transition path (e.g., H3→H4), we need to curve DOWN
      // to smoothly connect to the next U section
      if (isTransitionPath) {
        controlY = midY + curveDepth; // Transition: curve DOWN
      } else {
        controlY = midY - curveDepth; // Normal n shape: curve UP
      }
    }
    
    // Calculate approximate number of dots along the curve
    const curveLength = this.estimateCurveLength(x1, y1, controlX, controlY, x2, y2);
    const numDots = Math.floor(curveLength / dotSpacing);
    
    // Draw dots along the curved path
    graphics.fillStyle(lineColor, 0.7);

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

    // Now place dots at equal arc-length intervals
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
      
      // Draw circular dot at the found position
      graphics.fillCircle(closestPoint.x, closestPoint.y, dotSize / 2);
    }
    
    this.roads.push(graphics as any); // Store for cleanup
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

  private calculateHousePosition(index: number, width: number, height: number, house: HousePosition): { x: number; y: number } {
    // Alternating: top row (index 0, 2, 4...), bottom row (index 1, 3, 5...)
    const isTopRow = index % 2 === 0;
    const columnIndex = Math.floor(index / 2);
    
    // WIDER SPACING FOR HORIZONTAL SCROLL
    const startX = 15; // Start at 15% from left edge
    const horizontalSpacing = 50; // 50% spacing between houses (MUCH WIDER)
    const bottomRowOffset = 25; // Bottom row shifted to the right by 25%
    const topRowY = 30; // Top row at 30% from top
    const bottomRowY = 65; // Bottom row at 65% from top (35% vertical gap)
    
    // Calculate X position with offset for bottom row
    // Top row (0, 2, 4...): stays in columns
    // Bottom row (1, 3, 5...): offset to the right, but stays in same column group
    const defaultX = isTopRow 
      ? startX + (columnIndex * horizontalSpacing)  // Top row: 15%, 65%, 115%...
      : startX + (columnIndex * horizontalSpacing) + bottomRowOffset;  // Bottom row: 40%, 90%, 140%...
    
    const defaultY = isTopRow ? topRowY : bottomRowY;  // Always top or bottom, no progression
    
    // DEBUG: Log what we're calculating vs what backend provides
    console.log(`🏠 House ${index} (${house.name}):`);
    console.log(`  - Calculated: ${defaultX}%, ${defaultY}%`);
    console.log(`  - Backend: x=${house.x}, y=${house.y}`);
    console.log(`  - Row: ${isTopRow ? 'TOP' : 'BOTTOM'}, Column: ${columnIndex}`);
    
    // TEMPORARY FIX: Force using calculated positions (ignore backend x/y)
    // Remove this after confirming the layout works, then update backend data
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

    // Create house icon (without cloud - cloud added separately below)
    if (house.houseType) {
      this.createHouseIcon(houseContainer, house.houseType, house.isLocked);
    }

    // Add cloud overlay OUTSIDE container if no backend data (prevents clipping)
    if (!hasBackendData && house.houseType) {
      const cloudOverlay = this.add.image(x, y - scale(50), ASSET_KEYS.HOUSE_CLOUD);
      cloudOverlay.setDisplaySize(scale(700), scale(700));
      cloudOverlay.setAlpha(0.9);
      cloudOverlay.setDepth(10);
      this.cloudOverlays.push(cloudOverlay); // Track for cleanup
    }

    // Create house name label (module title from backend)
    const nameLabel = this.add.text(0, scale(90), house.name, {
      fontSize: scaleFontSize(14),
      fontFamily: 'Fredoka, sans-serif',
      color: COLORS.TEXT_PRIMARY,
      fontStyle: 'bold',
      backgroundColor: '#ffffff',
      padding: { x: scale(8), y: scale(4) },
    }).setOrigin(0.5);
    houseContainer.add(nameLabel);

    // Add coin reward badge if available
    if (house.coinReward && house.coinReward > 0) {
      this.createCoinBadge(houseContainer, house.coinReward);
    }

    // Make interactive if not locked
    if (!house.isLocked) {
      this.makeHouseInteractive(houseContainer, house);
    } else {
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
    houseImage.setDisplaySize(scale(250), scale(250));
    
    if (isLocked) {
      houseImage.setTint(0x999999);
    }
    
    container.add(houseImage);
  }

  private createCoinBadge(container: Phaser.GameObjects.Container, coinReward: number): void {
    const badgeBg = this.add.circle(scale(50), scale(-50), scale(20), 0xFFD700);
    badgeBg.setStrokeStyle(scale(2), 0xFFA500);
    container.add(badgeBg);

    const coinText = this.add.text(scale(50), scale(-50), `${coinReward}`, {
      fontSize: scaleFontSize(12),
      fontFamily: 'Fredoka, sans-serif',
      color: '#000000',
      fontStyle: 'bold',
    }).setOrigin(0.5);
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

  private makeHouseInteractive(
    container: Phaser.GameObjects.Container,
    house: HousePosition
  ): void {
    const background = container.list[0] as Phaser.GameObjects.Image;
    
    if (background) {
      background.setInteractive({
        useHandCursor: true,
        pixelPerfect: true,
        alphaTolerance: 1
      });
      
      this.houseImages.push(background);
      
      const originalWidth = background.displayWidth;
      const originalHeight = background.displayHeight;
      
      background.on('pointerover', () => {
        this.tweens.add({
          targets: background,
          displayWidth: originalWidth * 1.1,
          displayHeight: originalHeight * 1.1,
          duration: 200,
          ease: 'Power2',
        });
      });

      background.on('pointerout', () => {
        this.tweens.add({
          targets: background,
          displayWidth: originalWidth,
          displayHeight: originalHeight,
          duration: 200,
          ease: 'Power2',
        });
      });
      
      background.on('pointerdown', () => {
        if (!this.isTransitioning) {
          const targetIndex = this.houses.findIndex(h => h.id === house.id);
          
          if (targetIndex !== -1 && targetIndex !== this.currentHouseIndex) {
            this.travelToHouse(targetIndex);
          } else if (targetIndex === this.currentHouseIndex) {
            this.handleHouseClick(house);
          }
        }
      });
      
      if (background.input) {
        background.input.cursor = 'pointer';
      }
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
    
    this.houseImages = [];
    
    if (this.backButton) this.backButton.destroy();
    this.roads.forEach(road => road.destroy());
    this.roads = [];
    // REMOVED: if (this.platform) this.platform.destroy();
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
    } else {
      this.createPlaceholder();
    }
  }

  // ═══════════════════════════════════════════════════════════
  // TRANSITION METHODS
  // ═══════════════════════════════════════════════════════════
  private transitionToHouse(callback: () => void): void {
    callback();
  }

  private transitionToMap(callback: () => void): void {
    callback();
  }
}