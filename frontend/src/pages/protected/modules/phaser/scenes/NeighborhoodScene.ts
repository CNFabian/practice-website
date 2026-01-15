import Phaser from 'phaser';
import { scale, scaleFontSize } from '../../../../../utils/scaleHelper';
import { House1, House2, House3, House4 } from '../../../../../assets';

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

  preload() {
    // Load house images using imported variables
    this.load.image('house1', House1);
    this.load.image('house2', House2);
    this.load.image('house3', House3);
    this.load.image('house4', House4);
  }

  init(data: NeighborhoodSceneData) {
    this.neighborhoodId = data.neighborhoodId;
    this.houses = data.houses || [];
    this.isTransitioning = false;
    this.houseSprites.clear();
  }

  create() {
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
    this.backButton = this.add.container(scale(80), scale(40));

    // Button background
    const buttonBg = this.add.rectangle(0, 0, scale(140), scale(44), 0xffffff, 0.9);
    buttonBg.setStrokeStyle(scale(1), 0xe5e7eb);
    this.backButton.add(buttonBg);

    // Back arrow icon (simplified SVG path as graphics)
    const arrow = this.add.graphics();
    arrow.lineStyle(scale(2), 0x000000, 1);
    arrow.beginPath();
    arrow.moveTo(scale(-50), 0);
    arrow.lineTo(scale(-40), scale(-5));
    arrow.moveTo(scale(-50), 0);
    arrow.lineTo(scale(-40), scale(5));
    arrow.moveTo(scale(-50), 0);
    arrow.lineTo(scale(-30), 0);
    arrow.strokePath();
    this.backButton.add(arrow);

    // Button text
    const buttonText = this.add.text(0, 0, 'Back to Map', {
      fontSize: scaleFontSize(14),
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

  // House icon - use houseType to determine which image
  this.createHouseIcon(houseContainer, house.houseType || 'house1');

  // House name label
  const labelBg = this.add.rectangle(
    0, 
    scale(100), 
    scale(house.name.length * 8 + 20), 
    scale(30), 
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
        if (!this.isTransitioning) {
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
        if (!this.isTransitioning) {
          this.handleHouseClick(house.id);
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
      this.neighborhoodId ? `Exploring: ${this.neighborhoodId}` : 'Learning Neighborhood',
      {
        fontSize: scaleFontSize(18),
        fontFamily: 'Arial, sans-serif',
        color: '#6b7280'
      }
    ).setOrigin(0.5);
    this.placeholderCard.add(subtitle);

    // Features title
    const featuresTitle = this.add.text(scale(-180), scale(-60), 'Coming Features:', {
      fontSize: scaleFontSize(16),
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
      const featureText = this.add.text(scale(-180), scale(-30 + (index * 25)), feature, {
        fontSize: scaleFontSize(14),
        fontFamily: 'Arial, sans-serif',
        color: '#6b7280'
      }).setOrigin(0, 0.5);
      if (this.placeholderCard) {
        this.placeholderCard.add(featureText);
      }
    });

    // Preview Houses title
    const previewTitle = this.add.text(0, scale(100), 'Preview Houses:', {
      fontSize: scaleFontSize(16),
      fontFamily: 'Arial, sans-serif',
      color: '#1f2937',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.placeholderCard.add(previewTitle);

    // Create demo house buttons
    this.createDemoButton('starter_house', 'Starter House', scale(-90), scale(160), 0x3b82f6, 0xdbeafe);
    this.createDemoButton('advanced_house', 'Advanced House', scale(90), scale(160), 0xa855f7, 0xf3e8ff);
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

    const buttonWidth = scale(160);
    const buttonHeight = scale(40);

    // Create button container
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
      this.backButton.setPosition(scale(80), scale(40));
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