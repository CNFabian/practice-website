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
  
  // UI Elements
  private leftPanel!: Phaser.GameObjects.Container;
  private rightPanel!: Phaser.GameObjects.Container;
  private questionText!: Phaser.GameObjects.Text;
  private optionButtons: Phaser.GameObjects.Container[] = [];
  private nextButton!: Phaser.GameObjects.Container;
  private progressText!: Phaser.GameObjects.Text;
  private plantGraphics!: Phaser.GameObjects.Container;
  private stageText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'GrowYourNestMinigame' });
  }

  init(data: { questions?: QuizQuestion[] }) {
    this.questions = data.questions || this.getDefaultQuestions();
    this.currentQuestionIndex = 0;
    this.selectedAnswer = null;
    this.score = 0;
  }

  create() {
    const { width, height } = this.cameras.main;

    // No background - transparent

    // Create back button
    this.createBackButton();

    // Create header with title
    this.createHeader(width);

    // Create two-panel layout (both visible)
    this.createPanels(width, height);
  }

  private createBackButton(): void {
    const backButton = this.add.container(60, 48);
    
    // Back arrow
    const arrow = this.add.text(0, 0, '←', {
      fontSize: '28px',
      color: '#6b7280'
    });
    arrow.setOrigin(0.5);
    
    // Back text
    const text = this.add.text(30, 0, 'Module 1', {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: '#1f2937'
    });
    text.setOrigin(0, 0.5);
    
    backButton.add([arrow, text]);
    backButton.setDepth(100);
    
    // Make interactive
    const hitArea = this.add.rectangle(-10, 0, 180, 50, 0x000000, 0);
    hitArea.setOrigin(0, 0.5);
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.on('pointerdown', () => {
      this.scene.stop();
    });
    backButton.add(hitArea);
    backButton.sendToBack(hitArea);
  }

  private createHeader(width: number): void {
    const headerY = 48;
    
    // Title
    const titleText = this.add.text(width / 2, headerY, 'Grow Your Nest', {
      fontSize: '28px',
      fontFamily: 'Arial, sans-serif',
      color: '#1f2937',
      fontStyle: 'bold'
    });
    titleText.setOrigin(0.5, 0.5);
    titleText.setDepth(10);
  }

  private createPanels(width: number, height: number): void {
    const panelY = 120;
    const panelHeight = height - panelY - 40;
    const panelWidth = (width - 80) / 2 - 20;
    
    // Left panel - Growth visualization
    this.createLeftPanel(60, panelY, panelWidth, panelHeight);
    
    // Right panel - Question cards
    this.createRightPanel(width / 2 + 20, panelY, panelWidth, panelHeight);
  }

  private createLeftPanel(x: number, y: number, panelWidth: number, panelHeight: number): void {
    this.leftPanel = this.add.container(x, y);
    this.leftPanel.setDepth(5);

    // Panel background
    const panelBg = this.add.rectangle(panelWidth / 2, panelHeight / 2, panelWidth, panelHeight, 0xffffff, 1);
    panelBg.setStrokeStyle(2, 0xe5e7eb);
    this.leftPanel.add(panelBg);

    // Title
    const title = this.add.text(panelWidth / 2, 40, 'Growth', {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: '#1f2937',
      fontStyle: 'bold'
    });
    title.setOrigin(0.5, 0);
    this.leftPanel.add(title);

    // Plant container
    this.plantGraphics = this.add.container(panelWidth / 2, panelHeight / 2 + 20);
    this.leftPanel.add(this.plantGraphics);

    // Stage indicator at bottom (CREATE BEFORE calling updatePlantGrowth)
    this.stageText = this.add.text(panelWidth / 2, panelHeight - 40, 'Stage 1', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#6b7280'
    });
    this.stageText.setOrigin(0.5, 0);
    this.leftPanel.add(this.stageText);

    // Progress bar
    const progressBarWidth = panelWidth - 60;
    const progressBarBg = this.add.rectangle(panelWidth / 2, panelHeight - 20, progressBarWidth, 8, 0xe5e7eb);
    progressBarBg.setStrokeStyle(1, 0xd1d5db);
    this.leftPanel.add(progressBarBg);

    const progressBarFill = this.add.rectangle(
      (panelWidth / 2) - (progressBarWidth / 2),
      panelHeight - 20,
      0,
      8,
      0x22c55e
    );
    progressBarFill.setOrigin(0, 0.5);
    this.leftPanel.add(progressBarFill);
    this.leftPanel.setData('progressBar', progressBarFill);
    this.leftPanel.setData('progressBarWidth', progressBarWidth);

    // Progress text
    this.progressText = this.add.text(panelWidth - 30, panelHeight - 20, '0 / 100', {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#6b7280'
    });
    this.progressText.setOrigin(1, 0.5);
    this.leftPanel.add(this.progressText);
    
    // Draw initial plant (CALL AFTER stageText is created)
    this.updatePlantGrowth();
  }

  private createRightPanel(x: number, y: number, panelWidth: number, panelHeight: number): void {
    this.rightPanel = this.add.container(x, y);
    this.rightPanel.setDepth(5);

    // Panel background
    const panelBg = this.add.rectangle(panelWidth / 2, panelHeight / 2, panelWidth, panelHeight, 0xffffff, 1);
    panelBg.setStrokeStyle(2, 0xe5e7eb);
    this.rightPanel.add(panelBg);

    // Title
    const title = this.add.text(panelWidth / 2, 40, 'Question Cards', {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: '#1f2937',
      fontStyle: 'bold'
    });
    title.setOrigin(0.5, 0);
    this.rightPanel.add(title);

    // Store panel dimensions for later use
    this.rightPanel.setData('panelWidth', panelWidth);
    this.rightPanel.setData('panelHeight', panelHeight);

    // Initial question will be loaded
    this.updateQuestion();
  }

  private updatePlantGrowth(): void {
    // Clear existing plant
    this.plantGraphics.removeAll(true);

    const stage = Math.floor((this.score / this.questions.length) * 5) + 1;
    const growth = (this.score / this.questions.length) * 100;

    // Draw soil mound
    const soil = this.add.ellipse(0, 40, 120, 40, 0x8B4513);
    this.plantGraphics.add(soil);

    // Draw stem based on growth
    if (growth > 0) {
      const stemHeight = Math.min(growth * 1.5, 120);
      const stem = this.add.rectangle(0, 40 - stemHeight / 2, 8, stemHeight, 0x2d5016);
      this.plantGraphics.add(stem);
    }

    // Draw leaves based on stage
    if (stage >= 2) {
      // Left leaf
      const leftLeaf = this.add.ellipse(-25, 0, 40, 60, 0x4ade80);
      leftLeaf.setRotation(-0.5);
      this.plantGraphics.add(leftLeaf);
      
      // Right leaf
      const rightLeaf = this.add.ellipse(25, 0, 40, 60, 0x4ade80);
      rightLeaf.setRotation(0.5);
      this.plantGraphics.add(rightLeaf);
    }

    if (stage >= 4) {
      // Additional leaves
      const leftLeaf2 = this.add.ellipse(-35, -30, 35, 55, 0x22c55e);
      leftLeaf2.setRotation(-0.6);
      this.plantGraphics.add(leftLeaf2);
      
      const rightLeaf2 = this.add.ellipse(35, -30, 35, 55, 0x22c55e);
      rightLeaf2.setRotation(0.6);
      this.plantGraphics.add(rightLeaf2);
    }

    // Update stage text
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

    // Clear old question content (keep background and title)
    this.optionButtons.forEach(btn => btn.destroy());
    this.optionButtons = [];
    if (this.questionText) this.questionText.destroy();
    if (this.nextButton) this.nextButton.destroy();

    // Question number and text
    const questionNumber = this.add.text(30, 90, `${this.currentQuestionIndex + 1}.`, {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#1f2937',
      fontStyle: 'bold'
    });
    questionNumber.setOrigin(0, 0);
    this.rightPanel.add(questionNumber);

    this.questionText = this.add.text(60, 90, question.question, {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#1f2937',
      wordWrap: { width: panelWidth - 90 }
    });
    this.questionText.setOrigin(0, 0);
    this.rightPanel.add(this.questionText);

    // Create option buttons
    const startY = this.questionText.y + this.questionText.height + 40;
    const spacing = 70;

    question.options.forEach((option, index) => {
      const optionY = startY + (index * spacing);
      const optionContainer = this.createOptionButton(option, optionY, panelWidth);
      this.optionButtons.push(optionContainer);
      this.rightPanel.add(optionContainer);
    });

    // Create next button at bottom right
    this.createNextButton(panelWidth - 100, panelHeight - 40);
    this.rightPanel.add(this.nextButton);

    // Update progress
    this.updateProgress();
  }

  private createOptionButton(option: { letter: string; text: string }, y: number, panelWidth: number): Phaser.GameObjects.Container {
    const container = this.add.container(0, y);

    const buttonWidth = panelWidth - 60;
    const buttonBg = this.add.rectangle(panelWidth / 2, 0, buttonWidth, 60, 0xf3f4f6, 1);
    buttonBg.setStrokeStyle(2, 0xe5e7eb);

    const letterText = this.add.text(40, 0, `${option.letter}.`, {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#1f2937',
      fontStyle: 'bold'
    });
    letterText.setOrigin(0, 0.5);

    const optionText = this.add.text(80, 0, option.text, {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#374151',
      wordWrap: { width: buttonWidth - 100 }
    });
    optionText.setOrigin(0, 0.5);

    container.add([buttonBg, letterText, optionText]);
    container.setData('letter', option.letter);
    container.setData('bg', buttonBg);

    buttonBg.setInteractive({ useHandCursor: true });
    buttonBg.on('pointerdown', () => this.handleAnswerSelect(option.letter));
    buttonBg.on('pointerover', () => {
      if (this.selectedAnswer !== option.letter) {
        buttonBg.setFillStyle(0xe5e7eb);
      }
    });
    buttonBg.on('pointerout', () => {
      if (this.selectedAnswer !== option.letter) {
        buttonBg.setFillStyle(0xf3f4f6);
      }
    });

    return container;
  }

  private createNextButton(x: number, y: number): void {
    this.nextButton = this.add.container(x, y);

    const buttonBg = this.add.graphics();
    buttonBg.fillStyle(0xd1d5db);
    buttonBg.fillRoundedRect(-70, -20, 140, 40, 20);

    const buttonText = this.add.text(-10, 0, 'NEXT', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#9ca3af',
      fontStyle: 'bold'
    });
    buttonText.setOrigin(0.5, 0.5);

    const arrow = this.add.text(40, 0, '→', {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#9ca3af'
    });
    arrow.setOrigin(0.5, 0.5);

    this.nextButton.add([buttonBg, buttonText, arrow]);
    this.nextButton.setData('bg', buttonBg);
    this.nextButton.setData('text', buttonText);
    this.nextButton.setData('arrow', arrow);
    this.nextButton.setData('enabled', false);

    // Make interactive area
    const hitArea = this.add.rectangle(0, 0, 140, 40, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.on('pointerdown', () => this.handleNext());
    this.nextButton.add(hitArea);
    this.nextButton.sendToBack(hitArea);
  }

  private handleAnswerSelect(letter: string): void {
    this.selectedAnswer = letter;

    // Update all option buttons
    this.optionButtons.forEach(btn => {
      const bg = btn.getData('bg') as Phaser.GameObjects.Rectangle;
      const btnLetter = btn.getData('letter') as string;
      
      if (btnLetter === letter) {
        bg.setFillStyle(0xdbeafe);
        bg.setStrokeStyle(2, 0x3b82f6);
      } else {
        bg.setFillStyle(0xf3f4f6);
        bg.setStrokeStyle(2, 0xe5e7eb);
      }
    });

    // Enable next button
    this.updateNextButton(true);
  }

  private updateNextButton(enabled: boolean): void {
    const bg = this.nextButton.getData('bg') as Phaser.GameObjects.Graphics;
    const text = this.nextButton.getData('text') as Phaser.GameObjects.Text;
    const arrow = this.nextButton.getData('arrow') as Phaser.GameObjects.Text;

    this.nextButton.setData('enabled', enabled);

    bg.clear();
    if (enabled) {
      bg.fillStyle(0x3b82f6);
      bg.fillRoundedRect(-70, -20, 140, 40, 20);
      text.setColor('#ffffff');
      arrow.setColor('#ffffff');
    } else {
      bg.fillStyle(0xd1d5db);
      bg.fillRoundedRect(-70, -20, 140, 40, 20);
      text.setColor('#9ca3af');
      arrow.setColor('#9ca3af');
    }
  }

  private handleNext(): void {
    if (!this.nextButton.getData('enabled')) return;

    const question = this.questions[this.currentQuestionIndex];
    
    // Check if answer is correct
    if (this.selectedAnswer === question.correctAnswer) {
      this.score++;
    }

    // Move to next question
    this.currentQuestionIndex++;
    this.selectedAnswer = null;
    this.updateNextButton(false);
    
    // Update plant growth
    this.updatePlantGrowth();
    this.updateProgress();
    
    // Load next question or show completion
    this.updateQuestion();
  }

  private updateProgress(): void {
    const totalQuestions = this.questions.length;
    const progress = (this.score / totalQuestions) * 100;
    
    this.progressText.setText(`${Math.round(progress)} / 100`);
    
    // Update progress bar
    const progressBar = this.leftPanel.getData('progressBar') as Phaser.GameObjects.Rectangle;
    const progressBarWidth = this.leftPanel.getData('progressBarWidth') as number;
    
    if (progressBar) {
      progressBar.width = (progress / 100) * progressBarWidth;
    }
  }

  private showCompletion(): void {
    // Hide both panels
    this.leftPanel.setVisible(false);
    this.rightPanel.setVisible(false);
    
    const { width, height } = this.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;

    // Completion message
    const completionText = this.add.text(centerX, centerY - 80, 'Minigame Complete! 🎉', {
      fontSize: '36px',
      fontFamily: 'Arial, sans-serif',
      color: '#1f2937',
      fontStyle: 'bold'
    });
    completionText.setOrigin(0.5, 0.5);
    completionText.setDepth(20);

    const finalScoreText = this.add.text(centerX, centerY, `Final Score: ${this.score}/${this.questions.length}`, {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: '#3b82f6',
      fontStyle: 'bold'
    });
    finalScoreText.setOrigin(0.5, 0.5);
    finalScoreText.setDepth(20);

    // Return button
    const returnButton = this.add.container(centerX, centerY + 100);
    returnButton.setDepth(20);
    
    const returnBg = this.add.graphics();
    returnBg.fillStyle(0x3b82f6);
    returnBg.fillRoundedRect(-100, -25, 200, 50, 25);
    
    const returnText = this.add.text(0, 0, 'Return to House', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    returnText.setOrigin(0.5, 0.5);
    
    returnButton.add([returnBg, returnText]);
    
    const hitArea = this.add.rectangle(0, 0, 200, 50, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.on('pointerdown', () => {
      this.scene.stop();
      // Return to previous scene (House scene or wherever the minigame was launched from)
      // this.scene.start('HouseScene'); // Uncomment and adjust as needed
    });
    returnButton.add(hitArea);
    returnButton.sendToBack(hitArea);
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