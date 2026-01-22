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
  x: number;
  y: number;
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
  private platform?: Phaser.GameObjects.Image;
  private roads: Phaser.GameObjects.Image[] = [];
  
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
    this.houses = data.houses || [];
    this.isTransitioning = false;
    this.currentHouseIndex = data.currentHouseIndex ?? 0;
    this.previousHouseIndex = this.currentHouseIndex;
    
    console.log('🏘️ NeighborhoodScene init with houses:', this.houses);
    
    // Clear existing data
    this.houseSprites.clear();
    this.roads = [];
    
    // Cleanup existing bird
    if (this.bird) {
      this.bird.destroy();
      this.bird = undefined;
    }
  }

  create() {
    super.create();
    this.createUI();
    this.setupEventListeners();
  }

  shutdown() {
    super.shutdown();
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
    this.createPlatform();
    this.createRoads();
  }

  private createPlatform(): void {
    const { width, height } = this.scale;
    
    this.platform = this.add.image(width / 2, height / 2, ASSET_KEYS.PLATFORM_1);
    // Use percentage of height instead of fixed scale value
    this.platform.setDisplaySize(width * 0.9, height * 0.4);
    this.platform.setAlpha(0.8);
    this.platform.setDepth(0);
  }

  private createRoads(): void {
    const { width, height } = this.scale;
    
    for (let i = 0; i < this.houses.length - 1; i++) {
      const house1 = this.houses[i];
      const house2 = this.houses[i + 1];
      
      const x1 = (house1.x / 100) * width;
      const y1 = (house1.y / 100) * height;
      const x2 = (house2.x / 100) * width;
      const y2 = (house2.y / 100) * height;
      
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const angle = Phaser.Math.Angle.Between(x1, y1, x2, y2);
      const distance = Phaser.Math.Distance.Between(x1, y1, x2, y2);
      
      const road = this.add.image(midX, midY, ASSET_KEYS.ROAD_1);
      // Make road width responsive - use percentage of screen height
      const roadWidth = Math.min(height * 0.05, 50); // 5% of height, max 50px
      road.setDisplaySize(distance, roadWidth);
      road.setRotation(angle);
      road.setAlpha(0.7);
      road.setDepth(1);
      
      this.roads.push(road);
    }
  }

  private createHouses(): void {
    this.houses.forEach(house => this.createHouse(house));
  }

  private createHouse(house: HousePosition): void {
    const { width, height } = this.scale;
    const x = (house.x / 100) * width;
    const y = (house.y / 100) * height;

    const houseContainer = this.add.container(x, y);
    houseContainer.setDepth(2);

    // Create house icon
    if (house.houseType) {
      this.createHouseIcon(houseContainer, house.houseType, house.isLocked);
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
      // Show locked state
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
    houseImage.setDisplaySize(scale(150), scale(150));
    
    // Add a slight tint to locked houses
    if (isLocked) {
      houseImage.setTint(0x999999);
    }
    
    container.add(houseImage);
  }

  private createCoinBadge(container: Phaser.GameObjects.Container, coinReward: number): void {
    // Create coin badge background
    const badgeBg = this.add.circle(scale(50), scale(-50), scale(20), 0xFFD700);
    badgeBg.setStrokeStyle(scale(2), 0xFFA500);
    container.add(badgeBg);

    // Create coin text
    const coinText = this.add.text(scale(50), scale(-50), `${coinReward}`, {
      fontSize: scaleFontSize(12),
      fontFamily: 'Fredoka, sans-serif',
      color: '#000000',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add(coinText);
  }

  private createLockIcon(container: Phaser.GameObjects.Container): void {
    // Create lock icon background
    const lockBg = this.add.circle(scale(-50), scale(-50), scale(18), 0xFF6B6B);
    lockBg.setStrokeStyle(scale(2), 0xCC0000);
    container.add(lockBg);

    // Create lock emoji/icon
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
      background.setInteractive({ useHandCursor: true });
      
      // Store original size
      const originalWidth = background.displayWidth;
      const originalHeight = background.displayHeight;
      
      background.on('pointerover', () => {
        // Hover effect - slightly scale up using display size
        this.tweens.add({
          targets: background,
          displayWidth: originalWidth * 1.1,
          displayHeight: originalHeight * 1.1,
          duration: 200,
          ease: 'Power2',
        });
      });

      background.on('pointerout', () => {
        // Remove hover effect - return to original size
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

    // Create placeholder card using CardBuilder
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

    // Add description
    const description = UIComponents.createSubtitle(
      this,
      'Houses and learning modules\nwill appear here once configured.',
      16,
      COLORS.TEXT_SECONDARY
    );
    description.setPosition(0, scale(-60));
    this.placeholderCard.add(description);

    // Add features
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
    
    const birdOffsetX = width * 0.04;
    const birdOffsetY = height * 0.025;
    
    const birdX = (currentHouse.x / 100) * width + birdOffsetX;
    const birdY = (currentHouse.y / 100) * height + birdOffsetY;

    // Initialize bird character
    this.bird = new BirdCharacter(this);
    this.bird.createStatic(birdX, birdY);
  }

  private startBirdIdleAnimation(): void {
    if (!this.bird) return;

    // Stop any existing idle animation
    this.bird.stopIdleAnimation();

    // Start new idle animation with custom logic for neighborhood boundaries
    const scheduleNextIdleHop = () => {
      const randomDelay = Phaser.Math.Between(5000, 8000);

      this.time.delayedCall(randomDelay, () => {
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

    const { width } = this.scale;
    const currentHouse = this.houses[this.currentHouseIndex];
    
    const birdOffsetX = width * 0.04;
    const houseCenterX = (currentHouse.x / 100) * width + birdOffsetX;
    const houseAreaRadius = width * 0.05;

    // Use bird's idle hop method with boundary constraints
    this.bird.playIdleHopWithBoundary(houseCenterX, houseAreaRadius);
  }

  private travelToHouse(targetHouseIndex: number): void {
    if (!this.bird || this.bird.getIsAnimating() || targetHouseIndex >= this.houses.length) return;

    this.bird.setIsAnimating(true);
    this.previousHouseIndex = this.currentHouseIndex;

    const { width, height } = this.scale;
    const targetHouse = this.houses[targetHouseIndex];
    
    const birdOffsetX = width * 0.04;
    const birdOffsetY = height * 0.025;
    
    const targetX = (targetHouse.x / 100) * width + birdOffsetX;
    const targetY = (targetHouse.y / 100) * height + birdOffsetY;

    // Calculate distance
    const houseDistance = Math.abs(targetHouseIndex - this.currentHouseIndex);

    if (houseDistance > 1) {
      // Glide animation for long distances
      this.bird.glideToPosition(targetX, targetY, houseDistance, () => {
        this.currentHouseIndex = targetHouseIndex;
        this.handleHouseClick(targetHouse);
      });
    } else {
      // Hop animation for short distances
      this.bird.hopToPosition(targetX, targetY, () => {
        this.currentHouseIndex = targetHouseIndex;
        this.handleHouseClick(targetHouse);
      });
    }
  }

  // ═══════════════════════════════════════════════════════════
  // EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════
  private handleHouseClick(house: HousePosition): void {
    if (this.isTransitioning) return;

    this.isTransitioning = true;

    console.log('🏠 House clicked:', house.name, 'Module ID:', house.moduleId);

    // Store bird travel info for HouseScene
    this.registry.set('currentHouseIndex', this.currentHouseIndex);
    this.registry.set('birdTravelInfo', {
      previousHouseIndex: this.previousHouseIndex,
      currentHouseIndex: this.currentHouseIndex,
      traveled: this.previousHouseIndex !== this.currentHouseIndex,
    });

    // Store module backend ID for HouseScene to use
    if (house.moduleBackendId) {
      this.registry.set('currentModuleUUID', house.moduleBackendId);
      this.registry.set('currentModuleTitle', house.name);
      console.log('✅ Stored module UUID in registry:', house.moduleBackendId);
    }

    // Get navigation handler
    const handleHouseSelect = this.registry.get('handleHouseSelect');

    if (handleHouseSelect && typeof handleHouseSelect === 'function') {
      this.transitionToHouse(() => {
        handleHouseSelect(house.id, house.moduleId || 0);
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
    // Destroy existing elements
    if (this.backButton) this.backButton.destroy();
    this.roads.forEach(road => road.destroy());
    this.roads = [];
    if (this.platform) this.platform.destroy();
    this.houseSprites.forEach(sprite => sprite.destroy());
    this.houseSprites.clear();
    if (this.placeholderCard) this.placeholderCard.destroy();

    this.handleCoinCounterResize();
    
    // Handle bird resize
    if (this.bird && this.houses.length > 0) {
      const { width, height } = this.scale;
      const currentHouse = this.houses[this.currentHouseIndex];
      const birdOffsetX = width * 0.04;
      const birdOffsetY = height * 0.025;
      const birdX = (currentHouse.x / 100) * width + birdOffsetX;
      const birdY = (currentHouse.y / 100) * height + birdOffsetY;
      
      this.bird.setPosition(birdX, birdY);
      this.bird.handleResize();
    }
    
    // Recreate everything with new dimensions
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