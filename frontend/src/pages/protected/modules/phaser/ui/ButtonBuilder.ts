import Phaser from 'phaser';
import { scale, scaleFontSize } from '../../../../../utils/scaleHelper';
import { COLORS, OPACITY } from '../constants/Colors';

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

    // Create button text
    const buttonText = scene.add.text(0, 0, text, {
      fontSize: scaleFontSize(fontSize),
      fontFamily: 'Arial, sans-serif',
      color: textColor,
      fontStyle: 'bold',
    }).setOrigin(0.5);
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

    // Create icon
    const iconText = scene.add.text(-width / 4, 0, icon, {
      fontSize: scaleFontSize(iconSize),
      color: textColor,
    }).setOrigin(0.5);
    container.add(iconText);

    // Create button text
    const buttonText = scene.add.text(width / 8, 0, text, {
      fontSize: scaleFontSize(fontSize),
      fontFamily: 'Arial, sans-serif',
      color: textColor,
      fontStyle: 'bold',
    }).setOrigin(0.5);
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
      width: scale(120),
      height: scale(40),
      text: 'Back',
      icon: '←',
      iconSize: 24,
      fontSize: 16,
      backgroundColor: COLORS.GRAY_700,
      hoverColor: COLORS.GRAY_800,
      onClick,
    });
  }

  /**
   * Create a lesson card button
   */
  static createLessonButton(
    config: ButtonConfig & {
      completed: boolean;
      locked: boolean;
    }
  ): Phaser.GameObjects.Container {
    const { completed, locked } = config;

    let backgroundColor: number = COLORS.BLUE_500;
    let hoverColor: number = COLORS.BLUE_600;
    let buttonText = 'Start';

    if (completed) {
      backgroundColor = COLORS.GREEN_500;
      hoverColor = COLORS.GREEN_600;
      buttonText = 'Review';
    }

    if (locked) {
      backgroundColor = COLORS.GRAY_400;
      hoverColor = COLORS.GRAY_400;
      buttonText = 'Locked';
    }

    return ButtonBuilder.createButton({
      ...config,
      text: buttonText,
      backgroundColor,
      hoverColor,
      disabled: locked,
    });
  }
}