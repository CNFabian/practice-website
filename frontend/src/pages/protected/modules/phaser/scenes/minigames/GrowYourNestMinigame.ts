import Phaser from 'phaser';
import { createTextStyle } from '../../constants/Typography';
import { COLORS } from '../../constants/Colors';
import { ASSET_KEYS } from '../../constants/AssetKeys';
import {
  submitLessonAnswers,
  saveFreeRoamProgress,
} from '../../../../../../services/growYourNestAPI';
import type {
  GYNGameMode,
  GYNMinigameInitData,
  GYNMinigameResult,
  LessonAnswerSubmission,
  TreeState,
  TreeStateWithTransition,
} from '../../../../../../types/growYourNest.types';

// ═══════════════════════════════════════════════════════════════
// LEGACY INTERFACE (kept for backward compatibility with walkthrough)
// ═══════════════════════════════════════════════════════════════
interface LegacyQuizQuestion {
  id: number;
  question: string;
  options: Array<{
    letter: string;
    text: string;
  }>;
  correctAnswer: string;
}

// ═══════════════════════════════════════════════════════════════
// INTERNAL UNIFIED QUESTION FORMAT
// ═══════════════════════════════════════════════════════════════
interface InternalQuestion {
  id: string;
  question: string;
  options: Array<{
    letter: string;
    text: string;
    answerId: string; // UUID for backend, empty for legacy
  }>;
  /** For legacy mode: letter of correct answer. For API mode: null (server-side) */
  correctAnswer: string | null;
  explanation: string;
}

export default class GrowYourNestMinigame extends Phaser.Scene {
  // ─── Core game state ───────────────────────────────────────
  private questions: InternalQuestion[] = [];
  private currentQuestionIndex: number = 0;
  private selectedAnswer: string | null = null;
  private score: number = 0;
  private consecutiveCorrect: number = 0;
  private fertilizerBonusCount: number = 0;
  private totalGrowthPointsEarned: number = 0;
  private totalCoinsEarned: number = 0;

  // ─── API integration state ─────────────────────────────────
  private gameMode: GYNGameMode | 'legacy' = 'legacy';
  private lessonId: string | null = null;
  private moduleId: string | null = null;
  private treeState: TreeState | null = null;
  private lessonAnswers: LessonAnswerSubmission[] = [];
  private isSubmitting: boolean = false;
  private lastServerResponse: TreeStateWithTransition | null = null;

  // ─── UI elements (unchanged from original) ─────────────────
  private leftPanel!: Phaser.GameObjects.Container;
  private rightPanel!: Phaser.GameObjects.Container;
  private questionText!: Phaser.GameObjects.Text;
  private questionNumber!: Phaser.GameObjects.Text;
  private optionButtons: Phaser.GameObjects.Container[] = [];
  private nextButton!: Phaser.GameObjects.Container;
  private plantGraphics!: Phaser.GameObjects.Container;
  private stageText!: Phaser.GameObjects.Text;
  private progressPercentText!: Phaser.GameObjects.Text;
  private backButton?: Phaser.GameObjects.Container;
  private headerTitle?: Phaser.GameObjects.Text;
  private completionReturnButton?: Phaser.GameObjects.Container;
  private showingStartScreen: boolean = true;
  private moduleNumber: number = 1;
  private leftPanelBackground?: Phaser.GameObjects.Image;
  private floatingTween?: Phaser.Tweens.Tween;
  private wateringCanImage?: Phaser.GameObjects.Image;
  private isWateringAnimationPlaying: boolean = false;

  constructor() {
    super({ key: 'GrowYourNestMinigame' });
  }

