// OPT-05: Main barrel file — re-exports from scoped sub-barrels
// Existing imports from '../../assets' continue to work unchanged.
// New code should import from the scoped sub-barrels directly:
//   assets/phaser     — Phaser game assets (PreloaderScene)
//   assets/icons      — UI icons (React components)
//   assets/onboarding — Onboarding images

// Onest typography components
export { default as OnestFont } from '../components/common/OnestFont';
export { default as Typography } from '../components/common/Typography';

// Re-export all sub-barrels
export * from './icons';
export * from './onboarding';
export * from './phaser';

// Static Images
export { default as SignupImage } from './images/static/signup_page.png'
export { default as LoginImage } from './images/static/login_page.png'
export { default as CelebrationImage } from './images/static/celebration-image.png'
export { default as QuestionImage } from './images/static/question_image.png'
export { default as TryAgainImage } from './images/static/tryagain-image.png'

// Downloadables
export { default as AccessibilityDoc } from './downloadables/Accessibility_Statement.pdf?url'
export { default as PrivacyPolicyDoc } from './downloadables/Privacy_Policy.pdf?url'
export { default as TermsConditionsDoc } from './downloadables/Terms_Conditions.pdf?url'

// Background Images
export { default as LessonViewBackground } from './images/backgrounds/lessonView_background.png'