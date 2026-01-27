import Phaser from 'phaser';
import { UIComponents } from '../ui/UIComponents';
// Add Typography import for future consistency (even though not directly used)
import { createTextStyle } from '../constants/Typography';

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
    this.clearBackgroundImage();
  }

  protected createCoinCounter(): void {
    const { width, height } = this.scale;
    
    // Get coins from registry (set by React)
    const totalCoins = this.registry.get('totalCoins') || 0;
    
    // Position in top right (same as old minigame button position)
    const counterX = width - (width * 0.08); // 8% from right
    const counterY = height * 0.05; // 5% from top
    
    // Uses UIComponents which now implements Onest typography
    this.coinCounter = UIComponents.createCoinCounter(this, totalCoins);
    this.coinCounter.setPosition(counterX, counterY);
    this.coinCounter.setScrollFactor(0);
  }

  protected updateCoinCounter(): void {
    if (!this.coinCounter) return;
    
    const totalCoins = this.registry.get('totalCoins') || 0;
    
    // Find the text component by name (now uses Onest font via UIComponents)
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

  /**
   * Set background image on DOM element (extends under sidebar like HouseScene)
   * @param assetKey - The asset key from ASSET_KEYS
   */
  protected setBackgroundImage(assetKey: string): void {
    console.log('🎨 BaseScene.setBackgroundImage called with key:', assetKey);
    
    const bgElement = document.getElementById('section-background');
    if (!bgElement) {
      console.error('❌ section-background element not found in DOM');
      return;
    }
    
    console.log('✅ Found section-background element');
    
    // Get the texture from Phaser's texture manager
    const texture = this.textures.get(assetKey);
    if (!texture) {
      console.error('❌ Texture not found in Phaser cache:', assetKey);
      return;
    }
    
    console.log('✅ Found texture:', texture);
    
    // Get the texture's source data which contains the original image path
    const textureSource = texture.source[0];
    console.log('📷 Texture source:', textureSource);
    
    if (textureSource && textureSource.source) {
      const image = textureSource.source as HTMLImageElement;
      console.log('🖼️ Image element:', image);
      console.log('🔗 Image src:', image.src);
      
      // Alternative: Create a canvas and export as data URL
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(image, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        
        console.log('✅ Setting background with data URL');
        bgElement.style.setProperty('background', `url(${dataUrl})`, 'important');
        bgElement.style.backgroundSize = 'cover';
        bgElement.style.backgroundPosition = 'center';
        bgElement.style.backgroundRepeat = 'no-repeat';
        console.log('✅ Background image set successfully');
      } else {
        console.error('❌ Could not get canvas context');
      }
    } else {
      console.error('❌ Texture source not available');
    }
  }

  /**
   * Clear the background image from DOM element
   */
  protected clearBackgroundImage(): void {
    const bgElement = document.getElementById('section-background');
    if (bgElement) {
      bgElement.style.setProperty('background', '', 'important');
      bgElement.style.backgroundSize = '';
      bgElement.style.backgroundPosition = '';
      bgElement.style.backgroundRepeat = '';
    }
  }

  // Helper method for future direct text creation (following Onest pattern)
  protected createStyledText(
    x: number, 
    y: number, 
    text: string, 
    stylePreset: string, 
    color: string
  ): Phaser.GameObjects.Text {
    // Example of how to create text directly with Onest typography
    // (BaseScene doesn't currently need this, but shows the pattern for other scenes)
    return this.add.text(x, y, text, createTextStyle(stylePreset as any, color)).setOrigin(0.5);
  }
}