import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { scale, scaleFontSize } from '../../../../../utils/scaleHelper';
import { SCENE_KEYS } from '../constants/SceneKeys';
import { COLORS } from '../constants/Colors';
import { CardBuilder } from '../ui/CardBuilder';
import { UIComponents } from '../ui/UIComponents';

interface NeighborhoodData {
  id: string;
  name: string;
  x: number;
  y: number;
  color: number;
  isLocked: boolean;
}

export default class MapScene extends BaseScene {
  // ═══════════════════════════════════════════════════════════
  // PROPERTIES
  // ═══════════════════════════════════════════════════════════
  private neighborhoods: NeighborhoodData[] = [];
  private isTransitioning: boolean = false;
  private centerContainer!: Phaser.GameObjects.Container;
  private neighborhoodButtons: Phaser.GameObjects.Container[] = [];
  private resizeDebounceTimer?: Phaser.Time.TimerEvent;

  // ═══════════════════════════════════════════════════════════
  // CONSTRUCTOR
  // ═══════════════════════════════════════════════════════════
  constructor() {
    super({ key: SCENE_KEYS.MAP });
  }

  // ═══════════════════════════════════════════════════════════
  // LIFECYCLE METHODS
  // ═══════════════════════════════════════════════════════════
  init() {
    this.isTransitioning = false;
    this.neighborhoodButtons = []; // Reset button array
  }

  create() {
    super.create();
    this.setupNeighborhoodData();
    this.createUI();
    this.setupEventListeners();
  }

  shutdown() {
    super.shutdown();
    
    // Clean up debounce timer
    if (this.resizeDebounceTimer) {
      this.resizeDebounceTimer.remove();
      this.resizeDebounceTimer = undefined;
    }
    
    // Clean up neighborhood button listeners
    this.neighborhoodButtons.forEach(button => {
      const buttonBg = button.list[0] as Phaser.GameObjects.Rectangle;
      if (buttonBg && buttonBg.input) {
        buttonBg.removeAllListeners();
        buttonBg.disableInteractive();
      }
    });
    
    this.neighborhoodButtons = [];
    
    // Kill all tweens
    this.tweens.killAll();
    
    this.cleanupEventListeners();
  }

  // ═══════════════════════════════════════════════════════════
  // SETUP METHODS
  // ═══════════════════════════════════════════════════════════
  private setupNeighborhoodData(): void {
    const { width, height } = this.scale;

    this.neighborhoods = [
      {
        id: 'downtown',
        name: 'Downtown',
        x: width * 0.35,
        y: height * 0.5,
        color: COLORS.BLUE_500,
        isLocked: false,
      },
      {
        id: 'suburbs',
        name: 'Suburbs',
        x: width * 0.65,
        y: height * 0.5,
        color: COLORS.GREEN_500,
        isLocked: false,
      },
    ];
  }

  private setupEventListeners(): void {
    this.scale.on('resize', this.handleResizeDebounced, this);
  }

  private handleResizeDebounced(): void {
    // Clear existing debounce timer
    if (this.resizeDebounceTimer) {
      this.resizeDebounceTimer.remove();
    }
    
    // Set new debounce timer (wait 100ms after last resize)
    this.resizeDebounceTimer = this.time.delayedCall(100, () => {
      this.handleResize();
      this.resizeDebounceTimer = undefined;
    });
  }

  private cleanupEventListeners(): void {
    this.scale.off('resize', this.handleResizeDebounced, this);
  }

  // ═══════════════════════════════════════════════════════════
  // UI CREATION METHODS
  // ═══════════════════════════════════════════════════════════
  private createUI(): void {
    const { width, height } = this.scale;

    // Create center container
    this.centerContainer = this.add.container(width / 2, height / 2);

    // Create main card
    this.createMainCard();

    // Create neighborhood buttons
    this.createNeighborhoodButtons();
  }

  private createMainCard(): void {
    // Create card with header using CardBuilder
    const headerCard = CardBuilder.createHeaderCard({
      scene: this,
      width: scale(400),
      height: scale(500),
      iconText: '🗺️',
      titleText: 'Map View',
      subtitleText: 'Interactive map with learning\nneighborhoods coming soon!',
      iconCircleColor: COLORS.BLUE_500,
    });

    this.centerContainer.add(headerCard);

    // Add features section
    this.createFeaturesSection();

    // Add preview title
    this.createPreviewTitle();
  }

