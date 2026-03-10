import Phaser from 'phaser';
import { ASSET_KEYS } from '../constants/AssetKeys';
import { scale } from '../utils/scaleHelper';
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../constants/DesignConstants';

/**
 * BirdCharacter - Encapsulates all bird sprite and animation logic
 * 
 * This class handles:
 * - Bird sprite creation and sizing
 * - Idle animations (small random hops)
 * - Travel animations (hop and glide)
 * - Entrance animations for HouseScene
 * - Texture switching between idle and flying states
 * 
 * Usage:
 * const bird = new BirdCharacter(scene);
 * bird.createStatic(x, y);
 * bird.startIdleAnimation();
 */
export class BirdCharacter {
  // ═══════════════════════════════════════════════════════════
  // PROPERTIES
  // ═══════════════════════════════════════════════════════════
  private scene: Phaser.Scene;
  private sprite?: Phaser.GameObjects.Image;
  private idleTimer?: Phaser.Time.TimerEvent;
  private isAnimating: boolean = false;
  private cleanupScheduled: boolean = false;
  private hasFadedIn: boolean = false; // Track if fade-in has completed
  private lockedY?: number; // Locked Y position (doesn't change on resize)

  // ═══════════════════════════════════════════════════════════
  // CONSTRUCTOR
  // ═══════════════════════════════════════════════════════════
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  // ═══════════════════════════════════════════════════════════
  // SPRITE CREATION METHODS
  // ═══════════════════════════════════════════════════════════

  /**
   * Create bird sprite at position without animation.
   * Sprite starts at alpha 0 — call fadeIn() or forceVisible() to show it.
   * The Y position is locked and will not shift on resize; size recalculates
   * responsively via handleResize() whenever the viewport changes.
   */
  createStatic(x: number, y: number): void {
    this.sprite = this.scene.add.image(x, y, ASSET_KEYS.BIRD_IDLE);
    this.lockedY = y;
    this.updateSize();
    this.sprite.setDepth(1000);
    this.sprite.setAlpha(0);
    this.hasFadedIn = false;
  }

