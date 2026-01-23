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
  BirdFly,
  CoinCounterIcon,
} from '../../../../../assets';

export default class PreloaderScene extends Phaser.Scene {
  private shouldLoad: boolean = false;
  private progressBar?: Phaser.GameObjects.Graphics;
  private progressBox?: Phaser.GameObjects.Graphics;
  private loadingText?: Phaser.GameObjects.Text;
  private percentText?: Phaser.GameObjects.Text;

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
      this.textures.exists('bird_fly') &&
      this.textures.exists('coin_counter');
    
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
    this.load.image('coinIcon', CoinCounterIcon);
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