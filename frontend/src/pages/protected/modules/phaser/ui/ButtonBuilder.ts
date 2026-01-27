import Phaser from 'phaser';
import { scale, scaleFontSize } from '../../../../../utils/scaleHelper';
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
      backgroundColor = COLORS.BLUE_500,
      hoverColor = COLORS.BLUE_600,
      textColor = COLORS.TEXT_WHITE,
      fontSize = 16,
      onClick,
      disabled = false,
    } = config;

    const container = scene.add.container(x, y);

    // Create button background
    const buttonBg = scene.add.rectangle(0, 0, width, height, backgroundColor);
    buttonBg.setStrokeStyle(scale(2), COLORS.GRAY_200);
    container.add(buttonBg);

    // Create button text - UPDATED
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
      backgroundColor = COLORS.BLUE_500,
      hoverColor = COLORS.BLUE_600,
      textColor = COLORS.TEXT_WHITE,
      fontSize = 14,
      onClick,
      disabled = false,
    } = config;

    const container = scene.add.container(x, y);

    // Create button background (rounded)
    const buttonBg = scene.add.rectangle(0, 0, width, height, backgroundColor, OPACITY.HIGH);
    buttonBg.setStrokeStyle(scale(2), COLORS.WHITE);
    container.add(buttonBg);

    // Create icon - UPDATED
    const iconText = scene.add.text(-width / 4, 0, icon, {
      fontSize: `${scaleFontSize(iconSize)}px`,
      fontFamily: FONT_FAMILY,
      color: textColor,
    }).setOrigin(0.5);
    container.add(iconText);

    // Create button text - UPDATED
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
    x: number = scale(20),
    y: number = scale(20)
  ): Phaser.GameObjects.Container {
    return ButtonBuilder.createIconButton({
      scene,
      x,
      y,
      width: scale(100),
      height: scale(40),
      text: 'Back',
      icon: '←',
      iconSize: 20,
      fontSize: 14,
      backgroundColor: COLORS.GRAY_500,
      hoverColor: COLORS.GRAY_600,
      textColor: COLORS.TEXT_WHITE,
      onClick,
    });
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

    // Determine colors based on state - Fix type assignments
    let backgroundColor: number;
    let textColor: string;
    let statusIcon = '';

    if (isLocked) {
      backgroundColor = COLORS.GRAY_400; // This is a number
      textColor = COLORS.TEXT_SECONDARY; // This is a string
      statusIcon = '🔒';
    } else if (isCompleted) {
      backgroundColor = COLORS.GREEN_500; // This is a number
      textColor = COLORS.TEXT_WHITE; // This is a string
      statusIcon = '✓';
    } else {
      backgroundColor = COLORS.BLUE_500; // This is a number  
      textColor = COLORS.TEXT_WHITE; // This is a string
    }

    // Create button background
    const buttonBg = scene.add.rectangle(0, 0, width, height, backgroundColor);
    buttonBg.setStrokeStyle(scale(2), COLORS.GRAY_200);
    container.add(buttonBg);

    // Create lesson title - UPDATED
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
      const hoverColor = isCompleted ? COLORS.GREEN_600 : COLORS.BLUE_600;
      
      buttonBg.setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
          buttonBg.setFillStyle(hoverColor);
          scene.tweens.add({
            targets: container,
            scale: 1.03,
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

    // Special gradient-like background for minigames (using existing colors)
    const buttonBg = scene.add.rectangle(0, 0, width, height, COLORS.BLUE_700);
    buttonBg.setStrokeStyle(scale(3), COLORS.BLUE_400);
    container.add(buttonBg);

    // Add icon
    const iconText = scene.add.text(0, -scale(15), icon, {
      fontSize: `${scaleFontSize(32)}px`,
      fontFamily: FONT_FAMILY,
    }).setOrigin(0.5);
    container.add(iconText);

    // Add button text - UPDATED
    const buttonText = scene.add.text(0, scale(15), text,
      createTextStyle('BUTTON', COLORS.TEXT_WHITE, { fontSize: `${scaleFontSize(14)}px` })
    ).setOrigin(0.5);
    container.add(buttonText);

    // Make interactive
    if (onClick) {
      buttonBg.setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
          buttonBg.setFillStyle(COLORS.BLUE_600);
          scene.tweens.add({
            targets: container,
            scale: 1.05,
            duration: 150,
            ease: 'Power2',
          });
        })
        .on('pointerout', () => {
          buttonBg.setFillStyle(COLORS.BLUE_700);
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