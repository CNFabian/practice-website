import Phaser from 'phaser';
import { createTextStyle } from '../../constants/Typography';
import { COLORS } from '../../constants/Colors';
import {
  validateAnswer,
  submitLessonAnswers,
  submitFreeRoamAnswer,
} from '../../../../../../services/growYourNestAPI';
import type {
  GYNMinigameInitData,
  GYNMinigameResult,
} from '../../../../../../types/growYourNest.types';
import type {
  InternalQuestion,
  GYNSceneState,
  GYNGameMode,
  TreeState,
  LessonAnswerSubmission,
  TreeStateWithTransition,
} from './grow-your-nest/GYNTypes';
import {
  createLeftPanel,
  updatePlantGrowth,
  playWateringAnimation,
  playFertilizerAnimation
} from './grow-your-nest/GYNLeftPanel';
import {
  createRightPanel,
  clearStartScreen,
  updateQuestion,
  updateNextButton,
  showCompletion,
  showTreeFullyGrownScreen,
  showFeedbackBanner,
} from './grow-your-nest/GYNRightPanel';
import { BaseScene } from '../BaseScene';
import { queryClient } from '../../../../../../lib/queryClient';
import { queryKeys } from '../../../../../../lib/queryKeys';

export default class GrowYourNestMinigame extends BaseScene {
  // ─── Core game state ───
  private questions: InternalQuestion[] = [];
  private currentQuestionIndex: number = 0;
  private selectedAnswer: string | null = null;
  private score: number = 0;
  private consecutiveCorrect: number = 0;
  private fertilizerBonusCount: number = 0;
  private totalGrowthPointsEarned: number = 0;
  private totalCoinsEarned: number = 0;

  // ─── API integration state ───
  private gameMode: GYNGameMode = 'lesson';
  private lessonId: string | null = null;
  private moduleId: string | null = null;
  private treeState: TreeState | null = null;
  private lessonAnswers: LessonAnswerSubmission[] = [];
  private isSubmitting: boolean = false;
  private pendingFertilizer: boolean = false;
  private lastServerResponse: TreeStateWithTransition | null = null;

  // ─── UI elements ───
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
  private fertilizerImage?: Phaser.GameObjects.Image;
  private isFertilizerAnimationPlaying: boolean = false;
  private feedbackBanner?: Phaser.GameObjects.Container;
  private awardedQuestionIds: Set<string> = new Set();
  private lastAnswerAlreadyAwarded: boolean = false;
  private lastAnswerCoinsEarned: number = 0;

  constructor() {
    super({ key: 'GrowYourNestMinigame' });
  }

  /** Creates a snapshot of current scene state for component files */
  private getState(): GYNSceneState {
    return {
      questions: this.questions,
      currentQuestionIndex: this.currentQuestionIndex,
      selectedAnswer: this.selectedAnswer,
      score: this.score,
      consecutiveCorrect: this.consecutiveCorrect,
      fertilizerBonusCount: this.fertilizerBonusCount,
      totalGrowthPointsEarned: this.totalGrowthPointsEarned,
      totalCoinsEarned: this.totalCoinsEarned,
      gameMode: this.gameMode,
      lessonId: this.lessonId,
      moduleId: this.moduleId,
      treeState: this.treeState,
      lessonAnswers: this.lessonAnswers,
      isSubmitting: this.isSubmitting,
      lastServerResponse: this.lastServerResponse,
      showingStartScreen: this.showingStartScreen,
      moduleNumber: this.moduleNumber,
      isWateringAnimationPlaying: this.isWateringAnimationPlaying,
      isFertilizerAnimationPlaying: this.isFertilizerAnimationPlaying,
      leftPanel: this.leftPanel,
      rightPanel: this.rightPanel,
      questionText: this.questionText,
      questionNumber: this.questionNumber,
      optionButtons: this.optionButtons,
      nextButton: this.nextButton,
      plantGraphics: this.plantGraphics,
      stageText: this.stageText,
      progressPercentText: this.progressPercentText,
      backButton: this.backButton,
      headerTitle: this.headerTitle,
      completionReturnButton: this.completionReturnButton,
      leftPanelBackground: this.leftPanelBackground,
      floatingTween: this.floatingTween,
      wateringCanImage: this.wateringCanImage,
      fertilizerImage: this.fertilizerImage,
      feedbackBanner: this.feedbackBanner,
    };
  }

