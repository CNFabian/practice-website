import Phaser from 'phaser';
import { scale, scaleFontSize } from '../../../../../utils/scaleHelper';
import { SCENE_KEYS } from '../constants/SceneKeys';
import { ASSET_KEYS } from '../constants/AssetKeys';
import { COLORS, OPACITY } from '../constants/Colors';
import { CardBuilder } from '../ui/CardBuilder';
import { ButtonBuilder } from '../ui/ButtonBuilder';
import { UIComponents } from '../ui/UIComponents';

interface HousePosition {
  id: string;
  name: string; // NOW COMES FROM MODULE TITLE
  x: number; // Percentage from left (0-100)
  y: number; // Percentage from top (0-100)
  isLocked?: boolean; // NOW COMES FROM MODULE UNLOCK STATUS
  houseType?: string; // 'house1', 'house2', 'house3', 'house4', etc.
  moduleId?: number; // Frontend module ID
  moduleBackendId?: string; // Backend module UUID
  description?: string; // Module description
  coinReward?: number; // Module coin reward
}

interface NeighborhoodSceneData {
  neighborhoodId?: string;
  houses?: HousePosition[];
  currentHouseIndex?: number;
}

export default class NeighborhoodScene extends Phaser.Scene {
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
  
  // Bird animation properties
  private birdSprite?: Phaser.GameObjects.Image;
  private currentHouseIndex: number = 0;
  private previousHouseIndex: number = 0;
  private isHopping: boolean = false;
  private idleHopTimer?: Phaser.Time.TimerEvent;

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
    this.isHopping = false;
    
    console.log('🏘️ NeighborhoodScene init with houses:', this.houses);
    
    // Clear existing data
    this.houseSprites.clear();
    this.roads = [];
    
