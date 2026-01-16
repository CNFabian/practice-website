import Phaser from 'phaser';
import { scale, scaleFontSize } from '../../../../../utils/scaleHelper';

interface HousePosition {
  id: string;
  name: string;
  x: number; // Percentage from left (0-100)
  y: number; // Percentage from top (0-100)
  isLocked?: boolean;
  houseType?: string; // 'house1', 'house2', 'house3', 'house4', etc.
}

interface NeighborhoodSceneData {
  neighborhoodId?: string;
  houses?: HousePosition[];
  currentHouseIndex?: number;
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
  private previousHouseIndex: number = 0; // Track where bird came from

  constructor() {
    super({ key: 'NeighborhoodScene' });
  }

  init(data: NeighborhoodSceneData) {
    this.neighborhoodId = data.neighborhoodId;
    this.houses = data.houses || [];
    this.isTransitioning = false;
    this.houseSprites.clear();
    this.roads = [];
    this.currentHouseIndex = data.currentHouseIndex ?? 0;
    this.previousHouseIndex = this.currentHouseIndex; // Initialize previous to current
    this.isHopping = false;
    
    // Clear any existing timers
    if (this.idleHopTimer) {
      this.idleHopTimer.remove();
      this.idleHopTimer = undefined;
    }
  }

  create() {
    // Fade in camera
    this.cameras.main.fadeIn(300, 254, 215, 170);

    // Create back button
    this.createBackButton();

    // Create houses or placeholder
    if (this.houses.length > 0) {
      // Create single platform as background first
      this.createPlatform();
      
      // Create roads between houses
      this.createRoads();
      
      // Then create houses on top
      this.houses.forEach(house => this.createHouse(house));
      
      // Create bird character at current house
      this.createBird();
      
      // Start idle hopping animation
      this.startIdleHopping();
    } else {
      this.createPlaceholder();
    }

    // Handle window resize
    this.scale.on('resize', this.handleResize, this);
  }

  private createBird() {
    if (this.houses.length === 0) return;
    
    const { width, height } = this.scale;
    const currentHouse = this.houses[this.currentHouseIndex];
    
    // Calculate bird position (above the current house)
    const birdX = (currentHouse.x / 100) * width + scale(50); // Centered horizontally
    const birdY = (currentHouse.y / 100) * height + scale(20);
    
    // Create bird sprite
    this.birdSprite = this.add.image(birdX, birdY, 'bird_idle');
    this.birdSprite.setDisplaySize(scale(80), scale(80));
    this.birdSprite.setDepth(1000); // Ensure bird is always on top
  }

  private startIdleHopping() {
    // Schedule next idle hop with random delay
    const scheduleNextIdleHop = () => {
      const randomDelay = Phaser.Math.Between(5000, 8000); // Random delay between 5-8 seconds
      
      this.idleHopTimer = this.time.delayedCall(randomDelay, () => {
        if (!this.isHopping && !this.isTransitioning && this.birdSprite) {
          this.playIdleHop();
        }
        scheduleNextIdleHop(); // Schedule the next hop
      });
    };
    
    scheduleNextIdleHop();
  }

