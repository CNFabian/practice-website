import Phaser from 'phaser';
import { COLORS } from '../constants/Colors';

export interface TransitionConfig {
  duration?: number;
  fadeColor?: { r: number; g: number; b: number };
  onComplete?: () => void;
}

export class SceneTransitionManager {
  private scene: Phaser.Scene;
  private isTransitioning: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  // ═══════════════════════════════════════════════════════════
  // TRANSITION STATE
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Check if a transition is currently in progress
   */
  isInProgress(): boolean {
    return this.isTransitioning;
  }

  /**
   * Set transition state
   */
  private setTransitionState(state: boolean): void {
    this.isTransitioning = state;
  }

  // ═══════════════════════════════════════════════════════════
  // FADE TRANSITIONS
  // ═══════════════════════════════════════════════════════════

  /**
   * Fade in the camera
   */
  fadeIn(config: TransitionConfig = {}): void {
    const {
      duration = 300,
      fadeColor = COLORS.FADE_BLACK,
      onComplete,
    } = config;

    this.scene.cameras.main.fadeIn(duration, fadeColor.r, fadeColor.g, fadeColor.b);

    if (onComplete) {
      this.scene.cameras.main.once('camerafadeincomplete', onComplete);
    }
  }

  /**
   * Fade out the camera
   */
  fadeOut(config: TransitionConfig = {}): void {
    const {
      duration = 300,
      fadeColor = COLORS.FADE_BLACK,
      onComplete,
    } = config;

    this.setTransitionState(true);

    this.scene.cameras.main.fadeOut(duration, fadeColor.r, fadeColor.g, fadeColor.b);

    this.scene.cameras.main.once('camerafadeoutcomplete', () => {
      this.setTransitionState(false);
      if (onComplete) {
        onComplete();
      }
    });
  }

  // ═══════════════════════════════════════════════════════════
  // SCENE-SPECIFIC TRANSITIONS
  // ═══════════════════════════════════════════════════════════

  /**
   * Transition from Map to Neighborhood
   */
  toNeighborhood(callback: () => void): void {
    this.fadeOut({
      duration: 300,
      fadeColor: COLORS.FADE_BLACK,
      onComplete: callback,
    });
  }

  /**
   * Transition from Neighborhood to House
   */
  toHouse(callback: () => void): void {
    this.fadeOut({
      duration: 300,
      fadeColor: COLORS.FADE_ORANGE,
      onComplete: callback,
    });
  }

  /**
   * Transition from House to Neighborhood
   */
  backToNeighborhood(callback: () => void): void {
    this.fadeOut({
      duration: 300,
      fadeColor: COLORS.FADE_PEACH,
      onComplete: callback,
    });
  }

  /**
   * Transition from Neighborhood to Map
   */
  backToMap(callback: () => void): void {
    this.fadeOut({
      duration: 300,
      fadeColor: COLORS.FADE_ORANGE,
      onComplete: callback,
    });
  }

  // ═══════════════════════════════════════════════════════════
  // CAMERA ENTRANCE EFFECTS
  // ═══════════════════════════════════════════════════════════

  /**
   * Fade in when entering Map scene
   */
  enterMap(): void {
    this.fadeIn({
      duration: 300,
      fadeColor: COLORS.FADE_BLACK,
    });
  }

  /**
   * Fade in when entering Neighborhood scene
   */
  enterNeighborhood(): void {
    this.fadeIn({
      duration: 300,
      fadeColor: COLORS.FADE_ORANGE,
    });
  }

  /**
   * Fade in when entering House scene
   */
  enterHouse(): void {
    this.fadeIn({
      duration: 300,
      fadeColor: COLORS.FADE_PEACH,
    });
  }

  // ═══════════════════════════════════════════════════════════
  // UTILITY METHODS
  // ═══════════════════════════════════════════════════════════

  /**
   * Execute a callback only if not currently transitioning
   */
  executeIfNotTransitioning(callback: () => void): boolean {
    if (this.isTransitioning) {
      return false;
    }
    callback();
    return true;
  }

  /**
   * Cleanup - call this in scene shutdown
   */
  cleanup(): void {
    this.isTransitioning = false;
    this.scene.cameras.main.off('camerafadeincomplete');
    this.scene.cameras.main.off('camerafadeoutcomplete');
  }
}