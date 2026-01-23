import Phaser from 'phaser';

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

  private createBackButton(): void {
    this.backButton = this.add.container(60, 48); // Assign to class property
    const arrow = this.add.text(0, 0, '←', { fontSize: '48px', color: '#6b7280' });
    arrow.setOrigin(0.5);
    const text = this.add.text(40, 0, 'Module 1', { fontSize: '36px', fontFamily: 'Arial, sans-serif', color: '#1f2937' });
    text.setOrigin(0, 0.5);
    this.backButton.add([arrow, text]);
    this.backButton.setDepth(100);
    const hitArea = this.add.rectangle(-10, 0, 250, 70, 0x000000, 0);
    hitArea.setOrigin(0, 0.5);
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.on('pointerdown', () => this.scene.stop());
    this.backButton.add(hitArea);
    this.backButton.sendToBack(hitArea);
  }

  private createHeader(width: number): void {
    this.headerTitle = this.add.text(width / 2, 48, 'Grow Your Nest', { // Assign to class property
      fontSize: '42px',
      fontFamily: 'Arial, sans-serif',
      color: '#1f2937',
      fontStyle: 'bold'
    });
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

    const panelBg = this.add.rectangle(panelWidth / 2, panelHeight / 2, panelWidth, panelHeight, 0xffffff, 1);
    panelBg.setStrokeStyle(2, 0xe5e7eb);
    this.leftPanel.add(panelBg);

    const title = this.add.text(panelWidth / 2, 40, 'Growth', {
      fontSize: '36px',
      fontFamily: 'Arial, sans-serif',
      color: '#1f2937',
      fontStyle: 'bold'
    });
    title.setOrigin(0.5, 0);
    this.leftPanel.add(title);

    this.plantGraphics = this.add.container(panelWidth / 2, panelHeight / 2 + 20);
    this.leftPanel.add(this.plantGraphics);

    this.stageText = this.add.text(panelWidth / 2, panelHeight - 60, 'Stage 1', {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: '#6b7280'
    });
    this.stageText.setOrigin(0.5, 0);
    this.leftPanel.add(this.stageText);

    const progressBarWidth = panelWidth - 60;
    const progressBarBg = this.add.rectangle(panelWidth / 2, panelHeight - 30, progressBarWidth, 12, 0xe5e7eb);
    progressBarBg.setStrokeStyle(1, 0xd1d5db);
    this.leftPanel.add(progressBarBg);

    const progressBarFill = this.add.rectangle((panelWidth / 2) - (progressBarWidth / 2), panelHeight - 30, 0, 12, 0x22c55e);
    progressBarFill.setOrigin(0, 0.5);
    this.leftPanel.add(progressBarFill);
    this.leftPanel.setData('progressBar', progressBarFill);
    this.leftPanel.setData('progressBarWidth', progressBarWidth);

    this.progressText = this.add.text(panelWidth - 30, panelHeight - 30, '0 / 100', {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#6b7280'
    });
    this.progressText.setOrigin(1, 0.5);
    this.leftPanel.add(this.progressText);
    
    this.updatePlantGrowth();
  }

  private createRightPanel(x: number, y: number, panelWidth: number, panelHeight: number): void {
    this.rightPanel = this.add.container(x, y);
    this.rightPanel.setDepth(5);
    const panelBg = this.add.rectangle(panelWidth / 2, panelHeight / 2, panelWidth, panelHeight, 0xffffff, 1);
    panelBg.setStrokeStyle(2, 0xe5e7eb);
    this.rightPanel.add(panelBg);
    const title = this.add.text(panelWidth / 2, 40, 'Question Cards', {
      fontSize: '36px',
      fontFamily: 'Arial, sans-serif',
      color: '#1f2937',
      fontStyle: 'bold'
    });
    title.setOrigin(0.5, 0);
    this.rightPanel.add(title);
    this.rightPanel.setData('panelWidth', panelWidth);
    this.rightPanel.setData('panelHeight', panelHeight);
    this.updateQuestion();
  }

  private updatePlantGrowth(): void {
    this.plantGraphics.removeAll(true);
    const stage = Math.floor((this.score / this.questions.length) * 5) + 1;
    const growth = (this.score / this.questions.length) * 100;
    const soil = this.add.ellipse(0, 40, 120, 40, 0x8B4513);
    this.plantGraphics.add(soil);
    if (growth > 0) {
      const stemHeight = Math.min(growth * 1.5, 120);
      const stem = this.add.rectangle(0, 40 - stemHeight / 2, 8, stemHeight, 0x2d5016);
      this.plantGraphics.add(stem);
    }
    if (stage >= 2) {
      const leftLeaf = this.add.ellipse(-25, 0, 40, 60, 0x4ade80);
      leftLeaf.setRotation(-0.5);
      this.plantGraphics.add(leftLeaf);
      const rightLeaf = this.add.ellipse(25, 0, 40, 60, 0x4ade80);
      rightLeaf.setRotation(0.5);
      this.plantGraphics.add(rightLeaf);
    }
    if (stage >= 4) {
      const leftLeaf2 = this.add.ellipse(-35, -30, 35, 55, 0x22c55e);
      leftLeaf2.setRotation(-0.6);
      this.plantGraphics.add(leftLeaf2);
      const rightLeaf2 = this.add.ellipse(35, -30, 35, 55, 0x22c55e);
      rightLeaf2.setRotation(0.6);
      this.plantGraphics.add(rightLeaf2);
    }
    this.stageText.setText(`Stage ${Math.min(stage, 5)}`);
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
    this.questionText = this.add.text(horizontalPadding, questionStartY, fullQuestionText, {
        fontSize: `${questionTextFontSize}px`,
        fontFamily: 'Arial, sans-serif',
        color: '#1f2937',
        wordWrap: { width: contentWidth },
        lineSpacing: questionTextFontSize * 0.4
      });
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

    // ========================================
    // CREATE NEXT BUTTON
    // ========================================
    const nextButtonX = panelWidth - horizontalPadding - (panelWidth * 0.13);
    const nextButtonY = panelHeight - nextButtonMargin;
    this.createNextButton(nextButtonX, nextButtonY, panelWidth);
    this.rightPanel.add(this.nextButton);

    // Update progress
    this.updateProgress();
  }

  private createOptionButton(option: { letter: string; text: string }, y: number, leftPadding: number, buttonWidth: number, buttonHeight: number, letterFontSize: number, textFontSize: number): Phaser.GameObjects.Container {
    const container = this.add.container(0, y);
    const buttonBg = this.add.graphics();
    buttonBg.fillStyle(0xdbeafe, 1);
    buttonBg.lineStyle(2, 0xe5e7eb);
    const cornerRadius = buttonHeight * 0.2;
    buttonBg.fillRoundedRect(leftPadding, -buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
    buttonBg.strokeRoundedRect(leftPadding, -buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
    container.add(buttonBg);
    const buttonHitArea = this.add.rectangle(leftPadding + buttonWidth / 2, 0, buttonWidth, buttonHeight, 0x000000, 0);
    const letterPaddingLeft = buttonWidth * 0.05;
    const letterText = this.add.text(leftPadding + letterPaddingLeft, 0, `${option.letter}.`, {
      fontSize: `${letterFontSize}px`,
      fontFamily: 'Arial, sans-serif',
      color: '#1f2937',
      fontStyle: 'bold'
    });
    letterText.setOrigin(0, 0.5);
    const optionTextPaddingLeft = buttonWidth * 0.15;
    const optionText = this.add.text(leftPadding + optionTextPaddingLeft, 0, option.text, {
      fontSize: `${textFontSize}px`,
      fontFamily: 'Arial, sans-serif',
      color: '#374151',
      wordWrap: { width: buttonWidth * 0.8 }
    });
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
        buttonBg.fillStyle(0xe0e7ff, 1);
        buttonBg.lineStyle(2, 0xe5e7eb);
        buttonBg.fillRoundedRect(leftPadding, -buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
        buttonBg.strokeRoundedRect(leftPadding, -buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
      }
    });
    buttonHitArea.on('pointerout', () => {
      if (this.selectedAnswer !== option.letter) {
        buttonBg.clear();
        buttonBg.fillStyle(0xdbeafe, 1);
        buttonBg.lineStyle(2, 0xe5e7eb);
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
    buttonBg.fillStyle(0xd1d5db);
    buttonBg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, borderRadius);
    const buttonText = this.add.text(-buttonWidth * 0.12, 0, 'NEXT', {
      fontSize: `${fontSize}px`,
      fontFamily: 'Arial, sans-serif',
      color: '#9ca3af',
      fontStyle: 'bold'
    });
    buttonText.setOrigin(0.5, 0.5);
    const arrow = this.add.text(buttonWidth * 0.22, 0, '→', {
      fontSize: `${fontSize + 4}px`,
      fontFamily: 'Arial, sans-serif',
      color: '#9ca3af'
    });
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
        bg.fillStyle(0xdbeafe, 1);
        bg.lineStyle(2, 0x3b82f6);
        bg.fillRoundedRect(leftPadding, -buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
        bg.strokeRoundedRect(leftPadding, -buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
      } else {
        bg.fillStyle(0xf3f4f6, 1);
        bg.lineStyle(2, 0xe5e7eb);
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
      bg.fillStyle(0x3b82f6);
      bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, borderRadius);
      text.setColor('#ffffff');
      arrow.setColor('#ffffff');
    } else {
      bg.fillStyle(0xd1d5db);
      bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, borderRadius);
      text.setColor('#9ca3af');
      arrow.setColor('#9ca3af');
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

  private showCompletion(): void {
     this.leftPanel.setVisible(false);
    this.rightPanel.setVisible(false);
    
    const { width, height } = this.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;

    const completionText = this.add.text(centerX, centerY - 80, 'Minigame Complete! 🎉', {
      fontSize: '48px',
      fontFamily: 'Arial, sans-serif',
      color: '#1f2937',
      fontStyle: 'bold'
    });

    completionText.setOrigin(0.5, 0.5);
    completionText.setDepth(20);
  
    const finalScoreText = this.add.text(centerX, centerY, `Final Score: ${this.score}/${this.questions.length}`, {
      fontSize: '32px',
      fontFamily: 'Arial, sans-serif',
      color: '#3b82f6',
      fontStyle: 'bold'
    });

    finalScoreText.setOrigin(0.5, 0.5);
    finalScoreText.setDepth(20);

    this.completionReturnButton = this.add.container(centerX, centerY + 100);
    this.completionReturnButton.setDepth(20);
    
    const returnBg = this.add.graphics();
    returnBg.fillStyle(0x3b82f6);
    returnBg.fillRoundedRect(-130, -35, 260, 70, 35);
    
    const returnText = this.add.text(0, 0, 'Return to House', {
      fontSize: '22px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    returnText.setOrigin(0.5, 0.5);
    
    this.completionReturnButton.add([returnBg, returnText]);
    
    const hitArea = this.add.rectangle(0, 0, 260, 70, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.on('pointerdown', () => this.scene.stop());
    this.completionReturnButton.add(hitArea);
    this.completionReturnButton.sendToBack(hitArea);
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