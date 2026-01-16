import Phaser from 'phaser';
import { scale, scaleFontSize } from '../../../../../utils/scaleHelper';

interface HousePosition {
  id: string;
  name: string;
  x: number;
  y: number;
  isLocked?: boolean;
  houseType?: string;
}

interface NeighborhoodSceneData {
  neighborhoodId?: string;
  houses?: HousePosition[];
}

export default class NeighborhoodScene extends Phaser.Scene {
  private neighborhoodId?: string;
  private houses: HousePosition[] = [];
  private isTransitioning: boolean = false;
  private houseSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private backButton?: Phaser.GameObjects.Container;
  private placeholderCard?: Phaser.GameObjects.Container;
  private platform?: Phaser.GameObjects.Image;
  private roads: Phaser.GameObjects.Image[] = [];
  private birdSprite?: Phaser.GameObjects.Image;
  private currentHouseIndex: number = 0;
  private isHopping: boolean = false;
  private idleHopTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: 'NeighborhoodScene' });
  }

  // NO preload() - assets are already loaded by PreloaderScene!

  init(data: NeighborhoodSceneData) {
    this.neighborhoodId = data.neighborhoodId;
    this.houses = data.houses || [];
    this.isTransitioning = false;
    this.houseSprites.clear();
    this.roads = [];
    this.currentHouseIndex = 0;
    this.isHopping = false;
    
    if (this.idleHopTimer) {
      this.idleHopTimer.remove();
      this.idleHopTimer = undefined;
    }
  }

  create() {
    this.cameras.main.fadeIn(300, 254, 215, 170);
    this.createBackButton();

    if (this.houses.length > 0) {
      this.createPlatform();
      this.createRoads();
      this.houses.forEach(house => this.createHouse(house));
      this.createBird();
      this.startIdleHopping();
    } else {
      this.createPlaceholder();
    }

    this.scale.on('resize', this.handleResize, this);
  }

  private createBird() {
    if (this.houses.length === 0) return;
    
    const { width, height } = this.scale;
    const firstHouse = this.houses[0];
    
    const birdX = (firstHouse.x / 100) * width + scale(50);
    const birdY = (firstHouse.y / 100) * height + scale(20);
    
    this.birdSprite = this.add.image(birdX, birdY, 'bird_idle');
    this.birdSprite.setDisplaySize(scale(80), scale(80));
    this.birdSprite.setDepth(1000);
  }

  private startIdleHopping() {
    const scheduleNextIdleHop = () => {
      const randomDelay = Phaser.Math.Between(5000, 8000);
      
      this.idleHopTimer = this.time.delayedCall(randomDelay, () => {
        if (!this.isHopping && !this.isTransitioning && this.birdSprite) {
          this.playIdleHop();
        }
        scheduleNextIdleHop();
      });
    };
    
    scheduleNextIdleHop();
  }

  private playIdleHop() {
    if (!this.birdSprite || this.isHopping || this.houses.length === 0) return;
    
    const originalY = this.birdSprite.y;
    const originalX = this.birdSprite.x;
    
    const { width } = this.scale;
    const currentHouse = this.houses[this.currentHouseIndex];
    const houseCenterX = (currentHouse.x / 100) * width + scale(50);
    
    const houseAreaRadius = scale(60);
    const minX = houseCenterX - houseAreaRadius;
    const maxX = houseCenterX + houseAreaRadius;
    
    const moveDistance = Phaser.Math.Between(-5, 5);
    let targetX = originalX + scale(moveDistance);
    
    targetX = Phaser.Math.Clamp(targetX, minX, maxX);
    
    const hopHeight = scale(15);
    const hopDuration = 300;
    
    this.isHopping = true;
    
    this.tweens.add({
      targets: this.birdSprite,
      x: targetX,
      y: originalY - hopHeight,
      duration: hopDuration / 2,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: this.birdSprite,
          y: originalY,
          duration: hopDuration / 2,
          ease: 'Quad.easeIn',
          onComplete: () => {
            this.isHopping = false;
          }
        });
      }
    });
  }

  private createBackButton() {
    const backButton = this.add.container(scale(20), scale(20));
    backButton.setDepth(100);

    const buttonBg = this.add.graphics();
    buttonBg.fillStyle(0xffffff, 0.9);
    buttonBg.fillRoundedRect(-scale(60), -scale(15), scale(120), scale(30), scale(8));

    const arrowIcon = this.add.graphics();
    arrowIcon.lineStyle(scale(2), 0x000000);
    arrowIcon.beginPath();
    arrowIcon.moveTo(-scale(40), 0);
    arrowIcon.lineTo(-scale(30), -scale(6));
    arrowIcon.moveTo(-scale(40), 0);
    arrowIcon.lineTo(-scale(30), scale(6));
    arrowIcon.strokePath();

    const backText = this.add.text(-scale(15), 0, 'Back', {
      fontSize: scaleFontSize(14),
      color: '#000000',
      fontFamily: 'Arial'
    });
    backText.setOrigin(0, 0.5);

    backButton.add([buttonBg, arrowIcon, backText]);

    const hitArea = new Phaser.Geom.Rectangle(-scale(60), -scale(15), scale(120), scale(30));
    backButton.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains)
      .on('pointerover', () => {
        buttonBg.clear();
        buttonBg.fillStyle(0xffffff, 1);
        buttonBg.fillRoundedRect(-scale(60), -scale(15), scale(120), scale(30), scale(8));
      })
      .on('pointerout', () => {
        buttonBg.clear();
        buttonBg.fillStyle(0xffffff, 0.9);
        buttonBg.fillRoundedRect(-scale(60), -scale(15), scale(120), scale(30), scale(8));
      })
      .on('pointerdown', () => {
        if (!this.isTransitioning) {
          this.handleBackToMap();
        }
      });

    this.backButton = backButton;
  }

  private createPlatform() {
    const { width, height } = this.scale;
    
    this.platform = this.add.image(width / 2, height / 2, 'platform1');
    this.platform.setDepth(0);
    this.platform.setDisplaySize(width * 0.9, scale(300));
  }

  private createRoads() {
    const { width, height } = this.scale;
    
    if (this.houses.length < 2) return;

    for (let i = 0; i < this.houses.length - 1; i++) {
      const house1 = this.houses[i];
      const house2 = this.houses[i + 1];
      
      const x1 = (house1.x / 100) * width;
      const x2 = (house2.x / 100) * width;
      const midX = (x1 + x2) / 2;
      const midY = height / 2;

      const road = this.add.image(midX, midY, 'road1');
      road.setDepth(1);
      
      const distance = Math.abs(x2 - x1);
      road.setDisplaySize(distance * 0.8, scale(40));
      
      this.roads.push(road);
    }
  }

  private createHouse(house: HousePosition) {
    const { width, height } = this.scale;
    
    const x = (house.x / 100) * width;
    const y = (house.y / 100) * height;
    
    const houseContainer = this.add.container(x, y);
    houseContainer.setDepth(10);

    const houseTexture = house.houseType || 'house1';
    const houseSprite = this.add.image(0, 0, houseTexture);
    houseSprite.setDisplaySize(scale(150), scale(150));

    const labelBg = this.add.graphics();
    labelBg.fillStyle(0xffffff, house.isLocked ? 0.7 : 0.9);
    labelBg.fillRoundedRect(-scale(60), scale(90), scale(120), scale(30), scale(8));

    const labelText = this.add.text(0, scale(105), house.name, {
      fontSize: scaleFontSize(14),
      color: house.isLocked ? '#9ca3af' : '#1f2937',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    labelText.setOrigin(0.5, 0.5);

    if (house.isLocked) {
      const lockIcon = this.add.graphics();
      lockIcon.lineStyle(scale(2), 0x9ca3af);
      lockIcon.strokeRect(-scale(8), -scale(8), scale(16), scale(12));
      lockIcon.strokeCircle(0, -scale(10), scale(6));
      houseContainer.add(lockIcon);
    }

    houseContainer.add([houseSprite, labelBg, labelText]);

    if (!house.isLocked) {
      const hitArea = new Phaser.Geom.Circle(0, 0, scale(75));
      houseContainer.setInteractive(hitArea, Phaser.Geom.Circle.Contains)
        .on('pointerover', () => {
          this.tweens.add({
            targets: houseContainer,
            scale: 1.05,
            duration: 150,
            ease: 'Power2'
          });
        })
        .on('pointerout', () => {
          this.tweens.add({
            targets: houseContainer,
            scale: 1,
            duration: 150,
            ease: 'Power2'
          });
        })
        .on('pointerdown', () => {
          if (!this.isTransitioning) {
            this.handleHouseClick(house.id);
          }
        });
    }

    this.houseSprites.set(house.id, houseContainer);
  }

  private createPlaceholder() {
    const { width, height } = this.scale;
    
    const placeholderContainer = this.add.container(width / 2, height / 2);
    placeholderContainer.setDepth(10);

    const cardBg = this.add.graphics();
    cardBg.fillStyle(0xffffff, 0.9);
    cardBg.fillRoundedRect(-scale(200), -scale(100), scale(400), scale(200), scale(15));

    const title = this.add.text(0, -scale(40), '🏘️ Neighborhood View', {
      fontSize: scaleFontSize(24),
      color: '#1f2937',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    title.setOrigin(0.5, 0.5);

    const description = this.add.text(0, scale(10), 
      this.neighborhoodId ? `Neighborhood: ${this.neighborhoodId}` : 'Houses will appear here', 
      {
        fontSize: scaleFontSize(16),
        color: '#6b7280',
        fontFamily: 'Arial'
      }
    );
    description.setOrigin(0.5, 0.5);

    placeholderContainer.add([cardBg, title, description]);
    this.placeholderCard = placeholderContainer;
  }

  private handleHouseClick(houseId: string) {
    if (this.isTransitioning) return;

    this.isTransitioning = true;

    const handleHouseSelect = this.registry.get('handleHouseSelect');
    
    if (handleHouseSelect && typeof handleHouseSelect === 'function') {
      this.cameras.main.fadeOut(300, 254, 215, 170);
      
      this.cameras.main.once('camerafadeoutcomplete', () => {
        handleHouseSelect(houseId);
        this.isTransitioning = false;
      });
    }
  }

  private handleBackToMap() {
    if (this.isTransitioning) return;

    this.isTransitioning = true;

    const handleBackToMap = this.registry.get('handleBackToMap');
    
    if (handleBackToMap && typeof handleBackToMap === 'function') {
      this.cameras.main.fadeOut(300, 254, 215, 170);
      
      this.cameras.main.once('camerafadeoutcomplete', () => {
        handleBackToMap();
        this.isTransitioning = false;
      });
    }
  }

  private handleResize(gameSize: Phaser.Structs.Size) {
    const { width, height } = gameSize;

    if (this.backButton) {
      this.backButton.setPosition(scale(20), scale(20));
    }

    if (this.platform) {
      this.platform.setPosition(width / 2, height / 2);
      this.platform.setDisplaySize(width * 0.9, scale(300));
    }

    this.roads.forEach((road, index) => {
      if (index < this.houses.length - 1) {
        const house1 = this.houses[index];
        const house2 = this.houses[index + 1];
        
        const x1 = (house1.x / 100) * width;
        const x2 = (house2.x / 100) * width;
        const midX = (x1 + x2) / 2;
        const midY = height / 2;
        const distance = Math.abs(x2 - x1);
        
        road.setPosition(midX, midY);
        road.setDisplaySize(distance * 0.8, scale(40));
      }
    });

    this.houses.forEach(house => {
      const houseContainer = this.houseSprites.get(house.id);
      if (houseContainer) {
        const x = (house.x / 100) * width;
        const y = (house.y / 100) * height;
        houseContainer.setPosition(x, y);
      }
    });

    if (this.birdSprite && this.houses.length > 0) {
      const currentHouse = this.houses[this.currentHouseIndex];
      const birdX = (currentHouse.x / 100) * width;
      const birdY = (currentHouse.y / 100) * height;
      this.birdSprite.setPosition(birdX, birdY);
    }

    if (this.placeholderCard) {
      this.placeholderCard.setPosition(width / 2, height / 2);
    }
  }

  shutdown() {
    this.scale.off('resize', this.handleResize, this);
    
    if (this.idleHopTimer) {
      this.idleHopTimer.remove();
      this.idleHopTimer = undefined;
    }
  }
}