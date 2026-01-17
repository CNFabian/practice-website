import Phaser from 'phaser';
import { scale } from '../../../../../utils/scaleHelper';
import { COLORS, OPACITY } from '../constants/Colors';

export interface CardConfig {
  scene: Phaser.Scene;
  x?: number;
  y?: number;
  width: number;
  height: number;
  backgroundColor?: number;
  backgroundAlpha?: number;
  strokeColor?: number;
  strokeWidth?: number;
}

export class CardBuilder {
  /**
   * Create a basic card container with background and optional stroke
   */
  static createCard(config: CardConfig): Phaser.GameObjects.Container {
    const {
      scene,
      x = 0,
      y = 0,
      width,
      height,
      backgroundColor = COLORS.WHITE,
      backgroundAlpha = OPACITY.HIGH,
      strokeColor = COLORS.GRAY_200,
      strokeWidth = 2,
    } = config;

    const container = scene.add.container(x, y);

    // Create card background
    const card = scene.add.rectangle(0, 0, width, height, backgroundColor, backgroundAlpha);
    
    if (strokeWidth > 0 && strokeColor !== undefined) {
      card.setStrokeStyle(scale(strokeWidth), strokeColor);
    }
    
    container.add(card);

    return container;
  }

  /**
   * Create a card with an icon circle at the top
   */
  static createCardWithIcon(
    config: CardConfig & {
      iconText: string;
      iconCircleColor?: number;
      iconCircleRadius?: number;
      iconCircleY?: number;
    }
  ): Phaser.GameObjects.Container {
    const {
      iconText,
      iconCircleColor = COLORS.BLUE_500,
      iconCircleRadius = 32,
      iconCircleY = -180,
    } = config;

    const container = CardBuilder.createCard(config);

    // Create icon circle
    const iconCircle = config.scene.add.circle(
      0,
      scale(iconCircleY),
      scale(iconCircleRadius),
      iconCircleColor
    );
    container.add(iconCircle);

    // Add icon text/emoji
    const icon = config.scene.add.text(0, scale(iconCircleY), iconText, {
      fontSize: `${scale(32)}px`,
      color: COLORS.TEXT_WHITE,
    }).setOrigin(0.5);
    container.add(icon);

    return container;
  }

  /**
   * Create a card with header (icon + title + subtitle)
   */
  static createHeaderCard(
    config: CardConfig & {
      iconText: string;
      titleText: string;
      subtitleText: string;
      iconCircleColor?: number;
      titleColor?: string;
      subtitleColor?: string;
    }
  ): Phaser.GameObjects.Container {
    const {
      iconText,
      titleText,
      subtitleText,
      iconCircleColor = COLORS.BLUE_500,
      titleColor = COLORS.TEXT_PRIMARY,
      subtitleColor = COLORS.TEXT_SECONDARY,
    } = config;

    const container = CardBuilder.createCardWithIcon({
      ...config,
      iconText,
      iconCircleColor,
    });

    // Add title
    const title = config.scene.add.text(0, scale(-120), titleText, {
      fontSize: `${scale(28)}px`,
      fontFamily: 'Arial, sans-serif',
      color: titleColor,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add(title);

    // Add subtitle
    const subtitle = config.scene.add.text(0, scale(-80), subtitleText, {
      fontSize: `${scale(16)}px`,
      fontFamily: 'Arial, sans-serif',
      color: subtitleColor,
      align: 'center',
    }).setOrigin(0.5);
    container.add(subtitle);

    return container;
  }
}