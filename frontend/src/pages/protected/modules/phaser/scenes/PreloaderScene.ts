import Phaser from 'phaser';
import { SCENE_KEYS } from '../constants/SceneKeys';
import { ASSET_KEYS } from '../constants/AssetKeys';
// Typography constants imported via createTextStyle helper
import {
  HouseBackground,
  LessonHouse,
  House1,
  House2,
  House3,
  House4,
  House5,
  HouseCloud,
  BirdIdle,
  BirdFly,
  BirdCelebration,
  CoinCounterIcon,
  stage1Tree,
  stage2Tree,
  stage3Tree,
  stage4Tree,
  stage5Tree,
  stage6Tree,
  stage7Tree,
  Neighborhood1,
  Neighborhood2,
  Neighborhood3,
  NeighborhoodMap,
  NeighborhoodShadow,
  LockIcon,
  RoadblockIcon,
  NoticeBirdIcon,
  VideoProgressIcon,
  DocumentProgressIcon,
  ProgressStarIcon,
  FrontGrass,
  BackgroundCloud,
  GrowYourNestBackground,
  WateringCanStill,
  WateringCanWatering
} from '../../../../../assets';

export default class PreloaderScene extends Phaser.Scene {
  private progressBar?: Phaser.GameObjects.Graphics;
  private progressBox?: Phaser.GameObjects.Graphics;
  private loadingText?: Phaser.GameObjects.Text;
  private percentText?: Phaser.GameObjects.Text;
  private shouldLoad: boolean = true;

  constructor() {
    super({ key: SCENE_KEYS.PRELOADER });
  }

  init() {
    const assetsLoaded = this.registry.get('assetsLoaded');
    this.shouldLoad = !assetsLoaded;
    console.log('PreloaderScene.init: shouldLoad =', this.shouldLoad);
  }

