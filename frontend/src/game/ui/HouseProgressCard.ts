/* eslint-disable no-useless-assignment */
import Phaser from 'phaser';
import { scale, scaleFontSize } from '../utils/scaleHelper';
import { COLORS } from '../constants/Colors';
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
  status?: 'start' | 'continue' | 'locked';
  completedLessons?: number;
  treeGrowthPoints?: number;
  treeCurrentStage?: number;
  treeTotalStages?: number;
  treeCompleted?: boolean;
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
    
    // Helper function to create a rounded rectangle with horizontal gradient using render texture
    const createGradientRoundedRect = (
      width: number,
      height: number,
      radius: number,
      colorStart: string,
      colorEnd: string,
      key: string,
      roundedCorners: 'all' | 'bottom' = 'all'
    ): Phaser.GameObjects.Image => {
      // Create a canvas with the gradient
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(width);
      canvas.height = Math.ceil(height);
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Create horizontal gradient
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, colorStart);
        gradient.addColorStop(1, colorEnd);
        
        // Draw rounded rectangle with gradient
        ctx.fillStyle = gradient;
        ctx.beginPath();
        
        if (roundedCorners === 'bottom') {
          // Only bottom corners rounded (for accent bar)
          ctx.moveTo(0, 0); // Top-left (square)
          ctx.lineTo(canvas.width, 0); // Top-right (square)
          ctx.lineTo(canvas.width, canvas.height - radius); // Right side
          ctx.quadraticCurveTo(canvas.width, canvas.height, canvas.width - radius, canvas.height); // Bottom-right
          ctx.lineTo(radius, canvas.height); // Bottom side
          ctx.quadraticCurveTo(0, canvas.height, 0, canvas.height - radius); // Bottom-left
          ctx.closePath();
        } else {
          // All corners rounded (for progress bar)
          ctx.moveTo(radius, 0);
          ctx.lineTo(canvas.width - radius, 0);
          ctx.quadraticCurveTo(canvas.width, 0, canvas.width, radius);
          ctx.lineTo(canvas.width, canvas.height - radius);
          ctx.quadraticCurveTo(canvas.width, canvas.height, canvas.width - radius, canvas.height);
          ctx.lineTo(radius, canvas.height);
          ctx.quadraticCurveTo(0, canvas.height, 0, canvas.height - radius);
          ctx.lineTo(0, radius);
          ctx.quadraticCurveTo(0, 0, radius, 0);
          ctx.closePath();
        }
        
        ctx.fill();
      }
      
      // Add texture to Phaser
      if (!scene.textures.exists(key)) {
        scene.textures.addCanvas(key, canvas);
      }
      
      // Create and return image
      const image = scene.add.image(0, 0, key);
      image.setDisplaySize(width, height);
      return image;
    };

    const drawCard = (height: number, isHovered: boolean = false) => {
      cardBg.clear();
      // Use slightly different color or alpha when hovered
      const bgColor = isHovered ? COLORS.TEXT_WHITE : COLORS.TEXT_WHITE;
      cardBg.fillStyle(bgColor, 1);
      cardBg.fillRoundedRect(-cardWidth / 2, -height / 2, cardWidth, height, borderRadius);
    };
    
    drawCard(initialHeight, false);
    container.add(cardBg);

    // Create gradient bar for bottom accent with rounded corners ONLY on bottom
    const shadowHeight = scale(15);
    const gradientBarKey = `gradient-bar-${Date.now()}-${Math.random()}`;
    
    const gradientBar = createGradientRoundedRect(
      cardWidth,
      shadowHeight,
      borderRadius,
      '#1D3CC6', // LinearBlue1 start
      '#837CFF', // LinearBlue1 end
      gradientBarKey,
      'bottom' // Only round bottom corners
    );
    
    gradientBar.setPosition(0, initialHeight / 2 - shadowHeight / 2);
    gradientBar.setOrigin(0.5, 0.5);
    container.add(gradientBar);

    // Function to draw the glow
    const drawGlow = (height: number, alpha: number = 0) => {
      glowGraphics.clear();
      if (alpha > 0) {
        // Outer glow layer - Using LogoBlue
        glowGraphics.lineStyle(scale(12), COLORS.LOGO_BLUE, alpha * 0.15);
        glowGraphics.strokeRoundedRect(
          -cardWidth / 2 - scale(6), 
          -height / 2 - scale(6), 
          cardWidth + scale(12), 
          height + scale(12), 
          borderRadius + scale(3)
        );
        
        // Middle glow layer
        glowGraphics.lineStyle(scale(8), COLORS.LOGO_BLUE, alpha * 0.3);
        glowGraphics.strokeRoundedRect(
          -cardWidth / 2 - scale(4), 
          -height / 2 - scale(4), 
          cardWidth + scale(8), 
          height + scale(8), 
          borderRadius + scale(2)
        );
        
        // Inner bright border
        glowGraphics.lineStyle(scale(4), COLORS.LOGO_BLUE, alpha * 0.7);
        glowGraphics.strokeRoundedRect(-cardWidth / 2, -height / 2, cardWidth, height, borderRadius);
      }
    };

    // Module number and title (top section) - always visible
    const titleY = -initialHeight / 2 + scale(20);
    const titleText = `${data.moduleNumber}. ${data.moduleName}`;
    const title = scene.add.text(-cardWidth / 2 + scale(20), titleY, titleText,
      createTextStyle('BODY_BOLD', COLORS.TEXT_PRIMARY, {
        fontSize: scaleFontSize(16),
      })
    ).setOrigin(0, 0.5);
    container.add(title);

    const duration = scene.add.text(cardWidth / 2 - scale(20), titleY, data.duration,
      createTextStyle('BODY_LIGHT', '#1D3CC6', { // LinearBlue1 start color
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

      const progressY = scale(-5);

      // Progress bar background
      const progressBarWidth = cardWidth - scale(40);
      const progressBarHeight = scale(8);
      const progressBg = scene.add.graphics();
      progressBg.fillStyle(COLORS.UNAVAILABLE_BUTTON, 1); // UnavailableButton - Light gray
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
      
      // Progress bar fill
      // ONLY SHOW IF THERE ARE COMPLETED LESSONS
      let progressFillWidth = 0;
      if (totalLessons > 0 && completedLessons > 0) {
        // Calculate progress based on lessons completed (not percentage)
        const lessonProgress = completedLessons / totalLessons;
        progressFillWidth = progressBarWidth * lessonProgress;
        
        // Create rounded gradient progress bar with all corners rounded
        const progressGradientKey = `progress-gradient-${Date.now()}-${Math.random()}`;
        const progressFillImage = createGradientRoundedRect(
          progressFillWidth,
          progressBarHeight,
          progressBarHeight / 2, // Fully rounded ends
          '#1D3CC6', // LinearBlue1 start
          '#837CFF', // LinearBlue1 end
          progressGradientKey,
          'all' // All corners rounded (pill shape)
        );
        
        progressFillImage.setPosition(
          -progressBarWidth / 2 + progressFillWidth / 2,
          progressY
        );
        progressFillImage.setOrigin(0.5, 0.5);
        
        progressContainer.add(progressFillImage);
      }

      // Star icons on progress bar - ONLY RENDER FOR COMPLETED LESSONS
      // Stars positioned at the END of each lesson segment
      if (totalLessons > 0 && completedLessons > 0 && scene.textures.exists('progressStarIcon')) {
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

      // Lesson count (video icon) - grouped closer with count
      // OPT-02: Check texture exists (Tier 2 may still be loading)
      if (scene.textures.exists('videoProgressIcon')) {
        const videoIcon = scene.add.image(-cardWidth / 2 + scale(40), bottomY, 'videoProgressIcon');
        videoIcon.setDisplaySize(scale(24), scale(24));
        videoIcon.setOrigin(0.5);
        progressContainer.add(videoIcon);
      }

      const lessonCount = scene.add.text(-cardWidth / 2 + scale(60), bottomY, `${data.lessonCount || 0}`,
        createTextStyle('BODY_BOLD', COLORS.TEXT_PRIMARY, { fontSize: scaleFontSize(16) })
      ).setOrigin(0, 0.5);
      progressContainer.add(lessonCount);

      // Quiz count (document icon) - grouped closer with count, more separation from videos
      // OPT-02: Check texture exists (Tier 2 may still be loading)
      if (scene.textures.exists('documentProgressIcon')) {
        const documentIcon = scene.add.image(-cardWidth / 2 + scale(140), bottomY, 'documentProgressIcon');
        documentIcon.setDisplaySize(scale(24), scale(24));
        documentIcon.setOrigin(0.5);
        progressContainer.add(documentIcon);
      }

      const quizCount = scene.add.text(-cardWidth / 2 + scale(160), bottomY, `${data.quizCount || 0}`,
        createTextStyle('BODY_BOLD', COLORS.TEXT_PRIMARY, { fontSize: scaleFontSize(16) })
      ).setOrigin(0, 0.5);
      progressContainer.add(quizCount);

      // Tree icon
      const circleX = -cardWidth / 2 + scale(200);
      const circleRadius = scale(16);
            
      // Draw circular progress background (gray circle)
      const progressCircleBg = scene.add.graphics();
      progressCircleBg.lineStyle(scale(3), COLORS.UNAVAILABLE_BUTTON, 1); // UnavailableButton - Light gray
      progressCircleBg.strokeCircle(circleX, bottomY, circleRadius);
      progressContainer.add(progressCircleBg);
      
      // Draw circular progress fill (green arc based on completed lessons)
      const treeGrowthPoints = data.treeGrowthPoints ?? 0;
      const treeCurrentStage = data.treeCurrentStage ?? 0;
      const treeTotalStages = data.treeTotalStages ?? 5;
      const treeCompleted = data.treeCompleted ?? false;
      const pointsPerStage = 50;
      const treeTotalPoints = treeTotalStages * pointsPerStage;

      let treeProgressPercent = 0;
      if (treeCompleted) {
        treeProgressPercent = 100;
      } else if (treeTotalPoints > 0) {
        treeProgressPercent = (treeGrowthPoints / treeTotalPoints) * 100;
      }

      const progressCircleFill = scene.add.graphics();
      progressCircleFill.lineStyle(scale(3), COLORS.STATUS_GREEN, 1);

      const startAngle = Phaser.Math.DegToRad(270);
      const endAngle = Phaser.Math.DegToRad(270 + (360 * treeProgressPercent / 100));

      if (treeProgressPercent > 0) {
        progressCircleFill.beginPath();
        progressCircleFill.arc(circleX, bottomY, circleRadius, startAngle, endAngle, false);
        progressCircleFill.strokePath();
      }
      progressContainer.add(progressCircleFill);

      // Use actual tree stage from backend (1-indexed for display, clamped to 1-5)
      let treeStage = treeCurrentStage + 1;
      if (treeStage > 5) treeStage = 5;
      if (treeStage < 1) treeStage = 1;

      // Display the tree stage image
      const treeKey = `tree_stage_${treeStage}`;
      if (scene.textures.exists(treeKey)) {
        const treeIcon = scene.add.image(circleX, bottomY, treeKey);
        const targetSize = scale(28);
        const treeScale = targetSize / Math.max(treeIcon.width, treeIcon.height);
        treeIcon.setScale(treeScale);
        treeIcon.setOrigin(0.5);
        progressContainer.add(treeIcon);
      }

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
      continueButton.fillStyle(COLORS.ELEGANT_BLUE, 1);
      continueButton.fillRoundedRect(
        buttonX - buttonWidth / 2,
        bottomY - buttonHeight / 2,
        buttonWidth,
        buttonHeight,
        buttonHeight / 2
      );
      progressContainer.add(continueButton);

      const continueText = scene.add.text(buttonX, bottomY, buttonText,
        createTextStyle('BUTTON', COLORS.TEXT_WHITE_HEX, { fontSize: scaleFontSize(14) }) // White text on ElegantBlue button
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
          if (birdSprite && bird.getHasFadedIn()) {  // Only kill tweens if fade-in is complete
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
              gradientBar.setY(height / 2 - shadowHeight / 2);
            }
          }
        });

        // Fade out gradient bar when expanding (hiding the bottom accent)
        scene.tweens.add({
          targets: gradientBar,
          alpha: 0,
          duration: 200,
          ease: 'Power2'
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
                gradientBar.setY(height / 2 - shadowHeight / 2);
              }
            }
          });

          // Fade in gradient bar when collapsing (showing the bottom accent)
          scene.tweens.add({
            targets: gradientBar,
            alpha: 1,
            duration: 200,
            ease: 'Power2'
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