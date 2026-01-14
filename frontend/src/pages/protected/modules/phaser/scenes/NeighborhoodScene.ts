import Phaser from 'phaser';

interface HousePosition {
  id: string;
  name: string;
  x: number; // Percentage from left (0-100)
  y: number; // Percentage from top (0-100)
  isLocked?: boolean;
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

  constructor() {
    super({ key: 'NeighborhoodScene' });
  }

  init(data: NeighborhoodSceneData) {
    this.neighborhoodId = data.neighborhoodId;
    this.houses = data.houses || [];
    this.isTransitioning = false;
    this.houseSprites.clear();
  }

  create() {
    // Set background color (rgb(254, 215, 170) = #fed7aa)
    this.cameras.main.setBackgroundColor(0xfed7aa);

    // Fade in camera
    this.cameras.main.fadeIn(300, 254, 215, 170);

    // Create back button
    this.createBackButton();

    // Create houses or placeholder
    if (this.houses.length > 0) {
      this.houses.forEach(house => this.createHouse(house));
    } else {
      this.createPlaceholder();
    }

    // Handle window resize
    this.scale.on('resize', this.handleResize, this);
  }

  private createBackButton() {
    // Create back button container
    this.backButton = this.add.container(80, 40);

    // Button background
    const buttonBg = this.add.rectangle(0, 0, 140, 44, 0xffffff, 0.9);
    buttonBg.setStrokeStyle(1, 0xe5e7eb);
    this.backButton.add(buttonBg);

    // Back arrow icon (simplified SVG path as graphics)
    const arrow = this.add.graphics();
    arrow.lineStyle(2, 0x000000, 1);
    arrow.beginPath();
    arrow.moveTo(-50, 0);
    arrow.lineTo(-40, -5);
    arrow.moveTo(-50, 0);
    arrow.lineTo(-40, 5);
    arrow.moveTo(-50, 0);
    arrow.lineTo(-30, 0);
    arrow.strokePath();
    this.backButton.add(arrow);

    // Button text
    const buttonText = this.add.text(0, 0, 'Back to Map', {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#000000'
    }).setOrigin(0.5);
    this.backButton.add(buttonText);

    // Make interactive
    buttonBg.setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        if (!this.isTransitioning) {
          buttonBg.setFillStyle(0xffffff, 1);
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

    // Calculate position from percentage
    const x = (house.x / 100) * width;
    const y = (house.y / 100) * height;

    // Create house container
    const houseContainer = this.add.container(x, y);

    // House background box
    const houseSize = 80;
    const houseBg = this.add.rectangle(
      0, 
      0, 
      houseSize, 
      houseSize, 
      house.isLocked ? 0xd1d5db : 0xf97316, // gray-300 or orange-500
      1
    );
    houseBg.setStrokeStyle(2, 0x000000, 0.1);
    houseContainer.add(houseBg);

    // House icon
    if (house.isLocked) {
      // Lock icon
      this.createLockIcon(houseContainer);
    } else {
      // House icon
      this.createHouseIcon(houseContainer);
    }

    // House name label
    const labelBg = this.add.rectangle(
      0, 
      60, 
      house.name.length * 8 + 20, 
      30, 
      house.isLocked ? 0xe5e7eb : 0xffffff, 
      house.isLocked ? 1 : 0.9
    );
    houseContainer.add(labelBg);

    const nameText = this.add.text(0, 60, house.name, {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: house.isLocked ? '#4b5563' : '#1f2937',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    houseContainer.add(nameText);

    // Make interactive if not locked
    if (!house.isLocked) {
      houseBg.setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
          if (!this.isTransitioning) {
            houseBg.setFillStyle(0xea580c); // orange-600
            this.tweens.add({
              targets: houseContainer,
              scale: 1.1,
              duration: 300,
              ease: 'Power2'
            });
          }
        })
        .on('pointerout', () => {
          houseBg.setFillStyle(0xf97316); // orange-500
          this.tweens.add({
            targets: houseContainer,
            scale: 1,
            duration: 300,
            ease: 'Power2'
          });
        })
        .on('pointerdown', () => {
          if (!this.isTransitioning) {
            this.handleHouseClick(house.id);
          }
        });
    } else {
      // Reduce opacity for locked houses
      houseContainer.setAlpha(0.6);
    }

    // Store reference
    this.houseSprites.set(house.id, houseContainer);
  }

  private createHouseIcon(container: Phaser.GameObjects.Container) {
    // Simplified house icon using graphics
    const graphics = this.add.graphics();
    graphics.lineStyle(2, 0xffffff, 1);
    
    // House outline
    graphics.strokeRect(-20, -10, 40, 30);
    
    // Roof
    graphics.beginPath();
    graphics.moveTo(-25, -10);
    graphics.lineTo(0, -25);
    graphics.lineTo(25, -10);
    graphics.strokePath();
    
    // Door
    graphics.fillStyle(0xffffff, 0.8);
    graphics.fillRect(-8, 5, 16, 15);
    
    container.add(graphics);
  }

  private createLockIcon(container: Phaser.GameObjects.Container) {
    // Simplified lock icon using graphics
    const graphics = this.add.graphics();
    graphics.lineStyle(2, 0x6b7280, 1);
    
    // Lock body
    graphics.strokeRect(-12, -5, 24, 20);
    
    // Lock shackle
    graphics.strokeCircle(0, -10, 8);
    
    // Keyhole
    graphics.fillStyle(0x6b7280, 1);
    graphics.fillCircle(0, 3, 3);
    
    container.add(graphics);
  }

  private createPlaceholder() {
    const { width, height } = this.scale;

    // Create placeholder card container
    this.placeholderCard = this.add.container(width / 2, height / 2);

    // Card background
    const cardWidth = 500;
    const cardHeight = 550;
    const card = this.add.rectangle(0, 0, cardWidth, cardHeight, 0xffffff, 0.9);
    card.setStrokeStyle(2, 0xe5e7eb);
    this.placeholderCard.add(card);

    // Icon circle
    const iconCircle = this.add.circle(0, -220, 32, 0xf97316);
    this.placeholderCard.add(iconCircle);

    // House icon in circle
    const houseIcon = this.add.text(0, -220, '🏘️', {
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.placeholderCard.add(houseIcon);

    // Title
    const title = this.add.text(0, -160, 'Neighborhood View', {
      fontSize: '28px',
      fontFamily: 'Arial, sans-serif',
      color: '#1f2937',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.placeholderCard.add(title);

    // Subtitle
    const subtitle = this.add.text(
      0, 
      -120, 
      this.neighborhoodId ? `Exploring: ${this.neighborhoodId}` : 'Learning Neighborhood',
      {
        fontSize: '18px',
        fontFamily: 'Arial, sans-serif',
        color: '#6b7280'
      }
    ).setOrigin(0.5);
    this.placeholderCard.add(subtitle);

    // Features title
    const featuresTitle = this.add.text(-180, -60, 'Coming Features:', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#1f2937',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);
    this.placeholderCard.add(featuresTitle);

    // Features list
    const features = [
      '• Themed learning houses',
      '• Progressive unlocking',
      '• Neighborhood achievements',
      '• Interactive house selection'
    ];

    features.forEach((feature, index) => {
      const featureText = this.add.text(-180, -30 + (index * 25), feature, {
        fontSize: '14px',
        fontFamily: 'Arial, sans-serif',
        color: '#6b7280'
      }).setOrigin(0, 0.5);
      if (this.placeholderCard) {
        this.placeholderCard.add(featureText);
      }
    });

    // Preview Houses title
    const previewTitle = this.add.text(0, 100, 'Preview Houses:', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#1f2937',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.placeholderCard.add(previewTitle);

    // Create demo house buttons
    this.createDemoButton('starter_house', 'Starter House', -90, 160, 0x3b82f6, 0xdbeafe);
    this.createDemoButton('advanced_house', 'Advanced House', 90, 160, 0xa855f7, 0xf3e8ff);
  }

  private createDemoButton(
    id: string,
    label: string,
    x: number,
    y: number,
    bgColor: number,
    hoverColor: number
  ) {
    if (!this.placeholderCard) return;

    const buttonWidth = 160;
    const buttonHeight = 40;

    // Create button container
    const buttonContainer = this.add.container(x, y);
    this.placeholderCard.add(buttonContainer);

    // Button background
    const buttonBg = this.add.rectangle(0, 0, buttonWidth, buttonHeight, bgColor, 0.2);
    buttonBg.setStrokeStyle(1, bgColor, 0.3);
    buttonContainer.add(buttonBg);

    // Button text
    const buttonText = this.add.text(0, 0, label, {
      fontSize: '14px',
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

    // Get the navigation handler from registry
    const handleBackToMap = this.registry.get('handleBackToMap');
    
    if (handleBackToMap && typeof handleBackToMap === 'function') {
      // Add transition effect before switching scenes
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
      this.backButton.setPosition(80, 40);
    }

    // Reposition houses based on percentage
    this.houses.forEach(house => {
      const houseContainer = this.houseSprites.get(house.id);
      if (houseContainer) {
        const x = (house.x / 100) * width;
        const y = (house.y / 100) * height;
        houseContainer.setPosition(x, y);
      }
    });

    // Reposition placeholder card
    if (this.placeholderCard) {
      this.placeholderCard.setPosition(width / 2, height / 2);
    }
  }

  shutdown() {
    // Clean up event listeners
    this.scale.off('resize', this.handleResize, this);
    this.houseSprites.clear();
  }
}