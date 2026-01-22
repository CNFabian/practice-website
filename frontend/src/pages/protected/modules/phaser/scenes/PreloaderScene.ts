import Phaser from 'phaser';
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
  BirdFly 
} from '../../../../../assets';

export default class PreloaderScene extends Phaser.Scene {
  private shouldLoad: boolean = false;

  constructor() {
    super({ key: 'PreloaderScene' });
  }

  init() {
    // This runs BEFORE preload() - check if textures already exist
    const texturesExist = 
      this.textures.exists('suburbanBackground') &&
      this.textures.exists('lessonHouse') &&
      this.textures.exists('house1') &&
      this.textures.exists('house2') &&
      this.textures.exists('house3') &&
      this.textures.exists('house4') &&
      this.textures.exists('road1') &&
      this.textures.exists('platform1') &&
      this.textures.exists('bird_idle') &&
      this.textures.exists('bird_fly');
    
    this.shouldLoad = !texturesExist;
    
    if (!this.shouldLoad) {
      console.log('✓ PreloaderScene: Textures already cached, will skip loading');
    } else {
      console.log('→ PreloaderScene: Loading textures for first time');
    }
  }

  preload() {
    if (!this.shouldLoad) {
      console.log('✓ PreloaderScene.preload: Skipped (textures cached)');
      return;
    }

    console.log('→ PreloaderScene.preload: Creating loading bar and loading assets');

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);
    
    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      fontSize: '20px',
      color: '#ffffff'
    });
    loadingText.setOrigin(0.5, 0.5);
    
    const percentText = this.add.text(width / 2, height / 2, '0%', {
      fontSize: '18px',
      color: '#ffffff'
    });
    percentText.setOrigin(0.5, 0.5);

    this.load.on('progress', (value: number) => {
      percentText.setText(Math.floor(value * 100) + '%');
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });

    // Load all assets
    this.load.image('houseBackground', HouseBackground);
    this.load.image('lessonHouse', LessonHouse);
    this.load.image('house1', House1);
    this.load.image('house2', House2);
    this.load.image('house3', House3);
    this.load.image('house4', House4);
    this.load.image('road1', Road1);
    this.load.image('platform1', Platform1);
    this.load.image('bird_idle', BirdIdle);
    this.load.image('bird_fly', BirdFly);
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
}