  private createFeaturesSection(): void {
    // Features title
    const featuresTitle = UIComponents.createSubtitle(
      this,
      'Features:',
      16,
      COLORS.TEXT_PRIMARY,
      'left'
    );
    featuresTitle.setPosition(scale(-160), scale(-20));
    featuresTitle.setOrigin(0, 0.5);
    featuresTitle.setFontStyle('bold');
    this.centerContainer.add(featuresTitle);

    // Features list
    const features = [
      '• Navigate learning neighborhoods',
      '• Track progress across regions',
      '• Unlock new areas',
      '• Visual progress indicators',
    ];

    features.forEach((feature, index) => {
      const featureText = this.add.text(
        scale(-160),
        scale(10 + index * 25),
        feature,
        {
          fontSize: scaleFontSize(14),
          fontFamily: 'Arial, sans-serif',
          color: COLORS.TEXT_SECONDARY,
        }
      ).setOrigin(0, 0.5);
      this.centerContainer.add(featureText);
    });
  }

  private createPreviewTitle(): void {
    const previewTitle = UIComponents.createSubtitle(
      this,
      'Preview Neighborhoods:',
      16,
      COLORS.TEXT_PRIMARY
    );
    previewTitle.setPosition(0, scale(140));
    previewTitle.setFontStyle('bold');
    this.centerContainer.add(previewTitle);
  }

  private createNeighborhoodButtons(): void {
    // Downtown button
    this.createNeighborhoodButton(
      'downtown',
      'Downtown',
      scale(-80),
      scale(190),
      COLORS.BLUE_500,
      0xdbeafe // Light blue hover
    );

    // Suburbs button
    this.createNeighborhoodButton(
      'suburbs',
      'Suburbs',
      scale(80),
      scale(190),
      COLORS.GREEN_500,
      0xd1fae5 // Light green hover
    );
  }

  private createNeighborhoodButton(
    id: string,
    label: string,
    x: number,
    y: number,
    bgColor: number,
    hoverColor: number
  ): void {
    const buttonWidth = scale(140);
    const buttonHeight = scale(40);

    // Create button container
    const buttonContainer = this.add.container(x, y);
    this.centerContainer.add(buttonContainer);

    // Button background
    const buttonBg = this.add.rectangle(
      0,
      0,
      buttonWidth,
      buttonHeight,
      bgColor,
      0.2
    );
    buttonBg.setStrokeStyle(scale(1), bgColor, 0.3);
    buttonContainer.add(buttonBg);

    // Button text
    const buttonText = this.add.text(0, 0, label, {
      fontSize: scaleFontSize(14),
      fontFamily: 'Arial, sans-serif',
      color: Phaser.Display.Color.IntegerToColor(bgColor).rgba,
    }).setOrigin(0.5);
    buttonContainer.add(buttonText);

    // Make interactive
    this.makeButtonInteractive(buttonContainer, buttonBg, id, bgColor, hoverColor);
  }

  private makeButtonInteractive(
    container: Phaser.GameObjects.Container,
    background: Phaser.GameObjects.Rectangle,
    id: string,
    bgColor: number,
    hoverColor: number
  ): void {
    background.setInteractive({ useHandCursor: true });
    
    // Store the container for cleanup
    this.neighborhoodButtons.push(container);
    
    background.on('pointerover', () => {
      if (!this.isTransitioning) {
        background.setFillStyle(hoverColor, 0.3);
        this.tweens.add({
          targets: container,
          scale: 1.05,
          duration: 150,
          ease: 'Power2',
        });
      }
    });
    
    background.on('pointerout', () => {
      background.setFillStyle(bgColor, 0.2);
      this.tweens.add({
        targets: container,
        scale: 1,
        duration: 150,
        ease: 'Power2',
      });
    });
    
    background.on('pointerdown', () => {
      if (!this.isTransitioning) {
        this.handleNeighborhoodClick(id);
      }
    });
  }

  // ═══════════════════════════════════════════════════════════
  // EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════
  private handleNeighborhoodClick(neighborhoodId: string): void {
    if (this.isTransitioning) return;

    this.isTransitioning = true;

    // Get the navigation handler from registry
    const handleNeighborhoodSelect = this.registry.get('handleNeighborhoodSelect');

    if (handleNeighborhoodSelect && typeof handleNeighborhoodSelect === 'function') {
      // Add transition effect before switching scenes
      this.transitionToNeighborhood(() => {
        handleNeighborhoodSelect(neighborhoodId);
        this.isTransitioning = false;
      });
    }
  }

  private handleResize(): void {
    const { width, height } = this.scale;

    // Kill all active tweens before repositioning
    this.tweens.killAll();

    this.handleCoinCounterResize();

    // Reposition center container
    if (this.centerContainer) {
      this.centerContainer.setPosition(width / 2, height / 2);
    }

    // Update neighborhood positions
    this.neighborhoods.forEach((neighborhood, index) => {
      neighborhood.x = width * (0.35 + index * 0.3);
      neighborhood.y = height * 0.5;
    });
  }

  // ═══════════════════════════════════════════════════════════
  // TRANSITION METHODS
  // ═══════════════════════════════════════════════════════════
  private transitionToNeighborhood(callback: () => void): void {
    callback();
  }
}