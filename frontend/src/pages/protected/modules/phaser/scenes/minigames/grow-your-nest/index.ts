export type {
  InternalQuestion,
  GYNSceneState,
  GYNGameMode,
  TreeState,
  TreeStateWithTransition,
  LessonAnswerSubmission,
} from './GYNTypes';

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