  /**
   * Scene init - accepts either new GYNMinigameInitData or legacy QuizQuestion[] format.
   * This ensures backward compatibility with the walkthrough system.
   */
  init(data: GYNMinigameInitData | { questions?: LegacyQuizQuestion[]; moduleNumber?: number }) {
    // Reset all state
    this.currentQuestionIndex = 0;
    this.selectedAnswer = null;
    this.score = 0;
    this.consecutiveCorrect = 0;
    this.fertilizerBonusCount = 0;
    this.totalGrowthPointsEarned = 0;
    this.totalCoinsEarned = 0;
    this.optionButtons = [];
    this.showingStartScreen = true;
    this.lessonAnswers = [];
    this.isSubmitting = false;
    this.lastServerResponse = null;

    // Detect whether we're receiving new API data or legacy data
    if ('mode' in data && (data.mode === 'lesson' || data.mode === 'freeroam')) {
      // ─── New API mode ───────────────────────────────────
      const apiData = data as GYNMinigameInitData;
      this.gameMode = apiData.mode;
      this.lessonId = apiData.lessonId || null;
      this.moduleId = apiData.moduleId || null;
      this.treeState = apiData.treeState || null;
      this.moduleNumber = apiData.moduleNumber || 1;
      this.showingStartScreen = apiData.showStartScreen !== false;

      // Transform API questions to internal format
      this.questions = apiData.questions.map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options.map((opt) => ({
          letter: opt.letter,
          text: opt.text,
          answerId: opt.answerId,
        })),
        correctAnswer: null, // Server-side validation
        explanation: q.explanation || '',
      }));

      console.log(`🌳 GYN Minigame initialized in ${this.gameMode} mode`, {
        questionCount: this.questions.length,
        lessonId: this.lessonId,
        moduleId: this.moduleId,
        treeStage: this.treeState?.current_stage,
        treePoints: this.treeState?.growth_points,
      });
    } else {
      // ─── Legacy mode (walkthrough / fallback) ───────────
      this.gameMode = 'legacy';
      this.lessonId = null;
      this.moduleId = null;
      this.treeState = null;
      this.moduleNumber = (data as any).moduleNumber || 1;

      const legacyQuestions = (data as any).questions as LegacyQuizQuestion[] | undefined;
      if (legacyQuestions && legacyQuestions.length > 0) {
        this.questions = legacyQuestions.map((q) => ({
          id: String(q.id),
          question: q.question,
          options: q.options.map((opt) => ({
            letter: opt.letter,
            text: opt.text,
            answerId: '', // No backend ID in legacy mode
          })),
          correctAnswer: q.correctAnswer,
          explanation: '',
        }));
      } else {
        this.questions = this.getDefaultQuestions();
      }

      console.log('🌳 GYN Minigame initialized in legacy mode', {
        questionCount: this.questions.length,
      });
    }
  }

  create() {
    const { width, height } = this.cameras.main;
    this.createBackButton();
    this.createHeader(width);
    this.createPanels(width, height);

    // Slide-in animation: components enter from the right
    this.slideInMinigameComponents(width);

    this.scale.on('resize', this.handleResize, this);
  }

  // ═══════════════════════════════════════════════════════════════
  // ANSWER HANDLING WITH API INTEGRATION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Called when user selects an answer option.
   * In legacy mode: checks correctAnswer directly.
   * In API mode: records the answer for submission.
   */
  private handleAnswerSelection(selectedLetter: string): void {
    if (this.selectedAnswer || this.isSubmitting) return;
    this.selectedAnswer = selectedLetter;

    const currentQuestion = this.questions[this.currentQuestionIndex];

    if (this.gameMode === 'legacy') {
      // ─── Legacy: immediate local validation ─────────────
      const isCorrect = selectedLetter === currentQuestion.correctAnswer;
      if (isCorrect) {
        this.score++;
        this.consecutiveCorrect++;
      } else {
        this.consecutiveCorrect = 0;
      }
      this.showAnswerFeedback(isCorrect);
    } else if (this.gameMode === 'lesson') {
      // ─── Lesson mode: collect answer, validate on submit ──
      // We don't know if it's correct yet - that comes from the server.
      // For now, just record the selection and show as "selected" state.
      const selectedOption = currentQuestion.options.find((o) => o.letter === selectedLetter);
      if (selectedOption) {
        this.lessonAnswers.push({
          question_id: currentQuestion.id,
          answer_id: selectedOption.answerId,
          is_correct: false, // Will be updated by server response
        });
      }
      // In lesson mode, move to next question immediately (no per-question feedback)
      // The feedback comes after all 3 are submitted
      this.showAnswerSelected();
    } else if (this.gameMode === 'freeroam') {
      // ─── Free roam: submit immediately after each question ──
      this.isSubmitting = true;
      const selectedOption = currentQuestion.options.find((o) => o.letter === selectedLetter);

      if (selectedOption && this.moduleId) {
        // We don't know is_correct yet - send it and let server determine
        saveFreeRoamProgress(this.moduleId, {
          question_id: currentQuestion.id,
          answer_id: selectedOption.answerId,
          is_correct: false, // Server determines this
          consecutive_correct: this.consecutiveCorrect,
        })
          .then((response) => {
            this.isSubmitting = false;
            this.lastServerResponse = response.tree_state;

            const isCorrect = response.is_correct;
            if (isCorrect) {
              this.score++;
              this.consecutiveCorrect++;
            } else {
              this.consecutiveCorrect = 0;
            }

            if (response.fertilizer_bonus) {
              this.fertilizerBonusCount++;
            }
            this.totalGrowthPointsEarned += response.growth_points_earned;
            this.totalCoinsEarned += response.coins_earned;

            // Update tree state from server
            this.treeState = {
              growth_points: response.tree_state.growth_points,
              current_stage: response.tree_state.current_stage,
              total_stages: response.tree_state.total_stages,
              points_per_stage: response.tree_state.points_per_stage || 50,
              completed: response.tree_state.completed || response.tree_state.just_completed,
            };

            this.showAnswerFeedback(isCorrect);
          })
          .catch((error) => {
            console.error('🌳 Error saving free roam progress:', error);
            this.isSubmitting = false;
            // Fallback: treat as incorrect and continue
            this.consecutiveCorrect = 0;
            this.showAnswerFeedback(false);
          });
      } else {
        this.isSubmitting = false;
        this.showAnswerFeedback(false);
      }
    }
  }

  /**
   * Called when user clicks "Next" after answering a question.
   */
  private handleNextQuestion(): void {
    if (this.isSubmitting) return;

    this.currentQuestionIndex++;

    if (this.currentQuestionIndex >= this.questions.length) {
      // ─── All questions answered ─────────────────────────
      if (this.gameMode === 'lesson') {
        this.submitLessonResults();
      } else {
        this.showCompletionScreen();
      }
    } else {
      this.selectedAnswer = null;
      this.updateQuestion();
    }
  }

  /**
   * Lesson mode: Submit all answers at once when all 3 questions are done.
   */
  private submitLessonResults(): void {
    if (this.gameMode !== 'lesson' || !this.lessonId) {
      this.showCompletionScreen();
      return;
    }

    this.isSubmitting = true;

    submitLessonAnswers(this.lessonId, {
      answers: this.lessonAnswers,
      consecutive_correct: this.consecutiveCorrect,
    })
      .then((response) => {
        this.isSubmitting = false;
        this.lastServerResponse = response.tree_state;
        this.score = response.correct_count;
        this.totalGrowthPointsEarned = response.growth_points_earned;
        this.totalCoinsEarned = response.coins_earned;

        if (response.fertilizer_bonus) {
          this.fertilizerBonusCount++;
        }

        // Update tree state from server
        this.treeState = {
          growth_points: response.tree_state.growth_points,
          current_stage: response.tree_state.current_stage,
          total_stages: response.tree_state.total_stages,
          points_per_stage: response.tree_state.points_per_stage || 50,
          completed: response.tree_state.completed || response.tree_state.just_completed,
        };

        console.log('🌳 Lesson results submitted:', {
          correct: response.correct_count,
          total: response.total_questions,
          pointsEarned: response.growth_points_earned,
          coinsEarned: response.coins_earned,
        });

        this.showCompletionScreen();
      })
      .catch((error) => {
        console.error('🌳 Error submitting lesson results:', error);
        this.isSubmitting = false;
        // Show completion screen anyway with local data
        this.showCompletionScreen();
      });
  }

  /**
   * Show visual feedback that an answer was selected (used in lesson mode
   * where we don't have immediate correct/incorrect from server).
   */
  private showAnswerSelected(): void {
    // Highlight the selected option
    this.optionButtons.forEach((btn) => {
      const letterText = btn.getAt(1) as Phaser.GameObjects.Text;
      const optionLetter = letterText?.text?.trim();

      if (optionLetter === this.selectedAnswer) {
        const bg = btn.getAt(0) as Phaser.GameObjects.Graphics;
        if (bg) {
          const btnWidth = btn.getData('btnWidth') as number;
          const btnHeight = btn.getData('btnHeight') as number;
          bg.clear();
          bg.fillStyle(COLORS.ELEGANT_BLUE, 0.3);
          bg.fillRoundedRect(0, 0, btnWidth, btnHeight, 12);
          bg.lineStyle(2, COLORS.LOGO_BLUE);
          bg.strokeRoundedRect(0, 0, btnWidth, btnHeight, 12);
        }
      }

      // Disable all options
      const hitArea = btn.getData('hitArea') as Phaser.GameObjects.Rectangle;
      if (hitArea) hitArea.disableInteractive();
    });

    // Show next button after a brief delay
    this.time.delayedCall(400, () => {
      this.showNextButton();
    });
  }

  /**
   * Show correct/incorrect feedback on the answer buttons.
   * Used in legacy mode and free roam mode.
   */
  private showAnswerFeedback(isCorrect: boolean): void {
    this.optionButtons.forEach((btn) => {
      const letterText = btn.getAt(1) as Phaser.GameObjects.Text;
      const optionLetter = letterText?.text?.trim();
      const currentQuestion = this.questions[this.currentQuestionIndex];

      const bg = btn.getAt(0) as Phaser.GameObjects.Graphics;
      const btnWidth = btn.getData('btnWidth') as number;
      const btnHeight = btn.getData('btnHeight') as number;

      if (optionLetter === this.selectedAnswer) {
        if (bg) {
          bg.clear();
          bg.fillStyle(isCorrect ? COLORS.STATUS_GREEN : COLORS.STATUS_RED, 1);
          bg.fillRoundedRect(0, 0, btnWidth, btnHeight, 12);
        }
      } else if (this.gameMode === 'legacy' && optionLetter === currentQuestion.correctAnswer) {
        // In legacy mode, highlight the correct answer
        if (bg) {
          bg.clear();
          bg.fillStyle(COLORS.STATUS_GREEN, 0.4);
          bg.fillRoundedRect(0, 0, btnWidth, btnHeight, 12);
          bg.lineStyle(2, COLORS.STATUS_GREEN);
          bg.strokeRoundedRect(0, 0, btnWidth, btnHeight, 12);
        }
      }

      // Disable all options
      const hitArea = btn.getData('hitArea') as Phaser.GameObjects.Rectangle;
      if (hitArea) hitArea.disableInteractive();
    });

    // Update plant growth visual
    this.updatePlantGrowth();

    // Play watering animation if correct
    if (isCorrect) {
      this.playWateringAnimation();
    }

    // Show next button after a brief delay
    this.time.delayedCall(800, () => {
      this.showNextButton();
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // COMPLETION & RESULTS
  // ═══════════════════════════════════════════════════════════════

  private showCompletionScreen(): void {
    // Clear existing right panel content
    const panelWidth = this.rightPanel.getData('panelWidth') as number;
    const panelHeight = this.rightPanel.getData('panelHeight') as number;

    // Remove all children except the background (index 0) and title (index 1)
    while (this.rightPanel.length > 2) {
      const child = this.rightPanel.getAt(this.rightPanel.length - 1);
      if (child) {
        const hitArea = (child as any).getData?.('hitArea') as Phaser.GameObjects.Rectangle;
        if (hitArea && hitArea.input) {
          hitArea.removeAllListeners();
          hitArea.disableInteractive();
        }
        child.destroy();
      }
    }

    const centerX = panelWidth / 2;

    // ─── Score display ────────────────────────────────────
    const scoreY = panelHeight * 0.2;
    const scoreText = this.add.text(
      centerX,
      scoreY,
      `${this.score} / ${this.questions.length}`,
      createTextStyle('H1', COLORS.TEXT_PRIMARY, { fontSize: '64px' })
    );
    scoreText.setOrigin(0.5, 0.5);
    this.rightPanel.add(scoreText);

    const scoreLabel = this.add.text(
      centerX,
      scoreY + 50,
      'Questions Correct',
      createTextStyle('BODY_MEDIUM', COLORS.TEXT_SECONDARY, { fontSize: '24px' })
    );
    scoreLabel.setOrigin(0.5, 0);
    this.rightPanel.add(scoreLabel);

    // ─── Points & Coins earned (API mode only) ────────────
    if (this.gameMode !== 'legacy') {
      const detailsStartY = scoreY + 110;

      // Growth points
      const pointsText = this.add.text(
        centerX,
        detailsStartY,
        `🌱 +${this.totalGrowthPointsEarned} Growth Points`,
        createTextStyle('BODY_BOLD', COLORS.TEXT_PRIMARY, { fontSize: '28px' })
      );
      pointsText.setOrigin(0.5, 0);
      this.rightPanel.add(pointsText);

      // Coins
      const coinsText = this.add.text(
        centerX,
        detailsStartY + 45,
        `🪙 +${this.totalCoinsEarned} Nest Coins`,
        createTextStyle('BODY_BOLD', '#FDB212', { fontSize: '28px' })
      );
      coinsText.setOrigin(0.5, 0);
      this.rightPanel.add(coinsText);

      // Fertilizer bonus indicator
      if (this.fertilizerBonusCount > 0) {
        const fertText = this.add.text(
          centerX,
          detailsStartY + 90,
          `🧪 ${this.fertilizerBonusCount}x Fertilizer Bonus!`,
          createTextStyle('BODY_MEDIUM', COLORS.TEXT_SUCCESS, { fontSize: '22px' })
        );
        fertText.setOrigin(0.5, 0);
        this.rightPanel.add(fertText);
      }

      // Tree stage info
      if (this.treeState) {
        const stageY = detailsStartY + (this.fertilizerBonusCount > 0 ? 130 : 90);
        const stageInfo = this.add.text(
          centerX,
          stageY,
          this.treeState.completed
            ? '🌳 Tree Fully Grown!'
            : `🌱 Tree Stage: ${this.treeState.current_stage} / ${this.treeState.total_stages}`,
          createTextStyle('BODY_MEDIUM', COLORS.TEXT_SECONDARY, { fontSize: '22px' })
        );
        stageInfo.setOrigin(0.5, 0);
        this.rightPanel.add(stageInfo);
      }
    }

    // ─── Return button ────────────────────────────────────
    this.createCompletionReturnButton(panelWidth, panelHeight);

    // Final plant growth update
    this.updatePlantGrowth();

    // Emit result event for parent components
    this.emitResult();
  }

  /**
   * Emit the game result event so React components can respond.
   */
  private emitResult(): void {
    const result: GYNMinigameResult = {
      mode: this.gameMode === 'legacy' ? 'lesson' : this.gameMode,
      lessonId: this.lessonId || undefined,
      moduleId: this.moduleId || undefined,
      totalQuestions: this.questions.length,
      correctCount: this.score,
      growthPointsEarned: this.totalGrowthPointsEarned,
      coinsEarned: this.totalCoinsEarned,
      fertilizerBonuses: this.fertilizerBonusCount,
      treeState: this.lastServerResponse || this.treeState || {
        growth_points: 0,
        current_stage: 0,
        total_stages: 5,
        points_per_stage: 50,
        completed: false,
      },
      consecutiveCorrect: this.consecutiveCorrect,
    };

    this.events.emit('minigameResult', result);
  }

  // ═══════════════════════════════════════════════════════════════
  // ALL ORIGINAL UI METHODS PRESERVED BELOW
  // (handleResize, shutdown, slideIn, createBackButton, createHeader,
  //  createPanels, createLeftPanel, createRightPanel, showStartScreen,
  //  clearStartScreen, showQuestionsForWalkthrough, updatePlantGrowth,
  //  updateQuestion, showNextButton, createCompletionReturnButton,
  //  getDefaultQuestions, playWateringAnimation)
  // ═══════════════════════════════════════════════════════════════

  private handleResize(): void {
    this.tweens.killAll();

    this.optionButtons.forEach((btn) => {
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

    if (this.backButton) this.backButton.destroy();
    if (this.headerTitle) this.headerTitle.destroy();
    if (this.leftPanel) this.leftPanel.destroy();
    if (this.rightPanel) this.rightPanel.destroy();

    this.optionButtons = [];

    const { width, height } = this.scale;
    this.createBackButton();
    this.createHeader(width);
    this.createPanels(width, height);
  }

  shutdown() {
    this.tweens.killAll();
    if (this.floatingTween) {
      this.floatingTween.stop();
      this.floatingTween = undefined;
    }
    this.scale.off('resize', this.handleResize, this);
  }

  private slideInMinigameComponents(width: number): void {
    const offScreenX = width + 200;
    const duration = 600;
    const ease = 'Power2';

    if (this.backButton) {
      this.backButton.x = offScreenX;
      this.tweens.add({
        targets: this.backButton,
        x: 60,
        duration,
        ease,
      });
    }

    if (this.headerTitle) {
      this.headerTitle.x = offScreenX;
      this.tweens.add({
        targets: this.headerTitle,
        x: width / 2,
        duration,
        ease,
      });
    }

    if (this.leftPanel) {
      this.leftPanel.x = offScreenX;
      this.tweens.add({
        targets: this.leftPanel,
        x: 60,
        duration,
        ease,
        onUpdate: () => {
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
        },
      });
    }

    if (this.rightPanel) {
      this.rightPanel.x = offScreenX;
      this.tweens.add({
        targets: this.rightPanel,
        x: width / 2 + 20,
        duration,
        ease,
      });
    }
  }

  private createBackButton(): void {
    this.backButton = this.add.container(60, 48);
    const arrow = this.add.text(0, 0, '←', { fontSize: '48px', color: COLORS.TEXT_SECONDARY });
    arrow.setOrigin(0.5);

    const text = this.add.text(
      40,
      0,
      `Module ${this.moduleNumber}`,
      createTextStyle('H2', COLORS.TEXT_PRIMARY, { fontSize: '36px' })
    );
    text.setOrigin(0, 0.5);
    this.backButton.add([arrow, text]);
    this.backButton.setDepth(100);
    const hitArea = this.add.rectangle(-10, 0, 250, 70, 0x000000, 0);
    hitArea.setOrigin(0, 0.5);
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.on('pointerdown', () => {
      this.events.emit('minigameCompleted');
      this.scene.stop();
      this.scene.resume('HouseScene');
    });
    this.backButton.add(hitArea);
    this.backButton.sendToBack(hitArea);
  }

  private createHeader(width: number): void {
    this.headerTitle = this.add.text(
      width / 2,
      48,
      'Grow Your Nest',
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
    this.leftPanel.setData('panelWidth', panelWidth);
    this.leftPanel.setData('panelHeight', panelHeight);

    const panelBg = this.add.graphics();
    panelBg.fillStyle(COLORS.PURE_WHITE, 1);
    panelBg.lineStyle(2, COLORS.UNAVAILABLE_BUTTON);
    const cornerRadius = 16;
    panelBg.fillRoundedRect(0, 0, panelWidth, panelHeight, cornerRadius);
    panelBg.strokeRoundedRect(0, 0, panelWidth, panelHeight, cornerRadius);
    this.leftPanel.add(panelBg);

    if (this.textures.exists(ASSET_KEYS.GROW_YOUR_NEST_BACKGROUND)) {
      this.leftPanelBackground = this.add.image(
        panelWidth / 2,
        panelHeight / 2,
        ASSET_KEYS.GROW_YOUR_NEST_BACKGROUND
      );
      const scaleX = panelWidth / this.leftPanelBackground.width;
      const scaleY = panelHeight / this.leftPanelBackground.height;
      const scale = Math.max(scaleX, scaleY);
      this.leftPanelBackground.setScale(scale);

      const maskGraphics = this.make.graphics({});
      maskGraphics.fillStyle(0xffffff);
      maskGraphics.fillRoundedRect(x, y, panelWidth, panelHeight, cornerRadius);
      const mask = maskGraphics.createGeometryMask();
      this.leftPanelBackground.setMask(mask);
      this.leftPanel.add(this.leftPanelBackground);
    }

    // Plant/tree graphics container
    this.plantGraphics = this.add.container(panelWidth / 2, panelHeight * 0.65);
    this.leftPanel.add(this.plantGraphics);

    // Stage text
    this.stageText = this.add.text(
      panelWidth / 2,
      panelHeight - 60,
      '',
      createTextStyle('BODY_MEDIUM', COLORS.TEXT_SECONDARY, { fontSize: '20px' })
    );
    this.stageText.setOrigin(0.5, 0.5);
    this.leftPanel.add(this.stageText);

    // Progress percentage
    this.progressPercentText = this.add.text(
      panelWidth / 2,
      panelHeight - 30,
      '',
      createTextStyle('BODY_LIGHT', COLORS.TEXT_SECONDARY, { fontSize: '16px' })
    );
    this.progressPercentText.setOrigin(0.5, 0.5);
    this.leftPanel.add(this.progressPercentText);

    // Initial plant display
    this.updatePlantGrowth();
  }

  private createRightPanel(x: number, y: number, panelWidth: number, panelHeight: number): void {
    this.rightPanel = this.add.container(x, y);
    this.rightPanel.setDepth(5);

    const panelBg = this.add.graphics();
    panelBg.fillStyle(COLORS.PURE_WHITE, 1);
    panelBg.lineStyle(2, COLORS.UNAVAILABLE_BUTTON);
    const cornerRadius = 16;
    panelBg.fillRoundedRect(0, 0, panelWidth, panelHeight, cornerRadius);
    panelBg.strokeRoundedRect(0, 0, panelWidth, panelHeight, cornerRadius);
    this.rightPanel.add(panelBg);

    const title = this.add.text(
      panelWidth / 2,
      40,
      'Question Cards',
      createTextStyle('H2', COLORS.TEXT_PRIMARY, { fontSize: '36px' })
    );
    title.setOrigin(0.5, 0);
    this.rightPanel.add(title);
    this.rightPanel.setData('panelWidth', panelWidth);
    this.rightPanel.setData('panelHeight', panelHeight);

    if (this.showingStartScreen) {
      this.showStartScreen();
    } else {
      this.updateQuestion();
    }
  }

  private showStartScreen(): void {
    const panelWidth = this.rightPanel.getData('panelWidth') as number;
    const panelHeight = this.rightPanel.getData('panelHeight') as number;

    const HORIZONTAL_PADDING = panelWidth * 0.08;
    const contentWidth = panelWidth - HORIZONTAL_PADDING * 2;

    const birdSize = Math.min(220, panelWidth * 0.45);
    const birdY = panelHeight * 0.35;

    let birdGraphic: Phaser.GameObjects.Image | Phaser.GameObjects.Graphics;

    if (this.textures.exists('bird_celebration')) {
      birdGraphic = this.add.image(panelWidth / 2, birdY, 'bird_celebration');
      (birdGraphic as Phaser.GameObjects.Image).setDisplaySize(birdSize, birdSize);
    } else {
      birdGraphic = this.add.graphics();
      (birdGraphic as Phaser.GameObjects.Graphics).fillStyle(COLORS.ELEGANT_BLUE, 0.3);
      (birdGraphic as Phaser.GameObjects.Graphics).fillCircle(panelWidth / 2, birdY, birdSize / 2);
    }
    this.rightPanel.add(birdGraphic);

    if (!this.textures.exists('bird_celebration')) {
      const birdEmoji = this.add.text(panelWidth / 2, birdY, '🐦', {
        fontSize: `${birdSize * 0.6}px`,
      });
      birdEmoji.setOrigin(0.5, 0.5);
      this.rightPanel.add(birdEmoji);
    }

    const descriptionY = birdY + birdSize / 2 + panelHeight * 0.08;
    const descriptionFontSize = Math.round(panelWidth * 0.038);

    // Mode-specific description
    let descriptionText = `Answer questions to earn water and fertilizer to grow your tree! Get 3 correct in a row for a fertilizer bonus.`;
    if (this.gameMode === 'lesson') {
      descriptionText = `Answer 3 questions about this lesson to help your tree grow! Get 3 correct in a row for a fertilizer bonus.`;
    } else if (this.gameMode === 'freeroam') {
      descriptionText = `Free Roam mode! Answer questions from all lessons to keep growing your tree. Progress is saved after each question.`;
    }

    const description = this.add.text(panelWidth / 2, descriptionY, descriptionText, {
      ...createTextStyle('BODY_LIGHT', COLORS.TEXT_SECONDARY, {
        fontSize: `${descriptionFontSize}px`,
      }),
      wordWrap: { width: contentWidth },
      align: 'center',
    });
    description.setOrigin(0.5, 0);
    this.rightPanel.add(description);

    // Start button
    const buttonY = panelHeight * 0.82;
    const buttonWidth = contentWidth * 0.6;
    const buttonHeight = panelHeight * 0.08;
    const buttonFontSize = Math.round(panelWidth * 0.04);

    const startButton = this.add.container(panelWidth / 2, buttonY);

    const btnBg = this.add.graphics();
    btnBg.fillStyle(COLORS.LOGO_BLUE, 1);
    btnBg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 12);

    const btnText = this.add.text(0, 0, 'START', {
      ...createTextStyle('BUTTON', COLORS.TEXT_PURE_WHITE, {
        fontSize: `${buttonFontSize}px`,
      }),
    });
    btnText.setOrigin(0.5, 0.5);

    startButton.add([btnBg, btnText]);

    const btnHitArea = this.add.rectangle(0, 0, buttonWidth, buttonHeight, 0x000000, 0);
    btnHitArea.setInteractive({ useHandCursor: true });
    btnHitArea.on('pointerdown', () => {
      this.clearStartScreen();
      this.showingStartScreen = false;
      this.updateQuestion();
    });
    startButton.add(btnHitArea);

    this.rightPanel.add(startButton);
  }

  private clearStartScreen(): void {
    // Remove all children except background (0) and title (1)
    while (this.rightPanel.length > 2) {
      const child = this.rightPanel.getAt(this.rightPanel.length - 1);
      if (child) {
        const hitArea = (child as any).getData?.('hitArea') as Phaser.GameObjects.Rectangle;
        if (hitArea && hitArea.input) {
          hitArea.removeAllListeners();
          hitArea.disableInteractive();
        }
        child.destroy();
      }
    }
  }

  public showQuestionsForWalkthrough(): void {
    if (!this.showingStartScreen) {
      console.log('🎯 Minigame already showing questions, skipping');
      return;
    }

    console.log('🎯 Walkthrough: Switching minigame to question view');
    this.clearStartScreen();
    this.showingStartScreen = false;
    this.updateQuestion();
  }

  private updatePlantGrowth(): void {
    if (this.floatingTween) {
      this.floatingTween.stop();
      this.floatingTween = undefined;
    }

    this.plantGraphics.removeAll(true);

    // ─── Stage calculation ────────────────────────────────
    let stage: number;
    let progressPercent: number;

    if (this.gameMode !== 'legacy' && this.treeState) {
      // API mode: use tree state from backend
      stage = this.treeState.current_stage + 1; // Convert 0-based to 1-based for visuals
      if (stage > 7) stage = 7;
      if (stage < 1) stage = 1;
      progressPercent = (this.treeState.growth_points / (this.treeState.total_stages * this.treeState.points_per_stage)) * 100;
    } else {
      // Legacy mode: calculate from score
      const totalQuestions = this.questions.length;
      const correctAnswers = this.score;

      if (correctAnswers === 0) {
        stage = 1;
      } else if (correctAnswers === totalQuestions) {
        stage = 7;
      } else {
        const pct = correctAnswers / totalQuestions;
        stage = Math.floor(pct * 5) + 2;
        stage = Math.min(stage, 6);
      }
      progressPercent = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    }

    console.log(`🌳 Tree stage: ${stage}, progress: ${progressPercent.toFixed(1)}%`);

    // Stage scale multiplier: Stage 1 = 1.0x, Stage 7 = 2.0x
    const stageScaleMultiplier = 1.0 + ((stage - 1) / 6) * 1.0;

    // Add shadow
    if (this.textures.exists(ASSET_KEYS.TREE_SHADOW)) {
      const panelWidth = this.leftPanel.getData('panelWidth') as number;
      const shadowBaseWidth = panelWidth * 0.4;
      const shadow = this.add.image(0, 80, ASSET_KEYS.TREE_SHADOW);
      const shadowScale = (shadowBaseWidth * stageScaleMultiplier) / shadow.width;
      shadow.setScale(shadowScale, shadowScale * 0.3);
      shadow.setAlpha(0.3 + stage * 0.05);
      this.plantGraphics.add(shadow);
    }

    // Tree image based on stage
    const treeKey = `tree_stage_${stage}`;
    if (this.textures.exists(treeKey)) {
      const panelWidth = this.leftPanel.getData('panelWidth') as number;
      const baseSize = panelWidth * 0.35;
      const tree = this.add.image(0, 0, treeKey);
      const treeScale = (baseSize * stageScaleMultiplier) / Math.max(tree.width, tree.height);
      tree.setScale(treeScale);
      this.plantGraphics.add(tree);

      // Floating animation
      this.floatingTween = this.tweens.add({
        targets: tree,
        y: tree.y - 6,
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    } else {
      // Fallback: emoji tree
      const treeSizes = ['🌱', '🌱', '🪴', '🌿', '🌳', '🌳', '🌲'];
      const emoji = treeSizes[stage - 1] || '🌱';
      const fontSize = 40 + stage * 15;
      const treeEmoji = this.add.text(0, 0, emoji, { fontSize: `${fontSize}px` });
      treeEmoji.setOrigin(0.5, 0.5);
      this.plantGraphics.add(treeEmoji);
    }

    // Update stage text
    if (this.stageText) {
      if (this.gameMode !== 'legacy' && this.treeState) {
        this.stageText.setText(
          `Stage ${this.treeState.current_stage} / ${this.treeState.total_stages}`
        );
      } else {
        this.stageText.setText(`Stage ${stage} / 7`);
      }
    }

    if (this.progressPercentText) {
      this.progressPercentText.setText(`${Math.round(progressPercent)}% Growth`);
    }
  }

  private updateQuestion(): void {
    if (this.currentQuestionIndex >= this.questions.length) {
      if (this.gameMode === 'lesson') {
        this.submitLessonResults();
      } else {
        this.showCompletionScreen();
      }
      return;
    }

    const question = this.questions[this.currentQuestionIndex];
    const panelWidth = this.rightPanel.getData('panelWidth') as number;
    const panelHeight = this.rightPanel.getData('panelHeight') as number;

    // Clean up existing option buttons
    this.optionButtons.forEach((btn) => {
      const hitArea = btn.getData('hitArea') as Phaser.GameObjects.Rectangle;
      if (hitArea && hitArea.input) {
        hitArea.removeAllListeners();
        hitArea.disableInteractive();
      }
      btn.destroy();
    });
    this.optionButtons = [];

    if (this.questionText) this.questionText.destroy();
    if (this.questionNumber) this.questionNumber.destroy();

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
    const contentWidth = panelWidth - horizontalPadding * 2;
    const QUESTION_START_PERCENT = 0.18;
    const QUESTION_TO_OPTIONS_GAP_PERCENT = 0.15;
    const OPTION_BUTTON_HEIGHT_PERCENT = 0.095;
    const OPTION_GAP_PERCENT = 0.02;
    const QUESTION_TEXT_FONT_PERCENT = 0.04;
    const OPTION_LETTER_FONT_PERCENT = 0.035;
    const OPTION_TEXT_FONT_PERCENT = 0.03;
    const questionStartY = panelHeight * QUESTION_START_PERCENT;
    const questionToOptionsGap = panelHeight * QUESTION_TO_OPTIONS_GAP_PERCENT;
    const optionButtonHeight = panelHeight * OPTION_BUTTON_HEIGHT_PERCENT;
    const optionGap = panelHeight * OPTION_GAP_PERCENT;
    const questionTextFontSize = Math.round(panelWidth * QUESTION_TEXT_FONT_PERCENT);
    const optionLetterFontSize = Math.round(panelWidth * OPTION_LETTER_FONT_PERCENT);
    const optionTextFontSize = Math.round(panelWidth * OPTION_TEXT_FONT_PERCENT);

    const fullQuestionText = `${this.currentQuestionIndex + 1}. ${question.question}`;

    this.questionText = this.add.text(horizontalPadding, questionStartY, fullQuestionText, {
      ...createTextStyle('BODY_BOLD', COLORS.TEXT_PRIMARY, {
        fontSize: `${questionTextFontSize}px`,
      }),
      wordWrap: { width: contentWidth },
    });
    this.rightPanel.add(this.questionText);

    // Show mode indicator
    if (this.gameMode !== 'legacy') {
      const modeLabel = this.gameMode === 'lesson' ? 'LESSON MODE' : 'FREE ROAM';
      const modeText = this.add.text(
        panelWidth - horizontalPadding,
        questionStartY - 25,
        modeLabel,
        createTextStyle('BADGE', COLORS.TEXT_SECONDARY, { fontSize: '14px' })
      );
      modeText.setOrigin(1, 0.5);
      this.rightPanel.add(modeText);
    }

    // Streak indicator
    if (this.consecutiveCorrect > 0) {
      const streakText = this.add.text(
        horizontalPadding,
        questionStartY - 25,
        `🔥 Streak: ${this.consecutiveCorrect}`,
        createTextStyle('BADGE', COLORS.TEXT_WARNING, { fontSize: '14px' })
      );
      streakText.setOrigin(0, 0.5);
      this.rightPanel.add(streakText);
    }

    const optionsStartY =
      questionStartY + (this.questionText.height || 40) + questionToOptionsGap;

    // Create option buttons
    question.options.forEach((option, index) => {
      const btnY = optionsStartY + index * (optionButtonHeight + optionGap);
      const btnContainer = this.add.container(horizontalPadding, btnY);

      const bg = this.add.graphics();
      bg.fillStyle(COLORS.LIGHT_BACKGROUND_BLUE, 1);
      bg.fillRoundedRect(0, 0, contentWidth, optionButtonHeight, 12);
      bg.lineStyle(2, COLORS.UNAVAILABLE_BUTTON);
      bg.strokeRoundedRect(0, 0, contentWidth, optionButtonHeight, 12);

      const letterBgSize = optionButtonHeight * 0.6;
      const letterBg = this.add.graphics();
      letterBg.fillStyle(COLORS.LOGO_BLUE, 1);
      letterBg.fillCircle(
        optionButtonHeight * 0.5,
        optionButtonHeight / 2,
        letterBgSize / 2
      );

      const letterText = this.add.text(
        optionButtonHeight * 0.5,
        optionButtonHeight / 2,
        option.letter,
        createTextStyle('BUTTON', COLORS.TEXT_PURE_WHITE, {
          fontSize: `${optionLetterFontSize}px`,
        })
      );
      letterText.setOrigin(0.5, 0.5);

      const optionText = this.add.text(
        optionButtonHeight * 1.0,
        optionButtonHeight / 2,
        option.text,
        {
          ...createTextStyle('BODY_MEDIUM', COLORS.TEXT_PRIMARY, {
            fontSize: `${optionTextFontSize}px`,
          }),
          wordWrap: { width: contentWidth - optionButtonHeight * 1.2 },
        }
      );
      optionText.setOrigin(0, 0.5);

      btnContainer.add([bg, letterText, letterBg, optionText]);

      const hitArea = this.add.rectangle(
        contentWidth / 2,
        optionButtonHeight / 2,
        contentWidth,
        optionButtonHeight,
        0x000000,
        0
      );
      hitArea.setInteractive({ useHandCursor: true });
      hitArea.on('pointerdown', () => {
        this.handleAnswerSelection(option.letter);
      });
      btnContainer.add(hitArea);

      btnContainer.setData('hitArea', hitArea);
      btnContainer.setData('btnWidth', contentWidth);
      btnContainer.setData('btnHeight', optionButtonHeight);

      this.optionButtons.push(btnContainer);
      this.rightPanel.add(btnContainer);
    });
  }

  private showNextButton(): void {
    const panelWidth = this.rightPanel.getData('panelWidth') as number;
    const panelHeight = this.rightPanel.getData('panelHeight') as number;
    const HORIZONTAL_PADDING = panelWidth * 0.08;
    const contentWidth = panelWidth - HORIZONTAL_PADDING * 2;
    const buttonHeight = panelHeight * 0.07;
    const buttonFontSize = Math.round(panelWidth * 0.035);
    const buttonY = panelHeight - panelHeight * 0.08;

    const isLastQuestion = this.currentQuestionIndex >= this.questions.length - 1;
    const buttonLabel = isLastQuestion
      ? this.gameMode === 'lesson'
        ? 'SUBMIT ALL'
        : 'FINISH'
      : 'NEXT';

    this.nextButton = this.add.container(panelWidth / 2, buttonY);

    const bg = this.add.graphics();
    bg.fillStyle(COLORS.LOGO_BLUE, 1);
    bg.fillRoundedRect(-contentWidth / 2, -buttonHeight / 2, contentWidth, buttonHeight, 12);

    const text = this.add.text(0, 0, buttonLabel, {
      ...createTextStyle('BUTTON', COLORS.TEXT_PURE_WHITE, {
        fontSize: `${buttonFontSize}px`,
      }),
    });
    text.setOrigin(0.5, 0.5);

    this.nextButton.add([bg, text]);

    // Loading indicator for submission
    const loadingText = this.add.text(0, 0, '⏳', { fontSize: '24px' });
    loadingText.setOrigin(0.5, 0.5);
    loadingText.setVisible(false);
    this.nextButton.add(loadingText);

    const hitArea = this.add.rectangle(0, 0, contentWidth, buttonHeight, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.on('pointerdown', () => {
      if (this.isSubmitting) return;
      this.handleNextQuestion();
    });
    this.nextButton.add(hitArea);

    this.rightPanel.add(this.nextButton);

    // Fade in
    this.nextButton.setAlpha(0);
    this.tweens.add({
      targets: this.nextButton,
      alpha: 1,
      duration: 300,
      ease: 'Power2',
    });
  }

  private playWateringAnimation(): void {
    if (this.isWateringAnimationPlaying) return;
    this.isWateringAnimationPlaying = true;

    const panelWidth = this.leftPanel.getData('panelWidth') as number;
    const panelHeight = this.leftPanel.getData('panelHeight') as number;

    if (this.textures.exists(ASSET_KEYS.WATERING_CAN_POURING)) {
      this.wateringCanImage = this.add.image(
        panelWidth * 0.75,
        panelHeight * 0.3,
        ASSET_KEYS.WATERING_CAN_POURING
      );
      this.wateringCanImage.setScale(0.15);
      this.wateringCanImage.setAlpha(0);
      this.leftPanel.add(this.wateringCanImage);

      this.tweens.add({
        targets: this.wateringCanImage,
        alpha: 1,
        x: panelWidth * 0.55,
        y: panelHeight * 0.35,
        angle: -20,
        duration: 500,
        ease: 'Power2',
        onComplete: () => {
          this.tweens.add({
            targets: this.wateringCanImage,
            alpha: 0,
            y: panelHeight * 0.25,
            duration: 600,
            delay: 400,
            ease: 'Power2',
            onComplete: () => {
              this.wateringCanImage?.destroy();
              this.wateringCanImage = undefined;
              this.isWateringAnimationPlaying = false;
            },
          });
        },
      });
    } else {
      // Fallback: water drops emoji animation
      const dropText = this.add.text(panelWidth / 2, panelHeight * 0.3, '💧', {
        fontSize: '40px',
      });
      dropText.setOrigin(0.5, 0.5);
      dropText.setAlpha(0);
      this.leftPanel.add(dropText);

      this.tweens.add({
        targets: dropText,
        alpha: 1,
        y: panelHeight * 0.5,
        duration: 600,
        ease: 'Power2',
        onComplete: () => {
          this.tweens.add({
            targets: dropText,
            alpha: 0,
            duration: 400,
            onComplete: () => {
              dropText.destroy();
              this.isWateringAnimationPlaying = false;
            },
          });
        },
      });
    }
  }

  private createCompletionReturnButton(panelWidth: number, panelHeight: number): void {
    const moduleButtonWidth = panelWidth * 0.55;
    const moduleButtonHeight = panelHeight * 0.07;
    const moduleButtonFontSize = Math.round(panelWidth * 0.032);

    this.completionReturnButton = this.add.container(panelWidth / 2, panelHeight * 0.88);

    const moduleButtonBg = this.add.graphics();
    moduleButtonBg.fillStyle(COLORS.LOGO_BLUE, 1);
    moduleButtonBg.fillRoundedRect(
      -moduleButtonWidth / 2,
      -moduleButtonHeight / 2,
      moduleButtonWidth,
      moduleButtonHeight,
      12
    );

    const moduleButtonText = this.add.text(
      -moduleButtonWidth * 0.12,
      0,
      'MODULE',
      createTextStyle('BUTTON', COLORS.TEXT_PURE_WHITE, {
        fontSize: `${moduleButtonFontSize}px`,
      })
    );
    moduleButtonText.setOrigin(0.5, 0.5);

    const arrowFontSize = Math.round(moduleButtonFontSize * 1.15);
    const arrow = this.add.text(
      moduleButtonWidth * 0.22,
      0,
      '→',
      createTextStyle('BUTTON', COLORS.TEXT_PURE_WHITE, {
        fontSize: `${arrowFontSize}px`,
      })
    );
    arrow.setOrigin(0.5, 0.5);

    this.completionReturnButton.add([moduleButtonBg, moduleButtonText, arrow]);

    const hitArea = this.add.rectangle(0, 0, moduleButtonWidth, moduleButtonHeight, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.on('pointerdown', () => {
      this.events.emit('minigameCompleted');
      this.scene.stop();
      this.scene.resume('HouseScene');
    });
    this.completionReturnButton.add(hitArea);
    this.completionReturnButton.sendToBack(hitArea);

    this.rightPanel.add(this.completionReturnButton);
  }

  // ═══════════════════════════════════════════════════════════════
  // DEFAULT QUESTIONS (legacy / walkthrough fallback)
  // ═══════════════════════════════════════════════════════════════

  private getDefaultQuestions(): InternalQuestion[] {
    return [
      {
        id: '1',
        question: 'What is a down payment?',
        options: [
          { letter: 'A', text: 'The monthly payment on a mortgage', answerId: '' },
          { letter: 'B', text: 'The initial upfront payment when buying a home', answerId: '' },
          { letter: 'C', text: 'The final payment to close a loan', answerId: '' },
          { letter: 'D', text: 'A penalty for early loan repayment', answerId: '' },
        ],
        correctAnswer: 'B',
        explanation: '',
      },
      {
        id: '2',
        question: 'What does APR stand for?',
        options: [
          { letter: 'A', text: 'Annual Payment Rate', answerId: '' },
          { letter: 'B', text: 'Adjusted Percentage Rate', answerId: '' },
          { letter: 'C', text: 'Annual Percentage Rate', answerId: '' },
          { letter: 'D', text: 'Approved Payment Ratio', answerId: '' },
        ],
        correctAnswer: 'C',
        explanation: '',
      },
      {
        id: '3',
        question: "What is home equity?",
        options: [
          { letter: 'A', text: 'The total value of your home', answerId: '' },
          { letter: 'B', text: "The difference between your home's value and what you owe", answerId: '' },
          { letter: 'C', text: 'The interest rate on your mortgage', answerId: '' },
          { letter: 'D', text: 'The cost of home insurance', answerId: '' },
        ],
        correctAnswer: 'B',
        explanation: '',
      },
    ];
  }
}