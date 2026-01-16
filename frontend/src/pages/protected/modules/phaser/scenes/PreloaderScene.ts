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
    // Create a loading bar (optional but nice visual feedback)
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
    
    // MapScene assets would go here if you had any
    // this.load.image('mapBackground', MapBackground);
  }

  create() {
    console.log('PreloaderScene: All assets loaded successfully');
    console.log('Available textures:', this.textures.getTextureKeys());
    
    // Check localStorage for saved navigation state
    const savedState = localStorage.getItem('modules_nav_state');
    
    if (savedState) {
      try {
        const navState = JSON.parse(savedState);
        console.log('PreloaderScene: Found saved nav state:', navState);
        
        // Start the appropriate scene based on saved state
        // But let ModulesPage handle the actual scene switching
        // We just start MapScene and let the useEffect in ModulesPage handle the rest
        this.scene.start('MapScene');
      } catch (error) {
        console.error('PreloaderScene: Error parsing saved state:', error);
        // Default to MapScene
        this.scene.start('MapScene');
      }
    } else {
      console.log('PreloaderScene: No saved state, starting MapScene');
      // No saved state, start with MapScene
      this.scene.start('MapScene');
    }
  }
}