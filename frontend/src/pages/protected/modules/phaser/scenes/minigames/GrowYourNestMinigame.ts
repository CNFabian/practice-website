import Phaser from 'phaser';
import { createTextStyle } from '../../constants/Typography';
import { COLORS } from '../../constants/Colors';
import { ASSET_KEYS } from '../../constants/AssetKeys';

interface QuizQuestion {
  id: number;
  question: string;
  options: Array<{
    letter: string;
    text: string;
  }>;
  correctAnswer: string;
}

export default class GrowYourNestMinigame extends Phaser.Scene {
  private questions: QuizQuestion[] = [];
  private currentQuestionIndex: number = 0;
  private selectedAnswer: string | null = null;
  private score: number = 0;
  private leftPanel!: Phaser.GameObjects.Container;
  private rightPanel!: Phaser.GameObjects.Container;
  private questionText!: Phaser.GameObjects.Text;
  private questionNumber!: Phaser.GameObjects.Text;
  private optionButtons: Phaser.GameObjects.Container[] = [];
  private nextButton!: Phaser.GameObjects.Container;
  private progressText!: Phaser.GameObjects.Text;
  private plantGraphics!: Phaser.GameObjects.Container;
  private stageText!: Phaser.GameObjects.Text;
  private backButton?: Phaser.GameObjects.Container;
  private headerTitle?: Phaser.GameObjects.Text;
  private completionReturnButton?: Phaser.GameObjects.Container;
  private showingStartScreen: boolean = true; // NEW: Track if showing start screen
  private moduleNumber: number = 1; // NEW: Track module number
  private leftPanelBackground?: Phaser.GameObjects.Image; // NEW: Track background image
  private floatingTween?: Phaser.Tweens.Tween; // NEW: Track floating animation for cleanup
  private wateringCanImage?: Phaser.GameObjects.Image; // NEW: Track watering can image
  private isWateringAnimationPlaying: boolean = false; // NEW: Track if watering animation is active

  constructor() {
    super({ key: 'GrowYourNestMinigame' });
  }

  init(data: { questions?: QuizQuestion[]; moduleNumber?: number }) {
    this.questions = data.questions || this.getDefaultQuestions();
    this.moduleNumber = data.moduleNumber || 1; // NEW: Get module number
    this.currentQuestionIndex = 0;
    this.selectedAnswer = null;
    this.score = 0;
    this.optionButtons = [];
    this.showingStartScreen = true; // NEW: Start with start screen
  }

  create() {
    const { width, height } = this.cameras.main;
    this.createBackButton();
    this.createHeader(width);
    this.createPanels(width, height);
    
    // Slide-in animation: components enter from the right
    // This happens IMMEDIATELY when scene is created
    this.slideInMinigameComponents(width);
    
    this.scale.on('resize', this.handleResize, this);
  }

  private handleResize(): void {
    // Kill all tweens FIRST
    this.tweens.killAll();
    
    // Clean up interactive elements before destroying
    this.optionButtons.forEach(btn => {
      const hitArea = btn.getData('hitArea') as Phaser.GameObjects.Rectangle;
      if (hitArea && hitArea.input) {
        hitArea.removeAllListeners();
        hitArea.disableInteractive();
      }
    });
    
    if (this.nextButton) {
      const hitArea = this.nextButton.getAt(3) as Phaser.GameObjects.Rectangle;
      if (hitArea && hitArea.input) {
        hitArea.removeAllListeners();
        hitArea.disableInteractive();
      }
    }
    
    if (this.backButton) {
      const hitArea = this.backButton.getAt(3) as Phaser.GameObjects.Rectangle;
      if (hitArea && hitArea.input) {
        hitArea.removeAllListeners();
        hitArea.disableInteractive();
      }
    }
    
    // Destroy existing header elements
    if (this.backButton) this.backButton.destroy();
    if (this.headerTitle) this.headerTitle.destroy();
    
    // Destroy existing panels
    if (this.leftPanel) this.leftPanel.destroy();
    if (this.rightPanel) this.rightPanel.destroy();
    
    // Reset arrays
    this.optionButtons = [];
    
    // Recreate everything with new dimensions
    const { width, height } = this.scale;
    this.createBackButton();
    this.createHeader(width);
    this.createPanels(width, height);
  }

  shutdown() {
    // Kill all tweens
    this.tweens.killAll();
    
    // Kill floating animation specifically
    if (this.floatingTween) {
      this.floatingTween.stop();
      this.floatingTween = undefined;
    }
    
    // Clean up watering can if it exists
    if (this.wateringCanImage) {
      this.wateringCanImage.destroy();
      this.wateringCanImage = undefined;
    }
    this.isWateringAnimationPlaying = false;
    
    // Clean up back button
    if (this.backButton) {
      const hitArea = this.backButton.getAt(3) as Phaser.GameObjects.Rectangle;
      if (hitArea && hitArea.input) {
        hitArea.removeAllListeners();
        hitArea.disableInteractive();
      }
    }
    
    // Clean up option buttons
    this.optionButtons.forEach(btn => {
      const hitArea = btn.getData('hitArea') as Phaser.GameObjects.Rectangle;
      if (hitArea && hitArea.input) {
        hitArea.removeAllListeners();
        hitArea.disableInteractive();
      }
    });
    
    // Clean up next button
    if (this.nextButton) {
      const hitArea = this.nextButton.getAt(3) as Phaser.GameObjects.Rectangle;
      if (hitArea && hitArea.input) {
        hitArea.removeAllListeners();
        hitArea.disableInteractive();
      }
    }
    
    // Clean up completion button if it exists
    if (this.completionReturnButton) {
      const hitArea = this.completionReturnButton.getAt(3) as Phaser.GameObjects.Rectangle;
      if (hitArea && hitArea.input) {
        hitArea.removeAllListeners();
        hitArea.disableInteractive();
      }
    }
    
    // Clean up resize listener
    this.scale.off('resize', this.handleResize, this);
  }