  /** Syncs mutable UI refs back from component state */
  private syncState(s: GYNSceneState): void {
    this.leftPanel = s.leftPanel;
    this.rightPanel = s.rightPanel;
    this.questionText = s.questionText;
    this.questionNumber = s.questionNumber;
    this.optionButtons = s.optionButtons;
    this.nextButton = s.nextButton;
    this.plantGraphics = s.plantGraphics;
    this.stageText = s.stageText;
    this.progressPercentText = s.progressPercentText;
    this.backButton = s.backButton;
    this.headerTitle = s.headerTitle;
    this.completionReturnButton = s.completionReturnButton;
    this.leftPanelBackground = s.leftPanelBackground;
    this.floatingTween = s.floatingTween;
    this.wateringCanImage = s.wateringCanImage;
    this.isWateringAnimationPlaying = s.isWateringAnimationPlaying;
    this.fertilizerImage = s.fertilizerImage;
    this.isFertilizerAnimationPlaying = s.isFertilizerAnimationPlaying;
    this.showingStartScreen = s.showingStartScreen;
    this.selectedAnswer = s.selectedAnswer;
    this.feedbackBanner = s.feedbackBanner;
  }

  /** Re-enable HouseScene input so it is interactive after minigame exits */
  private restoreHouseSceneInput(): void {
    const houseScene = this.scene.get('HouseScene');
    if (houseScene && houseScene.input) {
      houseScene.input.enabled = true;
    }
  }

  /**
   * Override BaseScene's clearBackgroundImage to be a no-op.
   * GYN is a minigame overlay — it should NOT touch the DOM background.
   * The DOM background is managed by LessonView (React) or HouseScene, not by this Phaser scene.
   */
  protected clearBackgroundImage(): void {
    // Intentionally empty — do not clear the DOM background
  }

  private getCallbacks() {
    return {
      onAnswerSelection: (letter: string) => this.handleAnswerSelection(letter),
      onNext: () => this.handleNextQuestion(),
      onReturn: () => {
        this.events.emit('minigameCompleted');
        this.scene.stop();
        this.scene.resume('HouseScene');
      },
      onStartGame: () => this.handleStartGame(),
    };
  }

  private handleStartGame(): void {
    const state = this.getState();
    clearStartScreen(state);
    state.showingStartScreen = false;
    this.showingStartScreen = false;
    updateQuestion(this, state, this.getCallbacks());
    this.syncState(state);
  }

  // ═══════════════════════════════════════════════════════════════
  // INIT & CREATE
  // ═══════════════════════════════════════════════════════════════

