import Phaser from 'phaser';
import { scale, scaleFontSize } from '../utils/scaleHelper';
import { COLORS, OPACITY } from '../constants/Colors';
import { FONT_FAMILY, createTextStyle } from '../constants/Typography';

export interface ButtonConfig {
  scene: Phaser.Scene;
  x?: number;
  y?: number;
  width: number;
  height: number;
  text: string;
  backgroundColor?: number;
  hoverColor?: number;
  textColor?: string;
  fontSize?: number;
  onClick?: () => void;
  disabled?: boolean;
}

export class ButtonBuilder {
  /**
   * Create a basic rectangular button with text
   */
  static createButton(config: ButtonConfig): Phaser.GameObjects.Container {
    const {
      scene,
      x = 0,
      y = 0,
      width,
      height,
      text,
      backgroundColor = COLORS.LOGO_BLUE,
      hoverColor = COLORS.ELEGANT_BLUE,
      textColor = COLORS.TEXT_WHITE_HEX,
      fontSize = 16,
      onClick,
      disabled = false,
    } = config;

    const container = scene.add.container(x, y);

    // Create button background
    const buttonBg = scene.add.rectangle(0, 0, width, height, backgroundColor);
    buttonBg.setStrokeStyle(scale(2), COLORS.UNAVAILABLE_BUTTON);
    container.add(buttonBg);

    // Create button text
    const buttonText = scene.add.text(0, 0, text,
      createTextStyle('BUTTON', textColor, { fontSize: `${scaleFontSize(fontSize)}px` })
    ).setOrigin(0.5);
    container.add(buttonText);

    // Make interactive if not disabled
    if (!disabled && onClick) {
      buttonBg.setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
          buttonBg.setFillStyle(hoverColor);
          scene.tweens.add({
            targets: container,
            scale: 1.05,
            duration: 150,
            ease: 'Power2',
          });
        })
        .on('pointerout', () => {
          buttonBg.setFillStyle(backgroundColor);
          scene.tweens.add({
            targets: container,
            scale: 1,
            duration: 150,
            ease: 'Power2',
          });
        })
        .on('pointerdown', onClick);
    }

    if (disabled) {
      container.setAlpha(OPACITY.MEDIUM);
    }

    return container;
  }

  /**
   * Create a rounded button with icon and text
   */
  static createIconButton(
    config: ButtonConfig & {
      icon: string;
      iconSize?: number;
    }
  ): Phaser.GameObjects.Container {
    const {
      scene,
      x = 0,
      y = 0,
      width,
      height,
      text,
      icon,
      iconSize = 20,
      backgroundColor = COLORS.LOGO_BLUE,
      hoverColor = COLORS.ELEGANT_BLUE,
      textColor = COLORS.TEXT_WHITE_HEX,
      fontSize = 14,
      onClick,
      disabled = false,
    } = config;

    const container = scene.add.container(x, y);

    // Create button background (rounded)
    const buttonBg = scene.add.rectangle(0, 0, width, height, backgroundColor, OPACITY.HIGH);
    buttonBg.setStrokeStyle(scale(2), COLORS.PURE_WHITE);
    container.add(buttonBg);

    // Create icon
    const iconText = scene.add.text(-width / 4, 0, icon, {
      fontSize: `${scaleFontSize(iconSize)}px`,
      fontFamily: FONT_FAMILY,
      color: textColor,
    }).setOrigin(0.5);
    container.add(iconText);

    // Create button text
    const buttonText = scene.add.text(width / 8, 0, text,
      createTextStyle('BUTTON', textColor, { fontSize: `${scaleFontSize(fontSize)}px` })
    ).setOrigin(0.5);
    container.add(buttonText);

    // Make interactive if not disabled
    if (!disabled && onClick) {
      buttonBg.setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
          buttonBg.setFillStyle(hoverColor, OPACITY.FULL);
          scene.tweens.add({
            targets: container,
            scale: 1.05,
            duration: 150,
            ease: 'Power2',
          });
        })
        .on('pointerout', () => {
          buttonBg.setFillStyle(backgroundColor, OPACITY.HIGH);
          scene.tweens.add({
            targets: container,
            scale: 1,
            duration: 150,
            ease: 'Power2',
          });
        })
        .on('pointerdown', onClick);
    }

    if (disabled) {
      container.setAlpha(OPACITY.MEDIUM);
    }

    return container;
  }

/**
 * Create a back button (arrow + text)
 */
