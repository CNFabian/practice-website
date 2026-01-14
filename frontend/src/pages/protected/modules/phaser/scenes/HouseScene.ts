import Phaser from 'phaser';

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

  constructor() {
    super({ key: 'HouseScene' });
  }

  init(_data: HouseSceneData) {
    // Store data if needed in future
    // this.houseId = data.houseId;
    // this.moduleId = data.moduleId;
    this.isTransitioning = false;
    this.lessonContainers = [];
  }

  create() {
    const { width, height } = this.scale;

    // Set background gradient (fef3c7 -> fff7ed -> fee2e2)
    this.createGradientBackground(width, height);

    // Fade in camera
    this.cameras.main.fadeIn(300, 254, 243, 199);

    // Create back button
    this.createBackButton();

    // Create minigame button
    this.createMinigameButton();

    // Create header card
    this.createHeaderCard();

    // Create lesson grid
    this.createLessonGrid();

    // Handle window resize
    this.scale.on('resize', this.handleResize, this);
  }

  private createGradientBackground(width: number, height: number) {
    // Create gradient using graphics
    const graphics = this.add.graphics();
    
    // Create gradient colors from top to bottom
    const gradient = [
      { color: 0xfef3c7, position: 0 },    // rgb(254, 243, 199)
      { color: 0xfff7ed, position: 0.5 },  // rgb(255, 247, 237)
      { color: 0xfee2e2, position: 1 }     // rgb(254, 226, 226)
    ];

    // Draw gradient rectangles
    const steps = 50;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      let colorValue: number;
      
      if (t < 0.5) {
        // Interpolate between first and second color
        const localT = t * 2;
        const colorObj = Phaser.Display.Color.Interpolate.ColorWithColor(
          Phaser.Display.Color.IntegerToColor(gradient[0].color),
          Phaser.Display.Color.IntegerToColor(gradient[1].color),
          100,
          localT * 100
        );
        colorValue = Phaser.Display.Color.GetColor(colorObj.r, colorObj.g, colorObj.b);
      } else {
        // Interpolate between second and third color
        const localT = (t - 0.5) * 2;
        const colorObj = Phaser.Display.Color.Interpolate.ColorWithColor(
          Phaser.Display.Color.IntegerToColor(gradient[1].color),
          Phaser.Display.Color.IntegerToColor(gradient[2].color),
          100,
          localT * 100
        );
        colorValue = Phaser.Display.Color.GetColor(colorObj.r, colorObj.g, colorObj.b);
      }
      
      graphics.fillStyle(colorValue);
      graphics.fillRect(0, (height / steps) * i, width, height / steps + 1);
    }
  }

  private createBackButton() {
    // Create back button container
    this.backButton = this.add.container(100, 40);

    // Button background
    const buttonBg = this.add.rectangle(0, 0, 200, 44, 0xffffff, 0.9);
    buttonBg.setStrokeStyle(1, 0xe5e7eb);
    this.backButton.add(buttonBg);

    // Back arrow icon
    const arrow = this.add.graphics();
    arrow.lineStyle(2, 0x000000, 1);
    arrow.beginPath();
    arrow.moveTo(-75, 0);
    arrow.lineTo(-65, -5);
    arrow.moveTo(-75, 0);
    arrow.lineTo(-65, 5);
    arrow.moveTo(-75, 0);
    arrow.lineTo(-45, 0);
    arrow.strokePath();
    this.backButton.add(arrow);

    // Button text
    const buttonText = this.add.text(0, 0, 'Back to Neighborhood', {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#000000'
    }).setOrigin(0.5);
    this.backButton.add(buttonText);

    // Make interactive
    buttonBg.setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        if (!this.isTransitioning) {
          buttonBg.setFillStyle(0xffffff, 1);
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
    this.minigameButton = this.add.container(width - 120, 40);

    // Button background (blue)
    const buttonBg = this.add.rectangle(0, 0, 140, 44, 0x2563eb, 1);
    buttonBg.setStrokeStyle(1, 0x1e40af);
    this.minigameButton.add(buttonBg);

    // Play icon
    const playIcon = this.add.graphics();
    playIcon.lineStyle(2, 0xffffff, 1);
    playIcon.strokeCircle(-40, 0, 10);
    playIcon.fillStyle(0xffffff, 1);
    playIcon.fillTriangle(-43, -5, -43, 5, -36, 0);
    this.minigameButton.add(playIcon);

    // Button text
    const buttonText = this.add.text(0, 0, 'Minigame', {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.minigameButton.add(buttonText);

    // Make interactive
    buttonBg.setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        if (!this.isTransitioning) {
          buttonBg.setFillStyle(0x1d4ed8); // blue-700
          this.tweens.add({
            targets: this.minigameButton,
            scale: 1.05,
            duration: 150,
            ease: 'Power2'
          });
        }
      })
      .on('pointerout', () => {
        buttonBg.setFillStyle(0x2563eb); // blue-600
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

    // Card background
    const cardWidth = 700;
    const cardHeight = 120;
    const card = this.add.rectangle(0, 0, cardWidth, cardHeight, 0xffffff, 0.9);
    card.setStrokeStyle(2, 0xe5e7eb);
    this.headerCard.add(card);

    // Module title
    const title = this.add.text(0, -20, this.module.title, {
      fontSize: '32px',
      fontFamily: 'Arial, sans-serif',
      color: '#1f2937',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.headerCard.add(title);

    // Progress text
    const completedCount = this.module.lessons.filter(l => l.completed).length;
    const totalCount = this.module.lessons.length;
    const progressText = this.add.text(0, 25, `${completedCount}/${totalCount} Rooms Completed`, {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#6b7280'
    }).setOrigin(0.5);
    this.headerCard.add(progressText);
  }

  private createLessonGrid() {
    const { width, height } = this.scale;

    // Grid layout parameters
    const gridCenterX = width / 2;
    const gridCenterY = height * 0.6;
    const cardWidth = 320;
    const cardHeight = 200;
    const gapX = 50;
    const gapY = 60;

    // Calculate starting positions for 2x2 grid
    const startX = gridCenterX - cardWidth - gapX / 2;
    const startY = gridCenterY - cardHeight - gapY / 2;

    // Create each lesson card
    this.module.lessons.forEach((lesson, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      
      const x = startX + (col * (cardWidth + gapX));
      const y = startY + (row * (cardHeight + gapY));

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
    this.lessonContainers.push(lessonContainer);

    // Card background
    const card = this.add.rectangle(0, -20, width, height, 0xffffff, 0.7);
    card.setStrokeStyle(2, 0xe5e7eb);
    lessonContainer.add(card);

    // Lesson title
    const titleText = this.add.text(0, -60, lesson.title, {
      fontSize: '22px',
      fontFamily: 'Arial, sans-serif',
      color: '#1f2937',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: width - 40 }
    }).setOrigin(0.5);
    lessonContainer.add(titleText);

    // Lesson type
    const typeText = this.add.text(0, -20, lesson.type, {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#6b7280',
      align: 'center'
    }).setOrigin(0.5);
    lessonContainer.add(typeText);

    // Lock overlay for locked lessons
    if (lesson.locked) {
      const lockOverlay = this.add.rectangle(0, -20, width, height, 0xe5e7eb, 0.5);
      lessonContainer.add(lockOverlay);

      // Lock icon
      const lockIcon = this.add.graphics();
      lockIcon.lineStyle(3, 0x9ca3af, 1);
      lockIcon.strokeRect(-20, -30, 40, 30);
      lockIcon.strokeCircle(0, -30, 15);
      lockIcon.fillStyle(0x9ca3af, 1);
      lockIcon.fillCircle(0, -15, 4);
      lessonContainer.add(lockIcon);
    }

    // Action button
    const buttonY = 60;
    const buttonWidth = 180;
    const buttonHeight = 50;

    if (lesson.locked) {
      // Locked button
      const lockedButton = this.add.rectangle(0, buttonY, buttonWidth, buttonHeight, 0xd1d5db, 1);
      lessonContainer.add(lockedButton);

      const lockedText = this.add.text(0, buttonY, 'Locked', {
        fontSize: '16px',
        fontFamily: 'Arial, sans-serif',
        color: '#6b7280',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      lessonContainer.add(lockedText);
    } else {
      // Active button
      const buttonBg = lesson.completed
        ? this.add.rectangle(0, buttonY, buttonWidth, buttonHeight, 0xffffff, 1)
        : this.add.rectangle(0, buttonY, buttonWidth, buttonHeight, 0x2563eb, 1);

      if (lesson.completed) {
        buttonBg.setStrokeStyle(2, 0x3b82f6);
      }

      lessonContainer.add(buttonBg);

      const buttonText = this.add.text(
        0,
        buttonY,
        lesson.completed ? 'Re-read Lesson' : 'Start Lesson',
        {
          fontSize: '16px',
          fontFamily: 'Arial, sans-serif',
          color: lesson.completed ? '#2563eb' : '#ffffff',
          fontStyle: 'bold'
        }
      ).setOrigin(0.5);
      lessonContainer.add(buttonText);

      // Make interactive
      buttonBg.setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
          if (!this.isTransitioning) {
            if (lesson.completed) {
              buttonBg.setFillStyle(0xdbeafe, 1); // blue-50
            } else {
              buttonBg.setFillStyle(0x1d4ed8, 1); // blue-700
            }
            this.tweens.add({
              targets: buttonBg,
              scaleX: 1.05,
              scaleY: 1.05,
              duration: 150,
              ease: 'Power2'
            });
          }
        })
        .on('pointerout', () => {
          if (lesson.completed) {
            buttonBg.setFillStyle(0xffffff, 1);
          } else {
            buttonBg.setFillStyle(0x2563eb, 1);
          }
          this.tweens.add({
            targets: buttonBg,
            scaleX: 1,
            scaleY: 1,
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

    // Get the navigation handler from registry
    const handleLessonSelect = this.registry.get('handleLessonSelect');
    
    if (handleLessonSelect && typeof handleLessonSelect === 'function') {
      // Convert lesson ID to lesson string format
      const lessonNumber = lessonId - 100;
      const lessonString = `lesson-${lessonNumber}`;

      // Add transition effect before switching scenes
      this.cameras.main.fadeOut(300, 254, 243, 199);
      
      this.cameras.main.once('camerafadeoutcomplete', () => {
        handleLessonSelect(lessonString);
        this.isTransitioning = false;
      });
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
      // Add transition effect before switching
      this.cameras.main.fadeOut(300, 254, 243, 199);
      
      this.cameras.main.once('camerafadeoutcomplete', () => {
        handleMinigameSelect();
        this.isTransitioning = false;
      });
    }
  }

  private handleResize(gameSize: Phaser.Structs.Size) {
    const { width, height } = gameSize;

    // Recreate gradient background
    this.children.removeAll();
    this.createGradientBackground(width, height);

    // Reposition back button
    if (this.backButton) {
      this.backButton.setPosition(100, 40);
    }

    // Reposition minigame button
    if (this.minigameButton) {
      this.minigameButton.setPosition(width - 120, 40);
    }

    // Reposition header card
    if (this.headerCard) {
      this.headerCard.setPosition(width / 2, height * 0.15);
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
  }
}