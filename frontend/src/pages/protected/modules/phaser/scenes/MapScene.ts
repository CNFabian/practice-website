import Phaser from 'phaser';
import { scale, scaleFontSize } from '../../../../../utils/scaleHelper';

interface NeighborhoodData {
  id: string;
  name: string;
  x: number;
  y: number;
  color: number;
  isLocked: boolean;
}

export default class MapScene extends Phaser.Scene {
  private neighborhoods: NeighborhoodData[] = [];
  private isTransitioning: boolean = false;
  private centerContainer!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'MapScene' });
  }

  init() {
    this.isTransitioning = false;
  }

  create() {
    const { width, height } = this.scale;

    // Define neighborhood data
    this.neighborhoods = [
      {
        id: 'downtown',
        name: 'Downtown',
        x: width * 0.35,
        y: height * 0.5,
        color: 0x3b82f6, // Blue
        isLocked: false
      },
      {
        id: 'suburbs',
        name: 'Suburbs',
        x: width * 0.65,
        y: height * 0.5,
        color: 0x10b981, // Green
        isLocked: false
      }
    ];

    // Create center container for UI card
    this.centerContainer = this.add.container(width / 2, height / 2);

    // Create white background card
    const cardWidth = scale(400);
    const cardHeight = scale(500);
    const card = this.add.rectangle(0, 0, cardWidth, cardHeight, 0xffffff, 0.9);
    card.setStrokeStyle(scale(2), 0xe5e7eb);
    this.centerContainer.add(card);

    // Create map icon circle at top
    const iconCircle = this.add.circle(0, scale(-180), scale(32), 0x3b82f6);
    this.centerContainer.add(iconCircle);

    // Add map icon text (emoji as text)
    const mapIcon = this.add.text(0, scale(-180), '🗺️', {
      fontSize: scaleFontSize(32),
      color: '#ffffff'
    }).setOrigin(0.5);
    this.centerContainer.add(mapIcon);

    // Title
    const title = this.add.text(0, scale(-120), 'Map View', {
      fontSize: scaleFontSize(28),
      fontFamily: 'Arial, sans-serif',
      color: '#1f2937',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.centerContainer.add(title);

    // Subtitle
    const subtitle = this.add.text(0, scale(-80), 'Interactive map with learning\nneighborhoods coming soon!', {
      fontSize: scaleFontSize(16),
      fontFamily: 'Arial, sans-serif',
      color: '#6b7280',
      align: 'center'
    }).setOrigin(0.5);
    this.centerContainer.add(subtitle);

    // Features section
    const featuresTitle = this.add.text(scale(-160), scale(-20), 'Features:', {
      fontSize: scaleFontSize(16),
      fontFamily: 'Arial, sans-serif',
      color: '#1f2937',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);
    this.centerContainer.add(featuresTitle);

    // Features list
    const features = [
      '• Navigate learning neighborhoods',
      '• Track progress across regions',
      '• Unlock new areas',
      '• Visual progress indicators'
    ];

    features.forEach((feature, index) => {
      const featureText = this.add.text(scale(-160), scale(10 + (index * 25)), feature, {
        fontSize: scaleFontSize(14),
        fontFamily: 'Arial, sans-serif',
        color: '#6b7280'
      }).setOrigin(0, 0.5);
      this.centerContainer.add(featureText);
    });

    // Preview Neighborhoods title
    const previewTitle = this.add.text(0, scale(140), 'Preview Neighborhoods:', {
      fontSize: scaleFontSize(16),
      fontFamily: 'Arial, sans-serif',
      color: '#1f2937',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.centerContainer.add(previewTitle);

    // Create neighborhood buttons
    this.createNeighborhoodButton('downtown', 'Downtown', scale(-80), scale(190), 0x3b82f6, 0xdbeafe);
    this.createNeighborhoodButton('suburbs', 'Suburbs', scale(80), scale(190), 0x10b981, 0xd1fae5);

    // Handle window resize
    this.scale.on('resize', this.handleResize, this);
  }

  private createNeighborhoodButton(
    id: string,
    label: string,
    x: number,
    y: number,
    bgColor: number,
    hoverColor: number
  ) {
    const buttonWidth = scale(140);
    const buttonHeight = scale(40);

    // Create button container
    const buttonContainer = this.add.container(x, y);
    this.centerContainer.add(buttonContainer);

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
          this.handleNeighborhoodClick(id);
        }
      });
  }

  private handleNeighborhoodClick(neighborhoodId: string) {
    if (this.isTransitioning) return;

    this.isTransitioning = true;

    // Get the navigation handler from registry
    const handleNeighborhoodSelect = this.registry.get('handleNeighborhoodSelect');
    
    if (handleNeighborhoodSelect && typeof handleNeighborhoodSelect === 'function') {
      // Add transition effect before switching scenes
      this.cameras.main.fadeOut(300, 0, 0, 0);
      
      this.cameras.main.once('camerafadeoutcomplete', () => {
        handleNeighborhoodSelect(neighborhoodId);
        this.isTransitioning = false;
      });
    }
  }

  private handleResize(gameSize: Phaser.Structs.Size) {
    const { width, height } = gameSize;

    // Reposition center container
    if (this.centerContainer) {
      this.centerContainer.setPosition(width / 2, height / 2);
    }

    // Update neighborhood positions if they exist
    this.neighborhoods.forEach((neighborhood, index) => {
      neighborhood.x = width * (0.35 + (index * 0.3));
      neighborhood.y = height * 0.5;
    });
  }

  shutdown() {
    // Clean up event listeners
    this.scale.off('resize', this.handleResize, this);
  }
}