import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { scale, scaleFontSize } from '../utils/scaleHelper';
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
  private progressCards: Map<number, Phaser.GameObjects.Container> = new Map();
  private moduleProgressMap?: Map<string, any>;
  private lockedTooltips: Map<string, Phaser.GameObjects.Container> = new Map();
  private grassLayer?: Phaser.GameObjects.TileSprite;
  private houseHoverTweens: Map<string, Phaser.Tweens.Tween> = new Map();
  private backgroundClouds: Phaser.GameObjects.Image[] = [];
  private cloudTweens: Phaser.Tweens.Tween[] = [];

  // Scrollbar properties
  private scrollbarTrack?: Phaser.GameObjects.Graphics;
  private scrollbarThumb?: Phaser.GameObjects.Graphics;
  private scrollbarThumbZone?: Phaser.GameObjects.Zone;
  private isScrollbarDragging: boolean = false;
  private scrollbarDragStartX: number = 0;
  private scrollbarDragStartScrollX: number = 0;

  // Bird character properties
  private bird?: BirdCharacter;
  private currentHouseIndex: number = 0;
  private previousHouseIndex: number = 0;
  private isBirdTraveling: boolean = false;

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
    this.isBirdTraveling = false;
    this.currentHouseIndex = data.currentHouseIndex ?? 0;
    this.previousHouseIndex = this.currentHouseIndex;
    
    console.log('🏘️ NeighborhoodScene init with houses:', this.houses);
    console.log(`📊 Total houses: ${this.houses.length}`);
    
    // Clear existing data
    this.houseSprites.clear();
    this.houseImages = [];
    this.roads = [];
    this.lockedTooltips.clear();
    
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
        isLocked: true,
        moduleId: 1,
        moduleBackendId: 'mock-module-1',
        description: 'Learn the basics of home buying',
        coinReward: 100,
      },
      {
        id: 'mock-house-2',
        name: 'Financial Planning',
        houseType: ASSET_KEYS.HOUSE_2,
        isLocked: true,
        moduleId: 2,
        moduleBackendId: 'mock-module-2',
        description: 'Master your finances for home ownership',
        coinReward: 150,
      },
      {
        id: 'mock-house-3',
        name: 'Property Search',
        houseType: ASSET_KEYS.HOUSE_3,
        isLocked: true,
        moduleId: 3,
        moduleBackendId: 'mock-module-3',
        description: 'Find your perfect home',
        coinReward: 200,
      },
      {
        id: 'mock-house-4',
        name: 'Making an Offer',
        houseType: ASSET_KEYS.HOUSE_4,
        isLocked: true,
        moduleId: 4,
        moduleBackendId: 'mock-module-4',
        description: 'Negotiate and secure your home',
        coinReward: 250,
      },
      {
        id: 'mock-house-5',
        name: 'Closing Process',
        houseType: ASSET_KEYS.HOUSE_5,
        isLocked: true,
        moduleId: 5,
        moduleBackendId: 'mock-module-5',
        description: 'Complete your home purchase',
        coinReward: 300,
      },
    ];
  }

  create() {
    super.create();
    
    // Set background image on DOM element (like MapScene does)
    const bgElement = document.getElementById('section-background');
    if (bgElement) {
      // Sky blue gradient
      bgElement.style.setProperty(
        'background', 
        'linear-gradient(180deg, #EBEFFF 0%, #DDE3FF 100%)', 
        'important'
      );
    }
    
    this.transitionManager = new SceneTransitionManager(this);
    this.transitionManager.enterNeighborhood();
    
    // Setup camera for horizontal scrolling
    this.setupCamera();
    this.createScrollbar();

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

    this.createBackgroundClouds();
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
      if (pointer.isDown && !this.isTransitioning && !this.isBirdTraveling && !this.isScrollbarDragging) {
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
      if (!this.isTransitioning && !this.isBirdTraveling) {
        const scrollSpeed = 50;
        const newScrollX = this.cameras.main.scrollX + (deltaY * scrollSpeed / 100);
        
        const maxScrollX = worldWidth - width;
        const clampedScrollX = Phaser.Math.Clamp(newScrollX, 0, maxScrollX);
        
        this.cameras.main.setScroll(clampedScrollX, 0);
      }
    });
    
    console.log(`📷 Camera setup: World ${worldWidth}x${worldHeight}, Viewport ${width}x${height}`);
  }

  // ═══════════════════════════════════════════════════════════
  // SCROLLBAR
  // ═══════════════════════════════════════════════════════════
  private createScrollbar(): void {
    const { width, height } = this.scale;
    const worldWidth = width * 2.5;

    // Scrollbar dimensions
    const trackHeight = scale(6);
    const trackMarginX = scale(40);
    const trackY = height - scale(20);
    const trackWidth = width - trackMarginX * 2;

    // Thumb width is proportional to how much of the world is visible
    const viewRatio = width / worldWidth;
    const thumbWidth = Math.max(trackWidth * viewRatio, scale(40));

    // Track (background)
    this.scrollbarTrack = this.add.graphics();
    this.scrollbarTrack.fillStyle(COLORS.UNAVAILABLE_BUTTON, 0.3);
    this.scrollbarTrack.fillRoundedRect(trackMarginX, trackY - trackHeight / 2, trackWidth, trackHeight, trackHeight / 2);
    this.scrollbarTrack.setScrollFactor(0);
    this.scrollbarTrack.setDepth(100);

    // Thumb (draggable indicator)
    this.scrollbarThumb = this.add.graphics();
    this.scrollbarThumb.fillStyle(COLORS.LOGO_BLUE, 0.5);
    this.scrollbarThumb.fillRoundedRect(0, 0, thumbWidth, trackHeight, trackHeight / 2);
    this.scrollbarThumb.setScrollFactor(0);
    this.scrollbarThumb.setDepth(101);
    this.scrollbarThumb.setPosition(trackMarginX, trackY - trackHeight / 2);

    // Interactive zone for thumb dragging
    this.scrollbarThumbZone = this.add.zone(
      trackMarginX + thumbWidth / 2,
      trackY,
      thumbWidth,
      scale(30) // Larger hit area for easier grabbing
    );
    this.scrollbarThumbZone.setScrollFactor(0);
    this.scrollbarThumbZone.setDepth(102);
    this.scrollbarThumbZone.setInteractive({ useHandCursor: true, draggable: true });

    // Drag events
    this.input.setDraggable(this.scrollbarThumbZone);

    this.scrollbarThumbZone.on('dragstart', (pointer: Phaser.Input.Pointer) => {
      this.isScrollbarDragging = true;
      this.scrollbarDragStartX = pointer.x;
      this.scrollbarDragStartScrollX = this.cameras.main.scrollX;
      // Increase thumb opacity on drag
      if (this.scrollbarThumb) {
        this.scrollbarThumb.clear();
        this.scrollbarThumb.fillStyle(COLORS.LOGO_BLUE, 0.8);
        this.scrollbarThumb.fillRoundedRect(0, 0, thumbWidth, trackHeight, trackHeight / 2);
      }
    });

    this.scrollbarThumbZone.on('drag', (pointer: Phaser.Input.Pointer) => {
      if (!this.isScrollbarDragging) return;

      const dragDeltaX = pointer.x - this.scrollbarDragStartX;
      const maxScrollX = worldWidth - width;
      const scrollableTrackWidth = trackWidth - thumbWidth;

      // Convert track drag to camera scroll
      const scrollRatio = maxScrollX / scrollableTrackWidth;
      const newScrollX = this.scrollbarDragStartScrollX + dragDeltaX * scrollRatio;
      const clampedScrollX = Phaser.Math.Clamp(newScrollX, 0, maxScrollX);

      this.cameras.main.setScroll(clampedScrollX, 0);
    });

    this.scrollbarThumbZone.on('dragend', () => {
      this.isScrollbarDragging = false;
      // Restore thumb opacity
      if (this.scrollbarThumb) {
        this.scrollbarThumb.clear();
        this.scrollbarThumb.fillStyle(COLORS.LOGO_BLUE, 0.5);
        this.scrollbarThumb.fillRoundedRect(0, 0, thumbWidth, trackHeight, trackHeight / 2);
      }
    });

    // Hover effects
    this.scrollbarThumbZone.on('pointerover', () => {
      if (!this.isScrollbarDragging && this.scrollbarThumb) {
        this.scrollbarThumb.clear();
        this.scrollbarThumb.fillStyle(COLORS.LOGO_BLUE, 0.7);
        this.scrollbarThumb.fillRoundedRect(0, 0, thumbWidth, trackHeight, trackHeight / 2);
      }
    });

    this.scrollbarThumbZone.on('pointerout', () => {
      if (!this.isScrollbarDragging && this.scrollbarThumb) {
        this.scrollbarThumb.clear();
        this.scrollbarThumb.fillStyle(COLORS.LOGO_BLUE, 0.5);
        this.scrollbarThumb.fillRoundedRect(0, 0, thumbWidth, trackHeight, trackHeight / 2);
      }
    });

    // Click on track to jump to position
    const trackZone = this.add.zone(
      width / 2,
      trackY,
      trackWidth,
      scale(30)
    );
    trackZone.setScrollFactor(0);
    trackZone.setDepth(99); // Below thumb
    trackZone.setInteractive({ useHandCursor: true });
    trackZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const clickX = pointer.x - trackMarginX;
      const maxScrollX = worldWidth - width;
      const scrollableTrackWidth = trackWidth - thumbWidth;
      const ratio = Phaser.Math.Clamp((clickX - thumbWidth / 2) / scrollableTrackWidth, 0, 1);
      const targetScrollX = ratio * maxScrollX;

      // Smooth scroll to position
      this.tweens.add({
        targets: this.cameras.main,
        scrollX: targetScrollX,
        duration: 300,
        ease: 'Cubic.easeOut'
      });
    });
  }

  private updateScrollbarPosition(): void {
    if (!this.scrollbarThumb || !this.scrollbarThumbZone) return;

    const { width } = this.scale;
    const worldWidth = width * 2.5;
    const trackMarginX = scale(40);
    const trackWidth = width - trackMarginX * 2;
    const viewRatio = width / worldWidth;
    const thumbWidth = Math.max(trackWidth * viewRatio, scale(40));
    const scrollableTrackWidth = trackWidth - thumbWidth;
    const maxScrollX = worldWidth - width;

    const scrollRatio = maxScrollX > 0 ? this.cameras.main.scrollX / maxScrollX : 0;
    const thumbX = trackMarginX + scrollRatio * scrollableTrackWidth;

    this.scrollbarThumb.setPosition(thumbX, this.scrollbarThumb.y);
    this.scrollbarThumbZone.setPosition(thumbX + thumbWidth / 2, this.scrollbarThumbZone.y);
  }

  private destroyScrollbar(): void {
    if (this.scrollbarTrack) {
      this.scrollbarTrack.destroy();
      this.scrollbarTrack = undefined;
    }
    if (this.scrollbarThumb) {
      this.scrollbarThumb.destroy();
      this.scrollbarThumb = undefined;
    }
    if (this.scrollbarThumbZone) {
      this.scrollbarThumbZone.removeAllListeners();
      this.scrollbarThumbZone.destroy();
      this.scrollbarThumbZone = undefined;
    }
    this.isScrollbarDragging = false;
  }

  shutdown() {
    super.shutdown();
    this.transitionManager.cleanup();
    
    this.isShuttingDown = true;
    
    if (this.resizeDebounceTimer) {
      this.resizeDebounceTimer.remove();
      this.resizeDebounceTimer = undefined;
    }

    this.houseHoverTweens.forEach((tween) => {
      tween.stop();
    });
    this.houseHoverTweens.clear();
    
    this.houseImages.forEach(image => {
      if (image && image.input) {
        image.removeAllListeners();
        image.disableInteractive();
      }
    });
    
    this.houseImages = [];

    this.cloudTweens.forEach((tween) => {
      tween.stop();
    });
    this.cloudTweens = [];

    // Clean up cloud sprites
    this.backgroundClouds.forEach((cloud) => {
      cloud.destroy();
    });
    this.backgroundClouds = [];
    
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
    
    // Cleanup grass layer
    if (this.grassLayer) {
      this.grassLayer.destroy();
      this.grassLayer = undefined;
    }
    
    this.destroyScrollbar();
    this.tweens.killAll();
    this.progressCards.forEach(card => card.destroy());
    this.progressCards.clear();
    this.lockedTooltips.forEach(tooltip => tooltip.destroy());
    this.lockedTooltips.clear();
    this.cleanupEventListeners();
    this.cleanupBird();
  }

  // ═══════════════════════════════════════════════════════════
  // SETUP METHODS
  // ═══════════════════════════════════════════════════════════
  private setupEventListeners(): void {
  this.scale.on('resize', this.handleResize, this);
  
  // No longer using registry events - will use direct method call instead
  console.log('✅ NeighborhoodScene: Setup complete, ready for walkthrough');
}