  private slideInMinigameComponents(width: number): void {
    // Start all components FAR off-screen to the right
    // Use 1.5x width to match HouseScene's slide distance
    const startOffset = width * 1.5;
    
    // Set initial positions off-screen
    if (this.backButton) {
      this.backButton.x += startOffset;
    }
    if (this.headerTitle) {
      this.headerTitle.x += startOffset;
    }
    if (this.leftPanel) {
      this.leftPanel.x += startOffset;
    }
    if (this.rightPanel) {
      this.rightPanel.x += startOffset;
    }
    
    // Animate all components sliding in from right
    // Use same duration and easing as HouseScene for synchronization
    const duration = 800;
    const ease = 'Power2';
    
    if (this.backButton) {
      this.tweens.add({
        targets: this.backButton,
        x: 60,
        duration: duration,
        ease: ease
      });
    }
    
    if (this.headerTitle) {
      this.tweens.add({
        targets: this.headerTitle,
        x: width / 2,
        duration: duration,
        ease: ease
      });
    }
    
    if (this.leftPanel) {
      this.tweens.add({
        targets: this.leftPanel,
        x: 60,
        duration: duration,
        ease: ease,
        onUpdate: () => {
          // Update the mask position as the panel moves
          if (this.leftPanelBackground && this.leftPanelBackground.mask) {
            const maskShape = this.leftPanelBackground.mask as Phaser.Display.Masks.GeometryMask;
            const graphics = maskShape.geometryMask as Phaser.GameObjects.Graphics;
            if (graphics) {
              const panelWidth = this.leftPanel.getData('panelWidth');
              const panelHeight = this.leftPanel.getData('panelHeight');
              const cornerRadius = 16;
              
              graphics.clear();
              graphics.fillStyle(0xffffff);
              graphics.fillRoundedRect(
                this.leftPanel.x, 
                this.leftPanel.y, 
                panelWidth, 
                panelHeight, 
                cornerRadius
              );
            }
          }
        }
      });
    }
    
    if (this.rightPanel) {
      this.tweens.add({
        targets: this.rightPanel,
        x: width / 2 + 20,
        duration: duration,
        ease: ease
      });
    }
  }


  private createBackButton(): void {
    this.backButton = this.add.container(60, 48);
    const arrow = this.add.text(0, 0, '←', { fontSize: '48px', color: COLORS.TEXT_SECONDARY });
    arrow.setOrigin(0.5);
    
    const text = this.add.text(40, 0, 'Module 1', 
      createTextStyle('H2', COLORS.TEXT_PRIMARY, { fontSize: '36px' })
    );
    text.setOrigin(0, 0.5);
    this.backButton.add([arrow, text]);
    this.backButton.setDepth(100);
    const hitArea = this.add.rectangle(-10, 0, 250, 70, 0x000000, 0);
    hitArea.setOrigin(0, 0.5);
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.on('pointerdown', () => {
      // Emit completion event BEFORE stopping
      this.events.emit('minigameCompleted');
      
      // Stop the minigame completely
      this.scene.stop();
      
      // Resume HouseScene (it was paused when minigame launched)
      this.scene.resume('HouseScene');
    });
    this.backButton.add(hitArea);
    this.backButton.sendToBack(hitArea);
  }

  private createHeader(width: number): void {
    this.headerTitle = this.add.text(width / 2, 48, 'Grow Your Nest',
      createTextStyle('H2', COLORS.TEXT_PRIMARY, { fontSize: '42px' })
    );
    this.headerTitle.setOrigin(0.5, 0.5);
    this.headerTitle.setDepth(10);
  }

  private createPanels(width: number, height: number): void {
    const panelY = 120;
    const panelHeight = height - panelY - 40;
    const panelWidth = (width - 80) / 2 - 20;
    this.createLeftPanel(60, panelY, panelWidth, panelHeight);
    this.createRightPanel(width / 2 + 20, panelY, panelWidth, panelHeight);
  }

  private createLeftPanel(x: number, y: number, panelWidth: number, panelHeight: number): void {
    this.leftPanel = this.add.container(x, y);
    this.leftPanel.setDepth(5);
    
    // Store panel dimensions for mask updates
    this.leftPanel.setData('panelWidth', panelWidth);
    this.leftPanel.setData('panelHeight', panelHeight);

    // Use graphics instead of rectangle for rounded corners
    const panelBg = this.add.graphics();
    panelBg.fillStyle(COLORS.PURE_WHITE, 1);
    panelBg.lineStyle(2, COLORS.UNAVAILABLE_BUTTON);
    const cornerRadius = 16;
    panelBg.fillRoundedRect(0, 0, panelWidth, panelHeight, cornerRadius);
    panelBg.strokeRoundedRect(0, 0, panelWidth, panelHeight, cornerRadius);
    this.leftPanel.add(panelBg);

    // Add background image for the tree area - AFTER the white panel background
    if (this.textures.exists(ASSET_KEYS.GROW_YOUR_NEST_BACKGROUND)) {
      // Create background image at the panel's center (relative to container)
      this.leftPanelBackground = this.add.image(panelWidth / 2, panelHeight / 2, ASSET_KEYS.GROW_YOUR_NEST_BACKGROUND);
      
      // Scale the background to fit the panel while maintaining aspect ratio
      const scaleX = panelWidth / this.leftPanelBackground.width;
      const scaleY = panelHeight / this.leftPanelBackground.height;
      const scale = Math.max(scaleX, scaleY); // Use max to cover the entire panel
      
      this.leftPanelBackground.setScale(scale);
      
      // Create a mask to clip the background to the rounded rectangle
      // Mask needs world coordinates, so we use x + offset
      const maskShape = this.make.graphics({});
      maskShape.fillStyle(0xffffff);
      maskShape.fillRoundedRect(x, y, panelWidth, panelHeight, cornerRadius);
      
      const mask = maskShape.createGeometryMask();
      this.leftPanelBackground.setMask(mask);
      
      // Add to panel container so it moves with the panel during slide animation
      this.leftPanel.add(this.leftPanelBackground);
    }

    const title = this.add.text(panelWidth / 2, 40, 'Growth',
      createTextStyle('H2', COLORS.TEXT_PRIMARY, { fontSize: '36px' })
    );
    title.setOrigin(0.5, 0);
    this.leftPanel.add(title);

    this.plantGraphics = this.add.container(panelWidth / 2, panelHeight / 2 + 20);
    this.leftPanel.add(this.plantGraphics);

    // Bottom section - stage text and progress bar styled like the image
    const bottomY = panelHeight - 80;
    const leftMargin = 20;
    const rightMargin = 20;
    
    // Create orange rounded container background
    const containerWidth = panelWidth - leftMargin - rightMargin;
    const containerHeight = 96;
    const containerRadius = 24;
    const containerY = bottomY - containerHeight / 2;
    
    const orangeContainer = this.add.graphics();
    orangeContainer.fillStyle(0xFFA726, 1); // Orange color
    orangeContainer.fillRoundedRect(leftMargin, containerY, containerWidth, containerHeight, containerRadius);
    this.leftPanel.add(orangeContainer);
    
    // Progress bar container (light gray rounded background)
    const progressBarStartX = leftMargin + 20;
    const progressBarWidth = containerWidth - 120 - 40; // Leave space for progress text on right
    const progressBarHeight = 28;
    const progressBarRadius = 14;
    
    // Light gray background for progress bar
    const progressBarBg = this.add.graphics();
    progressBarBg.fillStyle(0xE0E0E0, 1); // Light gray
    progressBarBg.fillRoundedRect(
      progressBarStartX, 
      bottomY - progressBarHeight / 2, 
      progressBarWidth, 
      progressBarHeight, 
      progressBarRadius
    );
    this.leftPanel.add(progressBarBg);

    // Blue progress fill (starts empty)
    const progressBarFillGraphics = this.add.graphics();
    this.leftPanel.add(progressBarFillGraphics);
    this.leftPanel.setData('progressBarFill', progressBarFillGraphics);
    this.leftPanel.setData('progressBarStartX', progressBarStartX);
    this.leftPanel.setData('progressBarY', bottomY - progressBarHeight / 2);
    this.leftPanel.setData('progressBarWidth', progressBarWidth);
    this.leftPanel.setData('progressBarHeight', progressBarHeight);
    this.leftPanel.setData('progressBarRadius', progressBarRadius);

    // Progress text on the right inside container
    const progressTextX = panelWidth - rightMargin - 15;
    this.progressText = this.add.text(progressTextX, bottomY, '0 / 100',
      createTextStyle('BODY_MEDIUM', COLORS.TEXT_PURE_WHITE, { fontSize: '16px' })
    );
    this.progressText.setOrigin(1, 0.5);
    this.leftPanel.add(this.progressText);
    
    // Stage text at top LEFT corner - large, blue with white stroke, half outside container
    const stageTextX = leftMargin + 10;
    const stageTextY = containerY - 10; // Position half outside the top of the container
    this.stageText = this.add.text(stageTextX, stageTextY, 'Stage 1', {
      fontFamily: 'Onest',
      fontSize: '48px', // Much larger
      color: '#3658EC', // LogoBlue
      align: 'center',
      fontStyle: 'bold',
      stroke: '#FFFFFF', // White stroke
      strokeThickness: 3
    });
    this.stageText.setOrigin(0, 0.5); // Left-aligned, vertically centered
    this.leftPanel.add(this.stageText);
    
    this.updatePlantGrowth();
  }

