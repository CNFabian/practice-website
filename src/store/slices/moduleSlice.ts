import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Module } from '../../types/modules'

// Quiz-specific types
export interface QuizQuestion {
  id: number;
  question: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
  explanation: {
    correct: string;
    incorrect: {
      [key: string]: {
        why_wrong: string;
        confusion_reason: string;
      };
    };
  };
}

export interface QuizState {
  currentQuestion: number;
  selectedAnswer: string | null;
  showFeedback: boolean;
  answers: { [questionIndex: number]: string };
  showResults: boolean;
  score: number;
  isTransitioning: boolean;
  isActive: boolean;
  questions: QuizQuestion[];
  // Added for smoother transitions
  previousQuestionData: QuizQuestion | null;
  previousQuestionNumber: number;
  previousSelectedAnswer: string | null;
}

export interface LessonProgress {
  lessonId: number;
  moduleId: number;
  completed: boolean;
  watchProgress: number; // percentage watched
  quizCompleted: boolean;
  quizScore: number | null;
  timeSpent: number; // in seconds
  lastAccessed: string;
}

export interface ModuleProgress {
  moduleId: number;
  lessonsCompleted: number;
  totalLessons: number;
  overallProgress: number; // percentage
  status: 'Not Started' | 'In Progress' | 'Completed';
  lastAccessed: string;
}

interface ModuleState {
  // Current navigation state
  currentView: 'modules' | 'lesson' | 'quiz';
  selectedModuleId: number | null;
  selectedLessonId: number | null;
  
  // Modules data
  modules: Module[];
  
  // Progress tracking
  lessonProgress: { [lessonId: number]: LessonProgress };
  moduleProgress: { [moduleId: number]: ModuleProgress };
  
  // Quiz state
  quizState: QuizState;
  
  // UI state
  sidebarCollapsed: boolean;
  showCompactLayout: boolean;
  activeTab: 'All' | 'In Progress' | 'Completed';
  
  // Loading states
  isLoading: boolean;
  error: string | null;
}

const initialQuizState: QuizState = {
  currentQuestion: 0,
  selectedAnswer: null,
  showFeedback: false,
  answers: {},
  showResults: false,
  score: 0,
  isTransitioning: false,
  isActive: false,
  questions: [],
  previousQuestionData: null,
  previousQuestionNumber: 0,
  previousSelectedAnswer: null,
};

const initialState: ModuleState = {
  currentView: 'modules',
  selectedModuleId: null,
  selectedLessonId: null,
  modules: [],
  lessonProgress: {},
  moduleProgress: {},
  quizState: initialQuizState,
  sidebarCollapsed: true,
  showCompactLayout: false,
  activeTab: 'All',
  isLoading: false,
  error: null
};