  preload(): void {
    if (!this.shouldLoad) {
      console.log('PreloaderScene.preload: Skipping asset loading (already loaded)');
      return;
    }

    console.log('PreloaderScene.preload: Starting asset load');

    // ═══════════════════════════════════════════════════════════
    // LOAD ONEST FONTS
    // ═══════════════════════════════════════════════════════════
    
    // Load Onest font variants
    this.loadOnestFonts();
    
    // Create loading UI
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    this.progressBar = this.add.graphics();
    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x222222, 0.8);
    this.progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);
    
    this.loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      fontSize: '20px',
      color: '#ffffff'
    });
    this.loadingText.setOrigin(0.5, 0.5);
    
    this.percentText = this.add.text(width / 2, height / 2, '0%', {
      fontSize: '18px',
      color: '#ffffff'
    });
    this.percentText.setOrigin(0.5, 0.5);

    this.load.on('progress', (value: number) => {
      if (this.percentText) {
        this.percentText.setText(Math.floor(value * 100) + '%');
      }
      if (this.progressBar) {
        this.progressBar.clear();
        this.progressBar.fillStyle(0xffffff, 1);
        this.progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
      }
    });

    this.load.on('complete', () => {
      this.cleanup();
    });

    // Load all assets
    // Backgrounds
    this.load.image(ASSET_KEYS.SUBURBAN_BACKGROUND, HouseBackground);
    this.load.image(ASSET_KEYS.NEIGHBORHOOD_MAP_BACKGROUND, NeighborhoodMap);
    this.load.image(ASSET_KEYS.NEIGHBORHOOD_SHADOW, NeighborhoodShadow);
    this.load.image(ASSET_KEYS.LOCK_ICON, LockIcon);
    this.load.image(ASSET_KEYS.ROADBLOCK_ICON, RoadblockIcon);
    this.load.image(ASSET_KEYS.NOTICE_BIRD_ICON, NoticeBirdIcon);
    this.load.image(ASSET_KEYS.GROW_YOUR_NEST_BACKGROUND, GrowYourNestBackground);
    
    // Neighborhoods
    this.load.image(ASSET_KEYS.NEIGHBORHOOD_1, Neighborhood1);
    this.load.image(ASSET_KEYS.NEIGHBORHOOD_2, Neighborhood2);
    this.load.image(ASSET_KEYS.NEIGHBORHOOD_3, Neighborhood3);
    
    // Houses
    this.load.image(ASSET_KEYS.LESSON_HOUSE, LessonHouse);
    this.load.image(ASSET_KEYS.HOUSE_1, House1);
    this.load.image(ASSET_KEYS.HOUSE_2, House2);
    this.load.image(ASSET_KEYS.HOUSE_3, House3);
    this.load.image(ASSET_KEYS.HOUSE_4, House4);
    this.load.image(ASSET_KEYS.HOUSE_5, House5);
    this.load.image(ASSET_KEYS.HOUSE_CLOUD, HouseCloud);
    this.load.image(ASSET_KEYS.VIDEO_PROGRESS_ICON, VideoProgressIcon);
    this.load.image(ASSET_KEYS.DOCUMENT_PROGRESS_ICON, DocumentProgressIcon);
    this.load.image(ASSET_KEYS.PROGRESS_STAR_ICON, ProgressStarIcon);
    this.load.image(ASSET_KEYS.FRONT_GRASS, FrontGrass);
    this.load.image(ASSET_KEYS.BACKGROUND_CLOUD, BackgroundCloud);
    
    // Characters
    this.load.image(ASSET_KEYS.BIRD_IDLE, BirdIdle);
    this.load.image(ASSET_KEYS.BIRD_FLY, BirdFly);
    this.load.svg(ASSET_KEYS.BIRD_CELEBRATION, BirdCelebration, { width: 200, height: 200 });
    
    // UI
    this.load.image(ASSET_KEYS.COIN_ICON, CoinCounterIcon);
    
    // Trees
    this.load.image(ASSET_KEYS.TREE_STAGE_1, stage1Tree);
    this.load.image(ASSET_KEYS.TREE_STAGE_2, stage2Tree);
    this.load.image(ASSET_KEYS.TREE_STAGE_3, stage3Tree);
    this.load.image(ASSET_KEYS.TREE_STAGE_4, stage4Tree);
    this.load.image(ASSET_KEYS.TREE_STAGE_5, stage5Tree);
    this.load.image(ASSET_KEYS.TREE_STAGE_6, stage6Tree);
    this.load.image(ASSET_KEYS.TREE_STAGE_7, stage7Tree);

    //Minigame Assets
    this.load.image(ASSET_KEYS.WATERING_CAN_STILL, WateringCanStill);
    this.load.image(ASSET_KEYS.WATERING_CAN_POURING, WateringCanWatering);
  }

  /**
   * Load Onest font family in all required weights
   */
  private loadOnestFonts(): void {
    // Phaser doesn't have built-in font loading like CSS
    // We use a WebFont loader or create a CSS @font-face
    
    // METHOD 1: Inject CSS @font-face (Recommended for Phaser)
    const style = document.createElement('style');
    style.innerHTML = `
      @font-face {
        font-family: 'Onest';
        src: url('/assets/fonts/onest/Onest-Light.woff2') format('woff2');
        font-weight: 300;
        font-style: normal;
        font-display: swap;
      }
      
      @font-face {
        font-family: 'Onest';
        src: url('/assets/fonts/onest/Onest-Medium.woff2') format('woff2');
        font-weight: 500;
        font-style: normal;
        font-display: swap;
      }
      
      @font-face {
        font-family: 'Onest';
        src: url('/assets/fonts/onest/Onest-Bold.woff2') format('woff2');
        font-weight: 700;
        font-style: normal;
        font-display: swap;
      }
    `;
    document.head.appendChild(style);
    
    // Wait for fonts to load before proceeding
    this.waitForFonts();
  }
  
  /**
   * Wait for fonts to be loaded before continuing
   */
  private async waitForFonts(): Promise<void> {
    try {
      // Use Font Loading API to detect when fonts are ready
      await document.fonts.load('300 20px Onest');
      await document.fonts.load('500 20px Onest');
      await document.fonts.load('700 20px Onest');
      
      console.log('✓ Onest fonts loaded successfully');
    } catch (error) {
      console.warn('Font loading warning:', error);
      // Continue anyway - will fallback to Arial
    }
  }

  create(): void {
    if (this.shouldLoad) {
      console.log('✓ PreloaderScene.create: Assets loaded');
    } else {
      console.log('✓ PreloaderScene.create: No loading needed');
    }
    
    this.registry.set('assetsLoaded', true);
    
    // Ensure fonts are loaded before starting game
    document.fonts.ready.then(() => {
      // Start game after fonts are ready
      this.scene.stop();
      console.log('✓ PreloaderScene stopped, textures remain in cache');
    });
  }

  shutdown() {
    this.cleanup();
  }

  private cleanup(): void {
    if (this.progressBar) {
      this.progressBar.destroy();
      this.progressBar = undefined;
    }
    if (this.progressBox) {
      this.progressBox.destroy();
      this.progressBox = undefined;
    }
    if (this.loadingText) {
      this.loadingText.destroy();
      this.loadingText = undefined;
    }
    if (this.percentText) {
      this.percentText.destroy();
      this.percentText = undefined;
    }
  }
}