static createBackButton(
  scene: Phaser.Scene,
  onClick: () => void,
  x: number = scale(30),
  y: number = scale(30)
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y);

  // Create transparent rounded background that shows on hover
  const hoverBg = scene.add.graphics();
  hoverBg.fillStyle(0x000000, 0);
  hoverBg.fillRoundedRect(scale(-10), scale(-22), scale(90), scale(44), scale(10));
  container.add(hoverBg);

  // Create arrow icon
  const arrow = scene.add.text(0, 0, '←', {
    fontSize: '36px',
    fontFamily: FONT_FAMILY,
    color: COLORS.TEXT_PRIMARY,
    fontStyle: 'bold',
  }).setOrigin(0, 0.5);
  container.add(arrow);

  // Create "Back" text
  const backText = scene.add.text(scale(22), 0, 'Back', {
    fontSize: '28px',
    fontFamily: FONT_FAMILY,
    color: COLORS.TEXT_PRIMARY,
    fontStyle: 'bold',
  }).setOrigin(0, 0.5);
  container.add(backText);

  // Create interactive area for hover effects
  const interactiveZone = scene.add.zone(scale(35), 0, scale(90), scale(44));
  interactiveZone.setInteractive({ useHandCursor: true })
    .on('pointerover', () => {
      hoverBg.clear();
      hoverBg.fillStyle(0x000000, 0.1);
      hoverBg.fillRoundedRect(scale(-10), scale(-22), scale(90), scale(44), scale(10));
    })
    .on('pointerout', () => {
      hoverBg.clear();
      hoverBg.fillStyle(0x000000, 0);
      hoverBg.fillRoundedRect(scale(-10), scale(-22), scale(90), scale(44), scale(10));
    })
    .on('pointerdown', onClick);
  container.add(interactiveZone);

  return container;
}

  /**
   * Create a lesson button with completion states
   */
  static createLessonButton(
    config: ButtonConfig & {
      isCompleted?: boolean;
      isLocked?: boolean;
      coinReward?: number;
    }
  ): Phaser.GameObjects.Container {
    const {
      scene,
      x = 0,
      y = 0,
      width,
      height,
      text,
      isCompleted = false,
      isLocked = false,
      coinReward = 0,
      onClick,
    } = config;

    const container = scene.add.container(x, y);

    // Determine colors based on state
    let backgroundColor: number;
    let textColor: string;
    let statusIcon = '';

    if (isLocked) {
      backgroundColor = COLORS.UNAVAILABLE_BUTTON;
      textColor = COLORS.TEXT_SECONDARY;
      statusIcon = '🔒';
    } else if (isCompleted) {
      backgroundColor = COLORS.STATUS_GREEN;
      textColor = COLORS.TEXT_WHITE_HEX;
      statusIcon = '✓';
    } else {
      backgroundColor = COLORS.LOGO_BLUE;
      textColor = COLORS.TEXT_WHITE_HEX;
    }

    // Create button background
    const buttonBg = scene.add.rectangle(0, 0, width, height, backgroundColor);
    buttonBg.setStrokeStyle(scale(2), COLORS.UNAVAILABLE_BUTTON);
    container.add(buttonBg);

    // Create lesson title
    const lessonText = scene.add.text(0, -scale(8), text,
      createTextStyle('BUTTON', textColor, { fontSize: `${scaleFontSize(16)}px` })
    ).setOrigin(0.5);
    container.add(lessonText);

    // Add status icon if applicable
    if (statusIcon) {
      const icon = scene.add.text(scale(width / 2 - 20), -scale(height / 2 - 15), statusIcon, {
        fontSize: `${scaleFontSize(20)}px`,
        fontFamily: FONT_FAMILY,
        color: textColor,
      }).setOrigin(0.5);
      container.add(icon);
    }

    // Add coin reward if applicable
    if (coinReward > 0 && !isCompleted) {
      const coinText = scene.add.text(0, scale(8), `${coinReward} coins`,
        createTextStyle('CAPTION', textColor)
      ).setOrigin(0.5);
      container.add(coinText);
    }

    // Make interactive if not locked
    if (!isLocked && onClick) {
      // Use opacity for hover instead of new colors
      const originalAlpha = container.alpha;
      
      buttonBg.setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
          container.setAlpha(OPACITY.HIGH);
          scene.tweens.add({
            targets: container,
            scale: 1.03,
            duration: 150,
            ease: 'Power2',
          });
        })
        .on('pointerout', () => {
          container.setAlpha(originalAlpha);
          scene.tweens.add({
            targets: container,
            scale: 1,
            duration: 150,
            ease: 'Power2',
          });
        })
        .on('pointerdown', onClick);
    }

    if (isLocked) {
      container.setAlpha(OPACITY.MEDIUM);
    }

    return container;
  }

  /**
   * Create a minigame button with special styling
   */
  static createMinigameButton(
    config: ButtonConfig & {
      icon?: string;
    }
  ): Phaser.GameObjects.Container {
    const {
      scene,
      x = 0,
      y = 0,
      width,
      height,
      text,
      icon = '🎮',
      onClick,
    } = config;

    const container = scene.add.container(x, y);

    // Use gradient blue colors for minigames
    const buttonBg = scene.add.rectangle(0, 0, width, height, COLORS.LINEAR_BLUE_1_START);
    buttonBg.setStrokeStyle(scale(3), COLORS.ELEGANT_BLUE);
    container.add(buttonBg);

    // Add icon
    const iconText = scene.add.text(0, -scale(15), icon, {
      fontSize: `${scaleFontSize(32)}px`,
      fontFamily: FONT_FAMILY,
    }).setOrigin(0.5);
    container.add(iconText);

    // Add button text
    const buttonText = scene.add.text(0, scale(15), text,
      createTextStyle('BUTTON', COLORS.TEXT_WHITE_HEX, { fontSize: `${scaleFontSize(14)}px` })
    ).setOrigin(0.5);
    container.add(buttonText);

    // Make interactive - use opacity for hover
    if (onClick) {
      buttonBg.setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
          container.setAlpha(OPACITY.HIGH);
          scene.tweens.add({
            targets: container,
            scale: 1.05,
            duration: 150,
            ease: 'Power2',
          });
        })
        .on('pointerout', () => {
          container.setAlpha(OPACITY.FULL);
          scene.tweens.add({
            targets: container,
            scale: 1,
            duration: 150,
            ease: 'Power2',
          });
        })
        .on('pointerdown', onClick);
    }

    return container;
  }
}