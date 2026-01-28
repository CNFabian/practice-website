import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { scale, scaleFontSize } from '../../../../../utils/scaleHelper';
import { SCENE_KEYS } from '../constants/SceneKeys';
import { ASSET_KEYS } from '../constants/AssetKeys';
import { COLORS } from '../constants/Colors';
import { createTextStyle } from '../constants/Typography';

interface NeighborhoodData {
  id: string;
  name: string;
  x: number;
  y: number;
  color: number;
  isLocked: boolean;
  assetKey: string; // Reference to ASSET_KEYS
}

export default class MapScene extends BaseScene {
  // ═══════════════════════════════════════════════════════════
  // PROPERTIES
  // ═══════════════════════════════════════════════════════════
  private neighborhoods: NeighborhoodData[] = [];
  private isTransitioning: boolean = false;
  private centerContainer!: Phaser.GameObjects.Container;
  private neighborhoodContainers: Map<string, Phaser.GameObjects.Container> = new Map();
  private roads: Phaser.GameObjects.Graphics[] = [];
  private resizeDebounceTimer?: Phaser.Time.TimerEvent;
  private lastClickedNeighborhoodId: string | null = null;


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
    this.neighborhoodContainers.clear();
    this.roads = [];
  }

  create() {
    super.create();
    
    // Set background image on DOM element (extends under sidebar)
    console.log('🗺️ MapScene: Setting background image');
    console.log('🗺️ Available textures:', this.textures.list);
    console.log('🗺️ Looking for texture key:', ASSET_KEYS.NEIGHBORHOOD_MAP_BACKGROUND);
    
    // Check if texture exists
    if (this.textures.exists(ASSET_KEYS.NEIGHBORHOOD_MAP_BACKGROUND)) {
      console.log('✅ Texture exists, setting background');
      this.setBackgroundImage(ASSET_KEYS.NEIGHBORHOOD_MAP_BACKGROUND);
    } else {
      console.error('❌ Texture not found:', ASSET_KEYS.NEIGHBORHOOD_MAP_BACKGROUND);
      console.log('Available texture keys:', Object.keys(this.textures.list));
      
      // Fallback: Set a solid color background
      const bgElement = document.getElementById('section-background');
      if (bgElement) {
        bgElement.style.setProperty('background', 'linear-gradient(180deg, #E0E7FF 0%, #C7D2FE 100%)', 'important');
      }
    }
    
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
    
    this.neighborhoodContainers.forEach(container => {
      container.list.forEach(child => {
        if (child instanceof Phaser.GameObjects.Image && child.input) {
          child.removeAllListeners();
          child.disableInteractive();
        }
      });
    });
    
    this.neighborhoodContainers.clear();
    this.roads.forEach(road => road.destroy());
    this.roads = [];
    
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
        x: width * 0.2,
        y: height * 0.65,
        color: COLORS.BLUE_500,
        isLocked: false,
        assetKey: ASSET_KEYS.NEIGHBORHOOD_1,
      },
      {
        id: 'locked-neighborhood',
        name: 'Locked Neighborhood',
        x: width * 0.45,
        y: height * 0.25,
        color: COLORS.GRAY_400,
        isLocked: true,
        assetKey: ASSET_KEYS.NEIGHBORHOOD_2,
      },
      {
        id: 'construction-zone',
        name: 'Construction Zone',
        x: width * 0.7,
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
        // Use backend name if available, otherwise use frontend default
        name: backendData?.name || defaultNeighborhood.name,
        // Use backend lock status if available, otherwise use frontend default
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

    // Draw connecting roads
    this.createRoads();

    // Create neighborhood displays
    this.createNeighborhoodDisplays();
  }

  private createRoads(): void {
    const graphics = this.add.graphics();
    
    // Road from neighborhood 1 to 2
    this.drawRoad(graphics, this.neighborhoods[0], this.neighborhoods[1]);
    
    // Road from neighborhood 2 to 3
    this.drawRoad(graphics, this.neighborhoods[1], this.neighborhoods[2]);
    
    // Road from neighborhood 1 to 3
    this.drawRoad(graphics, this.neighborhoods[0], this.neighborhoods[2]);
    
    this.roads.push(graphics);
  }

  private drawRoad(
    graphics: Phaser.GameObjects.Graphics,
    from: NeighborhoodData,
    to: NeighborhoodData
  ): void {
    graphics.lineStyle(scale(8), 0xdcdcdc, 0.6);
    
    // Draw dashed line
    const points = this.getLinePoints(from.x, from.y, to.x, to.y, 20);
    
    for (let i = 0; i < points.length - 1; i += 2) {
      graphics.beginPath();
      graphics.moveTo(points[i].x, points[i].y);
      if (points[i + 1]) {
        graphics.lineTo(points[i + 1].x, points[i + 1].y);
      }
      graphics.strokePath();
    }
  }

  private getLinePoints(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    segments: number
  ): Array<{ x: number; y: number }> {
    const points = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      points.push({
        x: x1 + (x2 - x1) * t,
        y: y1 + (y2 - y1) * t,
      });
    }
    return points;
  }

  private createNeighborhoodDisplays(): void {
    this.neighborhoods.forEach((neighborhood) => {
      this.createNeighborhoodDisplay(neighborhood);
    });
  }

  private createNeighborhoodDisplay(neighborhood: NeighborhoodData): void {
    const container = this.add.container(neighborhood.x, neighborhood.y);

    // Use actual neighborhood image from preloaded assets
    const neighborhoodImage = this.add.image(0, 0, neighborhood.assetKey);
    
    // Scale each neighborhood independently while maintaining aspect ratio
    if (neighborhood.id === 'home-buying-knowledge') {
      neighborhoodImage.setScale(scale(0.8));
    } else if (neighborhood.id === 'locked-neighborhood') {
      neighborhoodImage.setScale(scale(0.45));
    } else if (neighborhood.id === 'construction-zone') {
      neighborhoodImage.setScale(scale(0.9));
    }
    
    container.add(neighborhoodImage);

    // Neighborhood name label - UPDATED FOR ONEST
    // BEFORE (Arial):
    // const nameLabel = this.add.text(0, scale(100), neighborhood.name, {
    //   fontSize: scaleFontSize(16),
    //   fontFamily: 'Arial, sans-serif',
    //   color: COLORS.TEXT_PRIMARY,
    //   fontStyle: 'bold',
    //   align: 'center',
    //   wordWrap: { width: scale(180) },
    // });
    
    // AFTER (Onest):
    const nameLabel = this.add.text(0, scale(100), neighborhood.name,
      createTextStyle('BODY_BOLD', COLORS.TEXT_PRIMARY, {
        fontSize: scaleFontSize(16),
        align: 'center',
        wordWrap: { width: scale(180) },
      })
    );
    nameLabel.setOrigin(0.5);
    container.add(nameLabel);

    // Lock icon if locked
    if (neighborhood.isLocked) {
      const lockIcon = this.add.text(0, scale(-70), '🔒', {
        fontSize: scaleFontSize(40),
      });
      lockIcon.setOrigin(0.5);
      container.add(lockIcon);
    }

    // Make all neighborhoods interactive with hover effects
    neighborhoodImage.setInteractive({ 
      useHandCursor: true,
      pixelPerfect: true,
      alphaTolerance: 1
    });
    
    neighborhoodImage.on('pointerover', () => {
      neighborhoodImage.setTint(0xdddddd); // Slight tint on hover
      this.tweens.add({
        targets: container,
        scale: 1.05,
        duration: 150,
        ease: 'Power2',
      });
    });

    neighborhoodImage.on('pointerout', () => {
      neighborhoodImage.clearTint();
      this.tweens.add({
        targets: container,
        scale: 1,
        duration: 150,
        ease: 'Power2',
      });
    });

    // Only allow clicking on unlocked neighborhoods
    if (!neighborhood.isLocked) {
      neighborhoodImage.on('pointerdown', () => {
        if (!this.isTransitioning) {
          this.handleNeighborhoodClick(neighborhood.id);
        }
      });
    }

    this.neighborhoodContainers.set(neighborhood.id, container);
  }

  // ═══════════════════════════════════════════════════════════
  // EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════
  private handleNeighborhoodClick(neighborhoodId: string): void {
    if (this.isTransitioning) return;

    this.isTransitioning = true;
    this.lastClickedNeighborhoodId = neighborhoodId; // Store which neighborhood was clicked

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
    
    this.neighborhoods[0].x = width * 0.2;
    this.neighborhoods[0].y = height * 0.65;
    
    this.neighborhoods[1].x = width * 0.45;
    this.neighborhoods[1].y = height * 0.25;
    
    this.neighborhoods[2].x = width * 0.7;
    this.neighborhoods[2].y = height * 0.65;
    
    // Update container positions
    this.neighborhoods.forEach((neighborhood) => {
      const container = this.neighborhoodContainers.get(neighborhood.id);
      if (container) {
        container.setPosition(neighborhood.x, neighborhood.y);
      }
    });

    // Redraw roads
    this.roads.forEach(road => road.destroy());
    this.roads = [];
    this.createRoads();
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

    const container = this.neighborhoodContainers.get(clickedNeighborhood.id);
    if (!container) {
      callback();
      return;
    }

    const neighborhoodImage = container.getAll().find(obj => obj.type === 'Image') as Phaser.GameObjects.Image;
    if (!neighborhoodImage) {
      callback();
      return;
    }

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