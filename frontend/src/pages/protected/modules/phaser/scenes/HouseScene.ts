import Phaser from 'phaser';
import { scale, scaleFontSize } from '../../../../../utils/scaleHelper';

interface Lesson {
  id: number;
  title: string;
  type: string;
  completed: boolean;
  locked: boolean;
}

interface Module {
  id: number;
  title: string;
  lessons: Lesson[];
}

interface HouseSceneData {
  houseId?: string;
  moduleId?: number;
}

interface BirdTravelInfo {
  previousHouseIndex: number;
  currentHouseIndex: number;
  traveled: boolean;
}

// Sample module data - this should match your actual module structure
const SAMPLE_MODULE: Module = {
  id: 1,
  title: 'Homebuying Foundations',
  lessons: [
    {
      id: 101,
      title: 'Renting vs Buying',
      type: 'Video/Reading',
      completed: false,
      locked: false,
    },
    {
      id: 102,
      title: 'Preparing Your Documents',
      type: 'Video/Reading',
      completed: true,
      locked: false,
    },
    {
      id: 103,
      title: 'Financial Basics',
      type: 'Video/Reading',
      completed: true,
      locked: false,
    },
    {
      id: 104,
      title: 'Setting a Timeline',
      type: 'Video/Reading',
      completed: false,
      locked: true,
    },
  ],
};

