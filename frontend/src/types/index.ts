// Export all types from the main modules file
export * from './modules';

// Utility types
export type ModuleStatus = 'Not Started' | 'In Progress' | 'Completed';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
export type LessonType = 'video' | 'interactive' | 'quiz' | 'minigame' | 'mixed';