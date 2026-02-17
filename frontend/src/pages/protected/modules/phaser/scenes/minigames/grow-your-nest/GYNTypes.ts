import type {
  GYNGameMode,
  TreeState,
  TreeStateWithTransition,
  LessonAnswerSubmission,
} from '../../../../../../../types/growYourNest.types';

// ═══════════════════════════════════════════════════════════════
// INTERNAL UNIFIED QUESTION FORMAT
// ═══════════════════════════════════════════════════════════════

export interface InternalQuestion {
  id: string;
  question: string;
  options: Array<{
    letter: string;
    text: string;
    answerId: string;
  }>;
  /** Always null — correct answer is determined server-side */
  correctAnswer: string | null;
  explanation: string;
}

// ═══════════════════════════════════════════════════════════════
// SCENE STATE — exposed to component helpers via getter interface
// ═══════════════════════════════════════════════════════════════

export interface GYNSceneState {
  questions: InternalQuestion[];
  currentQuestionIndex: number;
  selectedAnswer: string | null;
  score: number;
  consecutiveCorrect: number;
  fertilizerBonusCount: number;
  totalGrowthPointsEarned: number;
  totalCoinsEarned: number;
  gameMode: GYNGameMode;
  lessonId: string | null;
  moduleId: string | null;
  treeState: TreeState | null;
  lessonAnswers: LessonAnswerSubmission[];
  isSubmitting: boolean;
  lastServerResponse: TreeStateWithTransition | null;
  showingStartScreen: boolean;
  moduleNumber: number;
  isWateringAnimationPlaying: boolean;
  isFertilizerAnimationPlaying: boolean;
  lessonPassed: boolean | null;


  // UI element references
  leftPanel: Phaser.GameObjects.Container;
  rightPanel: Phaser.GameObjects.Container;
  questionText: Phaser.GameObjects.Text;
  questionNumber: Phaser.GameObjects.Text;
  optionButtons: Phaser.GameObjects.Container[];
  nextButton: Phaser.GameObjects.Container;
  plantGraphics: Phaser.GameObjects.Container;
  stageText: Phaser.GameObjects.Text;
  progressPercentText: Phaser.GameObjects.Text;
  backButton?: Phaser.GameObjects.Container;
  headerTitle?: Phaser.GameObjects.Text;
  completionReturnButton?: Phaser.GameObjects.Container;
  leftPanelBackground?: Phaser.GameObjects.Image;
  floatingTween?: Phaser.Tweens.Tween;
  wateringCanImage?: Phaser.GameObjects.Image;
  fertilizerImage?: Phaser.GameObjects.Image;
  feedbackBanner?: Phaser.GameObjects.Container;
}

// Re-export needed types so component files only import from here
export type { GYNGameMode, TreeState, TreeStateWithTransition, LessonAnswerSubmission };