    // Clear any existing timers
    if (this.idleHopTimer) {
      this.idleHopTimer.remove();
      this.idleHopTimer = undefined;
    }
  }

  create() {
    this.createUI();
    this.setupEventListeners();
  }

  shutdown() {
    this.cleanupEventListeners();
    this.cleanupTimers();
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

  private cleanupTimers(): void {
    if (this.idleHopTimer) {
      this.idleHopTimer.remove();
      this.idleHopTimer = undefined;
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
    this.platform.setDisplaySize(width * 0.9, scale(300));
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
      road.setDisplaySize(distance, scale(40));
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
      
      background.on('pointerover', () => {
        // Hover effect - slightly scale up
        this.tweens.add({
          targets: background,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 200,
          ease: 'Power2',
        });
      });

      background.on('pointerout', () => {
        // Remove hover effect
        this.tweens.add({
          targets: background,
          scaleX: 1,
          scaleY: 1,
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
    const birdX = (currentHouse.x / 100) * width + scale(50);
    const birdY = (currentHouse.y / 100) * height + scale(20);

    this.birdSprite = this.add.image(birdX, birdY, ASSET_KEYS.BIRD_IDLE);
    this.birdSprite.setDisplaySize(scale(80), scale(80));
    this.birdSprite.setDepth(1000);
  }

  private startBirdIdleAnimation(): void {
    const scheduleNextIdleHop = () => {
      const randomDelay = Phaser.Math.Between(5000, 8000);

      this.idleHopTimer = this.time.delayedCall(randomDelay, () => {
        if (!this.isHopping && !this.isTransitioning && this.birdSprite) {
          this.playBirdIdleHop();
        }
        scheduleNextIdleHop();
      });
    };

    scheduleNextIdleHop();
  }

  private playBirdIdleHop(): void {
    if (!this.birdSprite || this.isHopping || this.houses.length === 0) return;

    const originalY = this.birdSprite.y;
    const originalX = this.birdSprite.x;

    // Get current house position to constrain movement
    const { width } = this.scale;
    const currentHouse = this.houses[this.currentHouseIndex];
    const houseCenterX = (currentHouse.x / 100) * width + scale(50);

    // Define boundary around house
    const houseAreaRadius = scale(60);
    const minX = houseCenterX - houseAreaRadius;
    const maxX = houseCenterX + houseAreaRadius;

    // Random small movement
    const moveDistance = Phaser.Math.Between(-5, 5);
    let targetX = originalX + scale(moveDistance);
    targetX = Phaser.Math.Clamp(targetX, minX, maxX);

    // Flip sprite based on movement direction
    const actualMove = targetX - originalX;
    if (Math.abs(actualMove) > scale(2)) {
      this.birdSprite.setFlipX(actualMove < 0);
    }

    // Single hop animation
    const hopHeight = scale(2);
    const duration = 300;

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

  private travelToHouse(targetHouseIndex: number): void {
    if (!this.birdSprite || this.isHopping || targetHouseIndex >= this.houses.length) return;

    this.isHopping = true;
    this.previousHouseIndex = this.currentHouseIndex;

    const { width, height } = this.scale;
    const targetHouse = this.houses[targetHouseIndex];
    const targetX = (targetHouse.x / 100) * width + scale(50);
    const targetY = (targetHouse.y / 100) * height + scale(20);

    // Flip sprite based on direction
    this.birdSprite.setFlipX(targetX < this.birdSprite.x);

    // Calculate distance
    const houseDistance = Math.abs(targetHouseIndex - this.currentHouseIndex);

    if (houseDistance > 1) {
      // Glide animation for long distances
      this.animateBirdGlide(targetX, targetY, targetHouseIndex, targetHouse, houseDistance);
    } else {
      // Hop animation for short distances
      this.animateBirdHop(targetX, targetY, targetHouseIndex, targetHouse);
    }
  }

  private animateBirdGlide(
    targetX: number,
    targetY: number,
    targetHouseIndex: number,
    targetHouse: HousePosition,
    houseDistance: number
  ): void {
    const hopDuration = 250;
    const totalGlideTime = houseDistance * hopDuration * 4;

    // Change to flight texture
    this.birdSprite!.setTexture(ASSET_KEYS.BIRD_FLY);
    const flyTexture = this.textures.get(ASSET_KEYS.BIRD_FLY);
    const flyWidth = flyTexture.getSourceImage().width;
    const flyHeight = flyTexture.getSourceImage().height;
    const flyAspectRatio = flyWidth / flyHeight;
    this.birdSprite!.setDisplaySize(scale(100) * flyAspectRatio, scale(100));

    this.tweens.add({
      targets: this.birdSprite,
      x: targetX,
      y: targetY,
      duration: totalGlideTime,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.birdSprite!.setTexture(ASSET_KEYS.BIRD_IDLE);
        this.birdSprite!.setDisplaySize(scale(80), scale(80));
        this.isHopping = false;
        this.currentHouseIndex = targetHouseIndex;
        this.handleHouseClick(targetHouse);
      },
    });
  }

  private animateBirdHop(
    targetX: number,
    targetY: number,
    targetHouseIndex: number,
    targetHouse: HousePosition
  ): void {
    const distance = Phaser.Math.Distance.Between(
      this.birdSprite!.x,
      this.birdSprite!.y,
      targetX,
      targetY
    );

    const numHops = Math.max(5, Math.floor(distance / scale(40)));
    const hopHeight = scale(10);
    const hopDuration = 250;

    // Create hop path
    const path: { x: number; y: number }[] = [];
    for (let i = 0; i <= numHops; i++) {
      const t = i / numHops;
      const x = Phaser.Math.Linear(this.birdSprite!.x, targetX, t);
      const y = Phaser.Math.Linear(this.birdSprite!.y, targetY, t);
      path.push({ x, y });
    }

    let currentHop = 0;

    const performNextHop = () => {
      if (currentHop >= path.length - 1) {
        this.isHopping = false;
        this.currentHouseIndex = targetHouseIndex;
        this.handleHouseClick(targetHouse);
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

  private handleResize(gameSize: Phaser.Structs.Size): void {
    const { width, height } = gameSize;

    // Reposition back button
    if (this.backButton) {
      this.backButton.setPosition(scale(20), scale(20));
    }

    // Reposition platform
    if (this.platform) {
      this.platform.setPosition(width / 2, height / 2);
      this.platform.setDisplaySize(width * 0.9, scale(300));
    }

    // Reposition roads
    this.roads.forEach((road, index) => {
      if (index < this.houses.length - 1) {
        const house1 = this.houses[index];
        const house2 = this.houses[index + 1];

        const x1 = (house1.x / 100) * width;
        const y1 = (house1.y / 100) * height;
        const x2 = (house2.x / 100) * width;
        const y2 = (house2.y / 100) * height;

        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const angle = Phaser.Math.Angle.Between(x1, y1, x2, y2);
        const distance = Phaser.Math.Distance.Between(x1, y1, x2, y2);

        road.setPosition(midX, midY);
        road.setDisplaySize(distance, scale(40));
        road.setRotation(angle);
      }
    });

    // Reposition houses
    this.houses.forEach(house => {
      const houseContainer = this.houseSprites.get(house.id);
      if (houseContainer) {
        const x = (house.x / 100) * width;
        const y = (house.y / 100) * height;
        houseContainer.setPosition(x, y);
      }
    });

    // Reposition bird
    if (this.birdSprite && this.houses.length > 0) {
      const currentHouse = this.houses[this.currentHouseIndex];
      const birdX = (currentHouse.x / 100) * width + scale(50);
      const birdY = (currentHouse.y / 100) * height + scale(20);
      this.birdSprite.setPosition(birdX, birdY);
    }

    // Reposition placeholder
    if (this.placeholderCard) {
      this.placeholderCard.setPosition(width / 2, height / 2);
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