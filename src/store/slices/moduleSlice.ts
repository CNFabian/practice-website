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
  questions: []
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
    
    selectModule: (state, action: PayloadAction<number>) => {
      state.selectedModuleId = action.payload;
      state.currentView = 'modules';
    },
    
    selectLesson: (state, action: PayloadAction<{ lessonId: number; moduleId: number }>) => {
      state.selectedLessonId = action.payload.lessonId;
      state.selectedModuleId = action.payload.moduleId;
      state.currentView = 'lesson';
      
      // Update last accessed time
      const now = new Date().toISOString();
      if (!state.lessonProgress[action.payload.lessonId]) {
        state.lessonProgress[action.payload.lessonId] = {
          lessonId: action.payload.lessonId,
          moduleId: action.payload.moduleId,
          completed: false,
          watchProgress: 0,
          quizCompleted: false,
          quizScore: null,
          timeSpent: 0,
          lastAccessed: now
        };
      } else {
        state.lessonProgress[action.payload.lessonId].lastAccessed = now;
      }
    },
    
    setModules: (state, action: PayloadAction<Module[]>) => {
      state.modules = action.payload;
    },
    
    // Progress tracking
    updateLessonProgress: (state, action: PayloadAction<{
      lessonId: number;
      watchProgress?: number;
      timeSpent?: number;
    }>) => {
      const { lessonId, watchProgress, timeSpent } = action.payload;
      
      if (!state.lessonProgress[lessonId]) {
        state.lessonProgress[lessonId] = {
          lessonId,
          moduleId: state.selectedModuleId || 0,
          completed: false,
          watchProgress: 0,
          quizCompleted: false,
          quizScore: null,
          timeSpent: 0,
          lastAccessed: new Date().toISOString()
        };
      }
      
      if (watchProgress !== undefined) {
        state.lessonProgress[lessonId].watchProgress = watchProgress;
      }
      
      if (timeSpent !== undefined) {
        state.lessonProgress[lessonId].timeSpent = timeSpent;
      }
      
      state.lessonProgress[lessonId].lastAccessed = new Date().toISOString();
    },
    
    markLessonCompleted: (state, action: PayloadAction<{
      lessonId: number;
      moduleId: number;
      quizScore?: number;
    }>) => {
      const { lessonId, moduleId, quizScore } = action.payload;
      
      if (!state.lessonProgress[lessonId]) {
        state.lessonProgress[lessonId] = {
          lessonId,
          moduleId,
          completed: false,
          watchProgress: 0,
          quizCompleted: false,
          quizScore: null,
          timeSpent: 0,
          lastAccessed: new Date().toISOString()
        };
      }
      
      state.lessonProgress[lessonId].completed = true;
      state.lessonProgress[lessonId].lastAccessed = new Date().toISOString();
      
      if (quizScore !== undefined) {
        state.lessonProgress[lessonId].quizCompleted = true;
        state.lessonProgress[lessonId].quizScore = quizScore;
      }
      
      // Update module progress
      const module = state.modules.find(m => m.id === moduleId);
      if (module) {
        if (!state.moduleProgress[moduleId]) {
          state.moduleProgress[moduleId] = {
            moduleId,
            lessonsCompleted: 0,
            totalLessons: module.lessons.length,
            overallProgress: 0,
            status: 'Not Started',
            lastAccessed: new Date().toISOString()
          };
        }
        
        const moduleProgress = state.moduleProgress[moduleId];
        const completedLessons = Object.values(state.lessonProgress)
          .filter(progress => progress.moduleId === moduleId && progress.completed).length;
        
        moduleProgress.lessonsCompleted = completedLessons;
        moduleProgress.overallProgress = Math.round((completedLessons / moduleProgress.totalLessons) * 100);
        moduleProgress.status = completedLessons === 0 ? 
                               'Not Started' : 
                               completedLessons === moduleProgress.totalLessons ? 'Completed' : 'In Progress';
        moduleProgress.lastAccessed = new Date().toISOString();
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
      state.quizState.isTransitioning = true;
    },
    
    // Complete transition to next question
    nextQuizQuestion: (state) => {
      if (state.quizState.currentQuestion < state.quizState.questions.length - 1) {
        state.quizState.currentQuestion += 1;
        state.quizState.selectedAnswer = state.quizState.answers[state.quizState.currentQuestion] || null;
        state.quizState.showFeedback = false;
        state.quizState.isTransitioning = false;
      } else {
        // Show results
        const correctAnswers = state.quizState.questions.filter((question, index) => {
          const userAnswer = state.quizState.answers[index];
          return question.options.find(option => option.id === userAnswer)?.isCorrect;
        }).length;
        
        state.quizState.score = Math.round((correctAnswers / state.quizState.questions.length) * 100);
        state.quizState.showResults = true;
        state.quizState.isTransitioning = false;
      }
    },
    
    // Start transition for previous question
    startPreviousQuizTransition: (state) => {
      state.quizState.isTransitioning = true;
    },
    
    // Complete transition to previous question  
    previousQuizQuestion: (state) => {
      if (state.quizState.currentQuestion > 0) {
        state.quizState.currentQuestion -= 1;
        state.quizState.selectedAnswer = state.quizState.answers[state.quizState.currentQuestion] || null;
        state.quizState.showFeedback = !!state.quizState.selectedAnswer;
        state.quizState.isTransitioning = false;
      }
    },
    
    completeQuiz: (state, action: PayloadAction<{ lessonId: number; score: number }>) => {
      const { lessonId, score } = action.payload;
      
      // Update lesson progress with quiz completion
      if (state.lessonProgress[lessonId]) {
        state.lessonProgress[lessonId].quizCompleted = true;
        state.lessonProgress[lessonId].quizScore = score;
      }
      
      // Reset quiz state
      state.quizState = { ...initialQuizState };
      state.currentView = 'lesson';
    },
    
    resetQuiz: (state) => {
      state.quizState = {
        ...state.quizState,
        currentQuestion: 0,
        selectedAnswer: null,
        showFeedback: false,
        answers: {},
        showResults: false,
        score: 0,
        isTransitioning: false
      };
    },
    
    closeQuiz: (state) => {
      state.quizState = { ...initialQuizState };
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
    
    // Loading and error actions
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
  selectModule,
  selectLesson,
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