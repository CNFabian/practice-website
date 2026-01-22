import Phaser from 'phaser';
import { scale, scaleFontSize } from '../../../../../utils/scaleHelper';
import { COLORS } from '../constants/Colors';

export class UIComponents {

  /**
   * Create a coin counter display
   */
  static createCoinCounter(
    scene: Phaser.Scene,
    coins: number
  ): Phaser.GameObjects.Container {
    const container = scene.add.container(0, 0);
    container.setDepth(100); // High depth to stay on top

    // Background
    const background = scene.add.rectangle(0, 0, scale(120), scale(40), 0xFFFFFF, 0.95); // Changed opacity to match BaseScene
    background.setStrokeStyle(scale(2), COLORS.GRAY_200);
    container.add(background);

    // Coin text
    const coinText = scene.add.text(-scale(15), 0, coins.toString(), { // Changed position to match BaseScene
      fontSize: scaleFontSize(20), // Changed size to match BaseScene
      fontFamily: 'Fredoka, sans-serif',
      color: '#000000',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    coinText.setName('coinText'); // ADD THIS LINE - so BaseScene can find it
    container.add(coinText);

    // Coin icon
    const coinIcon = scene.add.text(scale(30), 0, '🪙', { // Changed position to match BaseScene
      fontSize: scaleFontSize(28), // Changed size to match BaseScene
    }).setOrigin(0.5);
    container.add(coinIcon);

    return container;
  }

  /**
   * Create a status badge (e.g., "Completed", "Locked")
   */
  static createBadge(
    scene: Phaser.Scene,
    text: string,
    backgroundColor: number = COLORS.GREEN_500,
    textColor: string = COLORS.TEXT_WHITE
  ): Phaser.GameObjects.Container {
    const container = scene.add.container(0, 0);

    // Badge background
    const badge = scene.add.rectangle(0, 0, scale(100), scale(28), backgroundColor);
    badge.setStrokeStyle(scale(1), COLORS.WHITE);
    container.add(badge);

    // Badge text
    const badgeText = scene.add.text(0, 0, text, {
      fontSize: scaleFontSize(12),
      fontFamily: 'Arial, sans-serif',
      color: textColor,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add(badgeText);

    return container;
  }

  /**
   * Create a circular icon with background
   */
  static createIconCircle(
    scene: Phaser.Scene,
    icon: string,
    backgroundColor: number = COLORS.BLUE_500,
    radius: number = 32,
    iconColor: string = COLORS.TEXT_WHITE
  ): Phaser.GameObjects.Container {
    const container = scene.add.container(0, 0);

    // Circle background
    const circle = scene.add.circle(0, 0, scale(radius), backgroundColor);
    container.add(circle);

    // Icon
    const iconText = scene.add.text(0, 0, icon, {
      fontSize: scaleFontSize(32),
      color: iconColor,
    }).setOrigin(0.5);
    container.add(iconText);

    return container;
  }

  /**
   * Create a title text with consistent styling
   */
  static createTitle(
    scene: Phaser.Scene,
    text: string,
    fontSize: number = 28,
    color: string = COLORS.TEXT_PRIMARY
  ): Phaser.GameObjects.Text {
    return scene.add.text(0, 0, text, {
      fontSize: scaleFontSize(fontSize),
      fontFamily: 'Arial, sans-serif',
      color: color,
      fontStyle: 'bold',
    }).setOrigin(0.5);
  }

  /**
   * Create a subtitle/description text
   */
  static createSubtitle(
    scene: Phaser.Scene,
    text: string,
    fontSize: number = 16,
    color: string = COLORS.TEXT_SECONDARY,
    align: string = 'center'
  ): Phaser.GameObjects.Text {
    return scene.add.text(0, 0, text, {
      fontSize: scaleFontSize(fontSize),
      fontFamily: 'Arial, sans-serif',
      color: color,
      align: align,
    }).setOrigin(0.5);
  }

  /**
   * Create a loading progress bar
   */
  static createProgressBar(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number = 320,
    height: number = 50
  ): {
    box: Phaser.GameObjects.Graphics;
    bar: Phaser.GameObjects.Graphics;
    text: Phaser.GameObjects.Text;
  } {
    // Progress box (background)
    const progressBox = scene.add.graphics();
    progressBox.fillStyle(COLORS.PROGRESS_BOX, 0.8);
    progressBox.fillRect(x - width / 2, y - height / 2, width, height);

    // Progress bar (fill)
    const progressBar = scene.add.graphics();

    // Percentage text
    const percentText = scene.add.text(x, y, '0%', {
      fontSize: scaleFontSize(18),
      color: COLORS.TEXT_WHITE,
    }).setOrigin(0.5);

    return {
      box: progressBox,
      bar: progressBar,
      text: percentText,
    };
  }

  /**
   * Update progress bar value
   */
  static updateProgressBar(
    progressBar: Phaser.GameObjects.Graphics,
    percentText: Phaser.GameObjects.Text,
    value: number,
    x: number,
    y: number,
    width: number = 300,
    height: number = 30
  ): void {
    progressBar.clear();
    progressBar.fillStyle(COLORS.PROGRESS_BAR, 1);
    progressBar.fillRect(x - width / 2, y - height / 2, width * value, height);
    percentText.setText(Math.floor(value * 100) + '%');
  }

  /**
   * Create a divider line
   */
  static createDivider(
    scene: Phaser.Scene,
    width: number,
    color: number = COLORS.GRAY_200,
    thickness: number = 2
  ): Phaser.GameObjects.Rectangle {
    return scene.add.rectangle(0, 0, scale(width), scale(thickness), color);
  }

  /**
   * Create a lesson type tag (e.g., "Video/Reading", "Quiz")
   */
  static createLessonTypeTag(
    scene: Phaser.Scene,
    type: string
  ): Phaser.GameObjects.Container {
    const container = scene.add.container(0, 0);

    // Tag background
    const tagBg = scene.add.rectangle(0, 0, scale(120), scale(24), COLORS.GRAY_200);
    container.add(tagBg);

    // Tag text
    const tagText = scene.add.text(0, 0, type, {
      fontSize: scaleFontSize(12),
      fontFamily: 'Arial, sans-serif',
      color: COLORS.TEXT_SECONDARY,
    }).setOrigin(0.5);
    container.add(tagText);

    return container;
  }

  /**
   * Create a checkmark icon for completed items
   */
  static createCheckmark(
    scene: Phaser.Scene,
    size: number = 24,
    color: string = COLORS.TEXT_SUCCESS
  ): Phaser.GameObjects.Text {
    return scene.add.text(0, 0, '✓', {
      fontSize: scaleFontSize(size),
      color: color,
      fontStyle: 'bold',
    }).setOrigin(0.5);
  }

  /**
   * Create a lock icon for locked items
   */
  static createLockIcon(
    scene: Phaser.Scene,
    size: number = 20
  ): Phaser.GameObjects.Text {
    return scene.add.text(0, 0, '🔒', {
      fontSize: scaleFontSize(size),
    }).setOrigin(0.5);
  }

  /**
   * Apply hover effect to a container
   */
  static applyHoverEffect(
    scene: Phaser.Scene,
    container: Phaser.GameObjects.Container,
    onHover?: () => void,
    onOut?: () => void
  ): void {
    const background = container.list[0] as Phaser.GameObjects.Rectangle;
    
    if (background && background.input) {
      background.on('pointerover', () => {
        scene.tweens.add({
          targets: container,
          scale: 1.05,
          duration: 150,
          ease: 'Power2',
        });
        if (onHover) onHover();
      });

      background.on('pointerout', () => {
        scene.tweens.add({
          targets: container,
          scale: 1,
          duration: 150,
          ease: 'Power2',
        });
        if (onOut) onOut();
      });
    }
  }
}