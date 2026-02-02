import Phaser from 'phaser';
import { createTextStyle } from '../../constants/Typography';
import { COLORS } from '../../constants/Colors';

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

  constructor() {
    super({ key: 'GrowYourNestMinigame' });
  }

  init(data: { questions?: QuizQuestion[] }) {
    this.questions = data.questions || this.getDefaultQuestions();
    this.currentQuestionIndex = 0;
    this.selectedAnswer = null;
    this.score = 0;
    this.optionButtons = [];
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
        ease: ease
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

    // Use graphics instead of rectangle for rounded corners
    const panelBg = this.add.graphics();
    panelBg.fillStyle(COLORS.PURE_WHITE, 1);
    panelBg.lineStyle(2, COLORS.UNAVAILABLE_BUTTON);
    const cornerRadius = 16;
    panelBg.fillRoundedRect(0, 0, panelWidth, panelHeight, cornerRadius);
    panelBg.strokeRoundedRect(0, 0, panelWidth, panelHeight, cornerRadius);
    this.leftPanel.add(panelBg);

    const title = this.add.text(panelWidth / 2, 40, 'Growth',
      createTextStyle('H2', COLORS.TEXT_PRIMARY, { fontSize: '36px' })
    );
    title.setOrigin(0.5, 0);
    this.leftPanel.add(title);

    this.plantGraphics = this.add.container(panelWidth / 2, panelHeight / 2 + 20);
    this.leftPanel.add(this.plantGraphics);

    // Bottom section - stage text and progress bar on same line
    const bottomY = panelHeight - 40;
    const leftMargin = 30;
    const rightMargin = 30;
    
    this.stageText = this.add.text(leftMargin, bottomY, 'Stage 1',
      createTextStyle('BODY_BOLD', COLORS.TEXT_SECONDARY, { fontSize: '20px' })
    );
    this.stageText.setOrigin(0, 0.5);
    this.leftPanel.add(this.stageText);

    // Progress bar on the right (after stage text)
    const progressBarStartX = leftMargin + 80;
    const progressBarWidth = panelWidth - progressBarStartX - rightMargin;
    
    const progressBarBg = this.add.rectangle(progressBarStartX + progressBarWidth / 2, bottomY, progressBarWidth, 12, COLORS.UNAVAILABLE_BUTTON);
    progressBarBg.setStrokeStyle(1, COLORS.UNAVAILABLE_BUTTON);
    this.leftPanel.add(progressBarBg);

    const progressBarFill = this.add.rectangle(progressBarStartX, bottomY, 0, 12, COLORS.STATUS_GREEN);
    progressBarFill.setOrigin(0, 0.5);
    this.leftPanel.add(progressBarFill);
    this.leftPanel.setData('progressBar', progressBarFill);
    this.leftPanel.setData('progressBarWidth', progressBarWidth);

    this.progressText = this.add.text(panelWidth - rightMargin, bottomY, '0 / 100',
      createTextStyle('BODY_MEDIUM', COLORS.TEXT_SECONDARY, { fontSize: '16px' })
    );
    this.progressText.setOrigin(1, 0.5);
    this.leftPanel.add(this.progressText);
    
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
    this.updateQuestion();
  }

  private updatePlantGrowth(): void {
    // Clear existing plant graphics
    this.plantGraphics.removeAll(true);
    
    // Calculate which stage we're on (1-7 based on progress)
    const totalQuestions = this.questions.length;
    const questionsAnswered = this.currentQuestionIndex;
    
    // Map progress to 7 stages
    let stage: number;
    if (questionsAnswered === 0) {
      stage = 1;
    } else if (questionsAnswered === totalQuestions) {
      stage = 7; // Final stage when all questions completed
    } else {
      // Stages 2-6 for questions in progress
      const progressPercent = questionsAnswered / totalQuestions;
      stage = Math.floor(progressPercent * 5) + 2; // Maps to stages 2-6
      stage = Math.min(stage, 6); // Cap at stage 6 until completion
    }
    
    // Display the appropriate tree stage image
    const treeImage = this.add.image(0, 0, `tree_stage_${stage}`);
    
    // Scale the tree to fit nicely in the panel
    const maxTreeHeight = 250;
    const maxTreeWidth = 200;
    
    const scaleX = maxTreeWidth / treeImage.width;
    const scaleY = maxTreeHeight / treeImage.height;
    const scale = Math.min(scaleX, scaleY);
    
    treeImage.setScale(scale);
    this.plantGraphics.add(treeImage);
    
    // Update stage text
    this.stageText.setText(`Stage ${stage}`);
  }

  private updateProgress(): void {
    const totalQuestions = this.questions.length;
    const progress = (this.score / totalQuestions) * 100;
    this.progressText.setText(`${Math.round(progress)} / 100`);
    const progressBar = this.leftPanel.getData('progressBar') as Phaser.GameObjects.Rectangle;
    const progressBarWidth = this.leftPanel.getData('progressBarWidth') as number;
    if (progressBar) {
      progressBar.width = (progress / 100) * progressBarWidth;
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
    if (this.selectedAnswer === question.correctAnswer) {
      this.score++;
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