  private playIdleHop() {
    if (!this.birdSprite || this.isHopping || this.houses.length === 0) return;
    
    const originalY = this.birdSprite.y;
    const originalX = this.birdSprite.x;
    
    // Get current house position to constrain movement
    const { width } = this.scale;
    const currentHouse = this.houses[this.currentHouseIndex];
    const houseCenterX = (currentHouse.x / 100) * width + scale(50);
    
    // Define the house area boundary (±60 pixels from house center)
    const houseAreaRadius = scale(60);
    const minX = houseCenterX - houseAreaRadius;
    const maxX = houseCenterX + houseAreaRadius;
    
    // Random small movement in X direction that stays within house area
    const moveDistance = Phaser.Math.Between(-5, 5);
    let targetX = originalX + scale(moveDistance);
    
    // Clamp to house area
    targetX = Phaser.Math.Clamp(targetX, minX, maxX);
    
    // Only flip if there's actual horizontal movement
    const actualMove = targetX - originalX;
    if (Math.abs(actualMove) > scale(2)) {
      if (actualMove < 0) {
        // Moving left, flip sprite
        this.birdSprite.setFlipX(true);
      } else {
        // Moving right, unflip sprite
        this.birdSprite.setFlipX(false);
      }
    }
    
    // Single hop with moderate height
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
        // Slight rotation during hop
        this.tweens.add({
          targets: this.birdSprite,
          angle: -3,
          duration: duration / 2,
          ease: 'Sine.easeInOut',
          yoyo: true
        });
      }
    });
  }

  private travelToHouse(targetHouseIndex: number) {
    if (!this.birdSprite || this.isHopping || targetHouseIndex >= this.houses.length) return;
    
    this.isHopping = true;
    this.previousHouseIndex = this.currentHouseIndex; // Store where we're coming from
    
    const { width, height } = this.scale;
    const targetHouse = this.houses[targetHouseIndex];
    const targetX = (targetHouse.x / 100) * width + scale(50);
    const targetY = (targetHouse.y / 100) * height + scale(20);
    
    // Flip bird sprite based on direction of travel
    if (targetX < this.birdSprite.x) {
      // Moving left
      this.birdSprite.setFlipX(true);
    } else {
      // Moving right
      this.birdSprite.setFlipX(false);
    }
    
    // Calculate house distance
    const houseDistance = Math.abs(targetHouseIndex - this.currentHouseIndex);
    
    // If more than 1 house away, glide. Otherwise, hop
    if (houseDistance > 1) {
      // GLIDE ANIMATION - smooth movement that takes time proportional to number of houses traveled
      const hopDuration = 250;
      const totalGlideTime = houseDistance * hopDuration * 4;
      
      // Change to flight texture - get original dimensions and scale proportionally
      this.birdSprite.setTexture('bird_fly');
      const flyTexture = this.textures.get('bird_fly');
      const flyWidth = flyTexture.getSourceImage().width;
      const flyHeight = flyTexture.getSourceImage().height;
      const flyAspectRatio = flyWidth / flyHeight;
      
      // Set size maintaining aspect ratio (base height 100, width scales accordingly)
      this.birdSprite.setDisplaySize(scale(100) * flyAspectRatio, scale(100));
      
      this.tweens.add({
        targets: this.birdSprite,
        x: targetX,
        y: targetY,
        duration: totalGlideTime,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          // Change back to idle texture and restore original size
          this.birdSprite!.setTexture('bird_idle');
          this.birdSprite!.setDisplaySize(scale(80), scale(80));
          this.isHopping = false;
          this.currentHouseIndex = targetHouseIndex;
          this.handleHouseClick(targetHouse.id);
        }
      });
    } else {
      // HOP ANIMATION (existing code)
      const distance = Phaser.Math.Distance.Between(
        this.birdSprite.x, 
        this.birdSprite.y, 
        targetX, 
        targetY
      );
      
      const numHops = Math.max(5, Math.floor(distance / scale(40)));
      const hopHeight = scale(10);
      const hopDuration = 250;
      
      const path: { x: number; y: number }[] = [];
      for (let i = 0; i <= numHops; i++) {
        const t = i / numHops;
        const x = Phaser.Math.Linear(this.birdSprite.x, targetX, t);
        const y = Phaser.Math.Linear(this.birdSprite.y, targetY, t);
        path.push({ x, y });
      }
      
      let currentHop = 0;
      
      const performNextHop = () => {
        if (currentHop >= path.length - 1) {
          this.isHopping = false;
          this.currentHouseIndex = targetHouseIndex;
          this.handleHouseClick(targetHouse.id);
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
              yoyo: true
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
              }
            });
          }
        });
      };
      
      performNextHop();
    }
  }

  private createPlatform() {
    const { width, height } = this.scale;
    
    // Create single platform centered in the scene
    this.platform = this.add.image(width / 2, height / 2, 'platform1');
    
    // Scale the platform to fit the width of the scene
    this.platform.setDisplaySize(width * 0.9, scale(300));
    this.platform.setAlpha(0.8);
    this.platform.setDepth(0);
  }

  private createRoads() {
    const { width, height } = this.scale;
    
    // Create roads connecting houses in sequence
    for (let i = 0; i < this.houses.length - 1; i++) {
      const house1 = this.houses[i];
      const house2 = this.houses[i + 1];
      
      const x1 = (house1.x / 100) * width;
      const y1 = (house1.y / 100) * height;
      const x2 = (house2.x / 100) * width;
      const y2 = (house2.y / 100) * height;
      
      // Calculate midpoint
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      
      // Calculate angle between houses
      const angle = Phaser.Math.Angle.Between(x1, y1, x2, y2);
      
      // Calculate distance for road length
      const distance = Phaser.Math.Distance.Between(x1, y1, x2, y2);
      
      // Create road
      const road = this.add.image(midX, midY, 'road1');
      road.setDisplaySize(distance, scale(40));
      road.setRotation(angle);
      road.setAlpha(0.7);
      road.setDepth(1);
      
      this.roads.push(road);
    }
  }

  private createBackButton() {
    // Create back button container
    this.backButton = this.add.container(scale(20), scale(20));

    // Button background
    const buttonBg = this.add.rectangle(0, 0, scale(100), scale(40), 0xffffff, 0.9);
    buttonBg.setStrokeStyle(scale(2), 0xe5e7eb);
    this.backButton.add(buttonBg);

    // Back arrow and text
    const backText = this.add.text(0, 0, '← Back', {
      fontSize: scaleFontSize(16),
      fontFamily: 'Arial, sans-serif',
      color: '#1f2937',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.backButton.add(backText);

    // Make interactive
    buttonBg.setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        if (!this.isTransitioning) {
          buttonBg.setFillStyle(0xf3f4f6);
          this.tweens.add({
            targets: this.backButton,
            scale: 1.05,
            duration: 150,
            ease: 'Power2'
          });
        }
      })
      .on('pointerout', () => {
        buttonBg.setFillStyle(0xffffff, 0.9);
        this.tweens.add({
          targets: this.backButton,
          scale: 1,
          duration: 150,
          ease: 'Power2'
        });
      })
      .on('pointerdown', () => {
        if (!this.isTransitioning) {
          this.handleBackToMap();
        }
      });
  }

  private createHouse(house: HousePosition) {
    const { width, height } = this.scale;

    // Calculate position based on percentages
    const x = (house.x / 100) * width;
    const y = (house.y / 100) * height;

    // Create container for house
    const houseContainer = this.add.container(x, y);
    houseContainer.setDepth(10);

    // Create the house icon
    const houseType = house.houseType || 'house1';
    this.createHouseIcon(houseContainer, houseType);

    // Label background
    const labelBg = this.add.rectangle(
      0, 
      scale(100), 
      scale(140), 
      scale(32), 
      house.isLocked ? 0xe5e7eb : 0xffffff, 
      house.isLocked ? 1 : 0.9
    );
    houseContainer.add(labelBg);

    const nameText = this.add.text(0, scale(100), house.name, {
      fontSize: scaleFontSize(14),
      fontFamily: 'Arial, sans-serif',
      color: house.isLocked ? '#4b5563' : '#1f2937',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    houseContainer.add(nameText);

    // Make interactive if not locked
    if (!house.isLocked) {
      houseContainer.setInteractive(new Phaser.Geom.Rectangle(-75, -75, 150, 150), Phaser.Geom.Rectangle.Contains)
        .on('pointerover', () => {
          if (!this.isTransitioning && !this.isHopping) {
            this.tweens.add({
              targets: houseContainer,
              scale: 1.1,
              duration: 300,
              ease: 'Power2'
            });
          }
        })
        .on('pointerout', () => {
          this.tweens.add({
            targets: houseContainer,
            scale: 1,
            duration: 300,
            ease: 'Power2'
          });
        })
        .on('pointerdown', () => {
          if (!this.isTransitioning && !this.isHopping) {
            // Find the index of the clicked house
            const targetIndex = this.houses.findIndex(h => h.id === house.id);
            
            if (targetIndex !== -1 && targetIndex !== this.currentHouseIndex) {
              // Bird travels to the clicked house
              this.travelToHouse(targetIndex);
            } else if (targetIndex === this.currentHouseIndex) {
              // Bird is already at this house, just transition
              this.handleHouseClick(house.id);
            }
          }
        });
      
      // Set cursor only if input exists
      if (houseContainer.input) {
        houseContainer.input.cursor = 'pointer';
      }
    } else {
      // Reduce opacity for locked houses
      houseContainer.setAlpha(0.6);
    }

    // Store reference
    this.houseSprites.set(house.id, houseContainer);
  }

  private createHouseIcon(container: Phaser.GameObjects.Container, houseType: string) {
    // Use the houseType to determine which image to display
    const houseImage = this.add.image(0, 0, houseType);
    houseImage.setDisplaySize(scale(150), scale(150)); // Set visible size
    container.add(houseImage);
  }

  private createPlaceholder() {
    const { width, height } = this.scale;

    // Create placeholder card container
    this.placeholderCard = this.add.container(width / 2, height / 2);

    // Card background
    const cardWidth = scale(500);
    const cardHeight = scale(550);
    const card = this.add.rectangle(0, 0, cardWidth, cardHeight, 0xffffff, 0.9);
    card.setStrokeStyle(scale(2), 0xe5e7eb);
    this.placeholderCard.add(card);

    // Icon circle
    const iconCircle = this.add.circle(0, scale(-220), scale(32), 0xf97316);
    this.placeholderCard.add(iconCircle);

    // House icon in circle
    const houseIcon = this.add.text(0, scale(-220), '🏘️', {
      fontSize: scaleFontSize(32),
      color: '#ffffff'
    }).setOrigin(0.5);
    this.placeholderCard.add(houseIcon);

    // Title
    const title = this.add.text(0, scale(-160), 'Neighborhood View', {
      fontSize: scaleFontSize(28),
      fontFamily: 'Arial, sans-serif',
      color: '#1f2937',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.placeholderCard.add(title);

    // Subtitle
    const subtitle = this.add.text(
      0, 
      scale(-120), 
      this.neighborhoodId ? 
        `Neighborhood: ${this.neighborhoodId}` : 
        'No neighborhood selected',
      {
        fontSize: scaleFontSize(16),
        fontFamily: 'Arial, sans-serif',
        color: '#6b7280',
        align: 'center'
      }
    ).setOrigin(0.5);
    this.placeholderCard.add(subtitle);

    // Description
    const description = this.add.text(
      0,
      scale(-60),
      'Houses and learning modules\nwill appear here once configured.',
      {
        fontSize: scaleFontSize(14),
        fontFamily: 'Arial, sans-serif',
        color: '#9ca3af',
        align: 'center',
        wordWrap: { width: cardWidth - scale(80) }
      }
    ).setOrigin(0.5);
    this.placeholderCard.add(description);

    // Placeholder houses (3 sample houses)
    const placeholderY = scale(60);
    const placeholderSpacing = scale(140);
    
    for (let i = 0; i < 3; i++) {
      this.createPlaceholderHouse(
        scale(-140) + (i * placeholderSpacing),
        placeholderY,
        `House ${i + 1}`,
        `house${i + 1}`,
        i === 0 ? 0x3b82f6 : i === 1 ? 0x10b981 : 0xf59e0b
      );
    }

    // Call to action
    const ctaText = this.add.text(
      0,
      scale(220),
      'Configure this neighborhood in settings',
      {
        fontSize: scaleFontSize(12),
        fontFamily: 'Arial, sans-serif',
        color: '#d1d5db',
        align: 'center'
      }
    ).setOrigin(0.5);
    this.placeholderCard.add(ctaText);
  }

  private createPlaceholderHouse(x: number, y: number, label: string, id: string, bgColor: number) {
    if (!this.placeholderCard) return;

    const buttonWidth = scale(120);
    const buttonHeight = scale(100);
    const hoverColor = Phaser.Display.Color.IntegerToColor(bgColor).lighten(20).color;

    const buttonContainer = this.add.container(x, y);
    this.placeholderCard.add(buttonContainer);

    // Button background
    const buttonBg = this.add.rectangle(0, 0, buttonWidth, buttonHeight, bgColor, 0.2);
    buttonBg.setStrokeStyle(scale(1), bgColor, 0.3);
    buttonContainer.add(buttonBg);

    // Button text
    const buttonText = this.add.text(0, 0, label, {
      fontSize: scaleFontSize(14),
      fontFamily: 'Arial, sans-serif',
      color: Phaser.Display.Color.IntegerToColor(bgColor).rgba
    }).setOrigin(0.5);
    buttonContainer.add(buttonText);

    // Make interactive
    buttonBg.setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        if (!this.isTransitioning) {
          buttonBg.setFillStyle(hoverColor, 0.3);
          this.tweens.add({
            targets: buttonContainer,
            scale: 1.05,
            duration: 150,
            ease: 'Power2'
          });
        }
      })
      .on('pointerout', () => {
        buttonBg.setFillStyle(bgColor, 0.2);
        this.tweens.add({
          targets: buttonContainer,
          scale: 1,
          duration: 150,
          ease: 'Power2'
          });
      })
      .on('pointerdown', () => {
        if (!this.isTransitioning) {
          this.handleHouseClick(id);
        }
      });
  }

  private handleHouseClick(houseId: string) {
    if (this.isTransitioning) return;

    this.isTransitioning = true;

    // Store the current house index in the registry before transitioning
    this.registry.set('currentHouseIndex', this.currentHouseIndex);
    
    // Store bird travel info for HouseScene entrance animation
    const travelInfo = {
      previousHouseIndex: this.previousHouseIndex,
      currentHouseIndex: this.currentHouseIndex,
      traveled: this.previousHouseIndex !== this.currentHouseIndex
    };
    this.registry.set('birdTravelInfo', travelInfo);

    // Get the navigation handler from registry
    const handleHouseSelect = this.registry.get('handleHouseSelect');
    
    if (handleHouseSelect && typeof handleHouseSelect === 'function') {
      // Add transition effect before switching scenes
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

    // Get the back handler from registry
    const handleBackToMap = this.registry.get('handleBackToMap');
    
    if (handleBackToMap && typeof handleBackToMap === 'function') {
      // Add transition effect
      this.cameras.main.fadeOut(300, 254, 215, 170);
      
      this.cameras.main.once('camerafadeoutcomplete', () => {
        handleBackToMap();
        this.isTransitioning = false;
      });
    }
  }

  private handleResize(gameSize: Phaser.Structs.Size) {
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

  shutdown() {
    // Clean up event listeners
    this.scale.off('resize', this.handleResize, this);
    
    // Clean up timer
    if (this.idleHopTimer) {
      this.idleHopTimer.remove();
      this.idleHopTimer = undefined;
    }
  }
}