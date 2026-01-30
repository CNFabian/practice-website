import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { scale, scaleFontSize } from '../../../../../utils/scaleHelper';
import { SCENE_KEYS } from '../constants/SceneKeys';
import { ASSET_KEYS } from '../constants/AssetKeys';
import { COLORS } from '../constants/Colors';
import { createTextStyle } from '../constants/Typography';
import { SceneTransitionManager } from '../managers/SceneTransitionManager';

interface NeighborhoodData {
  id: string;
  name: string;
  x: number;
  y: number;
  color: number;
  isLocked: boolean;
  assetKey: string;
}

interface NeighborhoodElements {
  container: Phaser.GameObjects.Container;
  shadowImage: Phaser.GameObjects.Image;
  neighborhoodImage: Phaser.GameObjects.Image;
  bgImage: Phaser.GameObjects.Image;
  nameLabel: Phaser.GameObjects.Text;
  lockIcon?: Phaser.GameObjects.Image;
}

export default class MapScene extends BaseScene {
  // ═══════════════════════════════════════════════════════════
  // PROPERTIES
  // ═══════════════════════════════════════════════════════════
  private neighborhoods: NeighborhoodData[] = [];
  private isTransitioning: boolean = false;
  private centerContainer!: Phaser.GameObjects.Container;
  private neighborhoodElements: Map<string, NeighborhoodElements> = new Map();
  private resizeDebounceTimer?: Phaser.Time.TimerEvent;
  private lastClickedNeighborhoodId: string | null = null;
  private transitionManager!: SceneTransitionManager;

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
    this.neighborhoodElements.clear();
  }

  create() {
    super.create();
    
    // Check if texture exists
    if (this.textures.exists(ASSET_KEYS.NEIGHBORHOOD_MAP_BACKGROUND)) {
      this.setBackgroundImage(ASSET_KEYS.NEIGHBORHOOD_MAP_BACKGROUND);
    } else {
      // Fallback: Set a solid color background
      const bgElement = document.getElementById('section-background');
      if (bgElement) {
        bgElement.style.setProperty('background', 'linear-gradient(180deg, #E0E7FF 0%, #C7D2FE 100%)', 'important');
      }
    }
    
    // Initialize transition manager and fade in
    this.transitionManager = new SceneTransitionManager(this);
    this.transitionManager.enterMap();
    
    this.setupNeighborhoodData();
    this.createUI();
    this.setupEventListeners();
  }

  shutdown() {
    super.shutdown();
    
    if (this.resizeDebounceTimer) {
      this.resizeDebounceTimer.remove();
      this.resizeDebounceTimer = undefined;
    }
    
    // Clean up coming soon modal
    this.hideComingSoonModal();
    
    this.neighborhoodElements.forEach(elements => {
      if (elements.neighborhoodImage.input) {
        elements.neighborhoodImage.removeAllListeners();
        elements.neighborhoodImage.disableInteractive();
      }
    });
    
    this.neighborhoodElements.clear();
    
    this.tweens.killAll();
    this.cleanupEventListeners();
  }

  // ═══════════════════════════════════════════════════════════
  // SETUP METHODS
  // ═══════════════════════════════════════════════════════════
  private setupNeighborhoodData(): void {
    const { width, height } = this.scale;

    // Get backend neighborhood data from registry (if available)
    const backendNeighborhoods = this.registry.get('neighborhoodsData');

    // Frontend defaults for positioning and assets
    const defaultNeighborhoods = [
      {
        id: 'home-buying-knowledge',
        name: 'Home-Buying Knowledge',
        x: width * 0.25, // Middle ground: was 0.2, then 0.3, now 0.25
        y: height * 0.65,
        color: COLORS.BLUE_500,
        isLocked: false,
        assetKey: ASSET_KEYS.NEIGHBORHOOD_1,
      },
      {
        id: 'locked-neighborhood',
        name: 'Locked Neighborhood',
        x: width * 0.5,  // Middle ground: was 0.45, then 0.55, now 0.5
        y: height * 0.25,
        color: COLORS.GRAY_400,
        isLocked: true,
        assetKey: ASSET_KEYS.NEIGHBORHOOD_2,
      },
      {
        id: 'construction-zone',
        name: 'Construction Zone',
        x: width * 0.75, // Middle ground: was 0.7, then 0.8, now 0.75
        y: height * 0.65,
        color: COLORS.ORANGE_500,
        isLocked: true,
        assetKey: ASSET_KEYS.NEIGHBORHOOD_3,
      },
    ];

    // Merge backend data with frontend defaults
    this.neighborhoods = defaultNeighborhoods.map((defaultNeighborhood, index) => {
      const backendData = backendNeighborhoods?.[index];
      return {
        ...defaultNeighborhood,
        name: backendData?.name || defaultNeighborhood.name,
        isLocked: backendData?.isLocked !== undefined ? backendData.isLocked : defaultNeighborhood.isLocked,
      };
    });
  }

  private setupEventListeners(): void {
    this.scale.on('resize', this.handleResizeDebounced, this);
  }

  private handleResizeDebounced(): void {
    if (this.resizeDebounceTimer) {
      this.resizeDebounceTimer.remove();
    }
    
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

    // Create neighborhood displays with proper layering
    this.createNeighborhoodDisplays();
  }

  private createNeighborhoodDisplays(): void {
    // LAYER 1: Create all shadows first (lowest layer)
    this.neighborhoods.forEach((neighborhood) => {
      this.createShadow(neighborhood);
    });

    // LAYER 2: Create all neighborhood images (middle layer)
    this.neighborhoods.forEach((neighborhood) => {
      this.createNeighborhoodImage(neighborhood);
    });

    // LAYER 3: Create all UI elements (top layer - backgrounds, text, icons)
    this.neighborhoods.forEach((neighborhood) => {
      this.createNeighborhoodUI(neighborhood);
    });

    // Setup interactivity after all elements are created
    this.neighborhoods.forEach((neighborhood) => {
      this.setupNeighborhoodInteractivity(neighborhood);
    });
  }

  private createShadow(neighborhood: NeighborhoodData): void {
    const container = this.add.container(neighborhood.x, neighborhood.y);

    // Create temporary neighborhood image to get dimensions
    const tempImage = this.add.image(0, 0, neighborhood.assetKey);
    
    // Scale based on neighborhood ID
    if (neighborhood.id === 'home-buying-knowledge') {
      tempImage.setScale(scale(0.8));
      container.setDepth(10);
    } else if (neighborhood.id === 'locked-neighborhood') {
      tempImage.setScale(scale(0.45));
    } else if (neighborhood.id === 'construction-zone') {
      tempImage.setScale(scale(0.65));
    }

    // Calculate shadow position and scale
    let shadowYOffset = tempImage.displayHeight * 0.2;
    let shadowScale = tempImage.scaleX;

    // Adjust for locked neighborhood - move shadow higher
    if (neighborhood.id === 'locked-neighborhood') {
      shadowYOffset = tempImage.displayHeight * 0.1; // Higher position
      shadowScale = tempImage.scaleX * 1.5;
    } else if (neighborhood.id === 'construction-zone') {
      shadowScale = tempImage.scaleX * 0.8;
    }

    // Create shadow image
    const shadowImage = this.add.image(0, shadowYOffset, ASSET_KEYS.NEIGHBORHOOD_SHADOW);
    shadowImage.setScale(shadowScale);
    shadowImage.setOrigin(0.5);
    shadowImage.setDepth(0); // Lowest depth
    container.add(shadowImage);

    // Store elements
    const elements = this.neighborhoodElements.get(neighborhood.id) || {} as NeighborhoodElements;
    elements.container = container;
    elements.shadowImage = shadowImage;
    this.neighborhoodElements.set(neighborhood.id, elements);

    // Destroy temp image
    tempImage.destroy();
  }

  private createNeighborhoodImage(neighborhood: NeighborhoodData): void {
    const elements = this.neighborhoodElements.get(neighborhood.id)!;
    const container = elements.container;

    // Create neighborhood image
    const neighborhoodImage = this.add.image(0, 0, neighborhood.assetKey);

    if (neighborhood.isLocked) {
      neighborhoodImage.preFX?.addBlur(0, 1.25, 1.25);
    }
    
    // Scale based on neighborhood ID
    if (neighborhood.id === 'home-buying-knowledge') {
      neighborhoodImage.setScale(scale(0.8));
    } else if (neighborhood.id === 'locked-neighborhood') {
      neighborhoodImage.setScale(scale(0.45));
    } else if (neighborhood.id === 'construction-zone') {
      neighborhoodImage.setScale(scale(0.4));
    }

    neighborhoodImage.setDepth(1); // Middle depth
    container.add(neighborhoodImage);

    // Update elements
    elements.neighborhoodImage = neighborhoodImage;
    this.neighborhoodElements.set(neighborhood.id, elements);
  }

  private createNeighborhoodUI(neighborhood: NeighborhoodData): void {
    const elements = this.neighborhoodElements.get(neighborhood.id)!;
    const container = elements.container;

    // Only show title and background for unlocked neighborhoods
    let bgImage: Phaser.GameObjects.Image;
    let nameLabel: Phaser.GameObjects.Text;

    if (!neighborhood.isLocked) {
      // Background for neighborhood name with radial gradient glow effect
      const bgWidth = scale(325);
      const bgHeight = scale(75);

      // Create a canvas element to draw the radial gradient
      const canvas = document.createElement('canvas');
      canvas.width = bgWidth;
      canvas.height = bgHeight;
      const ctx = canvas.getContext('2d')!;

      // Create elliptical radial gradient (wider horizontally)
      const centerX = bgWidth / 2;
      const centerY = bgHeight / 2;

      // Use transform to create elliptical gradient
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.scale(1, bgHeight / bgWidth); // Flatten the gradient vertically

      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, centerX);
      gradient.addColorStop(0, 'rgba(54, 88, 236, 0.8)');
      gradient.addColorStop(1, 'rgba(64, 85, 167, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, centerX, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Create texture from canvas
      const textureKey = `gradient-${neighborhood.id}`;
      if (!this.textures.exists(textureKey)) {
        this.textures.addCanvas(textureKey, canvas);
      }
      bgImage = this.add.image(0, 0, textureKey);
      bgImage.setOrigin(0.5);
      bgImage.setDepth(2); // Top depth
      container.add(bgImage);

      // Neighborhood name label
      nameLabel = this.add.text(0, 0, neighborhood.name,
        createTextStyle('BODY_BOLD', COLORS.TEXT_WHITE, {
          fontSize: scaleFontSize(16),
          align: 'center',
          wordWrap: { width: scale(246) },
        })
      );
      nameLabel.setOrigin(0.5);
      nameLabel.setDepth(3); // Highest depth
      container.add(nameLabel);
    }

    // Lock/Roadblock icon for locked neighborhoods
    let lockIcon: Phaser.GameObjects.Image | undefined;
    if (neighborhood.isLocked) {
      // Use different icons based on neighborhood type
      const iconAssetKey = neighborhood.id === 'construction-zone' 
        ? ASSET_KEYS.ROADBLOCK_ICON 
        : ASSET_KEYS.LOCK_ICON;
      
      lockIcon = this.add.image(0, 0, iconAssetKey);
      lockIcon.setOrigin(0.5);
      lockIcon.setScale(scale(0.5)); // Adjust scale as needed
      lockIcon.setDepth(3); // Highest depth
      container.add(lockIcon);
      
    }

    // Update elements
    elements.bgImage = bgImage!;
    elements.nameLabel = nameLabel!;
    elements.lockIcon = lockIcon;
    this.neighborhoodElements.set(neighborhood.id, elements);
  }

  private setupNeighborhoodInteractivity(neighborhood: NeighborhoodData): void {
    const elements = this.neighborhoodElements.get(neighborhood.id)!;
    const { neighborhoodImage, shadowImage, bgImage, nameLabel } = elements;

    // Make neighborhood image interactive
    neighborhoodImage.setInteractive({ 
      useHandCursor: !neighborhood.isLocked, // Only show hand cursor for unlocked
      pixelPerfect: true,
      alphaTolerance: 1
    });

    // If locked, show "Coming soon" modal on hover
    if (neighborhood.isLocked) {
      neighborhoodImage.on('pointerover', () => {
        this.showComingSoonModal(neighborhood);
      });
      
      neighborhoodImage.on('pointerout', () => {
        this.hideComingSoonModal();
      });
      
      return; // Skip hover animations and click handlers for locked neighborhoods
    }

    // Store original scale values for unlocked neighborhoods
    const originalImageScaleX = neighborhoodImage.scaleX;
    const originalImageScaleY = neighborhoodImage.scaleY;
    const originalShadowScaleX = shadowImage.scaleX;
    const originalShadowScaleY = shadowImage.scaleY;

    neighborhoodImage.on('pointerover', () => {
      // Kill any existing tweens on these objects
      this.tweens.killTweensOf([neighborhoodImage, shadowImage, bgImage, nameLabel]);
      
      this.tweens.add({
        targets: neighborhoodImage,
        scaleX: originalImageScaleX * 1.1,
        scaleY: originalImageScaleY * 1.1,
        y: -20,
        duration: 400,
        ease: 'Cubic.easeOut',
      });
      
      // Move text and background up with the image
      this.tweens.add({
        targets: [bgImage, nameLabel],
        y: -20,
        duration: 400,
        ease: 'Cubic.easeOut',
      });
      
      // Grow shadow
      this.tweens.add({
        targets: shadowImage,
        scaleX: originalShadowScaleX * 1.3,
        scaleY: originalShadowScaleY * 1.3,
        alpha: 0.8,
        duration: 400,
        ease: 'Cubic.easeOut',
      });
    });

    neighborhoodImage.on('pointerout', () => {
      // Kill any existing tweens on these objects
      this.tweens.killTweensOf([neighborhoodImage, shadowImage, bgImage, nameLabel]);
      
      this.tweens.add({
        targets: neighborhoodImage,
        scaleX: originalImageScaleX,
        scaleY: originalImageScaleY,
        y: 0,
        duration: 400,
        ease: 'Cubic.easeOut',
      });
      
      // Move text and background back down
      this.tweens.add({
        targets: [bgImage, nameLabel],
        y: 0,
        duration: 400,
        ease: 'Cubic.easeOut',
      });
      
      // Shrink shadow back
      this.tweens.add({
        targets: shadowImage,
        scaleX: originalShadowScaleX,
        scaleY: originalShadowScaleY,
        alpha: 1,
        duration: 400,
        ease: 'Cubic.easeOut',
      });
    });

    // Click handler for unlocked neighborhoods
    neighborhoodImage.on('pointerdown', () => {
      if (!this.isTransitioning) {
        this.handleNeighborhoodClick(neighborhood.id);
      }
    });
  }

  // ═══════════════════════════════════════════════════════════
  // COMING SOON MODAL
  // ═══════════════════════════════════════════════════════════
  private comingSoonModal?: Phaser.GameObjects.Container;

  private showComingSoonModal(neighborhood: NeighborhoodData): void {
    if (this.comingSoonModal) return; // Already showing

    const elements = this.neighborhoodElements.get(neighborhood.id)!;
    const container = elements.container;

    // Create modal container positioned directly over the neighborhood
    const modalContainer = this.add.container(
      container.x,
      container.y
    );
    modalContainer.setDepth(1000); // Very high depth to appear above everything

    // Modal background - smaller to reduce whitespace
    const modalWidth = scale(220);
    const modalHeight = scale(70);
    const modalBg = this.add.graphics();
    modalBg.fillStyle(0xffffff, 1);
    modalBg.fillRoundedRect(-modalWidth / 2, -modalHeight / 2, modalWidth, modalHeight, scale(12));
    modalContainer.add(modalBg);

    // Bird icon - positioned half outside the left border
    const birdIcon = this.add.image(-modalWidth / 2, 0, ASSET_KEYS.NOTICE_BIRD_ICON);
    birdIcon.setScale(scale(0.3));
    birdIcon.setOrigin(0.5, 0.5); // Center the bird so it's half in, half out
    modalContainer.add(birdIcon);

    // "Coming soon!" text - centered in the modal box
    const comingSoonText = this.add.text(0, 0, 'Coming soon!',
      createTextStyle('H1', COLORS.TEXT_PRIMARY, {
        fontSize: scaleFontSize(20),
        align: 'center',
      })
    );
    comingSoonText.setOrigin(0.5, 0.5);
    modalContainer.add(comingSoonText);

    this.comingSoonModal = modalContainer;
  }

  private hideComingSoonModal(): void {
    if (this.comingSoonModal) {
      this.comingSoonModal.destroy();
      this.comingSoonModal = undefined;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════
  private handleNeighborhoodClick(neighborhoodId: string): void {
    if (this.isTransitioning) return;

    this.isTransitioning = true;
    this.lastClickedNeighborhoodId = neighborhoodId;

    const handleNeighborhoodSelect = this.registry.get('handleNeighborhoodSelect');

    if (handleNeighborhoodSelect && typeof handleNeighborhoodSelect === 'function') {
      this.transitionToNeighborhood(() => {
        handleNeighborhoodSelect(neighborhoodId);
        this.isTransitioning = false;
      });
    }
  }

  private handleResize(): void {
    const { width, height } = this.scale;

    this.tweens.killAll();
    this.handleCoinCounterResize();

    if (this.centerContainer) {
      this.centerContainer.setPosition(width / 2, height / 2);
    }
    
    this.neighborhoods[0].x = width * 0.25; // Middle ground position
    this.neighborhoods[0].y = height * 0.65;
    
    this.neighborhoods[1].x = width * 0.5;  // Middle ground position
    this.neighborhoods[1].y = height * 0.25;
    
    this.neighborhoods[2].x = width * 0.75; // Middle ground position
    this.neighborhoods[2].y = height * 0.65;
    
    // Update container positions
    this.neighborhoods.forEach((neighborhood) => {
      const elements = this.neighborhoodElements.get(neighborhood.id);
      if (elements) {
        elements.container.setPosition(neighborhood.x, neighborhood.y);
      }
    });
  }

  // ═══════════════════════════════════════════════════════════
  // TRANSITION METHODS
  // ═══════════════════════════════════════════════════════════
  private transitionToNeighborhood(callback: () => void): void {
    const clickedNeighborhoodId = this.lastClickedNeighborhoodId;
    const clickedNeighborhood = this.neighborhoods.find(n => n.id === clickedNeighborhoodId);
    
    if (!clickedNeighborhood) {
      callback();
      return;
    }

    const elements = this.neighborhoodElements.get(clickedNeighborhood.id);
    if (!elements) {
      callback();
      return;
    }

    const { container, neighborhoodImage } = elements;

    const { width, height } = this.scale;
    const camera = this.cameras.main;

    const imageWorldWidth = neighborhoodImage.displayWidth;
    const imageWorldHeight = neighborhoodImage.displayHeight;
    const zoomX = width / imageWorldWidth;
    const zoomY = height / imageWorldHeight;
    const targetZoom = Math.max(zoomX, zoomY) * 1.2;

    const worldX = container.x;
    const worldY = container.y;
    const targetScrollX = worldX - width / 2;
    const targetScrollY = worldY - height / 2;

    // Fade the container to transparent
    this.tweens.add({
      targets: container,
      alpha: 0,
      duration: 800,
      ease: 'Cubic.easeInOut'
    });

    // Animate camera zoom and pan
    this.tweens.add({
      targets: camera,
      zoom: targetZoom,
      scrollX: targetScrollX,
      scrollY: targetScrollY,
      duration: 800,
      ease: 'Cubic.easeInOut',
      onComplete: () => {
        callback();
      }
    });
  }
}