  private createRightPanel(x: number, y: number, panelWidth: number, panelHeight: number): void {
    this.rightPanel = this.add.container(x, y);
    this.rightPanel.setDepth(5);
    
    // Use graphics instead of rectangle for rounded corners
    const panelBg = this.add.graphics();
    panelBg.fillStyle(COLORS.PURE_WHITE, 1);
    panelBg.lineStyle(2, COLORS.UNAVAILABLE_BUTTON);
    const cornerRadius = 16;
    panelBg.fillRoundedRect(0, 0, panelWidth, panelHeight, cornerRadius);
    panelBg.strokeRoundedRect(0, 0, panelWidth, panelHeight, cornerRadius);
    this.rightPanel.add(panelBg);
    
    const title = this.add.text(panelWidth / 2, 40, 'Question Cards',
      createTextStyle('H2', COLORS.TEXT_PRIMARY, { fontSize: '36px' })
    );
    title.setOrigin(0.5, 0);
    this.rightPanel.add(title);
    this.rightPanel.setData('panelWidth', panelWidth);
    this.rightPanel.setData('panelHeight', panelHeight);
    
    // NEW: Show start screen instead of questions initially
    if (this.showingStartScreen) {
      this.showStartScreen();
    } else {
      this.updateQuestion();
    }
  }

  // NEW: Show the start screen in the right panel
  private showStartScreen(): void {
    const panelWidth = this.rightPanel.getData('panelWidth') as number;
    const panelHeight = this.rightPanel.getData('panelHeight') as number;
    
    const HORIZONTAL_PADDING = panelWidth * 0.08;
    const contentWidth = panelWidth - (HORIZONTAL_PADDING * 2);
    
    // Blue bird illustration
    const birdSize = Math.min(220, panelWidth * 0.45);
    const birdY = panelHeight * 0.35;
    
    let birdGraphic: Phaser.GameObjects.Image | Phaser.GameObjects.Graphics;
    
    // Check if bird image exists, otherwise create placeholder
    if (this.textures.exists('bird_celebration')) {
      birdGraphic = this.add.image(panelWidth / 2, birdY, 'bird_celebration');
      (birdGraphic as Phaser.GameObjects.Image).setDisplaySize(birdSize, birdSize);
    } else {
      // Placeholder bird
      birdGraphic = this.add.graphics();
      (birdGraphic as Phaser.GameObjects.Graphics).fillStyle(COLORS.ELEGANT_BLUE, 0.3);
      (birdGraphic as Phaser.GameObjects.Graphics).fillCircle(panelWidth / 2, birdY, birdSize / 2);
    }
    this.rightPanel.add(birdGraphic);
    
    // Emoji placeholder on top of graphic if no image
    if (!this.textures.exists('bird_celebration')) {
      const birdEmoji = this.add.text(panelWidth / 2, birdY, '🐦',
        { fontSize: `${birdSize * 0.6}px` }
      );
      birdEmoji.setOrigin(0.5, 0.5);
      this.rightPanel.add(birdEmoji);
    }
    
    // Description text
    const descriptionY = birdY + birdSize / 2 + (panelHeight * 0.08);
    const descriptionFontSize = Math.round(panelWidth * 0.038);
    
    const description = this.add.text(
      panelWidth / 2,
      descriptionY,
      `Answer questions to earn water and fertilizer to grow your tree of Module ${this.moduleNumber}!`,
      createTextStyle('BODY_MEDIUM', COLORS.TEXT_PRIMARY, {
        fontSize: `${descriptionFontSize}px`,
        align: 'center',
        wordWrap: { width: contentWidth },
        lineSpacing: descriptionFontSize * 0.4
      })
    );
    description.setOrigin(0.5, 0.5);
    this.rightPanel.add(description);
    
    // Buttons at bottom
    const buttonsY = panelHeight - (panelHeight * 0.12);
    const buttonGap = panelWidth * 0.03;
    const buttonWidth = (contentWidth - buttonGap) / 2;
    const buttonHeight = panelHeight * 0.08;
    const buttonRadius = buttonHeight * 0.3;
    
    // "DO IT LATER" button
    const laterButtonX = HORIZONTAL_PADDING;
    const laterButton = this.createStartScreenButton(
      laterButtonX,
      buttonsY,
      buttonWidth,
      buttonHeight,
      buttonRadius,
      'DO IT LATER',
      false, // Not primary button
      () => {
        // Return to HouseScene
        this.events.emit('minigameCompleted');
        this.scene.stop();
        this.scene.resume('HouseScene');
      }
    );
    this.rightPanel.add(laterButton);
    
    // "LET'S GO" button
    const goButtonX = laterButtonX + buttonWidth + buttonGap;
    const goButton = this.createStartScreenButton(
      goButtonX,
      buttonsY,
      buttonWidth,
      buttonHeight,
      buttonRadius,
      "LET'S GO",
      true, // Primary button
      () => {
        // Clear start screen and show questions
        this.clearStartScreen();
        this.showingStartScreen = false;
        this.updateQuestion();
      }
    );
    this.rightPanel.add(goButton);
  }

