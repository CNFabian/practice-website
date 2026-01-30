import Phaser from 'phaser';
import { scale, scaleFontSize } from '../../../../../utils/scaleHelper';
import { createTextStyle } from '../constants/Typography';

export interface HouseProgressData {
  moduleNumber: number;
  moduleName: string;
  duration: string;
  hasProgress: boolean;
  progressPercent?: number; // 0-100
  lessonCount?: number;
  quizCount?: number;
  coinReward?: number;
}

export class HouseProgressCard {
  /**
   * Create a progress card for a house
   */
  static createProgressCard(
    scene: Phaser.Scene,
    x: number,
    y: number,
    data: HouseProgressData,
    onContinueClick?: () => void
  ): Phaser.GameObjects.Container {
    const container = scene.add.container(x, y);

    // Card dimensions
    const cardWidth = scale(380);
    const collapsedHeight = scale(70);
    const expandedHeight = scale(140);
    const borderRadius = scale(16);

    // Determine initial state
    const isExpandable = data.hasProgress && data.progressPercent !== undefined;
    const initialHeight = isExpandable ? collapsedHeight : collapsedHeight;

    // Create card background
    const cardBg = scene.add.graphics();
    
    const drawCard = (height: number) => {
      cardBg.clear();
      cardBg.fillStyle(0xE8F0FE, 1); // Light blue background
      cardBg.fillRoundedRect(-cardWidth / 2, -height / 2, cardWidth, height, borderRadius);
      
      // Add subtle border/shadow effect at bottom
      const shadowHeight = scale(6);
      cardBg.fillStyle(0x5B7FDB, 1); // Blue shadow
      cardBg.fillRoundedRect(
        -cardWidth / 2,
        height / 2 - shadowHeight,
        cardWidth,
        shadowHeight,
        { bl: borderRadius, br: borderRadius, tl: 0, tr: 0 }
      );
    };
    
    drawCard(initialHeight);
    container.add(cardBg);

    // Module number and title (top section) - always visible
    const titleY = -initialHeight / 2 + scale(20);
    const titleText = `${data.moduleNumber}. ${data.moduleName}`;
    const title = scene.add.text(-cardWidth / 2 + scale(20), titleY, titleText,
      createTextStyle('BODY_BOLD', '#1E3A8A', {
        fontSize: scaleFontSize(16),
      })
    ).setOrigin(0, 0.5);
    container.add(title);

    // Duration (top right) - always visible
    const duration = scene.add.text(cardWidth / 2 - scale(20), titleY, data.duration,
      createTextStyle('BODY_LIGHT', '#6B7280', {
        fontSize: scaleFontSize(14),
      })
    ).setOrigin(1, 0.5);
    container.add(duration);

    // Progress section container (only if hasProgress)
    let progressContainer: Phaser.GameObjects.Container | undefined;
    let continueButton: Phaser.GameObjects.Graphics | undefined;
    let buttonZone: Phaser.GameObjects.Zone | undefined;

    if (isExpandable) {
      progressContainer = scene.add.container(0, 0);
      progressContainer.setAlpha(0); // Start hidden
      container.add(progressContainer);

      const progressY = scale(15);

      // Progress bar background
      const progressBarWidth = cardWidth - scale(40);
      const progressBarHeight = scale(8);
      const progressBg = scene.add.graphics();
      progressBg.fillStyle(0xD1D5DB, 1);
      progressBg.fillRoundedRect(
        -progressBarWidth / 2,
        progressY - progressBarHeight / 2,
        progressBarWidth,
        progressBarHeight,
        progressBarHeight / 2
      );
      progressContainer.add(progressBg);

      // Progress bar fill
      const progressFillWidth = (progressBarWidth * (data.progressPercent || 0)) / 100;
      const progressFill = scene.add.graphics();
      progressFill.fillStyle(0x5B7FDB, 1);
      progressFill.fillRoundedRect(
        -progressBarWidth / 2,
        progressY - progressBarHeight / 2,
        progressFillWidth,
        progressBarHeight,
        progressBarHeight / 2
      );
      progressContainer.add(progressFill);

      // Star icon on progress bar
      const starX = -progressBarWidth / 2 + progressFillWidth;
      const star = scene.add.text(starX, progressY, '⭐',
        {
          fontSize: scaleFontSize(20),
        }
      ).setOrigin(0.5);
      progressContainer.add(star);

      // Bottom section with icons and button
      const bottomY = progressY + scale(30);

      // Lesson count (calendar icon)
      const lessonIcon = scene.add.text(-cardWidth / 2 + scale(60), bottomY, '📅',
        { fontSize: scaleFontSize(24) }
      ).setOrigin(0.5);
      progressContainer.add(lessonIcon);

      const lessonCount = scene.add.text(-cardWidth / 2 + scale(90), bottomY, `${data.lessonCount || 0}`,
        createTextStyle('BODY_BOLD', '#5B7FDB', { fontSize: scaleFontSize(16) })
      ).setOrigin(0, 0.5);
      progressContainer.add(lessonCount);

      // Quiz count (document icon)
      const quizIcon = scene.add.text(-cardWidth / 2 + scale(140), bottomY, '📄',
        { fontSize: scaleFontSize(24) }
      ).setOrigin(0.5);
      progressContainer.add(quizIcon);

      const quizCount = scene.add.text(-cardWidth / 2 + scale(170), bottomY, `${data.quizCount || 0}`,
        createTextStyle('BODY_BOLD', '#5B7FDB', { fontSize: scaleFontSize(16) })
      ).setOrigin(0, 0.5);
      progressContainer.add(quizCount);

      // Coin icon
      const coinIcon = scene.add.text(-cardWidth / 2 + scale(220), bottomY, '🪙',
        { fontSize: scaleFontSize(24) }
      ).setOrigin(0.5);
      progressContainer.add(coinIcon);

      // Continue button
      const buttonWidth = scale(120);
      const buttonHeight = scale(36);
      const buttonX = cardWidth / 2 - scale(20) - buttonWidth / 2;

      continueButton = scene.add.graphics();
      continueButton.fillStyle(0x5B7FDB, 1);
      continueButton.fillRoundedRect(
        buttonX - buttonWidth / 2,
        bottomY - buttonHeight / 2,
        buttonWidth,
        buttonHeight,
        buttonHeight / 2
      );
      progressContainer.add(continueButton);

      const continueText = scene.add.text(buttonX, bottomY, 'CONTINUE',
        createTextStyle('BUTTON', '#FFFFFF', { fontSize: scaleFontSize(14) })
      ).setOrigin(0.5);
      progressContainer.add(continueText);

      // Make button interactive
      if (onContinueClick) {
        buttonZone = scene.add.zone(buttonX, bottomY, buttonWidth, buttonHeight);
        buttonZone.setInteractive({ useHandCursor: true })
          .on('pointerdown', onContinueClick)
          .on('pointerover', () => {
            continueButton!.clear();
            continueButton!.fillStyle(0x4A6BC7, 1);
            continueButton!.fillRoundedRect(
              buttonX - buttonWidth / 2,
              bottomY - buttonHeight / 2,
              buttonWidth,
              buttonHeight,
              buttonHeight / 2
            );
          })
          .on('pointerout', () => {
            continueButton!.clear();
            continueButton!.fillStyle(0x5B7FDB, 1);
            continueButton!.fillRoundedRect(
              buttonX - buttonWidth / 2,
              bottomY - buttonHeight / 2,
              buttonWidth,
              buttonHeight,
              buttonHeight / 2
            );
          });
        progressContainer.add(buttonZone);
      }

      // Add hover interaction to expand/collapse the card
const hoverZone = scene.add.zone(0, 0, cardWidth, collapsedHeight);
hoverZone.setOrigin(0.5, 0.5);
hoverZone.setInteractive()
  .on('pointerover', () => {
    console.log('Card hover - expanding'); // Debug log
    
    // Expand animation
    scene.tweens.add({
      targets: { height: collapsedHeight },
      height: expandedHeight,
      duration: 200,
      ease: 'Power2',
      onUpdate: (tween) => {
        const height = tween.getValue();
        if (height !== null) {
          drawCard(height);
          title.setY(-height / 2 + scale(20));
          duration.setY(-height / 2 + scale(20));
        }
      }
    });

    // Fade in progress details
    if (progressContainer) {
      scene.tweens.add({
        targets: progressContainer,
        alpha: 1,
        duration: 200,
        ease: 'Power2'
      });
    }
  })
  .on('pointerout', () => {
    console.log('Card hover - collapsing'); // Debug log
    
    // Collapse animation
    scene.tweens.add({
      targets: { height: expandedHeight },
      height: collapsedHeight,
      duration: 200,
      ease: 'Power2',
      onUpdate: (tween) => {
        const height = tween.getValue();
        if (height !== null) {
          drawCard(height);
          title.setY(-height / 2 + scale(20));
          duration.setY(-height / 2 + scale(20));
        }
      }
    });

    // Fade out progress details
    if (progressContainer) {
      scene.tweens.add({
        targets: progressContainer,
        alpha: 0,
        duration: 200,
        ease: 'Power2'
      });
    }
  });
container.add(hoverZone);
    }

    return container;
  }
}