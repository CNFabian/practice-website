import Phaser from 'phaser';
import { ASSET_KEYS } from '../constants/AssetKeys';

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
   * Create bird sprite at position without animation
   */
  createStatic(x: number, y: number): void {
    this.sprite = this.scene.add.image(x, y, ASSET_KEYS.BIRD_IDLE);
    this.updateSize();
    this.sprite.setDepth(1000);
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
      this.isAnimating = false;
      if (onComplete) onComplete();
    });
  }

  // ═══════════════════════════════════════════════════════════
  // IDLE ANIMATION METHODS
  // ═══════════════════════════════════════════════════════════

  /**
   * Start idle animation (small random hops)
   */
  startIdleAnimation(): void {
    this.stopIdleAnimation();

    const scheduleNextIdleHop = () => {
      const randomDelay = Phaser.Math.Between(5000, 8000);

      this.idleTimer = this.scene.time.delayedCall(randomDelay, () => {
        if (!this.isAnimating && this.sprite) {
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
    if (this.idleTimer) {
      this.idleTimer.remove();
      this.idleTimer = undefined;
    }
  }

  /**
   * Play a single idle hop animation
   */
  private playIdleHop(): void {
    if (!this.sprite || this.isAnimating) return;

    const { width, height } = this.scene.scale;
    const originalY = this.sprite.y;
    const originalX = this.sprite.x;

    // Random small movement with constraints
    const moveRange = Math.floor(width * 0.01);
    const moveX = Phaser.Math.Between(-moveRange, moveRange);
    const minX = width * 0.1;
    const maxX = width * 0.9;
    const targetX = Phaser.Math.Clamp(originalX + moveX, minX, maxX);

    // Flip sprite based on movement direction
    if (Math.abs(moveX) > moveRange * 0.5) {
      this.sprite.setFlipX(moveX < 0);
    }

    const hopHeight = height * 0.008;
    const duration = 400;

    this.scene.tweens.add({
      targets: this.sprite,
      x: targetX,
      y: originalY - hopHeight,
      duration: duration,
      ease: 'Sine.easeOut',
      yoyo: true,
      onStart: () => {
        this.scene.tweens.add({
          targets: this.sprite,
          angle: -3,
          duration: duration / 2,
          ease: 'Sine.easeInOut',
          yoyo: true,
        });
      },
    });
  }

  /**
   * Play idle hop with boundary constraints (for NeighborhoodScene)
   */
  playIdleHopWithBoundary(
    houseCenterX: number,
    boundaryRadius: number
  ): void {
    if (!this.sprite || this.isAnimating) return;

    const { width, height } = this.scene.scale;
    const originalY = this.sprite.y;
    const originalX = this.sprite.x;

    // Calculate boundaries around house
    const minX = houseCenterX - boundaryRadius;
    const maxX = houseCenterX + boundaryRadius;

    // Random small movement within boundaries
    const moveDistance = Phaser.Math.Between(-5, 5);
    let targetX = originalX + (width * 0.005 * moveDistance); // Scale movement
    targetX = Phaser.Math.Clamp(targetX, minX, maxX);

    // Flip sprite based on movement direction
    const actualMove = targetX - originalX;
    if (Math.abs(actualMove) > width * 0.002) {
      this.sprite.setFlipX(actualMove < 0);
    }

    // Single hop animation
    const hopHeight = height * 0.003;
    const duration = 300;

    this.scene.tweens.add({
      targets: this.sprite,
      x: targetX,
      y: originalY - hopHeight,
      duration: duration,
      ease: 'Sine.easeOut',
      yoyo: true,
      onStart: () => {
        this.scene.tweens.add({
          targets: this.sprite,
          angle: -3,
          duration: duration / 2,
          ease: 'Sine.easeInOut',
          yoyo: true,
        });
      },
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

    // Flip sprite based on direction
    this.sprite.setFlipX(targetX < this.sprite.x);

    const hopDuration = 250;
    const totalGlideTime = distance * hopDuration * 4;

    // Switch to flight texture
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

    // Flip sprite based on direction
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

    // Create hop path
    const path: { x: number; y: number }[] = [];
    for (let i = 0; i <= numHops; i++) {
      const t = i / numHops;
      const x = Phaser.Math.Linear(this.sprite.x, targetX, t);
      const y = Phaser.Math.Linear(this.sprite.y, targetY, t);
      path.push({ x, y });
    }

    this.performHopSequence(path, hopHeight, hopDuration, () => {
      this.isAnimating = false;
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
   * Update bird size based on viewport
   */
  private updateSize(isFlying: boolean = false): void {
    if (!this.sprite) return;

    const { width, height } = this.scene.scale;

    if (isFlying) {
      // Flying texture size (larger)
      const flyTexture = this.scene.textures.get(ASSET_KEYS.BIRD_FLY);
      const flyWidth = flyTexture.getSourceImage().width;
      const flyHeight = flyTexture.getSourceImage().height;
      const flyAspectRatio = flyWidth / flyHeight;
      const flySize = Math.min(width, height) * 0.1;
      this.sprite.setDisplaySize(flySize * flyAspectRatio, flySize);
    } else {
      // Idle texture size
      const birdSize = Math.min(width, height) * 0.08;
      this.sprite.setDisplaySize(birdSize, birdSize);
    }
  }

  /**
   * Switch bird texture to idle and update size
   */
  private switchToIdleTexture(): void {
    if (!this.sprite) return;
    this.sprite.setTexture(ASSET_KEYS.BIRD_IDLE);
    this.updateSize(false);
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
    }
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
      this.sprite.destroy();
      this.sprite = undefined;
    }
  }

  /**
   * Resize bird sprite when viewport changes
   */
  handleResize(): void {
    if (this.sprite) {
      const currentTexture = this.sprite.texture.key;
      const isFlying = currentTexture === ASSET_KEYS.BIRD_FLY;
      this.updateSize(isFlying);
    }
  }
}