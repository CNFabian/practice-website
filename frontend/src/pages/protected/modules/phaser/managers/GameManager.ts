import Phaser from 'phaser';
import { createGameConfig } from '../config/gameConfig';

class GameManager {
  private static instance: GameManager;
  private game: Phaser.Game | null = null;
  private assetsLoaded: boolean = false;
  private isPhaserReady: boolean = false;
  private savedNavState: any = null;

  private constructor() {}

  static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  /**
   * Save navigation state before component unmounts
   */
  saveNavState(navState: any): void {
    this.savedNavState = navState;
    console.log('=== SAVING NAV STATE ===', navState);
  }

  /**
   * Restore navigation state when component remounts
   */
  restoreNavState(): any | null {
    console.log('=== RESTORING NAV STATE ===', this.savedNavState);
    return this.savedNavState;
  }

  /**
   * Clear saved navigation state
   */
  clearNavState(): void {
    this.savedNavState = null;
  }

  /**
   * Initialize or retrieve existing game instance
   */
  initializeGame(container: HTMLElement): Phaser.Game {
    // If game already exists, reattach to new container
    if (this.game) {
      console.log('=== USING EXISTING PHASER GAME INSTANCE ===');
      
      // CRITICAL: Reattach the canvas to the new container
      const canvas = this.game.canvas;
      if (canvas && canvas.parentElement !== container) {
        console.log('=== REATTACHING CANVAS TO NEW CONTAINER ===');
        container.appendChild(canvas);
      }
      
      // Update the parent reference
      this.game.scale.parent = container;
      
      // Make sure the canvas is visible and properly sized
      if (canvas) {
        canvas.style.display = 'block';
      }
      
      // Trigger a resize to ensure proper scaling
      const dpr = window.devicePixelRatio || 1;
      const newWidth = (window.innerWidth - 192) * dpr;
      const newHeight = window.innerHeight * dpr;
      this.game.scale.resize(newWidth, newHeight);
      
      return this.game;
    }

    // Create new game instance
    console.log('=== CREATING NEW PHASER GAME INSTANCE ===');
    const config = createGameConfig(container);
    this.game = new Phaser.Game(config);

    this.game.events.once('ready', () => {
      console.log('=== PHASER GAME READY ===');
      this.isPhaserReady = true;
      
      // Only start PreloaderScene if assets haven't been loaded yet
      if (!this.assetsLoaded && this.game) {
        console.log('=== STARTING PRELOADER SCENE (FIRST TIME) ===');
        this.game.scene.start('PreloaderScene');
        
        // Poll for assets loaded
        const checkInterval = setInterval(() => {
          if (this.game) {
            const flag = this.game.registry.get('assetsLoaded');
            if (flag) {
              console.log('=== ASSETS LOADED AND READY ===');
              this.assetsLoaded = true;
              clearInterval(checkInterval);
            }
          }
        }, 50);
        
        setTimeout(() => clearInterval(checkInterval), 10000);
      } else {
        console.log('=== ASSETS ALREADY LOADED, SKIPPING PRELOADER ===');
        // Set the registry flag immediately so components know assets are ready
        if (this.game) {
          this.game.registry.set('assetsLoaded', true);
        }
      }
    });

    return this.game;
  }

  /**
   * Get current game instance
   */
  getGame(): Phaser.Game | null {
    return this.game;
  }

  /**
   * Check if game is ready
   */
  isReady(): boolean {
    return this.isPhaserReady;
  }

  /**
   * Check if assets are loaded
   */
  areAssetsLoaded(): boolean {
    return this.assetsLoaded;
  }

  /**
   * Destroy game instance (only call on app unmount)
   */
  destroy(): void {
    if (this.game) {
      console.log('=== DESTROYING PHASER GAME INSTANCE ===');
      this.game.destroy(true);
      this.game = null;
      this.assetsLoaded = false;
      this.isPhaserReady = false;
    }
  }

  /**
   * Pause all scenes
   */
  pause(): void {
    if (this.game) {
      this.game.scene.getScenes(true).forEach(scene => {
        if (scene.scene.isActive()) {
          scene.scene.pause();
        }
      });
    }
  }

  /**
   * Resume all paused scenes
   */
  resume(): void {
    if (this.game) {
      this.game.scene.getScenes(true).forEach(scene => {
        if (scene.scene.isPaused()) {
          scene.scene.resume();
        }
      });
    }
  }
}

export default GameManager.getInstance();