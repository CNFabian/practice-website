export type {
  LegacyQuizQuestion,
  InternalQuestion,
  GYNSceneState,
  GYNGameMode,
  TreeState,
  TreeStateWithTransition,
  LessonAnswerSubmission,
} from './GYNTypes';

export { getDefaultQuestions } from './GYNDefaultQuestions';

export {
  createLeftPanel,
  updatePlantGrowth,
  playWateringAnimation,
} from './GYNLeftPanel';

export {
  createRightPanel,
  showStartScreen,
  clearStartScreen,
  updateQuestion,
  updateNextButton,
  showCompletion,
} from './GYNRightPanel';