  /**
   * Fade in the bird sprite - call this from scene's fadeInScene method
   * This is the ONLY way to make the bird visible after createStatic
   */
  fadeIn(duration: number = 600, onComplete?: () => void): void {
    if (!this.sprite) return;

    // Kill any existing tweens on this sprite to prevent conflicts
    this.scene.tweens.killTweensOf(this.sprite);

    // Ensure we start from 0
    this.sprite.setAlpha(0);
    this.sprite.setDepth(1000);

    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 1,
      duration: duration,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        // FORCE alpha to 1 after tween completes - bulletproof
        if (this.sprite && this.sprite.scene) {
          this.sprite.setAlpha(1);
          this.sprite.setDepth(1000);
          this.hasFadedIn = true;
        }
        if (onComplete) onComplete();
      }
    });
  }

  /**
   * Check if bird has completed its fade-in animation
   */
  getHasFadedIn(): boolean {
    return this.hasFadedIn;
  }

  /**
   * Force the bird to be fully visible (use after fade-in or for instant visibility)
   */
  forceVisible(): void {
    if (this.sprite) {
      this.scene.tweens.killTweensOf(this.sprite);
      this.sprite.setAlpha(1);
      this.sprite.setDepth(1000);
      this.hasFadedIn = true;
    }
  }

  /**
   * @deprecated Alpha is now managed correctly through the fade/visible API.
   * Kept for call-site compatibility but does nothing — remove call sites
   * over time.
   */
  enforceAlpha(): void {
    // No-op: alpha is reliably set by fadeIn() / forceVisible() and is no
    // longer at risk of being silently reset by animation callbacks.
  }

  /**
   * Create bird sprite with flying entrance animation (for HouseScene)
   */
  createWithFlyingEntrance(
    finalX: number,
    finalY: number,
    fromLeft: boolean,
    onComplete?: () => void
  ): void {
    const { width, height } = this.scene.scale;
    const offset = Math.min(width, height) * 0.1;
    const startX = fromLeft ? -offset : width + offset;
    const startY = height * 0.5;

    // Create bird in flying texture
    this.sprite = this.scene.add.image(startX, startY, ASSET_KEYS.BIRD_FLY);
    this.updateSize(true);
    this.sprite.setDepth(1000);
    this.sprite.setFlipX(!fromLeft);
    this.sprite.setAlpha(1); // Flying entrance is immediately visible
    this.hasFadedIn = true;

    this.isAnimating = true;

    // Fly animation
    this.scene.tweens.add({
      targets: this.sprite,
      x: finalX,
      y: finalY,
      duration: 1500,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.switchToIdleTexture();
        this.sprite!.setFlipX(false);
        this.sprite!.setAlpha(1); // Ensure alpha stays 1
        this.isAnimating = false;
        if (onComplete) onComplete();
      },
    });
  }

  /**
   * Create bird sprite with hopping entrance animation (for HouseScene)
   */
  createWithHoppingEntrance(
    finalX: number,
    finalY: number,
    fromLeft: boolean,
    onComplete?: () => void
  ): void {
    const { width, height } = this.scene.scale;
    const offset = Math.min(width, height) * 0.1;
    const startX = fromLeft ? -offset : width + offset;

    this.sprite = this.scene.add.image(startX, finalY, ASSET_KEYS.BIRD_IDLE);
    this.updateSize();
    this.sprite.setDepth(1000);
    this.sprite.setFlipX(!fromLeft);
    this.sprite.setAlpha(1); // Hopping entrance is immediately visible
    this.hasFadedIn = true;

    // Calculate hop path
    const distance = Math.abs(finalX - startX);
    const birdSize = Math.min(width, height) * 0.08;
    const hopDistance = birdSize;
    const numHops = Math.max(5, Math.floor(distance / hopDistance));
    const hopHeight = height * 0.015;
    const hopDuration = 200;

    const path: { x: number; y: number }[] = [];
    for (let i = 0; i <= numHops; i++) {
      const t = i / numHops;
      path.push({
        x: Phaser.Math.Linear(startX, finalX, t),
        y: finalY,
      });
    }

    this.isAnimating = true;
    this.performHopSequence(path, hopHeight, hopDuration, () => {
      this.sprite!.setFlipX(false);
      this.sprite!.setAlpha(1); // Ensure alpha stays 1
      this.isAnimating = false;
      if (onComplete) onComplete();
    });
  }

  // ═══════════════════════════════════════════════════════════
  // IDLE ANIMATION METHODS
  // ═══════════════════════════════════════════════════════════

  /**
   * Start idle animation (small random hops).
   * Safe to call at any time — if the bird is not yet visible it waits until
   * hasFadedIn is true before playing any hop, so callers don't need to
   * sequence this manually against fadeIn / forceVisible.
   */
  startIdleAnimation(): void {
    this.stopIdleAnimation();
    this.cleanupScheduled = false;

    const scheduleNextIdleHop = () => {
      if (this.cleanupScheduled) return;

      const randomDelay = Phaser.Math.Between(5000, 8000);
      this.idleTimer = this.scene.time.delayedCall(randomDelay, () => {
        if (this.cleanupScheduled) return;
        // Guard: only animate once the bird is fully visible
        if (!this.isAnimating && this.sprite && this.hasFadedIn) {
          this.playIdleHop();
        }
        scheduleNextIdleHop();
      });
    };

    scheduleNextIdleHop();
  }

  /**
   * Stop idle animation
   */
  stopIdleAnimation(): void {
    this.cleanupScheduled = true;
    if (this.idleTimer) {
      this.idleTimer.remove();
      this.idleTimer = undefined;
    }
  }

  /**
   * Play a single idle movement animation with vertical hop
   */
  private playIdleHop(): void {
    if (!this.sprite || this.isAnimating || !this.hasFadedIn) return;

    const { width, height } = this.scene.scale;
    const originalX = this.sprite.x;
    const originalY = this.sprite.y;

    const moveRange = Math.floor(width * 0.003);
    const moveX = Phaser.Math.Between(-moveRange, moveRange);
    const hopHeight = height * 0.02; // Height of the hop

    // Use tighter boundaries for NeighborhoodScene
    const isNeighborhoodScene = this.scene.scene.key === 'NeighborhoodScene';

    let targetX: number;
    if (isNeighborhoodScene) {
      const maxDistance = width * 0.02;
      targetX = Phaser.Math.Clamp(originalX + moveX, originalX - maxDistance, originalX + maxDistance);
    } else {
      const minX = width * 0.1;
      const maxX = width * 0.9;
      targetX = Phaser.Math.Clamp(originalX + moveX, minX, maxX);
    }

    if (Math.abs(moveX) > moveRange * 0.5) {
      this.sprite.setFlipX(moveX < 0);
    }

    const duration = 600;

    this.scene.tweens.add({
      targets: this.sprite,
      x: targetX,
      y: originalY - hopHeight, // Jump up
      duration: duration,
      ease: 'Sine.easeInOut',
      yoyo: true, // Automatically falls back down
      onStart: () => {
        // Switch to hop texture at start
        this.sprite!.setTexture(ASSET_KEYS.BIRD_HOP);
        this.updateSize(false); // Ensure proper sizing for hop texture
        this.scene.tweens.add({
          targets: this.sprite,
          angle: moveX < 0 ? 2 : -2,
          duration: duration / 2,
          ease: 'Sine.easeInOut',
          yoyo: true,
        });
      },
      onComplete: () => {
        // Switch back to idle texture
        this.switchToIdleTexture();
        this.enforceAlpha();
      }
    });
  }

  /**
   * Play idle hop with boundary constraints (for NeighborhoodScene)
   */
  playIdleHopWithBoundary(
    houseCenterX: number,
    boundaryRadius: number
  ): void {
    if (!this.sprite || this.isAnimating || !this.hasFadedIn) return;

    const { width, height } = this.scene.scale;
    const originalY = this.sprite.y;
    const originalX = this.sprite.x;

    const minX = houseCenterX - boundaryRadius;
    const maxX = houseCenterX + boundaryRadius;

    const moveDistance = Phaser.Math.Between(-5, 5);
    let targetX = originalX + (width * 0.002 * moveDistance);
    targetX = Phaser.Math.Clamp(targetX, minX, maxX);

    const actualMove = targetX - originalX;
    if (Math.abs(actualMove) > width * 0.001) {
      this.sprite.setFlipX(actualMove < 0);
    }

    const hopHeight = height * 0.0015;
    const duration = 300;

    this.scene.tweens.add({
      targets: this.sprite,
      x: targetX,
      y: originalY - hopHeight,
      duration: duration,
      ease: 'Sine.easeOut',
      yoyo: true,
      onStart: () => {
        // Switch to hop texture at start
        this.sprite!.setTexture(ASSET_KEYS.BIRD_HOP);
        this.updateSize(false); // Ensure proper sizing for hop texture
        this.scene.tweens.add({
          targets: this.sprite,
          angle: -3,
          duration: duration / 2,
          ease: 'Sine.easeInOut',
          yoyo: true,
        });
      },
      onComplete: () => {
        // Switch back to idle texture
        this.switchToIdleTexture();
        this.enforceAlpha();
      }
    });
  }

  // ═══════════════════════════════════════════════════════════
  // TRAVEL ANIMATION METHODS (for NeighborhoodScene)
  // ═══════════════════════════════════════════════════════════

  /**
   * Glide animation for long distances
   */
  glideToPosition(
    targetX: number,
    targetY: number,
    distance: number,
    onComplete?: () => void
  ): void {
    if (!this.sprite) return;

    this.isAnimating = true;

    this.sprite.setFlipX(targetX < this.sprite.x);

    const hopDuration = 250;
    const totalGlideTime = distance * hopDuration * 4;

    this.sprite.setTexture(ASSET_KEYS.BIRD_FLY);
    this.updateSize(true);

    this.scene.tweens.add({
      targets: this.sprite,
      x: targetX,
      y: targetY,
      duration: totalGlideTime,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.switchToIdleTexture();
        this.isAnimating = false;
        this.enforceAlpha(); // Ensure alpha after animation
        if (onComplete) onComplete();
      },
    });
  }

  /**
   * Hop animation for short distances
   */
  hopToPosition(
    targetX: number,
    targetY: number,
    onComplete?: () => void
  ): void {
    if (!this.sprite) return;

    this.isAnimating = true;

    this.sprite.setFlipX(targetX < this.sprite.x);

    const distance = Phaser.Math.Distance.Between(
      this.sprite.x,
      this.sprite.y,
      targetX,
      targetY
    );

    const { width, height } = this.scene.scale;
    const numHops = Math.max(5, Math.floor(distance / (width * 0.04)));
    const hopHeight = height * 0.01;
    const hopDuration = 250;

    const path: { x: number; y: number }[] = [];
    for (let i = 0; i <= numHops; i++) {
      const t = i / numHops;
      const x = Phaser.Math.Linear(this.sprite.x, targetX, t);
      const y = Phaser.Math.Linear(this.sprite.y, targetY, t);
      path.push({ x, y });
    }

    this.performHopSequence(path, hopHeight, hopDuration, () => {
      this.isAnimating = false;
      this.enforceAlpha(); // Ensure alpha after animation
      if (onComplete) onComplete();
    });
  }

  // ═══════════════════════════════════════════════════════════
  // UTILITY METHODS
  // ═══════════════════════════════════════════════════════════

  /**
   * Perform a sequence of hops along a path
   */
  private performHopSequence(
    path: { x: number; y: number }[],
    hopHeight: number,
    hopDuration: number,
    onComplete?: () => void
  ): void {
    let currentHop = 0;

    const performNextHop = () => {
      if (currentHop >= path.length - 1) {
        // Switch back to idle texture at end of sequence
        this.switchToIdleTexture();
        this.enforceAlpha(); // Ensure alpha at end of sequence
        if (onComplete) onComplete();
        return;
      }

      const startPoint = path[currentHop];
      const endPoint = path[currentHop + 1];
      const midX = (startPoint.x + endPoint.x) / 2;
      const midY = (startPoint.y + endPoint.y) / 2 - hopHeight;

      this.scene.tweens.add({
        targets: this.sprite,
        x: midX,
        y: midY,
        duration: hopDuration / 2,
        ease: 'Sine.easeOut',
        onStart: () => {
          // Switch to hop texture at start of first hop
          if (currentHop === 0) {
            this.sprite!.setTexture(ASSET_KEYS.BIRD_HOP);
            this.updateSize(false); // Ensure proper sizing for hop texture
          }
          this.scene.tweens.add({
            targets: this.sprite,
            angle: currentHop % 2 === 0 ? -5 : 5,
            duration: hopDuration / 2,
            ease: 'Sine.easeInOut',
            yoyo: true,
          });
        },
        onComplete: () => {
          this.scene.tweens.add({
            targets: this.sprite,
            x: endPoint.x,
            y: endPoint.y,
            duration: hopDuration / 2,
            ease: 'Sine.easeIn',
            onComplete: () => {
              currentHop++;
              performNextHop();
            },
          });
        },
      });
    };

    performNextHop();
  }

  /**
   * Update bird display size based on the current viewport.
   *
   * Uses the same layout-clamped dimensions as the scenes (equivalent to
   * BaseScene.getLayoutSize) so the bird never shrinks below the design
   * reference on small viewports, staying consistent with all other UI.
   */
  private updateSize(isFlying: boolean = false): void {
    if (!this.sprite) return;

    // Mirror BaseScene.getLayoutSize() — clamp to design reference minimum
    const { width, height } = this.scene.scale;
    const lw = Math.max(width,  scale(DESIGN_WIDTH));
    const lh = Math.max(height, scale(DESIGN_HEIGHT));
    const minDimension = Math.min(lw, lh);

    if (isFlying) {
      const flyTexture = this.scene.textures.get(ASSET_KEYS.BIRD_FLY);
      const flySource  = flyTexture.getSourceImage();
      const flyAspect  = flySource.width / flySource.height;
      const flySize    = Math.min(minDimension * 0.12, scale(100));
      this.sprite.setDisplaySize(flySize * flyAspect, flySize);
    } else {
      const idleTexture = this.scene.textures.get(ASSET_KEYS.BIRD_IDLE);
      const idleSource  = idleTexture.getSourceImage();
      const idleAspect  = idleSource.width / idleSource.height;
      const birdSize    = Math.min(minDimension * 0.11, scale(80));
      this.sprite.setDisplaySize(birdSize * idleAspect, birdSize);
    }
  }

  /**
   * Switch bird texture to idle and update size
   */
  private switchToIdleTexture(): void {
    if (!this.sprite) return;
    this.sprite.setTexture(ASSET_KEYS.BIRD_IDLE);
    this.updateSize(false);
    this.enforceAlpha(); // Ensure alpha after texture switch
  }

  // ═══════════════════════════════════════════════════════════
  // PUBLIC GETTERS AND SETTERS
  // ═══════════════════════════════════════════════════════════

  /**
   * Get the bird sprite
   */
  getSprite(): Phaser.GameObjects.Image | undefined {
    return this.sprite;
  }

  /**
   * Get bird position
   */
  getPosition(): { x: number; y: number } | undefined {
    if (!this.sprite) return undefined;
    return { x: this.sprite.x, y: this.sprite.y };
  }

  /**
   * Set bird position
   */
  setPosition(x: number, y: number): void {
    if (this.sprite) {
      this.sprite.setPosition(x, y);
      this.lockedY = y; // Update locked Y when position is set
    }
  }

  /**
   * Get the locked Y position
   */
  getLockedY(): number | undefined {
    return this.lockedY;
  }

  /**
   * Check if bird is currently animating
   */
  getIsAnimating(): boolean {
    return this.isAnimating;
  }

  /**
   * Set animation state
   */
  setIsAnimating(value: boolean): void {
    this.isAnimating = value;
  }

  /**
   * Destroy bird sprite and cleanup
   */
  destroy(): void {
    this.stopIdleAnimation();
    if (this.sprite) {
      this.scene.tweens.killTweensOf(this.sprite); // Kill all tweens before destroy
      this.sprite.destroy();
      this.sprite = undefined;
    }
    this.hasFadedIn = false;
  }

  /**
   * Resize bird sprite when viewport changes
   */
  handleResize(): void {
    if (this.sprite) {
      const currentTexture = this.sprite.texture.key;
      const isFlying = currentTexture === ASSET_KEYS.BIRD_FLY;
      this.updateSize(isFlying);
      this.enforceAlpha(); // Ensure alpha after resize
    }
  }

  /**
   * Reposition the bird when the viewport changes.
   *
   * The callback receives the current scale dimensions and should return the
   * desired { x, y }.  The returned Y is applied and stored as the new locked
   * Y so it stays consistent on subsequent resizes.
   */
  repositionForViewport(calculateNewPosition: (width: number, height: number) => { x: number; y: number }): void {
    if (!this.sprite) return;

    const { width, height } = this.scene.scale;
    const newPosition = calculateNewPosition(width, height);

    this.sprite.setPosition(newPosition.x, newPosition.y);
    this.lockedY = newPosition.y; // Keep lockedY in sync with the new position
    this.updateSize();
  }
}