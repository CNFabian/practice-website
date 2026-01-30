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
    const expandedHeight = scale(110);
    const borderRadius = scale(16);

    // Determine initial state
    const isExpandable = data.hasProgress && data.progressPercent !== undefined;
    const initialHeight = isExpandable ? collapsedHeight : collapsedHeight;

    // Create glow graphics FIRST (so it appears behind everything)
    const glowGraphics = scene.add.graphics();
    container.add(glowGraphics);

    // Create card background
    const cardBg = scene.add.graphics();
    
    const drawCard = (height: number, isHovered: boolean = false) => {
      cardBg.clear();
      cardBg.fillStyle(0xE8F0FE, 1); // Light blue background
      cardBg.fillRoundedRect(-cardWidth / 2, -height / 2, cardWidth, height, borderRadius);
      
      // Only add the blue accent bar at bottom when NOT hovered
      if (!isHovered) {
        const shadowHeight = scale(6);
        cardBg.fillStyle(0x5B7FDB, 1); // Blue shadow
        cardBg.fillRoundedRect(
          -cardWidth / 2,
          height / 2 - shadowHeight,
          cardWidth,
          shadowHeight,
          { bl: borderRadius, br: borderRadius, tl: 0, tr: 0 }
        );
      }
    };
    
    drawCard(initialHeight, false);
    container.add(cardBg);

    // Function to draw the glow - TONED DOWN
    const drawGlow = (height: number, alpha: number = 0) => {
      glowGraphics.clear();
      if (alpha > 0) {
        // Outer glow layer - REDUCED from 0.25 to 0.15
        glowGraphics.lineStyle(scale(12), 0x5B7FDB, alpha * 0.15);
        glowGraphics.strokeRoundedRect(
          -cardWidth / 2 - scale(6), 
          -height / 2 - scale(6), 
          cardWidth + scale(12), 
          height + scale(12), 
          borderRadius + scale(3)
        );
        
        // Middle glow layer - REDUCED from 0.5 to 0.3
        glowGraphics.lineStyle(scale(8), 0x5B7FDB, alpha * 0.3);
        glowGraphics.strokeRoundedRect(
          -cardWidth / 2 - scale(4), 
          -height / 2 - scale(4), 
          cardWidth + scale(8), 
          height + scale(8), 
          borderRadius + scale(2)
        );
        
        // Inner bright border - REDUCED from alpha to alpha * 0.7
        glowGraphics.lineStyle(scale(4), 0x5B7FDB, alpha * 0.7);
        glowGraphics.strokeRoundedRect(-cardWidth / 2, -height / 2, cardWidth, height, borderRadius);
      }
    };

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

    if (isExpandable) {
      progressContainer = scene.add.container(0, 0);
      progressContainer.setAlpha(0); // Start hidden - FIXED from -10
      container.add(progressContainer);

      // TIGHTER SPACING - progress bar closer to title
      const progressY = scale(-5);

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
      const bottomY = progressY + scale(35);

      // Lesson count (video icon) - REPLACED EMOJI WITH SVG
      const videoIcon = scene.add.image(-cardWidth / 2 + scale(60), bottomY, 'videoProgressIcon');
      videoIcon.setDisplaySize(scale(24), scale(24));
      videoIcon.setOrigin(0.5);
      progressContainer.add(videoIcon);

      const lessonCount = scene.add.text(-cardWidth / 2 + scale(90), bottomY, `${data.lessonCount || 0}`,
        createTextStyle('BODY_BOLD', '#5B7FDB', { fontSize: scaleFontSize(16) })
      ).setOrigin(0, 0.5);
      progressContainer.add(lessonCount);

      // Quiz count (document icon) - REPLACED EMOJI WITH SVG
      const documentIcon = scene.add.image(-cardWidth / 2 + scale(140), bottomY, 'documentProgressIcon');
      documentIcon.setDisplaySize(scale(24), scale(24));
      documentIcon.setOrigin(0.5);
      progressContainer.add(documentIcon);

      const quizCount = scene.add.text(-cardWidth / 2 + scale(170), bottomY, `${data.quizCount || 0}`,
        createTextStyle('BODY_BOLD', '#5B7FDB', { fontSize: scaleFontSize(16) })
      ).setOrigin(0, 0.5);
      progressContainer.add(quizCount);

      // Circular progress bar with tree icon - NEW
      const circleX = -cardWidth / 2 + scale(220);
      const circleRadius = scale(16);
      
      // Draw circular progress background (gray circle)
      const progressCircleBg = scene.add.graphics();
      progressCircleBg.lineStyle(scale(3), 0xD1D5DB, 1);
      progressCircleBg.strokeCircle(circleX, bottomY, circleRadius);
      progressContainer.add(progressCircleBg);
      
      // Draw circular progress fill (green arc based on progress)
      const progressPercentForCircle = data.progressPercent || 0;
      const progressCircleFill = scene.add.graphics();
      progressCircleFill.lineStyle(scale(3), 0x10B981, 1); // Green color
      
      // Draw arc from top (270 degrees) clockwise
      const startAngle = Phaser.Math.DegToRad(270);
      const endAngle = Phaser.Math.DegToRad(270 + (360 * progressPercentForCircle / 100));
      
      if (progressPercentForCircle > 0) {
        progressCircleFill.beginPath();
        progressCircleFill.arc(circleX, bottomY, circleRadius, startAngle, endAngle, false);
        progressCircleFill.strokePath();
      }
      progressContainer.add(progressCircleFill);
      
      // Tree emoji in center
      const treeIcon = scene.add.text(circleX, bottomY, '🌳',
        { fontSize: scaleFontSize(18) }
      ).setOrigin(0.5);
      progressContainer.add(treeIcon);

      // Continue button
      const buttonWidth = scale(120);
      const buttonHeight = scale(36);
      const buttonX = cardWidth / 2 - scale(20) - buttonWidth / 2;

      const continueButton = scene.add.graphics();
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

      // HOVER ZONE FOR ENTIRE CARD - THIS MUST BE LAST AND ON TOP
      const hoverZone = scene.add.zone(0, 0, cardWidth, expandedHeight);
      hoverZone.setOrigin(0.5, 0.5);
      hoverZone.setInteractive({ useHandCursor: true });
      
      // Click handler - clicking anywhere on card triggers navigation
      if (onContinueClick) {
        hoverZone.on('pointerdown', () => {
          console.log('Card clicked - navigating');
          onContinueClick();
        });
      }
      
      hoverZone.on('pointerover', () => {
        console.log('Card hover - expanding'); // Debug log
        
        // Update zone size for expanded state
        hoverZone.setSize(cardWidth, expandedHeight);
        
        // Kill any existing tweens
        scene.tweens.killTweensOf([{ height: collapsedHeight }, { height: expandedHeight }, { glowAlpha: 0 }, { glowAlpha: 1 }]);
        
        // Expand animation
        scene.tweens.add({
          targets: { height: collapsedHeight },
          height: expandedHeight,
          duration: 200,
          ease: 'Power2',
          onUpdate: (tween) => {
            const height = tween.getValue();
            if (height !== null) {
              drawCard(height, true); // Pass true for hovered state - blue bar disappears
              title.setY(-height / 2 + scale(20));
              duration.setY(-height / 2 + scale(20));
            }
          }
        });

        // Fade in blue glow with FULL opacity for prominence
        scene.tweens.add({
          targets: { glowAlpha: 0 },
          glowAlpha: 1,
          duration: 200,
          ease: 'Power2',
          onUpdate: (tween) => {
            const alpha = tween.getValue();
            if (alpha !== null) {
              drawGlow(expandedHeight, alpha);
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
      });
      
      hoverZone.on('pointerout', () => {
        console.log('Card hover - collapsing'); // Debug log
        
        // Update zone size back to collapsed state
        hoverZone.setSize(cardWidth, collapsedHeight);
        
        // Kill any existing tweens
        scene.tweens.killTweensOf([{ height: collapsedHeight }, { height: expandedHeight }, { glowAlpha: 0 }, { glowAlpha: 1 }]);
        
        // Collapse animation
        scene.tweens.add({
          targets: { height: expandedHeight },
          height: collapsedHeight,
          duration: 200,
          ease: 'Power2',
          onUpdate: (tween) => {
            const height = tween.getValue();
            if (height !== null) {
              drawCard(height, false); // Pass false for normal state - blue bar returns
              title.setY(-height / 2 + scale(20));
              duration.setY(-height / 2 + scale(20));
            }
          }
        });

        // Fade out blue glow
        scene.tweens.add({
          targets: { glowAlpha: 1 },
          glowAlpha: 0,
          duration: 200,
          ease: 'Power2',
          onUpdate: (tween) => {
            const alpha = tween.getValue();
            if (alpha !== null) {
              drawGlow(collapsedHeight, alpha);
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

      // Add zone LAST so it's on top
      container.add(hoverZone);
    }

    return container;
  }
}