const moduleSlice = createSlice({
  name: 'modules',
  initialState,
  reducers: {
    // Navigation actions
    setCurrentView: (state, action: PayloadAction<'modules' | 'lesson' | 'quiz'>) => {
      state.currentView = action.payload;
    },
    
    setSelectedModule: (state, action: PayloadAction<number | null>) => {
      state.selectedModuleId = action.payload;
    },
    
    setSelectedLesson: (state, action: PayloadAction<number | null>) => {
      state.selectedLessonId = action.payload;
    },
    
    // Data loading
    setModules: (state, action: PayloadAction<Module[]>) => {
      state.modules = action.payload;
    },
    
    // Progress tracking
    updateLessonProgress: (state, action: PayloadAction<{ 
      lessonId: number; 
      moduleId: number; 
      watchProgress: number; 
      timeSpent: number; 
    }>) => {
      const { lessonId, moduleId, watchProgress, timeSpent } = action.payload;
      state.lessonProgress[lessonId] = {
        ...state.lessonProgress[lessonId],
        lessonId,
        moduleId,
        watchProgress,
        timeSpent,
        lastAccessed: new Date().toISOString(),
        completed: watchProgress >= 100,
        quizCompleted: state.lessonProgress[lessonId]?.quizCompleted || false,
        quizScore: state.lessonProgress[lessonId]?.quizScore || null,
      };
      
      // Update module progress
      const module = state.modules.find(m => m.id === moduleId);
      if (module) {
        const moduleProgress = state.moduleProgress[moduleId] || {
          moduleId,
          lessonsCompleted: 0,
          totalLessons: module.lessons.length,
          overallProgress: 0,
          status: 'Not Started' as const,
          lastAccessed: new Date().toISOString()
        };
        
        const completedLessons = module.lessons.filter(lesson => 
          state.lessonProgress[lesson.id]?.completed
        ).length;
        
        moduleProgress.lessonsCompleted = completedLessons;
        moduleProgress.overallProgress = Math.round((completedLessons / module.lessons.length) * 100);
        moduleProgress.status = completedLessons === 0 ? 'Not Started' : 
                               completedLessons === moduleProgress.totalLessons ? 'Completed' : 'In Progress';
        moduleProgress.lastAccessed = new Date().toISOString();
        
        state.moduleProgress[moduleId] = moduleProgress;
      }
    },

    markLessonCompleted: (state, action: PayloadAction<{ 
      lessonId: number; 
      moduleId: number; 
      quizScore?: number 
    }>) => {
      const { lessonId, moduleId, quizScore } = action.payload;
      state.lessonProgress[lessonId] = {
        ...state.lessonProgress[lessonId],
        lessonId,
        moduleId,
        completed: true,
        quizCompleted: quizScore !== undefined,
        quizScore: quizScore || state.lessonProgress[lessonId]?.quizScore || null,
        lastAccessed: new Date().toISOString(),
        watchProgress: state.lessonProgress[lessonId]?.watchProgress || 100,
        timeSpent: state.lessonProgress[lessonId]?.timeSpent || 0,
      };
      
      // Update module progress
      const module = state.modules.find(m => m.id === moduleId);
      if (module) {
        const moduleProgress = state.moduleProgress[moduleId] || {
          moduleId,
          lessonsCompleted: 0,
          totalLessons: module.lessons.length,
          overallProgress: 0,
          status: 'Not Started' as const,
          lastAccessed: new Date().toISOString()
        };
        
        const completedLessons = module.lessons.filter(lesson => 
          state.lessonProgress[lesson.id]?.completed
        ).length;
        
        moduleProgress.lessonsCompleted = completedLessons;
        moduleProgress.overallProgress = Math.round((completedLessons / module.lessons.length) * 100);
        moduleProgress.status = completedLessons === 0 ? 'Not Started' : 
                               completedLessons === moduleProgress.totalLessons ? 'Completed' : 'In Progress';
        moduleProgress.lastAccessed = new Date().toISOString();
        
        state.moduleProgress[moduleId] = moduleProgress;
      }
    },
    
    // Quiz actions
    startQuiz: (state, action: PayloadAction<{ questions: QuizQuestion[]; lessonId: number }>) => {
      state.quizState = {
        ...initialQuizState,
        questions: action.payload.questions,
        isActive: true
      };
      state.currentView = 'quiz';
    },
    
    selectQuizAnswer: (state, action: PayloadAction<{ questionIndex: number; answer: string }>) => {
      const { questionIndex, answer } = action.payload;
      state.quizState.selectedAnswer = answer;
      state.quizState.answers[questionIndex] = answer;
    },
    
    // Start transition for next question
    startQuizTransition: (state) => {
      // Store current question data before transition
      const currentQ = state.quizState.questions[state.quizState.currentQuestion];
      state.quizState.previousQuestionData = currentQ;
      state.quizState.previousQuestionNumber = state.quizState.currentQuestion + 1;
      state.quizState.previousSelectedAnswer = state.quizState.selectedAnswer;
      state.quizState.isTransitioning = true;
    },
    
    // Complete transition to next question
    nextQuizQuestion: (state) => {
      if (state.quizState.currentQuestion < state.quizState.questions.length - 1) {
        state.quizState.currentQuestion += 1;
        state.quizState.selectedAnswer = state.quizState.answers[state.quizState.currentQuestion] || null;
        state.quizState.showFeedback = false;
      } else {
        // Show results
        const correctAnswers = state.quizState.questions.filter((question, index) => {
          const userAnswer = state.quizState.answers[index];
          return question.options.find(option => option.id === userAnswer)?.isCorrect;
        }).length;
        
        state.quizState.score = Math.round((correctAnswers / state.quizState.questions.length) * 100);
        state.quizState.showResults = true;
      }
      
      // Clear transition state
      state.quizState.isTransitioning = false;
      state.quizState.previousQuestionData = null;
      state.quizState.previousQuestionNumber = 0;
      state.quizState.previousSelectedAnswer = null;
    },
    
    // Start transition for previous question
    startPreviousQuizTransition: (state) => {
      // Store current question data before transition
      const currentQ = state.quizState.questions[state.quizState.currentQuestion];
      state.quizState.previousQuestionData = currentQ;
      state.quizState.previousQuestionNumber = state.quizState.currentQuestion + 1;
      state.quizState.previousSelectedAnswer = state.quizState.selectedAnswer;
      state.quizState.isTransitioning = true;
    },
    
    // Complete transition to previous question  
    previousQuizQuestion: (state) => {
      if (state.quizState.currentQuestion > 0) {
        state.quizState.currentQuestion -= 1;
        state.quizState.selectedAnswer = state.quizState.answers[state.quizState.currentQuestion] || null;
        state.quizState.showFeedback = false;
      }
      
      // Clear transition state
      state.quizState.isTransitioning = false;
      state.quizState.previousQuestionData = null;
      state.quizState.previousQuestionNumber = 0;
      state.quizState.previousSelectedAnswer = null;
    },
    
    completeQuiz: (state, action: PayloadAction<{ lessonId: number; score: number }>) => {
      const { lessonId, score } = action.payload;
      state.quizState.score = score;
      state.quizState.showResults = true;
      
      // Update lesson progress with quiz completion
      if (state.selectedModuleId) {
        const existingProgress = state.lessonProgress[lessonId] || {
          lessonId,
          moduleId: state.selectedModuleId,
          completed: false,
          watchProgress: 0,
          quizCompleted: false,
          quizScore: null,
          timeSpent: 0,
          lastAccessed: new Date().toISOString()
        };
        
        state.lessonProgress[lessonId] = {
          ...existingProgress,
          quizCompleted: true,
          quizScore: score,
          completed: true,
          lastAccessed: new Date().toISOString()
        };
      }
    },
    
    resetQuiz: (state) => {
      state.quizState = {
        ...initialQuizState,
        questions: state.quizState.questions,
        isActive: true
      };
    },
    
    closeQuiz: (state) => {
      state.quizState = initialQuizState;
      state.currentView = 'lesson';
    },
    
    // UI state actions
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    
    setShowCompactLayout: (state, action: PayloadAction<boolean>) => {
      state.showCompactLayout = action.payload;
    },
    
    setActiveTab: (state, action: PayloadAction<'All' | 'In Progress' | 'Completed'>) => {
      state.activeTab = action.payload;
    },
    
    // Loading and error states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    }
  }
});

export const {
  setCurrentView,
  setSelectedModule,
  setSelectedLesson,
  setModules,
  updateLessonProgress,
  markLessonCompleted,
  startQuiz,
  selectQuizAnswer,
  startQuizTransition,
  nextQuizQuestion,
  startPreviousQuizTransition,
  previousQuizQuestion,
  completeQuiz,
  resetQuiz,
  closeQuiz,
  setSidebarCollapsed,
  setShowCompactLayout,
  setActiveTab,
  setLoading,
  setError,
  clearError
} = moduleSlice.actions;

export default moduleSlice.reducer;