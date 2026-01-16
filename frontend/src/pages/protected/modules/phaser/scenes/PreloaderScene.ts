import Phaser from 'phaser';
import { 
  SuburbanBackground, 
  LeftCutHouse, 
  RightCutHouse,
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
  constructor() {
    super({ key: 'PreloaderScene' });
  }

  preload() {
    // Create a loading bar
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

    // Update loading bar as assets load
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

    // ===== LOAD ALL ASSETS HERE - ONLY ONCE =====
    
    // HouseScene assets
    this.load.image('suburbanBackground', SuburbanBackground);
    this.load.image('leftCutHouse', LeftCutHouse);
    this.load.image('rightCutHouse', RightCutHouse);
    
    // NeighborhoodScene assets
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
    console.log('PreloaderScene: All assets loaded successfully');
    console.log('Available textures:', this.textures.getTextureKeys());
    
    // Signal that preloading is complete by setting a flag in the registry
    // This will be accessible to all scenes
    this.registry.set('assetsLoaded', true);
    
    // Stop this scene but DON'T destroy it - keeps textures in cache
    this.scene.stop();
    
    // The texture cache is shared across all scenes in the game
    // So stopping PreloaderScene won't remove the textures
    console.log('PreloaderScene: Stopped. Textures remain in global cache.');
  }
}