export default class HouseScene extends Phaser.Scene {
  private module: Module = SAMPLE_MODULE;
  private isTransitioning: boolean = false;
  private backButton?: Phaser.GameObjects.Container;
  private minigameButton?: Phaser.GameObjects.Container;
  private headerCard?: Phaser.GameObjects.Container;
  private lessonContainers: Phaser.GameObjects.Container[] = [];
  private background?: Phaser.GameObjects.Image;
  private leftHouse?: Phaser.GameObjects.Image;
  private rightHouse?: Phaser.GameObjects.Image;
  private birdSprite?: Phaser.GameObjects.Image;
  private birdIdleTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: 'HouseScene' });
  }

  init(_data: HouseSceneData) {
    this.isTransitioning = false;
    this.lessonContainers = [];
    
    // Clear any existing bird idle timer
    if (this.birdIdleTimer) {
      this.birdIdleTimer.remove();
      this.birdIdleTimer = undefined;
    }
  }

  create() {
    const { width, height } = this.scale;

    // Create house cutouts - Depth 1 (in front of background, behind lesson cards)
    // Left house cutout - positioned on the left side
    this.leftHouse = this.add.image(width * 0.25, height / 2, 'leftCutHouse');
    this.leftHouse.setDepth(1);
    this.leftHouse.setScale(2);
    
    // Right house cutout - positioned on the right side
    this.rightHouse = this.add.image(width * 0.76, height / 2, 'rightCutHouse');
    this.rightHouse.setDepth(1);
    this.rightHouse.setScale(2);

    // Fade in camera
    this.cameras.main.fadeIn(300, 254, 243, 199);

    // Create back button - Depth 10
    this.createBackButton();

    // Create minigame button - Depth 10
    this.createMinigameButton();

    // Create header card - Depth 10
    this.createHeaderCard();

    // Create lesson grid - Depth 10
    this.createLessonGrid();

    // Create bird with entrance animation based on travel info
    this.createBirdWithEntrance();

    // Handle window resize
    this.scale.on('resize', this.handleResize, this);
  }

  private createBirdWithEntrance() {
    const { width, height } = this.scale;
    
    // Get travel info from registry
    const travelInfo: BirdTravelInfo | undefined = this.registry.get('birdTravelInfo');
    const returningFromLesson = this.registry.get('returningFromLesson');
    
    // Default position (center bottom of screen)
    const finalX = width / 2;
    const finalY = height * 0.85;
    
    if (!travelInfo || !travelInfo.traveled || returningFromLesson) {
      // Bird was already at this house OR returning from lesson - no entrance animation, just place it
      this.birdSprite = this.add.image(finalX, finalY, 'bird_idle');
      this.birdSprite.setDisplaySize(scale(80), scale(80));
      this.birdSprite.setDepth(1000);
      this.startBirdIdleAnimation();
      
      // Clear the returning flag
      this.registry.set('returningFromLesson', false);
      return;
    }
    
    // Determine animation type based on travel distance
    const previousIndex = travelInfo.previousHouseIndex;
    const currentIndex = travelInfo.currentHouseIndex;
    const distance = Math.abs(currentIndex - previousIndex);
    const comingFromLeft = currentIndex > previousIndex;
    
    if (distance > 1) {
      this.createFlyingEntrance(finalX, finalY, comingFromLeft);
    } else {
      this.createHoppingEntrance(finalX, finalY, comingFromLeft);
    }
  }

  private createFlyingEntrance(finalX: number, finalY: number, fromLeft: boolean) {
    const { width, height } = this.scale;
    
    // Start position (off-screen)
    const startX = fromLeft ? -scale(100) : width + scale(100);
    const startY = height * 0.5; // Mid height
    
    // Create bird in flying texture
    this.birdSprite = this.add.image(startX, startY, 'bird_fly');
    const flyTexture = this.textures.get('bird_fly');
    const flyWidth = flyTexture.getSourceImage().width;
    const flyHeight = flyTexture.getSourceImage().height;
    const flyAspectRatio = flyWidth / flyHeight;
    this.birdSprite.setDisplaySize(scale(100) * flyAspectRatio, scale(100));
    this.birdSprite.setDepth(1000);
    
    // Flip sprite based on direction
    this.birdSprite.setFlipX(!fromLeft); // Flip if coming from right
    
    // Fly animation
    this.tweens.add({
      targets: this.birdSprite,
      x: finalX,
      y: finalY,
      duration: 1500,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        // Change to idle texture
        this.birdSprite!.setTexture('bird_idle');
        this.birdSprite!.setDisplaySize(scale(80), scale(80));
        this.birdSprite!.setFlipX(false); // Reset flip
        
        // Start idle animation
        this.startBirdIdleAnimation();
      }
    });
  }

  private createHoppingEntrance(finalX: number, finalY: number, fromLeft: boolean) {
    const { width } = this.scale;
    
    // Start position (off-screen on the appropriate side)
    const startX = fromLeft ? -scale(100) : width + scale(100);
    const startY = finalY; // Same Y level
    
    // Create bird in idle texture
    this.birdSprite = this.add.image(startX, startY, 'bird_idle');
    this.birdSprite.setDisplaySize(scale(80), scale(80));
    this.birdSprite.setDepth(1000);
    
    // Flip sprite based on direction
    this.birdSprite.setFlipX(!fromLeft); // Flip if coming from right
    
    // Calculate hop path
    const distance = Math.abs(finalX - startX);
    const numHops = Math.max(5, Math.floor(distance / scale(80)));
    const hopHeight = scale(10);
    const hopDuration = 200;
    
    const path: { x: number; y: number }[] = [];
    for (let i = 0; i <= numHops; i++) {
      const t = i / numHops;
      const x = Phaser.Math.Linear(startX, finalX, t);
      const y = finalY;
      path.push({ x, y });
    }
    
    let currentHop = 0;
    
    const performNextHop = () => {
      if (currentHop >= path.length - 1) {
        // Hopping complete
        this.birdSprite!.setFlipX(false); // Reset flip
        this.startBirdIdleAnimation();
        return;
      }
      
      const startPoint = path[currentHop];
      const endPoint = path[currentHop + 1];
      const midX = (startPoint.x + endPoint.x) / 2;
      const midY = (startPoint.y + endPoint.y) / 2 - hopHeight;
      
      this.tweens.add({
        targets: this.birdSprite,
        x: midX,
        y: midY,
        duration: hopDuration / 2,
        ease: 'Sine.easeOut',
        onStart: () => {
          this.tweens.add({
            targets: this.birdSprite,
            angle: currentHop % 2 === 0 ? -5 : 5,
            duration: hopDuration / 2,
            ease: 'Sine.easeInOut',
            yoyo: true
          });
        },
        onComplete: () => {
          this.tweens.add({
            targets: this.birdSprite,
            x: endPoint.x,
            y: endPoint.y,
            duration: hopDuration / 2,
            ease: 'Sine.easeIn',
            onComplete: () => {
              currentHop++;
              performNextHop();
            }
          });
        }
      });
    };
    
    performNextHop();
  }

  private startBirdIdleAnimation() {
    if (!this.birdSprite) return;
    
    const scheduleNextIdleHop = () => {
      const randomDelay = Phaser.Math.Between(5000, 8000);
      
      this.birdIdleTimer = this.time.delayedCall(randomDelay, () => {
        if (this.birdSprite && !this.isTransitioning) {
          this.playBirdIdleHop();
        }
        scheduleNextIdleHop();
      });
    };
    
    scheduleNextIdleHop();
  }

  private playBirdIdleHop() {
    if (!this.birdSprite || this.isTransitioning) return;
    
    const originalY = this.birdSprite.y;
    const originalX = this.birdSprite.x;
    
    // Small random movement
    const moveX = Phaser.Math.Between(-scale(10), scale(10));
    const targetX = Phaser.Math.Clamp(
      originalX + moveX,
      scale(100),
      this.scale.width - scale(100)
    );
    
    // Only flip if there's significant horizontal movement
    if (Math.abs(moveX) > scale(5)) {
      if (moveX < 0) {
        this.birdSprite.setFlipX(true);
      } else {
        this.birdSprite.setFlipX(false);
      }
    }
    
    const hopHeight = scale(3);
    const duration = 300;
    
    this.tweens.add({
      targets: this.birdSprite,
      x: targetX,
      y: originalY - hopHeight,
      duration: duration,
      ease: 'Sine.easeOut',
      yoyo: true,
      onStart: () => {
        this.tweens.add({
          targets: this.birdSprite,
          angle: -3,
          duration: duration / 2,
          ease: 'Sine.easeInOut',
          yoyo: true
        });
      }
    });
  }

  private createBackButton() {
    // Create back button container
    this.backButton = this.add.container(scale(100), scale(40));
    this.backButton.setDepth(10);

    // Button background
    const buttonBg = this.add.rectangle(0, 0, scale(160), scale(44), 0xffffff, 0.9);
    buttonBg.setStrokeStyle(scale(2), 0xe5e7eb);
    this.backButton.add(buttonBg);

    // Back arrow and text
    const backText = this.add.text(0, 0, '← Neighborhood', {
      fontSize: scaleFontSize(14),
      fontFamily: 'Arial, sans-serif',
      color: '#1f2937',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.backButton.add(backText);

    // Make interactive
    buttonBg.setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        if (!this.isTransitioning) {
          buttonBg.setFillStyle(0xf3f4f6);
          this.tweens.add({
            targets: this.backButton,
            scale: 1.05,
            duration: 150,
            ease: 'Power2'
          });
        }
      })
      .on('pointerout', () => {
        buttonBg.setFillStyle(0xffffff, 0.9);
        this.tweens.add({
          targets: this.backButton,
          scale: 1,
          duration: 150,
          ease: 'Power2'
        });
      })
      .on('pointerdown', () => {
        if (!this.isTransitioning) {
          this.handleBackToNeighborhood();
        }
      });
  }

  private createMinigameButton() {
    const { width } = this.scale;

    // Create minigame button container
    this.minigameButton = this.add.container(width - scale(120), scale(40));
    this.minigameButton.setDepth(10);

    // Button background
    const buttonBg = this.add.rectangle(0, 0, scale(160), scale(44), 0x2563eb, 1);
    this.minigameButton.add(buttonBg);

    // Button text
    const buttonText = this.add.text(0, 0, 'Minigame', {
      fontSize: scaleFontSize(14),
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.minigameButton.add(buttonText);

    // Make interactive
    buttonBg.setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        if (!this.isTransitioning) {
          buttonBg.setFillStyle(0x1d4ed8);
          this.tweens.add({
            targets: this.minigameButton,
            scale: 1.05,
            duration: 150,
            ease: 'Power2'
          });
        }
      })
      .on('pointerout', () => {
        buttonBg.setFillStyle(0x2563eb);
        this.tweens.add({
          targets: this.minigameButton,
          scale: 1,
          duration: 150,
          ease: 'Power2'
        });
      })
      .on('pointerdown', () => {
        if (!this.isTransitioning) {
          this.handleMinigameSelect();
        }
      });
  }

  private createHeaderCard() {
    const { width, height } = this.scale;

    // Create header container
    this.headerCard = this.add.container(width / 2, height * 0.15);
    this.headerCard.setDepth(10);

    // Card background
    const cardWidth = scale(700);
    const cardHeight = scale(120);
    const card = this.add.rectangle(0, 0, cardWidth, cardHeight, 0xffffff, 0.9);
    card.setStrokeStyle(scale(2), 0xe5e7eb);
    this.headerCard.add(card);

    // Module title
    const title = this.add.text(0, scale(-20), this.module.title, {
      fontSize: scaleFontSize(32),
      fontFamily: 'Arial, sans-serif',
      color: '#1f2937',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.headerCard.add(title);

    // Progress text
    const completedCount = this.module.lessons.filter(l => l.completed).length;
    const totalCount = this.module.lessons.length;
    const progressText = this.add.text(0, scale(25), `${completedCount}/${totalCount} Rooms Completed`, {
      fontSize: scaleFontSize(18),
      fontFamily: 'Arial, sans-serif',
      color: '#6b7280'
    }).setOrigin(0.5);
    this.headerCard.add(progressText);
  }

  private createLessonGrid() {
    const { width, height } = this.scale;

    const gridCenterX = width / 2;
    const gridCenterY = height * 0.65;
    const cardWidth = scale(320);
    const cardHeight = scale(200);
    const gapX = scale(50);
    const gapY = scale(60);

    this.module.lessons.forEach((lesson, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      
      // Calculate offset from center for each column
      const offsetX = (col === 0) ? -(cardWidth / 2 + gapX / 2) : (cardWidth / 2 + gapX / 2);
      const offsetY = (row === 0) ? -(cardHeight / 2 + gapY / 2) : (cardHeight / 2 + gapY / 2);
      
      const x = gridCenterX + offsetX;
      const y = gridCenterY + offsetY;

      this.createLessonCard(lesson, x, y, cardWidth, cardHeight);
    });
  }

  private createLessonCard(
    lesson: Lesson,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    // Create lesson container
    const lessonContainer = this.add.container(x, y);
    lessonContainer.setDepth(10); // In front of house cutouts
    this.lessonContainers.push(lessonContainer);

    // Card background
    const card = this.add.rectangle(0, scale(-20), width, height, 0xffffff, 0.7);
    card.setStrokeStyle(scale(2), 0xe5e7eb);
    lessonContainer.add(card);

    // Lesson title
    const titleText = this.add.text(0, scale(-60), lesson.title, {
      fontSize: scaleFontSize(22),
      fontFamily: 'Arial, sans-serif',
      color: '#1f2937',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: width - scale(40) }
    }).setOrigin(0.5);
    lessonContainer.add(titleText);

    // Lesson type
    const typeText = this.add.text(0, scale(-20), lesson.type, {
      fontSize: scaleFontSize(16),
      fontFamily: 'Arial, sans-serif',
      color: '#6b7280',
      align: 'center'
    }).setOrigin(0.5);
    lessonContainer.add(typeText);

    // Lock overlay for locked lessons
    if (lesson.locked) {
      const lockOverlay = this.add.rectangle(0, scale(-20), width, height, 0xe5e7eb, 0.5);
      lessonContainer.add(lockOverlay);
      
    }

    // Action button
    const buttonY = scale(60);
    const buttonWidth = scale(180);
    const buttonHeight = scale(50);

    if (lesson.locked) {
      // Locked button
      const lockedButton = this.add.rectangle(0, buttonY, buttonWidth, buttonHeight, 0xd1d5db, 1);
      lessonContainer.add(lockedButton);

      const lockedText = this.add.text(0, buttonY, 'Locked', {
        fontSize: scaleFontSize(16),
        fontFamily: 'Arial, sans-serif',
        color: '#6b7280',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      lessonContainer.add(lockedText);
    } else {
      // Active button
      const buttonBg = lesson.completed
        ? this.add.rectangle(0, buttonY, buttonWidth, buttonHeight, 0x10b981, 1)
        : this.add.rectangle(0, buttonY, buttonWidth, buttonHeight, 0x3b82f6, 1);
      lessonContainer.add(buttonBg);

      const buttonText = this.add.text(0, buttonY, lesson.completed ? 'Review' : 'Start', {
        fontSize: scaleFontSize(16),
        fontFamily: 'Arial, sans-serif',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      lessonContainer.add(buttonText);

      // Make interactive
      buttonBg.setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
          if (!this.isTransitioning) {
            const hoverColor = lesson.completed ? 0x059669 : 0x2563eb;
            buttonBg.setFillStyle(hoverColor);
            this.tweens.add({
              targets: lessonContainer,
              scale: 1.05,
              duration: 150,
              ease: 'Power2'
            });
          }
        })
        .on('pointerout', () => {
          const normalColor = lesson.completed ? 0x10b981 : 0x3b82f6;
          buttonBg.setFillStyle(normalColor);
          this.tweens.add({
            targets: lessonContainer,
            scale: 1,
            duration: 150,
            ease: 'Power2'
          });
        })
        .on('pointerdown', () => {
          if (!this.isTransitioning) {
            this.handleLessonClick(lesson.id);
          }
        });
    }
  }

  private handleLessonClick(lessonId: number) {
  if (this.isTransitioning) return;

  this.isTransitioning = true;

  // Set flag to indicate we're going to a lesson
  this.registry.set('returningFromLesson', true);

  // Get the navigation handler from registry
  const handleLessonSelect = this.registry.get('handleLessonSelect');
  
  if (handleLessonSelect && typeof handleLessonSelect === 'function') {
    handleLessonSelect(lessonId);
    this.isTransitioning = false;
  }
}

  private handleBackToNeighborhood() {
    if (this.isTransitioning) return;

    this.isTransitioning = true;

    // Get the navigation handler from registry
    const handleBackToNeighborhood = this.registry.get('handleBackToNeighborhood');
    
    if (handleBackToNeighborhood && typeof handleBackToNeighborhood === 'function') {
      // Add transition effect before switching scenes
      this.cameras.main.fadeOut(300, 254, 243, 199);
      
      this.cameras.main.once('camerafadeoutcomplete', () => {
        handleBackToNeighborhood();
        this.isTransitioning = false;
      });
    }
  }

  private handleMinigameSelect() {
    if (this.isTransitioning) return;

    this.isTransitioning = true;

    // Get the navigation handler from registry
    const handleMinigameSelect = this.registry.get('handleMinigameSelect');
    
    if (handleMinigameSelect && typeof handleMinigameSelect === 'function') {
      handleMinigameSelect();
      this.isTransitioning = false;
    }
  }

  private handleResize(gameSize: Phaser.Structs.Size) {
    const { width, height } = gameSize;

    // Resize and reposition background
    if (this.background) {
      this.background.setPosition(width / 2, height / 2);
      this.background.setDisplaySize(width, height);
    }

    // Reposition house cutouts
    if (this.leftHouse) {
      this.leftHouse.setPosition(width * 0.25, height / 2);
    }
    if (this.rightHouse) {
      this.rightHouse.setPosition(width * 0.76, height / 2);
    }

    // Reposition back button
    if (this.backButton) {
      this.backButton.setPosition(scale(100), scale(40));
    }

    // Reposition minigame button
    if (this.minigameButton) {
      this.minigameButton.setPosition(width - scale(120), scale(40));
    }

    // Reposition header card
    if (this.headerCard) {
      this.headerCard.setPosition(width / 2, height * 0.15);
    }

    // Reposition bird
    if (this.birdSprite) {
      this.birdSprite.setPosition(width / 2, height * 0.85);
    }

    // Recreate lesson grid with new dimensions
    this.lessonContainers.forEach(container => container.destroy());
    this.lessonContainers = [];
    this.createLessonGrid();
  }

  shutdown() {
    // Clean up event listeners
    this.scale.off('resize', this.handleResize, this);
    this.lessonContainers = [];
    
    // Clear bird idle timer
    if (this.birdIdleTimer) {
      this.birdIdleTimer.remove();
      this.birdIdleTimer = undefined;
    }
  }
}