// PUBLIC METHOD for walkthrough to call directly
public expandProgressCard(houseIndex: number): void {
  console.log(`🎯 NeighborhoodScene: expandProgressCard called for house ${houseIndex}`);
  console.log(`📊 progressCards Map size: ${this.progressCards.size}`);
  console.log(`📋 Available card indices:`, Array.from(this.progressCards.keys()));
  
  const targetCard = this.progressCards.get(houseIndex);
  
  if (targetCard) {
    console.log(`✅ Found progress card for house ${houseIndex}`);
    const hoverZone = targetCard.list[targetCard.list.length - 1] as Phaser.GameObjects.Zone;
    
    if (hoverZone && hoverZone.input) {
      console.log(`✅ Triggering expand on house ${houseIndex}'s card`);
      hoverZone.emit('pointerover');
    } else {
      console.warn(`⚠️ Hover zone not interactive`);
    }
  } else {
    console.warn(`⚠️ No progress card for house ${houseIndex}`);
  }
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

  private createBackgroundClouds(): void {
    // OPT-02: Skip if cloud texture not yet loaded (Tier 2)
    if (!this.textures.exists(ASSET_KEYS.BACKGROUND_CLOUD)) return;

    const { width, height } = this.scale;
    const worldWidth = width * 2.5; // Match the camera world width
    
    // Create 3-5 clouds at random positions
    const numClouds = Phaser.Math.Between(3, 5);
    
    // Track occupied positions to prevent overlap
    const occupiedPositions: Array<{ x: number; y: number; radius: number }> = [];
    
    // Minimum spacing between clouds (in pixels)
    const minSpacing = scale(300); // Minimum horizontal distance
    const minVerticalSpacing = scale(150); // Minimum vertical distance
    
    for (let i = 0; i < numClouds; i++) {
      let randomStartX: number = 0;
      let randomY: number = 0;
      let attempts = 0;
      let validPosition = false;
      
      // Try to find a valid position (not too close to existing clouds)
      while (!validPosition && attempts < 50) {
        // Random Y position (anywhere on screen)
        randomY = Phaser.Math.Between(scale(50), height - scale(50));
        
        // Start clouds at random X positions across the ENTIRE WORLD WIDTH
        randomStartX = Phaser.Math.Between(-scale(200), worldWidth + scale(200));
        
        // Check distance from all existing clouds
        validPosition = true;
        for (const occupied of occupiedPositions) {
          const horizontalDistance = Math.abs(randomStartX - occupied.x);
          const verticalDistance = Math.abs(randomY - occupied.y);
          
          // Check if too close to an existing cloud
          if (horizontalDistance < minSpacing && verticalDistance < minVerticalSpacing) {
            validPosition = false;
            break;
          }
        }
        
        attempts++;
      }
      
      // If we couldn't find a valid position after 50 attempts, skip this cloud
      if (!validPosition) {
        console.log(`⚠️ Could not find valid position for cloud ${i + 1}, skipping`);
        continue;
      }
      
      // Create cloud
      const cloud = this.add.image(randomStartX, randomY, ASSET_KEYS.BACKGROUND_CLOUD);
      const cloudScale = scale(0.5 + Math.random() * 0.5); // Random scale between 0.5-1.0
      cloud.setScale(cloudScale);
      cloud.setAlpha(0.6 + Math.random() * 0.3); // Random alpha between 0.6-0.9 for depth
      cloud.setDepth(0); // Behind everything
      
      this.backgroundClouds.push(cloud);
      
      // Store this cloud's position to prevent future overlaps
      // Use the cloud's display width to calculate its "radius" for collision detection
      const cloudRadius = (cloud.displayWidth / 2) + minSpacing / 2;
      occupiedPositions.push({
        x: randomStartX,
        y: randomY,
        radius: cloudRadius
      });
      
      // Left edge (where clouds reset to) - use world coordinates
      const leftEdge = -scale(200);
      // Right edge (where clouds travel to) - use WORLD WIDTH
      const rightEdge = worldWidth + scale(200);
      
      // Very slow speed: 20-40 pixels per second
      const speed = 20 + Math.random() * 20;
      
      // Calculate FULL distance for consistent looping
      const fullDistance = rightEdge - leftEdge;
      const fullDuration = (fullDistance / speed) * 1000;
      
      // Calculate initial duration to first loop point
      const distanceToRight = rightEdge - randomStartX;
      const initialDuration = (distanceToRight / speed) * 1000;
      
      // Create scrolling tween
      const tween = this.tweens.add({
        targets: cloud,
        x: rightEdge,
        duration: initialDuration,
        ease: 'Linear',
        onComplete: () => {
          // Reset cloud to left edge
          cloud.x = leftEdge;
          cloud.y = Phaser.Math.Between(scale(50), height - scale(50));
          
          // Create new tween with full duration for consistent looping
          const loopTween = this.tweens.add({
            targets: cloud,
            x: rightEdge,
            duration: fullDuration,
            ease: 'Linear',
            repeat: -1,
            repeatDelay: 0,
            onRepeat: () => {
              // Reset position and randomize Y on each loop
              cloud.x = leftEdge;
              cloud.y = Phaser.Math.Between(scale(50), height - scale(50));
            }
          });
          
          this.cloudTweens.push(loopTween);
        }
      });
      
      this.cloudTweens.push(tween);
    }
    
    console.log(`☁️ Created ${this.backgroundClouds.length} clouds with proper spacing`);
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
      this.createBird();
      this.createHouses();
      
      // Set all elements to alpha 0 initially
      this.setAllElementsInvisible();
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
    this.createGrassLayer();
    this.createDottedPaths();
  }

  private createGrassLayer(): void {
    // OPT-02: Skip if grass texture not yet loaded (Tier 2)
    if (!this.textures.exists('frontGrass')) return;

    const { width, height } = this.scale;
    
    // Use world width instead of just viewport width for scrollable area
    const worldWidth = width * 2.5;
    
    // Create a TileSprite that repeats the grass texture across the entire world width
    this.grassLayer = this.add.tileSprite(
      worldWidth / 2,  // Center of the world
      height,          // Bottom of the screen
      worldWidth,      // Width to cover entire scrollable area
      0,               // Height will be set automatically based on texture
      'frontGrass'
    );
    
    // Set origin to bottom-center so it sits flush at the bottom
    this.grassLayer.setOrigin(0.5, 1);
    
    // Automatically scale height to maintain aspect ratio
    const textureHeight = this.textures.get('frontGrass').getSourceImage().height;
    
    // Calculate the height needed to maintain aspect ratio
    // We want the grass to tile horizontally at original size
    const displayHeight = textureHeight;
    this.grassLayer.setDisplaySize(worldWidth, displayHeight);
    
    // Set depth to 1 (above background which is 0, but below houses which are 2+)
    this.grassLayer.setDepth(1);
    
    // Make the grass scroll with the camera (it's part of the world, not UI)
    this.grassLayer.setScrollFactor(1);
    
    console.log('🌱 Tiled grass layer created at depth 1');
    console.log('   - World width:', worldWidth);
    console.log('   - Texture will repeat to fill width');
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
    // Line styling - CHANGED: Using LOGO_BLUE for path lights (only place LogoBlue should be used)
    const lineColor = COLORS.LOGO_BLUE;
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
    
    
    let controlY: number;
    
    const curveDepth = distance * 0.7;
    const controlX = midX;
    
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

    // Set coin counter invisible
    if (this.coinCounter) {
      this.coinCounter.setAlpha(0);
    }

    // Set grass layer invisible
    if (this.grassLayer) {
      this.grassLayer.setAlpha(0);
    }

    // Set roads invisible
    this.roads.forEach((road) => {
      road.setAlpha(0);
    });

    // Set house sprites invisible
    const houseSpritesArray = Array.from(this.houseSprites.values());
    houseSpritesArray.forEach((sprite) => {
      sprite.setAlpha(0);
    });

    // Set progress cards invisible
    this.progressCards.forEach((card) => {
      card.setAlpha(0);
    });

    // Set cloud overlays invisible
    this.cloudOverlays.forEach((cloud) => {
      cloud.setAlpha(0);
    });

    // Set scrollbar invisible
    if (this.scrollbarTrack) {
      this.scrollbarTrack.setAlpha(0);
    }
    if (this.scrollbarThumb) {
      this.scrollbarThumb.setAlpha(0);
    }

    // Keep locked tooltips hidden (they only appear on hover)
    this.lockedTooltips.forEach((tooltip) => {
      tooltip.setAlpha(0);
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
    const horizontalSpacing = 80; // 80% spacing between houses
    const bottomRowOffset = 40; // Bottom row shifted to the right by 40%
    const topRowY = 35; // Top row at 35% from top
    const bottomRowY = 70; // Bottom row at 70% from top
    
    // Calculate X position with offset for bottom row
    const defaultX = isTopRow 
      ? startX + (columnIndex * horizontalSpacing)  // Top row: 15%, 95%, 175%...
      : startX + (columnIndex * horizontalSpacing) + bottomRowOffset;  // Bottom row: 55%, 135%, 215%...
    
    const defaultY = isTopRow ? topRowY : bottomRowY;
    
    const x = (defaultX / 100) * width;
    const y = (defaultY / 100) * height;
    
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

    // Set house to locked by default unless explicitly unlocked by backend
    const isLocked =  false; // Locked unless explicitly set to false

    // Create house icon
    let houseImage: Phaser.GameObjects.Image | undefined;
    if (house.houseType) {
      houseImage = this.createHouseIcon(houseContainer, house.houseType, isLocked);
    }

    // Add cloud overlay for locked houses ONLY - positioned lower
    if (isLocked && house.houseType && this.textures.exists(ASSET_KEYS.HOUSE_CLOUD)) {
      const cloudOverlay = this.add.image(x, y + scale(10), ASSET_KEYS.HOUSE_CLOUD);
      cloudOverlay.setDisplaySize(scale(700), scale(700));
      cloudOverlay.setAlpha(0); // Start invisible for fade-in
      cloudOverlay.setDepth(10);
      this.cloudOverlays.push(cloudOverlay);
    }

    // Only show progress card for unlocked houses
    if (!isLocked) {
      // ADD PROGRESS CARD - positioned to the right-middle of the house
      const progressCardX = x + scale(250); // Right side of house
      const progressCardY = y; // Middle height

      // Get progress data from backend (if available)
      const moduleProgress = this.moduleProgressMap?.get(house.moduleBackendId || '');

      // Determine button status based on backend data
      const getModuleStatus = (): 'start' | 'continue' | 'locked' => {
        if (isLocked) return 'locked';
        
        if (!moduleProgress) return 'start';
        
        // If lessons_completed > 0, show "Continue"
        if (moduleProgress.lessons_completed > 0) {
          return 'continue';
        }
        
        // Otherwise show "Start"
        return 'start';
      };

      // Prepare progress data with REAL backend values
      const progressData: HouseProgressData = {
        moduleNumber: index + 1,
        moduleName: house.name,
        duration: this.formatDuration(moduleProgress?.module.estimated_duration_minutes || 0),
        hasProgress: moduleProgress ? moduleProgress.lessons_completed > 0 : false,
        progressPercent: moduleProgress ? parseFloat(moduleProgress.completion_percentage) : 0,
        lessonCount: moduleProgress?.module.lesson_count || 0,
        quizCount: moduleProgress?.module.lesson_count || 0,
        coinReward: house.coinReward,
        isLocked: false,
        status: getModuleStatus(),
        completedLessons: moduleProgress?.lessons_completed || 0,
        treeGrowthPoints: moduleProgress?.module.tree_growth_points ?? 0,
        treeCurrentStage: moduleProgress?.module.tree_current_stage ?? 0,
        treeTotalStages: moduleProgress?.module.tree_total_stages ?? 5,
        treeCompleted: moduleProgress?.module.tree_completed ?? false,
      };

      const progressCard = HouseProgressCard.createProgressCard(
        this,
        progressCardX,
        progressCardY,
        progressData,
        () => {
          // Prevent interaction during bird travel
          if (!this.isBirdTraveling) {
            this.travelToHouse(index);
          }
        },
        index === this.currentHouseIndex ? this.bird : undefined,
        houseImage,
        () => this.isBirdTraveling // Pass function to check if bird is traveling
      );
      progressCard.setAlpha(0); // Start invisible for fade-in
      progressCard.setDepth(3); // Above houses
      
      // Store the progress card with house index as key
      this.progressCards.set(index, progressCard);
      console.log(`💾 Stored progress card for house ${index} (${house.name})`);
    } else {
      console.log(`🔒 House ${index} (${house.name}) is locked - no progress card created`);
      // For locked houses, create hover tooltip
      houseContainer.setAlpha(OPACITY.MEDIUM);
      this.createLockedHouseTooltip(houseContainer, house, index, x, y);
    }

    this.houseSprites.set(house.id, houseContainer);
  }


  private createHouseIcon(
    container: Phaser.GameObjects.Container, 
    houseType: string, 
    isLocked: boolean
  ): Phaser.GameObjects.Image | undefined {
    // OPT-02: Check texture exists (Tier 2 may still be loading)
    if (!this.textures.exists(houseType)) {
      // Listen for secondary assets to finish loading, then retry
      const onLoaded = () => {
        this.registry.events.off('changedata-secondaryAssetsLoaded', onLoaded);
        if (this.textures.exists(houseType)) {
          const img = this.add.image(0, 0, houseType);
          img.setScale(scale(1));
          if (isLocked) img.setTint(0x999999);
          container.add(img);
        }
      };
      this.registry.events.on('changedata-secondaryAssetsLoaded', onLoaded);
      return undefined;
    }

    const houseImage = this.add.image(0, 0, houseType);
    houseImage.setScale(scale(1));
    
    if (isLocked) {
      houseImage.setTint(0x999999);
    }
    
    container.add(houseImage);
    
    const randomDelay = Math.random() * 1500; // Random delay between 0-1500ms
    
    this.tweens.add({
      targets: houseImage,
      y: -scale(3), // Move up by 3 pixels (scaled)
      duration: 1500, // 1.5 seconds
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1, // Infinite loop
      delay: randomDelay // Each house starts at a different time
    });
    
    return houseImage;
  }

  private createLockedHouseTooltip(
    houseContainer: Phaser.GameObjects.Container,
    house: HousePosition,
    index: number,
    x: number,
    y: number
  ): void {
    // Create tooltip container (initially hidden) - positioned lower
    const tooltipContainer = this.add.container(x, y + scale(10));
    tooltipContainer.setAlpha(0);
    tooltipContainer.setDepth(20); // Above everything

    // Tooltip dimensions - made larger
    const tooltipWidth = scale(400);
    const tooltipHeight = scale(120);

    // Tooltip background - white with high opacity to match card style
    const tooltipBg = this.add.rectangle(
      0,
      0,
      tooltipWidth,
      tooltipHeight,
      COLORS.PURE_WHITE,
      OPACITY.HIGH
    );
    tooltipBg.setStrokeStyle(scale(2), COLORS.UNAVAILABLE_BUTTON);
    tooltipContainer.add(tooltipBg);

    // Lock icon using standard icon circle style - larger for bigger tooltip
    const lockIconBg = this.add.circle(0, scale(-35), scale(25), COLORS.UNAVAILABLE_BUTTON);
    tooltipContainer.add(lockIconBg);

    const lockIcon = this.add.text(0, scale(-35), '🔒', {
      fontSize: scaleFontSize(24),
    }).setOrigin(0.5);
    tooltipContainer.add(lockIcon);

    // Tooltip text - using standard text colors, larger font
    const previousHouseName = index > 0 ? this.houses[index - 1].name : 'the previous house';
    const tooltipText = this.add.text(
      0,
      scale(20),
      `Complete ${previousHouseName}\nto unlock this house`,
      createTextStyle('CAPTION', COLORS.TEXT_SECONDARY, {
        fontSize: scaleFontSize(16),
        align: 'center',
        wordWrap: { width: tooltipWidth - scale(30) },
      })
    ).setOrigin(0.5);
    tooltipContainer.add(tooltipText);

    // Add pointer triangle at top - white to match background
    const triangle = this.add.triangle(
      0,
      -tooltipHeight / 2,
      0, 0,
      scale(12), scale(-15),
      scale(-12), scale(-15),
      COLORS.PURE_WHITE
    );
    tooltipContainer.add(triangle);

    // Add triangle border for depth
    const triangleBorder = this.add.triangle(
      0,
      -tooltipHeight / 2 - scale(1),
      0, 0,
      scale(13), scale(-16),
      scale(-13), scale(-16),
      COLORS.UNAVAILABLE_BUTTON
    );
    triangleBorder.setDepth(-1);
    tooltipContainer.add(triangleBorder);

    // Store tooltip
    this.lockedTooltips.set(house.id, tooltipContainer);

    // Make house container interactive with explicit size to cover entire house image
    const houseSize = scale(350);
    houseContainer.setSize(houseSize, houseSize);
    houseContainer.setInteractive();
    
    // Adjust hit area to be centered on the house image
    houseContainer.setInteractive(
      new Phaser.Geom.Rectangle(-houseSize / 2, -houseSize / 2, houseSize, houseSize),
      Phaser.Geom.Rectangle.Contains
    );
    
    // Show tooltip on hover
    houseContainer.on('pointerover', () => {
      this.tweens.add({
        targets: tooltipContainer,
        alpha: 1,
        duration: 200,
        ease: 'Power2',
      });
    });

    // Hide tooltip on pointer out
    houseContainer.on('pointerout', () => {
      this.tweens.add({
        targets: tooltipContainer,
        alpha: 0,
        duration: 200,
        ease: 'Power2',
      });
    });

    // Prevent click action on locked houses - add bounce animation
    houseContainer.on('pointerdown', () => {
      this.tweens.add({
        targets: houseContainer,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 100,
        yoyo: true,
        ease: 'Power2',
      });
    });
  }

  private fadeInScene(): void {
    const fadeDuration = 600;
    
    // Fade in back button
    if (this.backButton) {
      this.tweens.add({
        targets: this.backButton,
        alpha: 1,
        duration: fadeDuration,
        ease: 'Cubic.easeOut'
      });
    }

    // Fade in coin counter
    if (this.coinCounter) {
      this.tweens.add({
        targets: this.coinCounter,
        alpha: 1,
        duration: fadeDuration,
        ease: 'Cubic.easeOut'
      });
    }
    
    // Fade in grass layer
    if (this.grassLayer) {
      this.tweens.add({
        targets: this.grassLayer,
        alpha: 1,
        duration: fadeDuration,
        ease: 'Cubic.easeOut'
      });
    }
    
    // Fade in roads
    this.roads.forEach((road) => {
      this.tweens.add({
        targets: road,
        alpha: 1,
        duration: fadeDuration,
        ease: 'Cubic.easeOut'
      });
    });
    
    // Fade in house sprites
    const houseSpritesArray = Array.from(this.houseSprites.values());
    houseSpritesArray.forEach((sprite) => {
      this.tweens.add({
        targets: sprite,
        alpha: 1,
        duration: fadeDuration,
        ease: 'Cubic.easeOut'
      });
    });
    
    // Fade in progress cards
    this.progressCards.forEach((card) => {
      this.tweens.add({
        targets: card,
        alpha: 1,
        duration: fadeDuration,
        ease: 'Cubic.easeOut'
      });
    });
    
    // Fade in cloud overlays
    this.cloudOverlays.forEach((cloud) => {
      this.tweens.add({
        targets: cloud,
        alpha: 0.9,
        duration: fadeDuration,
        ease: 'Cubic.easeOut'
      });
    });
    
    if (this.bird) {
      this.bird.fadeIn(fadeDuration, () => {
        if (this.bird) {
          this.bird.forceVisible(); // This ensures alpha=1 and depth=1000
        }
        // Start idle animation AFTER fade-in completes
        this.startBirdIdleAnimation();
      });
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

    // Fade in scrollbar
    if (this.scrollbarTrack) {
      this.tweens.add({
        targets: this.scrollbarTrack,
        alpha: 1,
        duration: fadeDuration,
        ease: 'Cubic.easeOut'
      });
    }
    if (this.scrollbarThumb) {
      this.tweens.add({
        targets: this.scrollbarThumb,
        alpha: 1,
        duration: fadeDuration,
        ease: 'Cubic.easeOut'
      });
    }

    // Locked tooltips stay hidden (only appear on hover)
    this.lockedTooltips.forEach((tooltip) => {
      tooltip.setAlpha(0);
    });
  }

  update(): void {
    // Ensure bird stays fully visible
    if (this.bird) {
      this.bird.enforceAlpha();
    }
    // Keep scrollbar thumb in sync with camera scroll
    this.updateScrollbarPosition();
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
      iconCircleColor: COLORS.STATUS_YELLOW,
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
    
    // Use consistent positioning formula
    const progressCardOffsetX = scale(250);
    const collapsedHeight = scale(70);
    
    const birdX = houseX + progressCardOffsetX + scale(100);
    const birdY = houseY + (collapsedHeight / 10) - scale(15); // Bottom of card

    this.bird = new BirdCharacter(this);
    this.bird.createStatic(birdX, birdY);
    // BirdCharacter.createStatic() now handles alpha=0 and depth internally
  }

  private startBirdIdleAnimation(): void {
    if (!this.bird) return;
    this.bird.startIdleAnimation();
  }

  private travelToHouse(targetHouseIndex: number): void {
    if (!this.bird || this.bird.getIsAnimating() || targetHouseIndex >= this.houses.length || this.isBirdTraveling) return;

    // Don't move bird if clicking the house it's already at
    if (targetHouseIndex === this.currentHouseIndex) {
      const targetHouse = this.houses[targetHouseIndex];
      this.handleHouseClick(targetHouse);
      return;
    }

    // Set traveling flag to block all interactions
    this.isBirdTraveling = true;
    this.bird.setIsAnimating(true);
    this.previousHouseIndex = this.currentHouseIndex;
    this.currentHouseIndex = targetHouseIndex;

    const { width, height } = this.scale;
    const targetHouse = this.houses[targetHouseIndex];
    
    const { x: targetX, y: targetY } = this.calculateHousePosition(targetHouseIndex, width, height, targetHouse);
    
    // Use consistent positioning formula - same as createBird()
    const progressCardOffsetX = scale(250);
    const collapsedHeight = scale(70);
    
    const finalX = targetX + progressCardOffsetX + scale(100);
    const finalY = targetY + (collapsedHeight / 10) - scale(40); // Progress bar

    const houseDistance = Math.abs(targetHouseIndex - this.previousHouseIndex);

    // Always use glide animation for house-to-house travel
    this.bird.glideToPosition(finalX, finalY, houseDistance, () => {
      // DON'T clear traveling flag here - keep it blocked during transition
      // It will be cleared after the full scene transition completes
      
      if (!this.isShuttingDown && this.scene.isActive(SCENE_KEYS.NEIGHBORHOOD)) {
        this.handleHouseClick(targetHouse);
      }
    });
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
        handleHouseSelect(house.id, house.moduleBackendId);
        this.isTransitioning = false;
        this.isBirdTraveling = false; // Clear traveling flag after full transition
      });
    }
  }

  private handleBackToMap(): void {
    if (this.isTransitioning || this.isBirdTraveling) return;

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
    this.progressCards.clear();
    
    this.houseImages = [];
    
    if (this.backButton) this.backButton.destroy();
    this.roads.forEach(road => road.destroy());
    this.roads = [];
    this.houseSprites.forEach(sprite => sprite.destroy());
    this.houseSprites.clear();
    if (this.placeholderCard) this.placeholderCard.destroy();
    this.cloudOverlays.forEach(cloud => cloud.destroy());
    this.cloudOverlays = [];
    this.lockedTooltips.forEach(tooltip => tooltip.destroy());
    this.lockedTooltips.clear();
    
    // Destroy grass layer before recreating
    if (this.grassLayer) {
      this.grassLayer.destroy();
      this.grassLayer = undefined;
    }

    this.handleCoinCounterResize();
    
    // Destroy and recreate scrollbar for new dimensions
    this.destroyScrollbar();

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

    // Recreate scrollbar with new dimensions
    this.createScrollbar();
    
    // Use consistent positioning formula - same as createBird() and travelToHouse()
    if (this.bird && this.houses.length > 0) {
      const currentHouse = this.houses[this.currentHouseIndex];
      const { x, y } = this.calculateHousePosition(this.currentHouseIndex, width, height, currentHouse);
      
      const progressCardOffsetX = scale(250);
      const collapsedHeight = scale(70);
      
      const birdX = x + progressCardOffsetX + scale(100);
      const birdY = y + (collapsedHeight / 10) - scale(15);
      
      this.bird.setPosition(birdX, birdY);
      this.bird.handleResize();
    }
    
    this.createBackButton();
    
    if (this.houses.length > 0) {
      this.createEnvironment();  // This will recreate the grass layer with new dimensions
      this.createHouses();
      
      this.setAllElementsInvisible();
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
    this.transitionManager.toHouse(callback);
  }

  private transitionToMap(callback: () => void): void {
    this.transitionManager.backToMap(callback);
  }
}