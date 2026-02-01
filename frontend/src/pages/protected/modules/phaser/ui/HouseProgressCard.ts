import Phaser from 'phaser';
import { scale, scaleFontSize } from '../../../../../utils/scaleHelper';
import { createTextStyle } from '../constants/Typography';
import { BirdCharacter } from '../characters/BirdCharacter';

export interface HouseProgressData {
  moduleNumber: number;
  moduleName: string;
  duration: string;
  hasProgress: boolean;
  progressPercent?: number; // 0-100
  lessonCount?: number;
  quizCount?: number;
  coinReward?: number;
  isLocked?: boolean;
  status?: 'start' | 'continue' | 'locked'; // Button text status
  completedLessons?: number; // Number of completed lessons
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
    onContinueClick?: () => void,
    bird?: BirdCharacter,
    houseImage?: Phaser.GameObjects.Image,
    isInteractionBlocked?: () => boolean
  ): Phaser.GameObjects.Container {
    console.log('🐦 Creating progress card with bird:', bird ? 'YES' : 'NO');
    if (bird) {
      console.log('🐦 Bird sprite:', bird.getSprite() ? 'EXISTS' : 'MISSING');
    }
    const container = scene.add.container(x, y);

    // Card dimensions
    const cardWidth = scale(380);
    const collapsedHeight = scale(60);
    const expandedHeight = scale(110);
    const borderRadius = scale(16);

    // Store original bird position for returning
    let originalBirdY: number | undefined;

    // Determine initial state
    const isExpandable = data.isLocked !== true;
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
      progressContainer.setAlpha(0); // Start hidden
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

      // Calculate progress based on completed lessons
      const completedLessons = data.completedLessons || 0;
      const totalLessons = data.lessonCount || 0;
      
      // Progress bar fill - ONLY SHOW IF THERE ARE COMPLETED LESSONS
      let progressFillWidth = 0;
      if (totalLessons > 0 && completedLessons > 0) {
        // Calculate progress based on lessons completed (not percentage)
        const lessonProgress = completedLessons / totalLessons;
        progressFillWidth = progressBarWidth * lessonProgress;
        
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
      }

      // Star icons on progress bar - ONLY RENDER FOR COMPLETED LESSONS
      // Stars positioned at the END of each lesson segment
      if (totalLessons > 0 && completedLessons > 0) {
        // Calculate spacing for stars along the progress bar
        const starSpacing = progressBarWidth / totalLessons;
        
        // Render stars for each completed lesson at the END of each segment
        for (let i = 0; i < completedLessons; i++) {
          // Position star at the end of each lesson segment
          const starX = -progressBarWidth / 2 + (starSpacing * (i + 1));
          const starIcon = scene.add.image(starX, progressY, 'progressStarIcon');
          starIcon.setDisplaySize(scale(20), scale(20));
          starIcon.setOrigin(0.5);
          progressContainer.add(starIcon);
        }
      }

      // Bottom section with icons and button
      const bottomY = progressY + scale(35);

      // Move all icons MORE TO THE LEFT (changed from 60 to 40)
      // Lesson count (video icon)
      const videoIcon = scene.add.image(-cardWidth / 2 + scale(40), bottomY, 'videoProgressIcon');
      videoIcon.setDisplaySize(scale(24), scale(24));
      videoIcon.setOrigin(0.5);
      progressContainer.add(videoIcon);

      const lessonCount = scene.add.text(-cardWidth / 2 + scale(70), bottomY, `${data.lessonCount || 0}`,
        createTextStyle('BODY_BOLD', '#5B7FDB', { fontSize: scaleFontSize(16) })
      ).setOrigin(0, 0.5);
      progressContainer.add(lessonCount);

      // Quiz count (document icon) - keep relative spacing
      const documentIcon = scene.add.image(-cardWidth / 2 + scale(120), bottomY, 'documentProgressIcon');
      documentIcon.setDisplaySize(scale(24), scale(24));
      documentIcon.setOrigin(0.5);
      progressContainer.add(documentIcon);

      const quizCount = scene.add.text(-cardWidth / 2 + scale(150), bottomY, `${data.quizCount || 0}`,
        createTextStyle('BODY_BOLD', '#5B7FDB', { fontSize: scaleFontSize(16) })
      ).setOrigin(0, 0.5);
      progressContainer.add(quizCount);

      // Tree icon
      const circleX = -cardWidth / 2 + scale(200);
      const circleRadius = scale(16);
            
      // Draw circular progress background (gray circle)
      const progressCircleBg = scene.add.graphics();
      progressCircleBg.lineStyle(scale(3), 0xD1D5DB, 1);
      progressCircleBg.strokeCircle(circleX, bottomY, circleRadius);
      progressContainer.add(progressCircleBg);
      
      // Draw circular progress fill (green arc based on completed lessons)
      let progressPercentForCircle = 0;
      if (totalLessons > 0 && completedLessons > 0) {
        progressPercentForCircle = (completedLessons / totalLessons) * 100;
      }
      
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

      // Map progress percentage to tree stages (1-7)
      let treeStage: number;
      if (progressPercentForCircle === 0) {
        treeStage = 1;
      } else if (progressPercentForCircle === 100) {
        treeStage = 7; // Final stage when complete
      } else {
        // Stages 2-6 for progress in between
        treeStage = Math.floor((progressPercentForCircle / 100) * 5) + 2;
        treeStage = Math.min(treeStage, 6); // Cap at stage 6 until 100%
      }

      // Display the tree stage image (these are loaded in PreloaderScene as 'tree_stage_1' through 'tree_stage_7')
      const treeIcon = scene.add.image(circleX, bottomY, `tree_stage_${treeStage}`);

      // Scale the tree to fit in the circular progress indicator
      // The circle has radius of scale(16), so tree should fit within ~scale(28) diameter
      const targetSize = scale(28);
      const treeScale = targetSize / Math.max(treeIcon.width, treeIcon.height);
      treeIcon.setScale(treeScale);
      treeIcon.setOrigin(0.5);

      progressContainer.add(treeIcon);

      // Determine button text based on status
      const getButtonText = (): string => {
        if (data.isLocked) return 'LOCKED';
        if (!data.status) {
          // Fallback to old logic if status not provided
          return data.hasProgress ? 'CONTINUE' : 'START';
        }
        switch (data.status) {
          case 'continue':
            return 'CONTINUE';
          case 'start':
            return 'START';
          case 'locked':
            return 'LOCKED';
          default:
            return 'START';
        }
      };

      const buttonText = getButtonText();

      // Continue/Start button
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

      const continueText = scene.add.text(buttonX, bottomY, buttonText,
        createTextStyle('BUTTON', '#FFFFFF', { fontSize: scaleFontSize(14) })
      ).setOrigin(0.5);
      progressContainer.add(continueText);

      // HOVER ZONE FOR ENTIRE CARD - THIS MUST BE LAST AND ON TOP
      const hoverZone = scene.add.zone(0, 0, cardWidth, collapsedHeight);
      hoverZone.setOrigin(0.5, 0.5);
      hoverZone.setInteractive({ useHandCursor: true });
      
      // Shared debounce timer to prevent flickering between house and card
      let collapseDebounce: Phaser.Time.TimerEvent | null = null;
      let isExpanded = false;
      
      // SHARED EXPAND FUNCTION - used by both card and house
      const expand = () => {
        // Block hover expansion if interactions are blocked (e.g., bird is traveling)
        if (isInteractionBlocked && isInteractionBlocked()) {
          return;
        }
        
        // Cancel any pending collapse
        if (collapseDebounce) {
          collapseDebounce.remove();
          collapseDebounce = null;
        }
        
        // Prevent duplicate expansion
        if (isExpanded) return;
        isExpanded = true;
              
        console.log('Expanding card');
        
        // Update zone size for expanded state
        hoverZone.setSize(cardWidth, expandedHeight);
        
        // Kill any existing tweens on bird
        if (bird) {
          const birdSprite = bird.getSprite();
          if (birdSprite) {
            scene.tweens.killTweensOf(birdSprite);
            
            // Store original bird Y position if not already stored
            if (originalBirdY === undefined) {
              originalBirdY = birdSprite.y;
            }
          }
        }
        
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
              drawCard(height, true);
              title.setY(-height / 2 + scale(20));
              duration.setY(-height / 2 + scale(20));
            }
          }
        });

        // Fade in blue glow
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

        // Bird hop up
        if (bird && bird.getSprite() && originalBirdY !== undefined) {
          const birdSprite = bird.getSprite();
          if (birdSprite) {
            const targetBirdY = y + scale(-30);
            
            scene.tweens.add({
              targets: birdSprite,
              y: targetBirdY,
              duration: 300,
              ease: 'Quad.easeOut',
              onStart: () => {
                scene.tweens.add({
                  targets: birdSprite,
                  angle: -8,
                  duration: 150,
                  ease: 'Sine.easeOut',
                  yoyo: false,
                  onComplete: () => {
                    scene.tweens.add({
                      targets: birdSprite,
                      angle: 0,
                      duration: 150,
                      ease: 'Sine.easeIn'
                    });
                  }
                });
              }
            });
          }
        }
      };
      
      // SHARED COLLAPSE FUNCTION - used by both card and house
      const scheduleCollapse = () => {
        // Block hover collapse if interactions are blocked (e.g., bird is traveling)
        if (isInteractionBlocked && isInteractionBlocked()) {
          return;
        }
        
        console.log('Scheduling collapse');
        
        // Clear existing timer
        if (collapseDebounce) {
          collapseDebounce.remove();
        }
        
        // Delay collapse to allow seamless transition between house and card
        collapseDebounce = scene.time.delayedCall(100, () => {
          isExpanded = false;
          console.log('Collapsing card');
          
          // Update zone size back to collapsed state
          hoverZone.setSize(cardWidth, collapsedHeight);
          
          // Kill any existing tweens on bird
          if (bird) {
            const birdSprite = bird.getSprite();
            if (birdSprite) {
              scene.tweens.killTweensOf(birdSprite);
            }
          }
          
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
                drawCard(height, false);
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

          // Bird hop down
          if (bird && bird.getSprite() && originalBirdY !== undefined) {
            const birdSprite = bird.getSprite();
            if (birdSprite) {
              scene.tweens.add({
                targets: birdSprite,
                y: originalBirdY,
                duration: 300,
                ease: 'Quad.easeIn',
                onStart: () => {
                  scene.tweens.add({
                    targets: birdSprite,
                    angle: 8,
                    duration: 150,
                    ease: 'Sine.easeOut',
                    yoyo: false,
                    onComplete: () => {
                      scene.tweens.add({
                        targets: birdSprite,
                        angle: 0,
                        duration: 150,
                        ease: 'Sine.easeIn'
                      });
                    }
                  });
                }
              });
            }
          }
          
          collapseDebounce = null;
        });
      };
      
      // CARD ZONE HANDLERS
      hoverZone.on('pointerover', expand);
      hoverZone.on('pointerout', scheduleCollapse);
      
      // Click handler for card
      if (onContinueClick) {
        hoverZone.on('pointerdown', () => {
          console.log('Card clicked - navigating');
          onContinueClick();
        });
      }
      
      // HOUSE IMAGE HANDLERS (if house image provided)
      if (houseImage) {
      // Enable pixel-perfect interaction - only respond to non-transparent pixels
      houseImage.setInteractive({ 
        pixelPerfect: true,
        alphaTolerance: 1,
        useHandCursor: true 
      });
      
      houseImage.on('pointerover', expand);
      houseImage.on('pointerout', scheduleCollapse);
      
      // Click handler for house
      if (onContinueClick) {
        houseImage.on('pointerdown', () => {
          console.log('House image clicked - navigating');
          onContinueClick();
        });
      }
    }

      // Add zone LAST so it's on top
      container.add(hoverZone);
    }

    return container;
  }
}