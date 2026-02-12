import type {
  GYNGameMode,
  TreeState,
  TreeStateWithTransition,
  LessonAnswerSubmission,
} from '../../../../../../../types/growYourNest.types';

// ═══════════════════════════════════════════════════════════════
// LEGACY INTERFACE (backward compatibility with walkthrough)
// ═══════════════════════════════════════════════════════════════
export interface LegacyQuizQuestion {
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
export interface InternalQuestion {
  id: string;
  question: string;
  options: Array<{
    letter: string;
    text: string;
    answerId: string;
  }>;
  /** For legacy mode: letter of correct answer. For API mode: null (server-side) */
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
  gameMode: GYNGameMode | 'legacy';
  lessonId: string | null;
  moduleId: string | null;
  treeState: TreeState | null;
  lessonAnswers: LessonAnswerSubmission[];
  isSubmitting: boolean;
  lastServerResponse: TreeStateWithTransition | null;
  showingStartScreen: boolean;
  moduleNumber: number;
  isWateringAnimationPlaying: boolean;

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
}

// Re-export needed types so component files only import from here
export type { GYNGameMode, TreeState, TreeStateWithTransition, LessonAnswerSubmission };