  // NEW: Create button for start screen
  private createStartScreenButton(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    text: string,
    isPrimary: boolean,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    
    // Button background
    const bg = this.add.graphics();
    if (isPrimary) {
      bg.fillStyle(COLORS.LOGO_BLUE, 1);
    } else {
      bg.fillStyle(COLORS.PURE_WHITE, 0); // Transparent
    }
    bg.fillRoundedRect(0, -height / 2, width, height, radius);
    container.add(bg);
    
    // Button text
    const fontSize = Math.round(width * 0.065);
    const textColor = isPrimary ? COLORS.TEXT_PURE_WHITE : COLORS.TEXT_SECONDARY;
    const buttonText = this.add.text(
      width / 2,
      0,
      text,
      createTextStyle('BUTTON', textColor, { fontSize: `${fontSize}px` })
    );
    buttonText.setOrigin(0.5, 0.5);
    container.add(buttonText);
    
    // Arrow for primary button
    if (isPrimary) {
      const arrowSize = Math.round(fontSize * 1.2);
      const arrow = this.add.text(
        width * 0.85,
        0,
        '→',
        createTextStyle('BUTTON', COLORS.TEXT_PURE_WHITE, { fontSize: `${arrowSize}px` })
      );
      arrow.setOrigin(0.5, 0.5);
      container.add(arrow);
      container.setData('arrow', arrow);
    }
    
    // Hit area
    const hitArea = this.add.rectangle(width / 2, 0, width, height, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    
    // Store references
    container.setData('bg', bg);
    container.setData('text', buttonText);
    container.setData('width', width);
    container.setData('height', height);
    container.setData('radius', radius);
    container.setData('isPrimary', isPrimary);
    container.setData('hitArea', hitArea);
    
    // Hover effects
    hitArea.on('pointerover', () => {
      bg.clear();
      if (isPrimary) {
        bg.fillStyle(COLORS.LOGO_BLUE, 0.9);
      } else {
        bg.fillStyle(COLORS.LIGHT_BACKGROUND_BLUE, 1);
      }
      bg.fillRoundedRect(0, -height / 2, width, height, radius);
    });
    
    hitArea.on('pointerout', () => {
      bg.clear();
      if (isPrimary) {
        bg.fillStyle(COLORS.LOGO_BLUE, 1);
      } else {
        bg.fillStyle(COLORS.PURE_WHITE, 0);
      }
      bg.fillRoundedRect(0, -height / 2, width, height, radius);
    });
    
    // Click handler
    hitArea.on('pointerdown', onClick);
    
    container.add(hitArea);
    container.sendToBack(hitArea);
    
    return container;
  }

  // NEW: Clear the start screen content
  private clearStartScreen(): void {
    // Remove all children except the background (index 0) and title (index 1)
    const children = this.rightPanel.getAll();
    for (let i = children.length - 1; i >= 2; i--) {
      const child = children[i];
      
      // Clean up interactive elements
      if (child instanceof Phaser.GameObjects.Container) {
        const hitArea = child.getData('hitArea') as Phaser.GameObjects.Rectangle;
        if (hitArea && hitArea.input) {
          hitArea.removeAllListeners();
          hitArea.disableInteractive();
        }
      }
      
      child.destroy();
    }
  }

  private updatePlantGrowth(): void {
    // Kill any existing floating animation
    if (this.floatingTween) {
      this.floatingTween.stop();
      this.floatingTween = undefined;
    }
    
    // Clear existing plant graphics
    this.plantGraphics.removeAll(true);
    
    // Calculate which stage we're on (1-7 based on CORRECT ANSWERS)
    const totalQuestions = this.questions.length;
    const correctAnswers = this.score; // Changed from currentQuestionIndex to score
    
    console.log('🌱 updatePlantGrowth:', {
      correctAnswers,
      totalQuestions,
      currentQuestionIndex: this.currentQuestionIndex,
      note: 'Tree grows based on CORRECT answers only!'
    });
    
    // Map progress to 7 stages based on correct answers
    let stage: number;
    if (correctAnswers === 0) {
      stage = 1; // Start stage - no correct answers yet
    } else if (correctAnswers === totalQuestions) {
      stage = 7; // Final stage when all questions answered correctly
    } else {
      // Stages 2-6 for correct answers in progress
      const progressPercent = correctAnswers / totalQuestions;
      stage = Math.floor(progressPercent * 5) + 2; // Maps to stages 2-6
      stage = Math.min(stage, 6); // Cap at stage 6 until completion
    }
    
    console.log(`🌳 Tree stage: ${stage} (based on ${correctAnswers}/${totalQuestions} correct)`);
    
    // Display the appropriate tree stage image
    const treeImage = this.add.image(0, 0, `tree_stage_${stage}`);
    
    // Scale the tree LARGER to fit nicely in the panel
    // Increased from 250/200 to 350/280 for ~40% larger size
    const maxTreeHeight = 350;
    const maxTreeWidth = 280;
    
    const scaleX = maxTreeWidth / treeImage.width;
    const scaleY = maxTreeHeight / treeImage.height;
    const scale = Math.min(scaleX, scaleY);
    
    treeImage.setScale(scale);
    this.plantGraphics.add(treeImage);
    
    // Add subtle floating animation
    // Small vertical movement (8 pixels) with smooth easing
    this.floatingTween = this.tweens.add({
      targets: treeImage,
      y: -8, // Float up 8 pixels
      duration: 2000, // 2 seconds up
      ease: 'Sine.easeInOut', // Smooth easing
      yoyo: true, // Return to original position
      repeat: -1 // Infinite loop
    });
    
    // Update stage text
    this.stageText.setText(`Stage ${stage}`);
  }

  // NEW: Play watering can animation when answer is correct
  private playWateringAnimation(): void {
    // Prevent multiple animations from playing at once
    if (this.isWateringAnimationPlaying) return;
    
    // Check if watering can textures exist
    if (!this.textures.exists(ASSET_KEYS.WATERING_CAN_STILL)) {
      console.warn('⚠️ Watering can animation skipped: WATERING_CAN_STILL texture not loaded');
      return;
    }
    if (!this.textures.exists(ASSET_KEYS.WATERING_CAN_POURING)) {
      console.warn('⚠️ Watering can animation skipped: WATERING_CAN_POURING texture not loaded');
      return;
    }
    
    console.log('🌊 Playing watering can animation!');
    this.isWateringAnimationPlaying = true;

    // Get panel dimensions for positioning
    const panelWidth = this.leftPanel.getData('panelWidth') as number;
    const panelHeight = this.leftPanel.getData('panelHeight') as number;

    // Position watering can above and to the right of the tree
    const startX = panelWidth * 0.7; // Right side of panel
    const startY = panelHeight * 0.45; // Upper portion
    const pouringX = panelWidth * 0.65; // Move slightly left
    const pouringY = panelHeight * 0.50; // Move slightly down

    // Create watering can image (still position initially)
    this.wateringCanImage = this.add.image(startX, startY, ASSET_KEYS.WATERING_CAN_STILL);
    this.wateringCanImage.setScale(1.5); // Adjust size as needed
    this.wateringCanImage.setAlpha(0); // Start invisible
    this.leftPanel.add(this.wateringCanImage);

    // Animation sequence using chained tweens
    // Step 1: Fade in the watering can
    this.tweens.add({
      targets: this.wateringCanImage,
      alpha: 1,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        if (!this.wateringCanImage) return;
        
        // Step 2: Move to pouring position
        this.tweens.add({
          targets: this.wateringCanImage,
          x: pouringX,
          y: pouringY,
          duration: 400,
          ease: 'Power2',
          onComplete: () => {
            if (!this.wateringCanImage) return;
            
            // Step 3: Switch to pouring frame and tilt
            this.wateringCanImage.setTexture(ASSET_KEYS.WATERING_CAN_POURING);
            this.wateringCanImage.setAngle(15);
            
            // NEW: Show "+1 Water" text animation
            this.showWaterText(pouringX, pouringY, panelWidth);
            
            // Step 4: Hold the pouring position
            this.time.delayedCall(1200, () => {
              if (!this.wateringCanImage) return;
              
              // Step 5: Switch back to still frame and straighten
              this.wateringCanImage.setTexture(ASSET_KEYS.WATERING_CAN_STILL);
              this.wateringCanImage.setAngle(0);
              
              // Step 6: Move back to start position
              this.tweens.add({
                targets: this.wateringCanImage,
                x: startX,
                y: startY,
                duration: 400,
                ease: 'Power2',
                onComplete: () => {
                  if (!this.wateringCanImage) return;
                  
                  // Step 7: Fade out and cleanup
                  this.tweens.add({
                    targets: this.wateringCanImage,
                    alpha: 0,
                    duration: 300,
                    ease: 'Power2',
                    onComplete: () => {
                      if (this.wateringCanImage) {
                        this.wateringCanImage.destroy();
                        this.wateringCanImage = undefined;
                      }
                      this.isWateringAnimationPlaying = false;
                      console.log('✅ Watering can animation complete!');
                    }
                  });
                }
              });
            });
          }
        });
      }
    });
  }

