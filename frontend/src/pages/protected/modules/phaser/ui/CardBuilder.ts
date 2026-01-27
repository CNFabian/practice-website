import Phaser from 'phaser';
import { scale } from '../../../../../utils/scaleHelper';
import { COLORS, OPACITY } from '../constants/Colors';
import { FONT_FAMILY, createTextStyle } from '../constants/Typography';

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

    // Add icon text/emoji - UPDATED
    const icon = config.scene.add.text(0, scale(iconCircleY), iconText, {
      fontSize: `${scale(32)}px`,
      fontFamily: FONT_FAMILY,
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

    // Add title - UPDATED
    const title = config.scene.add.text(0, scale(-120), titleText,
      createTextStyle('H2', titleColor, { fontSize: `${scale(28)}px` })
    ).setOrigin(0.5);
    container.add(title);

    // Add subtitle - UPDATED
    const subtitle = config.scene.add.text(0, scale(-80), subtitleText,
      createTextStyle('BODY_LIGHT', subtitleColor, { align: 'center' })
    ).setOrigin(0.5);
    container.add(subtitle);

    return container;
  }

  /**
   * Create a neighborhood selection card
   */
  static createNeighborhoodCard(
    config: CardConfig & {
      neighborhoodName: string;
      description: string;
      isLocked?: boolean;
      completionPercentage?: number;
    }
  ): Phaser.GameObjects.Container {
    const {
      neighborhoodName,
      description,
      isLocked = false,
      completionPercentage = 0,
    } = config;

    const container = CardBuilder.createCard(config);

    // Determine colors based on state - Fix type assignments
    const titleColor: string = isLocked ? COLORS.TEXT_SECONDARY : COLORS.TEXT_PRIMARY;
    const descColor: string = COLORS.TEXT_SECONDARY; // Always secondary for description

    // Add neighborhood name - UPDATED
    const title = config.scene.add.text(0, scale(-40), neighborhoodName,
      createTextStyle('H2', titleColor)
    ).setOrigin(0.5);
    container.add(title);

    // Add description - UPDATED
    const desc = config.scene.add.text(0, scale(-10), description,
      createTextStyle('BODY_LIGHT', descColor, { align: 'center' })
    ).setOrigin(0.5);
    container.add(desc);

    // Add completion percentage if not locked
    if (!isLocked && completionPercentage > 0) {
      const completionText = config.scene.add.text(
        0, 
        scale(20), 
        `${completionPercentage}% Complete`,
        createTextStyle('CAPTION', COLORS.TEXT_SUCCESS)
      ).setOrigin(0.5);
      container.add(completionText);
    }

    // Add lock icon if locked
    if (isLocked) {
      const lockIcon = config.scene.add.text(0, scale(20), '🔒', {
        fontSize: `${scale(24)}px`,
        fontFamily: FONT_FAMILY,
        color: titleColor,
      }).setOrigin(0.5);
      container.add(lockIcon);
    }

    if (isLocked) {
      container.setAlpha(OPACITY.MEDIUM);
    }

    return container;
  }

  /**
   * Create a house card for house selection
   */
  static createHouseCard(
    config: CardConfig & {
      houseName: string;
      lessonCount: number;
      isCompleted?: boolean;
      isLocked?: boolean;
      houseType?: string;
    }
  ): Phaser.GameObjects.Container {
    const {
      houseName,
      lessonCount,
      isCompleted = false,
      isLocked = false,
      houseType = 'house',
    } = config;

    const container = CardBuilder.createCard(config);

    // Determine icon based on house type
    const houseIcon = houseType === 'apartment' ? '🏢' : '🏠';
    
    // Determine colors based on state - Fix type assignments
    let titleColor: string;
    const descColor: string = COLORS.TEXT_SECONDARY;
    let statusIcon = '';

    if (isLocked) {
      titleColor = COLORS.TEXT_SECONDARY;
      statusIcon = '🔒';
    } else if (isCompleted) {
      titleColor = COLORS.TEXT_PRIMARY;
      statusIcon = '✓';
    } else {
      titleColor = COLORS.TEXT_PRIMARY;
    }

    // Add house icon - UPDATED
    const icon = config.scene.add.text(0, scale(-50), houseIcon, {
      fontSize: `${scale(40)}px`,
      fontFamily: FONT_FAMILY,
    }).setOrigin(0.5);
    container.add(icon);

    // Add house name - UPDATED
    const title = config.scene.add.text(0, scale(-10), houseName,
      createTextStyle('BODY_BOLD', titleColor)
    ).setOrigin(0.5);
    container.add(title);

    // Add lesson count - UPDATED
    const lessonText = config.scene.add.text(
      0, 
      scale(15), 
      `${lessonCount} lesson${lessonCount !== 1 ? 's' : ''}`,
      createTextStyle('CAPTION', descColor)
    ).setOrigin(0.5);
    container.add(lessonText);

    // Add status icon if applicable
    if (statusIcon) {
      const statusIconColor = isCompleted ? COLORS.TEXT_SUCCESS : titleColor;
      const status = config.scene.add.text(
        scale(config.width / 2 - 20), 
        scale(-config.height / 2 + 15), 
        statusIcon, 
        {
          fontSize: `${scale(20)}px`,
          fontFamily: FONT_FAMILY,
          color: statusIconColor,
        }
      ).setOrigin(0.5);
      container.add(status);
    }

    if (isLocked) {
      container.setAlpha(OPACITY.MEDIUM);
    }

    return container;
  }

  /**
   * Create a lesson card for lesson selection
   */
  static createLessonCard(
    config: CardConfig & {
      lessonName: string;
      lessonType: string;
      coinReward: number;
      isCompleted?: boolean;
      isLocked?: boolean;
      difficulty?: 'Easy' | 'Medium' | 'Hard';
    }
  ): Phaser.GameObjects.Container {
    const {
      lessonName,
      lessonType,
      coinReward,
      isCompleted = false,
      isLocked = false,
      difficulty = 'Easy',
    } = config;

    const container = CardBuilder.createCard(config);

    // Determine colors and icons - Fix type assignments
    let titleColor: string;
    let typeIcon = '📚';
    let statusIcon = '';

    if (isLocked) {
      titleColor = COLORS.TEXT_SECONDARY;
      statusIcon = '🔒';
    } else if (isCompleted) {
      titleColor = COLORS.TEXT_SUCCESS;
      statusIcon = '✓';
    } else {
      titleColor = COLORS.TEXT_PRIMARY;
    }

    // Set type icon based on lesson type
    switch (lessonType.toLowerCase()) {
      case 'video':
        typeIcon = '🎥';
        break;
      case 'quiz':
        typeIcon = '❓';
        break;
      case 'reading':
        typeIcon = '📖';
        break;
      case 'interactive':
        typeIcon = '🎮';
        break;
      default:
        typeIcon = '📚';
    }

    // Add lesson type icon - UPDATED
    const icon = config.scene.add.text(0, scale(-60), typeIcon, {
      fontSize: `${scale(32)}px`,
      fontFamily: FONT_FAMILY,
    }).setOrigin(0.5);
    container.add(icon);

    // Add lesson name - UPDATED
    const title = config.scene.add.text(0, scale(-20), lessonName,
      createTextStyle('BODY_BOLD', titleColor, { align: 'center' })
    ).setOrigin(0.5);
    container.add(title);

    // Add lesson type - UPDATED
    const type = config.scene.add.text(0, scale(0), lessonType,
      createTextStyle('CAPTION', COLORS.TEXT_SECONDARY)
    ).setOrigin(0.5);
    container.add(type);

    // Add difficulty - UPDATED (Fix color assignment)
    const diffColor: string = difficulty === 'Hard' ? COLORS.TEXT_WARNING : 
                              difficulty === 'Medium' ? COLORS.TEXT_WARNING : COLORS.TEXT_SUCCESS;
    const diff = config.scene.add.text(0, scale(20), difficulty,
      createTextStyle('CAPTION', diffColor)
    ).setOrigin(0.5);
    container.add(diff);

    // Add coin reward if not completed - UPDATED
    if (!isCompleted && !isLocked) {
      const coinText = config.scene.add.text(
        0, 
        scale(40), 
        `${coinReward} coins`,
        createTextStyle('CAPTION', COLORS.TEXT_WARNING) // Using TEXT_WARNING as coin color
      ).setOrigin(0.5);
      container.add(coinText);
    }

    // Add status icon if applicable
    if (statusIcon) {
      const statusIconColor = isCompleted ? COLORS.TEXT_SUCCESS : titleColor;
      const status = config.scene.add.text(
        scale(config.width / 2 - 15), 
        scale(-config.height / 2 + 15), 
        statusIcon, 
        {
          fontSize: `${scale(16)}px`,
          fontFamily: FONT_FAMILY,
          color: statusIconColor,
        }
      ).setOrigin(0.5);
      container.add(status);
    }

    if (isLocked) {
      container.setAlpha(OPACITY.MEDIUM);
    }

    return container;
  }

  /**
   * Create a progress card showing completion stats
   */
  static createProgressCard(
    config: CardConfig & {
      totalLessons: number;
      completedLessons: number;
      totalCoins: number;
    }
  ): Phaser.GameObjects.Container {
    const {
      totalLessons,
      completedLessons,
      totalCoins,
    } = config;

    const container = CardBuilder.createCard(config);
    const completionPercentage = Math.round((completedLessons / totalLessons) * 100);

    // Add progress title - UPDATED
    const title = config.scene.add.text(0, scale(-50), 'Your Progress',
      createTextStyle('H2', COLORS.TEXT_PRIMARY)
    ).setOrigin(0.5);
    container.add(title);

    // Add completion stats - UPDATED
    const completionText = config.scene.add.text(
      0, 
      scale(-10), 
      `${completedLessons}/${totalLessons} lessons completed`,
      createTextStyle('BODY_MEDIUM', COLORS.TEXT_SECONDARY)
    ).setOrigin(0.5);
    container.add(completionText);

    // Add percentage - UPDATED
    const percentageText = config.scene.add.text(
      0, 
      scale(15), 
      `${completionPercentage}%`,
      createTextStyle('H1', COLORS.TEXT_SUCCESS)
    ).setOrigin(0.5);
    container.add(percentageText);

    // Add total coins - UPDATED
    const coinText = config.scene.add.text(
      0, 
      scale(45), 
      `${totalCoins} coins earned`,
      createTextStyle('BODY_MEDIUM', COLORS.TEXT_WARNING) // Using TEXT_WARNING as coin color
    ).setOrigin(0.5);
    container.add(coinText);

    return container;
  }
}