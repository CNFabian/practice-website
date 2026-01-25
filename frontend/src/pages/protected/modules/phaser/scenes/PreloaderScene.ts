import Phaser from 'phaser';
import { SCENE_KEYS } from '../constants/SceneKeys';
import { ASSET_KEYS } from '../constants/AssetKeys';
import {
  HouseBackground,
  LessonHouse,
  House1,
  House2,
  House3,
  House4,
  Road1,
  Platform1,
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
    // Check if assets are already loaded
    const assetsLoaded = this.registry.get('assetsLoaded');
    this.shouldLoad = !assetsLoaded;
    
    console.log('PreloaderScene.init: shouldLoad =', this.shouldLoad);
  }

  preload() {
    if (!this.shouldLoad) {
      console.log('PreloaderScene.preload: Skipping asset loading (already loaded)');
      return;
    }

    console.log('PreloaderScene.preload: Starting asset load');

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
    
    // Environment
    this.load.image(ASSET_KEYS.ROAD_1, Road1);
    this.load.image(ASSET_KEYS.PLATFORM_1, Platform1);
    
    // Characters
    this.load.image(ASSET_KEYS.BIRD_IDLE, BirdIdle);
    this.load.image(ASSET_KEYS.BIRD_FLY, BirdFly);
    this.load.svg(ASSET_KEYS.BIRD_CELEBRATION, BirdCelebration, { width: 200, height: 200 });
    
    // UI
    this.load.image(ASSET_KEYS.COIN_ICON, CoinCounterIcon);
    
    // Trees
    this.load.image('tree_stage_1', stage1Tree);
    this.load.image('tree_stage_2', stage2Tree);
    this.load.image('tree_stage_3', stage3Tree);
    this.load.image('tree_stage_4', stage4Tree);
    this.load.image('tree_stage_5', stage5Tree);
    this.load.image('tree_stage_6', stage6Tree);
    this.load.image('tree_stage_7', stage7Tree);
  }

  create() {
    if (this.shouldLoad) {
      console.log('✓ PreloaderScene.create: Assets loaded');
    } else {
      console.log('✓ PreloaderScene.create: No loading needed');
    }
    
    this.registry.set('assetsLoaded', true);
    this.scene.stop();
    
    console.log('✓ PreloaderScene stopped, textures remain in cache');
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