  private showWaterText(x: number, y: number, panelWidth: number): void {
    // Create the "+1 Water" text
    const fontSize = Math.round(panelWidth * 0.08);
    const waterText = this.add.text(
      x - 175, // Position near the watering can spout
      y - 100, // Below the watering can
      '+1 Water',
      createTextStyle('BODY_BOLD', `#${COLORS.LOGO_BLUE.toString(16).padStart(6, '0')}`, {
        fontSize: `${fontSize}px`
      })
    );
    waterText.setOrigin(0.5, 0.5);
    waterText.setAlpha(0); // Start invisible
    waterText.setScale(0.5); // Start small
    this.leftPanel.add(waterText);

    // Animation sequence: Pop up, float up, and fade out
    // Step 1: Pop in and scale up
    this.tweens.add({
      targets: waterText,
      alpha: 1,
      scale: 1.2, // Slightly larger than final size for bounce effect
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Step 2: Settle to normal size
        this.tweens.add({
          targets: waterText,
          scale: 1,
          duration: 150,
          ease: 'Power2',
          onComplete: () => {
            // Step 3: Float up and fade out
            this.tweens.add({
              targets: waterText,
              y: y + 30, // Float upward
              alpha: 0,
              duration: 800,
              ease: 'Power2',
              delay: 200, // Hold for a moment before fading
              onComplete: () => {
                waterText.destroy();
              }
            });
          }
        });
      }
    });
  }

  private updateProgress(): void {
    const totalQuestions = this.questions.length;
    const progress = (this.score / totalQuestions) * 100;
    this.progressText.setText(`${Math.round(progress)} / 100`);
    
    // Get stored progress bar data
    const progressBarFillGraphics = this.leftPanel.getData('progressBarFill') as Phaser.GameObjects.Graphics;
    const progressBarStartX = this.leftPanel.getData('progressBarStartX') as number;
    const progressBarY = this.leftPanel.getData('progressBarY') as number;
    const progressBarWidth = this.leftPanel.getData('progressBarWidth') as number;
    const progressBarHeight = this.leftPanel.getData('progressBarHeight') as number;
    const progressBarRadius = this.leftPanel.getData('progressBarRadius') as number;
    
    if (progressBarFillGraphics) {
      // Clear and redraw the blue progress fill
      progressBarFillGraphics.clear();
      
      const fillWidth = (progress / 100) * progressBarWidth;
      
      if (fillWidth > 0) {
        progressBarFillGraphics.fillStyle(0x3F51B5, 1); // Blue color
        progressBarFillGraphics.fillRoundedRect(
          progressBarStartX,
          progressBarY,
          fillWidth,
          progressBarHeight,
          progressBarRadius
        );
      }
    }
  }

  private updateQuestion(): void {
    if (this.currentQuestionIndex >= this.questions.length) {
      this.showCompletion();
      return;
    }

    const question = this.questions[this.currentQuestionIndex];
    const panelWidth = this.rightPanel.getData('panelWidth') as number;
    const panelHeight = this.rightPanel.getData('panelHeight') as number;

    // Clean up old option buttons PROPERLY
    this.optionButtons.forEach(btn => {
      const hitArea = btn.getData('hitArea') as Phaser.GameObjects.Rectangle;
      if (hitArea && hitArea.input) {
        hitArea.removeAllListeners();
        hitArea.disableInteractive();
      }
      btn.destroy();
    });
    this.optionButtons = [];
    
    // Clean up old question elements
    if (this.questionText) this.questionText.destroy();
    if (this.questionNumber) this.questionNumber.destroy();
    
    // Clean up old next button
    if (this.nextButton) {
      const hitArea = this.nextButton.getAt(3) as Phaser.GameObjects.Rectangle;
      if (hitArea && hitArea.input) {
        hitArea.removeAllListeners();
        hitArea.disableInteractive();
      }
      this.nextButton.destroy();
    }

    const HORIZONTAL_PADDING_PERCENT = 0.08;
    const horizontalPadding = panelWidth * HORIZONTAL_PADDING_PERCENT;
    const contentWidth = panelWidth - (horizontalPadding * 2);
    const QUESTION_START_PERCENT = 0.18;
    const QUESTION_TO_OPTIONS_GAP_PERCENT = 0.15;
    const OPTION_BUTTON_HEIGHT_PERCENT = 0.095;
    const OPTION_GAP_PERCENT = 0.02;
    const NEXT_BUTTON_MARGIN_PERCENT = 0.08;
    const QUESTION_TEXT_FONT_PERCENT = 0.04;
    const OPTION_LETTER_FONT_PERCENT = 0.035;
    const OPTION_TEXT_FONT_PERCENT = 0.03;
    const questionStartY = panelHeight * QUESTION_START_PERCENT;
    const questionToOptionsGap = panelHeight * QUESTION_TO_OPTIONS_GAP_PERCENT;
    const optionButtonHeight = panelHeight * OPTION_BUTTON_HEIGHT_PERCENT;
    const optionGap = panelHeight * OPTION_GAP_PERCENT;
    const nextButtonMargin = panelHeight * NEXT_BUTTON_MARGIN_PERCENT;
    const questionTextFontSize = Math.round(panelWidth * QUESTION_TEXT_FONT_PERCENT);
    const optionLetterFontSize = Math.round(panelWidth * OPTION_LETTER_FONT_PERCENT);
    const optionTextFontSize = Math.round(panelWidth * OPTION_TEXT_FONT_PERCENT);
    
    const fullQuestionText = `${this.currentQuestionIndex + 1}. ${question.question}`;
    
    this.questionText = this.add.text(horizontalPadding, questionStartY, fullQuestionText,
      createTextStyle('BODY_MEDIUM', COLORS.TEXT_PRIMARY, {
        fontSize: `${questionTextFontSize}px`,
        wordWrap: { width: contentWidth },
        lineSpacing: questionTextFontSize * 0.4
      })
    );
    this.questionText.setOrigin(0, 0);
    this.rightPanel.add(this.questionText);
    this.questionNumber = this.questionText;

    const optionsStartY = questionStartY + this.questionText.height + questionToOptionsGap;
    
    question.options.forEach((option, index) => {
      const optionY = optionsStartY + (index * (optionButtonHeight + optionGap));
      const optionContainer = this.createOptionButton(
        option, 
        optionY, 
        horizontalPadding, 
        contentWidth, 
        optionButtonHeight,
        optionLetterFontSize,
        optionTextFontSize
      );
      this.optionButtons.push(optionContainer);
      this.rightPanel.add(optionContainer);
    });

    const nextButtonX = panelWidth - horizontalPadding - (panelWidth * 0.13);
    const nextButtonY = panelHeight - nextButtonMargin;
    this.createNextButton(nextButtonX, nextButtonY, panelWidth);
    this.rightPanel.add(this.nextButton);

    this.updateProgress();
  }

  private createOptionButton(option: { letter: string; text: string }, y: number, leftPadding: number, buttonWidth: number, buttonHeight: number, letterFontSize: number, textFontSize: number): Phaser.GameObjects.Container {
    const container = this.add.container(0, y);
    const buttonBg = this.add.graphics();
    buttonBg.fillStyle(COLORS.ELEGANT_BLUE, 0.2);
    buttonBg.lineStyle(2, COLORS.UNAVAILABLE_BUTTON);
    const cornerRadius = buttonHeight * 0.2;
    buttonBg.fillRoundedRect(leftPadding, -buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
    buttonBg.strokeRoundedRect(leftPadding, -buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
    container.add(buttonBg);
    const buttonHitArea = this.add.rectangle(leftPadding + buttonWidth / 2, 0, buttonWidth, buttonHeight, 0x000000, 0);
    const letterPaddingLeft = buttonWidth * 0.05;
    
    const letterText = this.add.text(leftPadding + letterPaddingLeft, 0, `${option.letter}.`,
      createTextStyle('BODY_BOLD', COLORS.TEXT_PRIMARY, { fontSize: `${letterFontSize}px` })
    );
    letterText.setOrigin(0, 0.5);
    const optionTextPaddingLeft = buttonWidth * 0.15;
    
    const optionText = this.add.text(leftPadding + optionTextPaddingLeft, 0, option.text,
      createTextStyle('BODY_MEDIUM', COLORS.TEXT_SECONDARY, {
        fontSize: `${textFontSize}px`,
        wordWrap: { width: buttonWidth * 0.8 }
      })
    );
    optionText.setOrigin(0, 0.5);
    container.add([letterText, optionText, buttonHitArea]);
    container.setData('letter', option.letter);
    container.setData('bg', buttonBg);
    container.setData('hitArea', buttonHitArea);
    container.setData('leftPadding', leftPadding);
    container.setData('buttonWidth', buttonWidth);
    container.setData('buttonHeight', buttonHeight);
    container.setData('cornerRadius', cornerRadius);
    buttonHitArea.setInteractive({ useHandCursor: true });
    buttonHitArea.on('pointerdown', () => this.handleAnswerSelect(option.letter));
    buttonHitArea.on('pointerover', () => {
      if (this.selectedAnswer !== option.letter) {
        buttonBg.clear();
        buttonBg.fillStyle(COLORS.ELEGANT_BLUE, 0.3);
        buttonBg.lineStyle(2, COLORS.ELEGANT_BLUE);
        buttonBg.fillRoundedRect(leftPadding, -buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
        buttonBg.strokeRoundedRect(leftPadding, -buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
      }
    });
    buttonHitArea.on('pointerout', () => {
      if (this.selectedAnswer === option.letter) {
        buttonBg.clear();
        buttonBg.fillStyle(COLORS.ELEGANT_BLUE, 0.2);
        buttonBg.lineStyle(2, COLORS.LOGO_BLUE);
        buttonBg.fillRoundedRect(leftPadding, -buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
        buttonBg.strokeRoundedRect(leftPadding, -buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
      } else if (this.selectedAnswer !== null) {
        buttonBg.clear();
        buttonBg.fillStyle(COLORS.TEXT_WHITE, 1);
        buttonBg.lineStyle(2, COLORS.UNAVAILABLE_BUTTON);
        buttonBg.fillRoundedRect(leftPadding, -buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
        buttonBg.strokeRoundedRect(leftPadding, -buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
      } else {
        buttonBg.clear();
        buttonBg.fillStyle(COLORS.ELEGANT_BLUE, 0.2);
        buttonBg.lineStyle(2, COLORS.UNAVAILABLE_BUTTON);
        buttonBg.fillRoundedRect(leftPadding, -buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
        buttonBg.strokeRoundedRect(leftPadding, -buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
      }
    });
    return container;
  }

  private createNextButton(x: number, y: number, panelWidth: number): void {
    this.nextButton = this.add.container(x, y);
    const buttonWidth = panelWidth * 0.24;
    const buttonHeight = panelWidth * 0.08;
    const borderRadius = buttonHeight / 2;
    const fontSize = Math.round(panelWidth * 0.035);
    const buttonBg = this.add.graphics();
    buttonBg.fillStyle(COLORS.UNAVAILABLE_BUTTON);
    buttonBg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, borderRadius);
    
    const buttonText = this.add.text(-buttonWidth * 0.12, 0, 'NEXT',
      createTextStyle('BUTTON', COLORS.TEXT_SECONDARY, { fontSize: `${fontSize}px` })
    );
    buttonText.setOrigin(0.5, 0.5);
    
    const arrow = this.add.text(buttonWidth * 0.22, 0, '→',
      createTextStyle('BUTTON', COLORS.TEXT_SECONDARY, { fontSize: `${fontSize + 4}px` })
    );
    arrow.setOrigin(0.5, 0.5);
    this.nextButton.add([buttonBg, buttonText, arrow]);
    this.nextButton.setData('bg', buttonBg);
    this.nextButton.setData('text', buttonText);
    this.nextButton.setData('arrow', arrow);
    this.nextButton.setData('enabled', false);
    this.nextButton.setData('buttonWidth', buttonWidth);
    this.nextButton.setData('buttonHeight', buttonHeight);
    this.nextButton.setData('borderRadius', borderRadius);
    const hitArea = this.add.rectangle(0, 0, buttonWidth, buttonHeight, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.on('pointerdown', () => this.handleNext());
    this.nextButton.add(hitArea);
    this.nextButton.sendToBack(hitArea);
  }

  private handleAnswerSelect(letter: string): void {
    this.selectedAnswer = letter;
    this.optionButtons.forEach(btn => {
      const bg = btn.getData('bg') as Phaser.GameObjects.Graphics;
      const btnLetter = btn.getData('letter') as string;
      const leftPadding = btn.getData('leftPadding') as number;
      const buttonWidth = btn.getData('buttonWidth') as number;
      const buttonHeight = btn.getData('buttonHeight') as number;
      const cornerRadius = btn.getData('cornerRadius') as number;
      
      bg.clear();
      
      if (btnLetter === letter) {
        bg.fillStyle(COLORS.ELEGANT_BLUE, 0.2);
        bg.lineStyle(2, COLORS.LOGO_BLUE);
        bg.fillRoundedRect(leftPadding, -buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
        bg.strokeRoundedRect(leftPadding, -buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
      } else {
        bg.fillStyle(COLORS.TEXT_WHITE, 1);
        bg.lineStyle(2, COLORS.UNAVAILABLE_BUTTON);
        bg.fillRoundedRect(leftPadding, -buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
        bg.strokeRoundedRect(leftPadding, -buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
      }
    });
    this.updateNextButton(true);
  }

  private updateNextButton(enabled: boolean): void {
    const bg = this.nextButton.getData('bg') as Phaser.GameObjects.Graphics;
    const text = this.nextButton.getData('text') as Phaser.GameObjects.Text;
    const arrow = this.nextButton.getData('arrow') as Phaser.GameObjects.Text;
    const buttonWidth = this.nextButton.getData('buttonWidth') as number;
    const buttonHeight = this.nextButton.getData('buttonHeight') as number;
    const borderRadius = this.nextButton.getData('borderRadius') as number;

    this.nextButton.setData('enabled', enabled);

    bg.clear();
    if (enabled) {
      bg.fillStyle(COLORS.LOGO_BLUE);
      bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, borderRadius);
      text.setColor(COLORS.TEXT_PURE_WHITE);
      arrow.setColor(COLORS.TEXT_PURE_WHITE);
    } else {
      bg.fillStyle(COLORS.UNAVAILABLE_BUTTON);
      bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, borderRadius);
      text.setColor(COLORS.TEXT_SECONDARY);
      arrow.setColor(COLORS.TEXT_SECONDARY);
    }
  }

  private handleNext(): void {
    if (!this.nextButton.getData('enabled')) return;
    
    const question = this.questions[this.currentQuestionIndex];
    console.log('🔍 handleNext called:', {
      currentQuestionIndex: this.currentQuestionIndex,
      selectedAnswer: this.selectedAnswer,
      correctAnswer: question.correctAnswer,
      question: question.question
    });
    
    const isCorrect = this.selectedAnswer === question.correctAnswer;
    console.log('✅ Answer check:', isCorrect ? 'CORRECT ✓' : 'INCORRECT ✗');
    
    if (isCorrect) {
      this.score++;
      console.log('💧 Triggering watering animation...');
      // Play watering animation when answer is correct
      this.playWateringAnimation();
    }
    
    this.currentQuestionIndex++;
    this.selectedAnswer = null;
    this.updateNextButton(false);
    this.updatePlantGrowth();
    this.updateProgress();
    this.updateQuestion();
  }

  private showCompletion(): void {
    const panelWidth = this.rightPanel.getData('panelWidth') as number;
    const panelHeight = this.rightPanel.getData('panelHeight') as number;
    
    const children = this.rightPanel.getAll();
    children.slice(1).forEach(child => child.destroy());
    
    const HORIZONTAL_PADDING_PERCENT = 0.08;
    const horizontalPadding = panelWidth * HORIZONTAL_PADDING_PERCENT;
    const contentWidth = panelWidth - (horizontalPadding * 2);
    
    const titleFontSize = Math.round(panelWidth * 0.068);
    const completionTextFontSize = Math.round(panelWidth * 0.06);
    const boxTitleFontSize = Math.round(panelWidth * 0.03);
    const boxValueFontSize = Math.round(panelWidth * 0.026);
    const coinButtonFontSize = Math.round(panelWidth * 0.03);
    const moduleButtonFontSize = Math.round(panelWidth * 0.034);
    
    const title = this.add.text(panelWidth / 2, 40, 'Question Cards',
      createTextStyle('H2', COLORS.TEXT_PRIMARY, { fontSize: `${titleFontSize}px` })
    );
    title.setOrigin(0.5, 0);
    this.rightPanel.add(title);
    
    const birdSize = panelWidth * 0.3;
    const birdY = panelHeight * 0.32;
    const bird = this.add.image(panelWidth / 2, birdY, 'bird_celebration');
    bird.setDisplaySize(birdSize, birdSize);
    this.rightPanel.add(bird);
    
    const completionTextY = birdY + (panelHeight * 0.14);
    
    const completionText = this.add.text(panelWidth / 2, completionTextY, 'Questions Completed!',
      createTextStyle('H2', COLORS.TEXT_PRIMARY, { fontSize: `${completionTextFontSize}px` })
    );
    completionText.setOrigin(0.5, 0.5);
    this.rightPanel.add(completionText);
    
    const boxY = completionTextY + (panelHeight * 0.12);
    const boxSpacing = panelWidth * 0.02;
    const boxWidth = (contentWidth - boxSpacing) / 2;
    const boxHeight = panelHeight * 0.12;
    const boxRadius = panelHeight * 0.018;
    
    const leftBoxX = horizontalPadding;
    const leftBoxBg = this.add.graphics();
    leftBoxBg.lineStyle(2, COLORS.ELEGANT_BLUE);
    leftBoxBg.strokeRoundedRect(leftBoxX, boxY, boxWidth, boxHeight, boxRadius);
    this.rightPanel.add(leftBoxBg);
    
    const waterText = this.add.text(leftBoxX + boxWidth / 2, boxY + boxHeight * 0.32, 'Growth Earned',
      createTextStyle('BODY_BOLD', COLORS.TEXT_SUCCESS, { fontSize: `${boxTitleFontSize}px` })
    );
    waterText.setOrigin(0.5, 0.5);
    this.rightPanel.add(waterText);
    
    const waterValue = this.add.text(leftBoxX + boxWidth / 2, boxY + boxHeight * 0.68, 'Water +6\nFertilizer +2',
      createTextStyle('BODY_MEDIUM', COLORS.TEXT_SUCCESS, {
        fontSize: `${boxValueFontSize}px`,
        align: 'center',
        lineSpacing: 2
      })
    );
    waterValue.setOrigin(0.5, 0.5);
    this.rightPanel.add(waterValue);
    
    const rightBoxX = leftBoxX + boxWidth + boxSpacing;
    const rightBoxBg = this.add.graphics();
    rightBoxBg.lineStyle(2, COLORS.ELEGANT_BLUE);
    rightBoxBg.strokeRoundedRect(rightBoxX, boxY, boxWidth, boxHeight, boxRadius);
    this.rightPanel.add(rightBoxBg);
    
    const accuracyText = this.add.text(rightBoxX + boxWidth / 2, boxY + boxHeight * 0.38, 'Amazing!',
      createTextStyle('BODY_BOLD', COLORS.TEXT_SUCCESS, { fontSize: `${boxTitleFontSize}px` })
    );
    accuracyText.setOrigin(0.5, 0.5);
    this.rightPanel.add(accuracyText);
    
    const accuracy = Math.round((this.score / this.questions.length) * 100);
    
    const accuracyValue = this.add.text(rightBoxX + boxWidth / 2, boxY + boxHeight * 0.68, `${accuracy}% Accuracy`,
      createTextStyle('BODY_BOLD', COLORS.TEXT_SUCCESS, { fontSize: `${boxValueFontSize}px` })
    );
    accuracyValue.setOrigin(0.5, 0.5);
    this.rightPanel.add(accuracyValue);
    
    const coinButtonY = boxY + boxHeight + (panelHeight * 0.045);
    const coinButtonWidth = contentWidth * 0.65;
    const coinButtonHeight = panelHeight * 0.08;
    const coinButtonRadius = coinButtonHeight / 2;
    const coinButton = this.add.graphics();
    coinButton.fillStyle(COLORS.ELEGANT_BLUE);
    coinButton.fillRoundedRect(panelWidth / 2 - coinButtonWidth / 2, coinButtonY, coinButtonWidth, coinButtonHeight, coinButtonRadius);
    this.rightPanel.add(coinButton);
    
    const coinText = this.add.text(panelWidth / 2, coinButtonY + coinButtonHeight / 2, 'You earned 15\nNest Coins!',
      createTextStyle('BODY_BOLD', COLORS.TEXT_PURE_WHITE, {
        fontSize: `${coinButtonFontSize}px`,
        align: 'center',
        lineSpacing: 2
      })
    );
    coinText.setOrigin(0.5, 0.5);
    this.rightPanel.add(coinText);
    
    const NEXT_BUTTON_MARGIN_PERCENT = 0.08;
    const nextButtonMargin = panelHeight * NEXT_BUTTON_MARGIN_PERCENT;
    const moduleButtonX = panelWidth - horizontalPadding - (panelWidth * 0.13);
    const moduleButtonY = panelHeight - nextButtonMargin;
    const moduleButtonWidth = panelWidth * 0.24;
    const moduleButtonHeight = panelWidth * 0.08;
    const moduleButtonRadius = moduleButtonHeight / 2;
    
    this.completionReturnButton = this.add.container(moduleButtonX, moduleButtonY);
    
    const moduleButtonBg = this.add.graphics();
    moduleButtonBg.fillStyle(COLORS.LOGO_BLUE);
    moduleButtonBg.fillRoundedRect(-moduleButtonWidth / 2, -moduleButtonHeight / 2, moduleButtonWidth, moduleButtonHeight, moduleButtonRadius);
    
    const moduleButtonText = this.add.text(-moduleButtonWidth * 0.12, 0, 'MODULE',
      createTextStyle('BUTTON', COLORS.TEXT_PURE_WHITE, { fontSize: `${moduleButtonFontSize}px` })
    );
    moduleButtonText.setOrigin(0.5, 0.5);
    
    const arrowFontSize = Math.round(moduleButtonFontSize * 1.15);
    
    const arrow = this.add.text(moduleButtonWidth * 0.22, 0, '→',
      createTextStyle('BUTTON', COLORS.TEXT_PURE_WHITE, { fontSize: `${arrowFontSize}px` })
    );
    arrow.setOrigin(0.5, 0.5);
    
    this.completionReturnButton.add([moduleButtonBg, moduleButtonText, arrow]);
    
    const hitArea = this.add.rectangle(0, 0, moduleButtonWidth, moduleButtonHeight, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.on('pointerdown', () => {
      // Emit completion event BEFORE stopping
      this.events.emit('minigameCompleted');
      
      this.scene.stop();
      this.scene.resume('HouseScene');
    });
    this.completionReturnButton.add(hitArea);
    this.completionReturnButton.sendToBack(hitArea);
    
    this.rightPanel.add(this.completionReturnButton);
  }

  private getDefaultQuestions(): QuizQuestion[] {
    return [
      {
        id: 1,
        question: 'What is a down payment?',
        options: [
          { letter: 'A', text: 'The monthly payment on a mortgage' },
          { letter: 'B', text: 'The initial upfront payment when buying a home' },
          { letter: 'C', text: 'The final payment to close a loan' },
          { letter: 'D', text: 'A penalty for early loan repayment' }
        ],
        correctAnswer: 'B'
      },
      {
        id: 2,
        question: 'What does APR stand for?',
        options: [
          { letter: 'A', text: 'Annual Payment Rate' },
          { letter: 'B', text: 'Adjusted Percentage Rate' },
          { letter: 'C', text: 'Annual Percentage Rate' },
          { letter: 'D', text: 'Approved Payment Ratio' }
        ],
        correctAnswer: 'C'
      },
      {
        id: 3,
        question: 'What is home equity?',
        options: [
          { letter: 'A', text: 'The total value of your home' },
          { letter: 'B', text: 'The difference between your home\'s value and what you owe' },
          { letter: 'C', text: 'The interest rate on your mortgage' },
          { letter: 'D', text: 'The cost of home insurance' }
        ],
        correctAnswer: 'B'
      }
    ];
  }
}