  init(data: GYNMinigameInitData) {
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
    this.feedbackBanner = undefined;

    this.gameMode = data.mode;
    this.lessonId = data.lessonId || null;
    this.moduleId = data.moduleId || null;
    this.treeState = data.treeState || null;
    this.moduleNumber = data.moduleNumber || 1;
    this.showingStartScreen = data.showStartScreen !== false;
    this.awardedQuestionIds = new Set(data.awardedQuestionIds || []);

    this.lastAnswerAlreadyAwarded = false;

    this.questions = data.questions.map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options.map((opt) => ({
        letter: opt.letter,
        text: opt.text,
        answerId: opt.answerId,
      })),
      correctAnswer: null,
      explanation: q.explanation || '',
    }));

    console.log(`🌳 GYN init ${this.gameMode}`, {
      count: this.questions.length,
      lessonId: this.lessonId,
      moduleId: this.moduleId,
    });
  }

  create() {
    // Call BaseScene.create() to set up coin counter and coin update listener
    super.create();

    const { width, height } = this.cameras.main;

    this.createBackButton();
    this.createHeader(width);
    this.createPanels(width, height);
    this.slideInMinigameComponents(width);

    this.scale.on('resize', this.handleResize, this);
  }

  // ═══════════════════════════════════════════════════════════════
  // ANSWER HANDLING
  // ═══════════════════════════════════════════════════════════════

  private handleAnswerSelection(selectedLetter: string): void {
    if (this.isSubmitting) return;

    // In lesson mode, allow re-selection before clicking Next
    if (this.selectedAnswer && this.gameMode !== 'lesson') return;

    // In lesson mode, remove previous answer for this question if re-selecting
    if (this.gameMode === 'lesson' && this.selectedAnswer) {
      this.lessonAnswers = this.lessonAnswers.filter(
        (a) => a.question_id !== this.questions[this.currentQuestionIndex].id
      );
    }

    this.selectedAnswer = selectedLetter;
    this.isSubmitting = true;

    const q = this.questions[this.currentQuestionIndex];
    const opt = q.options.find((o) => o.letter === selectedLetter);
    if (!opt) {
      this.isSubmitting = false;
      return;
    }

    // Both modes: validate answer immediately for instant feedback
    validateAnswer({ question_id: q.id, answer_id: opt.answerId })
      .then((validation) => {
          if (this.gameMode === 'lesson') {
            // Store the answer for batch submission later
            this.lessonAnswers.push({
              question_id: q.id,
              answer_id: opt.answerId,
            });

            // Track score locally for lesson mode
            if (validation.is_correct) {
              this.score++;
              this.consecutiveCorrect++;

              // Update treeState locally so progress bar reflects changes per-question
              // Water = 10 pts per correct; Fertilizer = 20 bonus pts at 3 consecutive
              // Only award base points if this question hasn't been awarded before (deduplication)
              const alreadyAwarded = this.awardedQuestionIds.has(q.id);
              this.lastAnswerAlreadyAwarded = alreadyAwarded;
              const waterPoints = alreadyAwarded ? 0 : 10;
              const isFertilizerStreak = this.consecutiveCorrect > 0 && this.consecutiveCorrect % 3 === 0;
              const fertilizerBonus = isFertilizerStreak ? 20 : 0;
              const pointsEarned = waterPoints + fertilizerBonus;
              if (fertilizerBonus > 0) this.fertilizerBonusCount++;
              this.pendingFertilizer = isFertilizerStreak;
              this.totalGrowthPointsEarned += pointsEarned;

              // Track this question as awarded locally for this session
              if (!alreadyAwarded) {
                this.awardedQuestionIds.add(q.id);
              }

              if (this.treeState && pointsEarned > 0) {
                this.treeState = {
                  ...this.treeState,
                  growth_points: this.treeState.growth_points + pointsEarned,
                  current_stage: Math.min(
                    Math.floor((this.treeState.growth_points + pointsEarned) / this.treeState.points_per_stage),
                    this.treeState.total_stages
                  ),
                };
              }
            } else {
              this.consecutiveCorrect = 0;
              this.lastAnswerAlreadyAwarded = false;
            }

            this.isSubmitting = false;
            this.showAnswerFeedback(validation.is_correct);
          } else if (this.gameMode === 'freeroam') {
          // After validation, submit to freeroam/answer for tree growth + coins
          if (!this.moduleId) {
            this.isSubmitting = false;
            this.showAnswerFeedback(validation.is_correct);
            return;
          }

          submitFreeRoamAnswer(this.moduleId, {
            question_id: q.id,
            answer_id: opt.answerId,
            consecutive_correct: this.consecutiveCorrect,
          })
            .then((r) => {
              this.isSubmitting = false;
              this.lastServerResponse = r.tree_state;
              this.pendingFertilizer = r.fertilizer_bonus;              
              if (r.is_correct) {
                this.score++;
                this.consecutiveCorrect++;
              } else {
                this.consecutiveCorrect = 0;
              }

              if (r.fertilizer_bonus) this.fertilizerBonusCount++;
              this.totalGrowthPointsEarned += r.growth_points_earned;
              this.totalCoinsEarned += r.coins_earned;
              this.lastAnswerCoinsEarned = r.coins_earned;

              // Refresh header coin display when coins are earned
              if (r.coins_earned > 0) {
                queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.coins() });
              }

              this.treeState = {
                growth_points: r.tree_state.growth_points,
                current_stage: r.tree_state.current_stage,
                total_stages: r.tree_state.total_stages,
                points_per_stage: r.tree_state.points_per_stage || 50,
                completed: r.tree_state.completed || r.tree_state.just_completed,
              };

              // If tree just completed, show completion after feedback
              if (this.treeState?.completed) {
                this.showAnswerFeedback(r.is_correct);
                this.time.delayedCall(2000, () => {
                  this.doShowCompletion();
                });
                return;
              }
              this.showAnswerFeedback(r.is_correct);            })
            .catch((e) => {
              console.error('🌳 freeroam answer error:', e);
              this.isSubmitting = false;
              this.consecutiveCorrect = 0;
              // Still show feedback from validate-answer even if freeroam/answer fails
              this.showAnswerFeedback(validation.is_correct);
            });
        }
      })
      .catch((e) => {
        console.error('🌳 validate-answer error:', e);
        this.isSubmitting = false;
        this.showAnswerFeedback(false);
      });
  }

  private handleNextQuestion(): void {
    if (this.isSubmitting) return;

    this.currentQuestionIndex++;

    if (this.currentQuestionIndex >= this.questions.length) {
      if (this.gameMode === 'lesson') {
        this.submitLessonResults();
        return;
      }

      // Free roam: check if tree is complete
      if (this.treeState?.completed) {
        this.doShowCompletion();
        return;
      }

      // Free roam: recycle questions, ensuring no repeat of last question
      const lastQuestion = this.questions[this.questions.length - 1];
      do {
        Phaser.Utils.Array.Shuffle(this.questions);
      } while (this.questions.length > 1 && this.questions[0].id === lastQuestion.id);
      this.currentQuestionIndex = 0;
    }

    this.selectedAnswer = null;
    const state = this.getState();
    updateNextButton(state, false);
    updateQuestion(this, state, this.getCallbacks());
    this.syncState(state);
  }

  private submitLessonResults(): void {
    if (this.gameMode !== 'lesson' || !this.lessonId) {
      this.doShowCompletion();
      return;
    }

    this.isSubmitting = true;

    submitLessonAnswers(this.lessonId, {
      answers: this.lessonAnswers,
    })
      .then((r) => {
        this.isSubmitting = false;
        this.lastServerResponse = r.tree_state;
        this.score = r.correct_count;
        this.totalGrowthPointsEarned = r.growth_points_earned;
        this.totalCoinsEarned = r.coins_earned;
        if (r.fertilizer_bonus) this.fertilizerBonusCount++;

        this.treeState = {
          growth_points: r.tree_state.growth_points,
          current_stage: r.tree_state.current_stage,
          total_stages: r.tree_state.total_stages,
          points_per_stage: r.tree_state.points_per_stage || 50,
          completed: r.tree_state.completed || r.tree_state.just_completed,
        };

        console.log('🌳 Lesson submitted:', {
          correct: r.correct_count,
          total: r.total_questions,
        });

        // Invalidate lesson cache so grow_your_nest_played is fresh
        if (this.lessonId) {
          queryClient.invalidateQueries({ queryKey: queryKeys.learning.lesson(this.lessonId) });
          queryClient.invalidateQueries({ queryKey: ['learning'] });
          queryClient.invalidateQueries({ queryKey: ['gyn'] });
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.coins() });
        }

        this.doShowCompletion();
      })
      .catch((e) => {
        console.error('🌳 lesson submit error:', e);
        this.isSubmitting = false;
        this.doShowCompletion();
      });
  }

  // ─── Answer visual feedback (uses option button data from state) ───

  private showAnswerFeedback(isCorrect: boolean): void {
    const state = this.getState();

    state.optionButtons.forEach((btn) => {
      const bg = btn.getData('bg') as Phaser.GameObjects.Graphics;
      const letter = btn.getData('letter') as string;
      const lp = btn.getData('leftPadding') as number;
      const bw = btn.getData('buttonWidth') as number;
      const bh = btn.getData('buttonHeight') as number;
      const cr = btn.getData('cornerRadius') as number;

      bg.clear();
      if (letter === this.selectedAnswer) {
        bg.fillStyle(isCorrect ? COLORS.STATUS_GREEN : COLORS.STATUS_RED, 1);
        bg.fillRoundedRect(lp, -bh / 2, bw, bh, cr);
      }
      const hitArea = btn.getData('hitArea') as Phaser.GameObjects.Rectangle;
      if (hitArea) hitArea.disableInteractive();
    });

    updatePlantGrowth(this, state);
    this.syncState(state);

    // Show the feedback banner below the options (with coin message on stage transition)
    showFeedbackBanner(this, state, isCorrect, this.lastAnswerCoinsEarned);
    this.lastAnswerCoinsEarned = 0;
    this.syncState(state);

      if (isCorrect) {
      playWateringAnimation(this, state, () => {
        this.isWateringAnimationPlaying = false;
      }, this.lastAnswerAlreadyAwarded);
      this.syncState(state);

      // Check for fertilizer bonus (3 consecutive correct)
      const shouldPlayFertilizer = this.pendingFertilizer;

      if (shouldPlayFertilizer) {
        // Delay fertilizer to play after watering starts (overlap slightly)
        this.time.delayedCall(800, () => {
          const fertState = this.getState();
          playFertilizerAnimation(this, fertState, () => {
            this.isFertilizerAnimationPlaying = false;
          });
          this.syncState(fertState);
        });
        this.pendingFertilizer = false;
      }
    }

    updateNextButton(state, true);
  }


  // ═══════════════════════════════════════════════════════════════
  // COMPLETION
  // ═══════════════════════════════════════════════════════════════

  private doShowCompletion(): void {
    const state = this.getState();

    // If tree is fully grown, show the special celebratory screen
    if (this.treeState?.completed && this.gameMode === 'freeroam') {
      showTreeFullyGrownScreen(this, state, this.getCallbacks().onReturn);
    } else {
      showCompletion(this, state, this.getCallbacks().onReturn);
    }

    this.syncState(state);
    updatePlantGrowth(this, state);
    this.syncState(state);
    this.emitResult();
  }

  private emitResult(): void {
    const result: GYNMinigameResult = {
      mode: this.gameMode,
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
  // SCENE LIFECYCLE
  // ═══════════════════════════════════════════════════════════════

  private handleResize(): void {
    this.tweens.killAll();

    this.optionButtons.forEach((btn) => {
      const h = btn.getData('hitArea') as Phaser.GameObjects.Rectangle;
      if (h?.input) {
        h.removeAllListeners();
        h.disableInteractive();
      }
    });

    if (this.nextButton) {
      const h = this.nextButton.getAt(3) as Phaser.GameObjects.Rectangle;
      if (h?.input) {
        h.removeAllListeners();
        h.disableInteractive();
      }
    }

    if (this.backButton) {
      const h = this.backButton.getAt(3) as Phaser.GameObjects.Rectangle;
      if (h?.input) {
        h.removeAllListeners();
        h.disableInteractive();
      }
    }

    if (this.backButton) this.backButton.destroy();
    if (this.headerTitle) this.headerTitle.destroy();
    if (this.leftPanel) this.leftPanel.destroy();
    if (this.rightPanel) this.rightPanel.destroy();

    this.optionButtons = [];
    this.feedbackBanner = undefined;

    // Handle coin counter resize from BaseScene
    this.handleCoinCounterResize();

    const { width, height } = this.scale;
    this.createBackButton();
    this.createHeader(width);
    this.createPanels(width, height);
  }

  shutdown() {
    // Safety net: re-enable HouseScene input on any exit path
    this.restoreHouseSceneInput();

    this.tweens.killAll();

    if (this.floatingTween) {
      this.floatingTween.stop();
      this.floatingTween = undefined;
    }

    if (this.wateringCanImage) {
      this.wateringCanImage.destroy();
      this.wateringCanImage = undefined;
    }
    this.isWateringAnimationPlaying = false;

    if (this.fertilizerImage) {
      this.fertilizerImage.destroy();
      this.fertilizerImage = undefined;
    }
    this.isFertilizerAnimationPlaying = false;

    if (this.feedbackBanner) {
      this.feedbackBanner.destroy();
      this.feedbackBanner = undefined;
    }

    if (this.backButton) {
      const h = this.backButton.getAt(3) as Phaser.GameObjects.Rectangle;
      if (h?.input) {
        h.removeAllListeners();
        h.disableInteractive();
      }
    }

    this.optionButtons.forEach((btn) => {
      const h = btn.getData('hitArea') as Phaser.GameObjects.Rectangle;
      if (h?.input) {
        h.removeAllListeners();
        h.disableInteractive();
      }
    });

    if (this.nextButton) {
      const h = this.nextButton.getAt(3) as Phaser.GameObjects.Rectangle;
      if (h?.input) {
        h.removeAllListeners();
        h.disableInteractive();
      }
    }

    if (this.completionReturnButton) {
      const h = this.completionReturnButton.getAt(
        3
      ) as Phaser.GameObjects.Rectangle;
      if (h?.input) {
        h.removeAllListeners();
        h.disableInteractive();
      }
    }

    this.scale.off('resize', this.handleResize, this);

    // Call BaseScene.shutdown() to clean up coin counter
    super.shutdown();
  }

  // ─── Slide-in animation ───

  private slideInMinigameComponents(width: number): void {
    const offset = width * 1.5;

    if (this.backButton) this.backButton.x += offset;
    if (this.headerTitle) this.headerTitle.x += offset;
    if (this.leftPanel) this.leftPanel.x += offset;
    if (this.rightPanel) this.rightPanel.x += offset;

    const dur = 800,
      ease = 'Power2';

    if (this.backButton)
      this.tweens.add({ targets: this.backButton, x: 60, duration: dur, ease });

    if (this.headerTitle)
      this.tweens.add({
        targets: this.headerTitle,
        x: width / 2,
        duration: dur,
        ease,
      });

    if (this.leftPanel) {
      this.tweens.add({
        targets: this.leftPanel,
        x: 60,
        duration: dur,
        ease,
        onUpdate: () => {
          if (this.leftPanelBackground?.mask) {
            const g = (
              this.leftPanelBackground.mask as Phaser.Display.Masks.GeometryMask
            ).geometryMask as Phaser.GameObjects.Graphics;
            if (g) {
              g.clear();
              g.fillStyle(0xffffff);
              g.fillRoundedRect(
                this.leftPanel.x,
                this.leftPanel.y,
                this.leftPanel.getData('panelWidth'),
                this.leftPanel.getData('panelHeight'),
                16
              );
            }
          }
        },
      });
    }

    if (this.rightPanel)
      this.tweens.add({
        targets: this.rightPanel,
        x: width / 2 + 20,
        duration: dur,
        ease,
      });
  }

  // ─── Back button & header (kept in main scene since they emit scene-level events) ───

  private createBackButton(): void {
    this.backButton = this.add.container(60, 48);

    const arrow = this.add.text(0, 0, '←', {
      fontSize: '48px',
      color: COLORS.TEXT_SECONDARY,
    });
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

    const state = this.getState();

    createLeftPanel(this, state, 60, panelY, panelWidth, panelHeight);
    this.syncState(state);

    createRightPanel(
      this,
      state,
      width / 2 + 20,
      panelY,
      panelWidth,
      panelHeight,
      this.getCallbacks()
    );
    this.syncState(state);
  }

  // ═══════════════════════════════════════════════════════════════
  // PUBLIC API (walkthrough system)
  // ═══════════════════════════════════════════════════════════════

  public showQuestionsForWalkthrough(): void {
    if (!this.showingStartScreen) {
      console.log('🎯 Already showing questions');
      return;
    }

    console.log('🎯 Walkthrough: Switching to question view');
    const state = this.getState();
    clearStartScreen(state);
    state.showingStartScreen = false;
    this.showingStartScreen = false;
    updateQuestion(this, state, this.getCallbacks());
    this.syncState(state);
  }
}