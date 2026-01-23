// BaseScene.ts - UPDATED VERSION

import Phaser from 'phaser';
import { UIComponents } from '../ui/UIComponents';

export class BaseScene extends Phaser.Scene {
  protected coinCounter?: Phaser.GameObjects.Container;
  private coinUpdateListener?: () => void;
  private coinCounterTween?: Phaser.Tweens.Tween;

  create(): void {
    this.createCoinCounter();
    this.setupCoinUpdateListener();
  }

  shutdown(): void {
    this.cleanupCoinCounter();
  }

  protected createCoinCounter(): void {
    const { width, height } = this.scale;
    
    // Get coins from registry (set by React)
    const totalCoins = this.registry.get('totalCoins') || 0;
    
    // Position in top right (same as old minigame button position)
    const counterX = width - (width * 0.08); // 8% from right
    const counterY = height * 0.05; // 5% from top
    
    // USE UIComponents instead of duplicate code
    this.coinCounter = UIComponents.createCoinCounter(this, totalCoins);
    this.coinCounter.setPosition(counterX, counterY);
  }

  protected updateCoinCounter(): void {
    if (!this.coinCounter) return;
    
    const totalCoins = this.registry.get('totalCoins') || 0;
    
    // Find the text component by name
    const coinText = this.coinCounter.getByName('coinText') as Phaser.GameObjects.Text;
    if (coinText) {
      coinText.setText(totalCoins.toString());
      
      // Optional: Add a small scale animation when coins update
      this.tweens.add({
        targets: this.coinCounter,
        scaleX: 1.15,
        scaleY: 1.15,
        duration: 150,
        yoyo: true,
        ease: 'Power2'
      });
    }
  }

  private setupCoinUpdateListener(): void {
    this.coinUpdateListener = () => {
      this.updateCoinCounter();
    };
    
    this.registry.events.on('changedata-totalCoins', this.coinUpdateListener);
  }

  private cleanupCoinCounter(): void {
    if (this.coinUpdateListener) {
      this.registry.events.off('changedata-totalCoins', this.coinUpdateListener);
      this.coinUpdateListener = undefined;
    }
    
    if (this.coinCounter) {
      this.coinCounter.destroy();
      this.coinCounter = undefined;
    }
  }

  protected handleCoinCounterResize(): void {
    if (this.coinCounter) {
      // Kill tween before destroying counter
      if (this.coinCounterTween) {
        this.coinCounterTween.stop();
        this.coinCounterTween = undefined;
      }
      
      this.coinCounter.destroy();
      this.createCoinCounter();
    }
  }
}