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
  quizType: 'lesson' | 'module'; // Track quiz type
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
  completedQuestions: { [questionId: number]: boolean }; // Track which questions were answered correctly
}

export interface ModuleProgress {
  moduleId: number;
  lessonsCompleted: number;
  totalLessons: number;
  overallProgress: number; // percentage
  status: 'Not Started' | 'In Progress' | 'Completed';
  lastAccessed: string;
  moduleQuizCompleted?: boolean; // Track module quiz completion
  moduleQuizScore?: number | null; // Track module quiz score
}

interface ModuleState {
  // Current navigation state
  currentView: 'modules' | 'lesson' | 'quiz' | 'moduleQuiz';
  selectedModuleId: number | null;
  selectedLessonId: number | null;
  
  // Modules data
  modules: Module[];
  
  // Progress tracking
  lessonProgress: { [lessonId: number]: LessonProgress };
  moduleProgress: { [moduleId: number]: ModuleProgress };
  
  // Quiz state
  quizState: QuizState;
  
  // Coin tracking
  totalCoins: number;
  
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
  quizType: 'lesson',
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
  totalCoins: 25, // Starting with 25 coins as shown in header
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
    setCurrentView: (state, action: PayloadAction<'modules' | 'lesson' | 'quiz' | 'moduleQuiz'>) => {
      state.currentView = action.payload;
    },
    
    setSelectedModule: (state, action: PayloadAction<number>) => {
      state.selectedModuleId = action.payload;
    },
    
    setSelectedLesson: (state, action: PayloadAction<number>) => {
      state.selectedLessonId = action.payload;
    },
    
    // Module data management
    setModules: (state, action: PayloadAction<Module[]>) => {
      state.modules = action.payload;
    },
    
    // Coin management
    addCoins: (state, action: PayloadAction<number>) => {
      state.totalCoins += action.payload;
    },
    
    spendCoins: (state, action: PayloadAction<number>) => {
      state.totalCoins = Math.max(0, state.totalCoins - action.payload);
    },
    
    setCoins: (state, action: PayloadAction<number>) => {
      state.totalCoins = action.payload;
    },
    
    incrementCoinsWithAnimation: (state, action: PayloadAction<{ lessonId: number; amount: number; isFromAnimation: boolean }>) => {
      const { amount, isFromAnimation } = action.payload;
      
      if (isFromAnimation) {
        state.totalCoins += amount;
      }
    },
    
    // Progress tracking
    updateLessonProgress: (state, action: PayloadAction<{ 
      lessonId: number; 
      moduleId: number; 
      watchProgress: number; 
      timeSpent: number 
    }>) => {
      const { lessonId, moduleId, watchProgress, timeSpent } = action.payload;
      
      if (!state.lessonProgress[lessonId]) {
        state.lessonProgress[lessonId] = {
          lessonId,
          moduleId,
          completed: false,
          watchProgress: 0,
          quizCompleted: false,
          quizScore: null,
          timeSpent: 0,
          lastAccessed: new Date().toISOString(),
          completedQuestions: {}
        };
      }
      
      state.lessonProgress[lessonId].watchProgress = watchProgress;
      state.lessonProgress[lessonId].timeSpent += timeSpent;
      state.lessonProgress[lessonId].lastAccessed = new Date().toISOString();
      
      // Auto-complete lesson if watched > 90%
      if (watchProgress > 90) {
        state.lessonProgress[lessonId].completed = true;
      }
      
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
    
    markLessonCompleted: (state, action: PayloadAction<{ lessonId: number; moduleId: number; quizScore?: number }>) => {
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
          lastAccessed: new Date().toISOString(),
          completedQuestions: {}
        };
      }
      
      state.lessonProgress[lessonId].completed = true;
      if (quizScore !== undefined) {
        state.lessonProgress[lessonId].quizScore = quizScore;
      }
      state.lessonProgress[lessonId].lastAccessed = new Date().toISOString();
      
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
    
    // Quiz actions - Updated to handle both lesson and module quizzes
    startQuiz: (state, action: PayloadAction<{ questions: QuizQuestion[]; lessonId: number }>) => {
      state.quizState = {
        ...initialQuizState,
        questions: action.payload.questions,
        isActive: true,
        quizType: 'lesson'
      };
      state.currentView = 'quiz';
    },
    
    // NEW: Start module quiz action
    startModuleQuiz: (state, action: PayloadAction<{ questions: QuizQuestion[]; moduleId: number }>) => {
      state.quizState = {
        ...initialQuizState,
        questions: action.payload.questions,
        isActive: true,
        quizType: 'module'
      };
      state.currentView = 'moduleQuiz';
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
        state.quizState.showFeedback = false;
      }
      state.quizState.isTransitioning = false;
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
        state.quizState.showFeedback = false;
      }
      state.quizState.isTransitioning = false;
    },
    
completeQuiz: (state, action: PayloadAction<{ 
  lessonId: number; 
  score: number; 
  skipCoinIncrement?: boolean; 
}>) => {
  const { lessonId, score, skipCoinIncrement = false } = action.payload;
  
  // Handle lesson quiz completion
  if (state.quizState.quizType === 'lesson') {
    // Get existing progress to check previous score
    const existingProgress = state.lessonProgress[lessonId];
    const wasQuizAlreadyCompleted = existingProgress?.quizCompleted || false;
    
    // Calculate total questions
    const totalQuestions = state.quizState.questions.length;
    
    // Convert percentage score to number of correct answers
    const correctAnswers = Math.round((score / 100) * totalQuestions);
    
    // Get previous score as number of correct answers (for consistency)
    const previousCorrectAnswers = existingProgress?.quizScore || 0;
    
    // Maximum possible coins for this lesson
    const maxCoinsForLesson = totalQuestions * 5; // 5 coins per question
    
    let coinsEarned = 0;
    const newlyCompletedQuestions: { [questionId: number]: boolean } = { ...existingProgress?.completedQuestions || {} };
    
    // Determine if coins should be awarded
    let shouldAwardCoins = false;
    
    // Check if user has already achieved 100% (perfect score)
    const hasAchievedPerfectScore = previousCorrectAnswers === totalQuestions;
    
    // Calculate coins that SHOULD be earned based on current score
    const totalCoinsForCurrentScore = correctAnswers * 5; // Total coins for current performance
    
    // Calculate coins already earned from previous attempts
    const coinsAlreadyEarned = previousCorrectAnswers * 5; // Coins earned from previous best score
    
    if (!wasQuizAlreadyCompleted) {
      // First time completing this quiz - award coins for correct answers
      shouldAwardCoins = true;
      coinsEarned = correctAnswers * 5; // 5 coins per correct answer
    } else if (correctAnswers > previousCorrectAnswers && !hasAchievedPerfectScore) {
      // User improved their score AND hasn't achieved perfect score yet
      shouldAwardCoins = true;
      // Award coins only for the improvement
      coinsEarned = totalCoinsForCurrentScore - coinsAlreadyEarned;
    }
    // If user already had perfect score (100%) or got same/lower score, no coins awarded
    
    // Cap the total coins to the maximum possible for this lesson
    if (coinsEarned > maxCoinsForLesson) {
      coinsEarned = maxCoinsForLesson;
    }
    
    // Users need at least 1 correct answer to earn coins
    if (correctAnswers < 1) {
      coinsEarned = 0;
      shouldAwardCoins = false;
    }
    
    // Ensure coins earned is never negative (safety check)
    coinsEarned = Math.max(0, coinsEarned);
    
    // Update completed questions based on current attempt
    state.quizState.questions.forEach((question, index) => {
      const userAnswer = state.quizState.answers[index];
      const isCorrect = question.options.find(option => option.id === userAnswer)?.isCorrect;
      
      if (isCorrect) {
        newlyCompletedQuestions[question.id] = true;
      }
    });
    
    // Only add coins if conditions are met
    if (!skipCoinIncrement && shouldAwardCoins && coinsEarned > 0 && !hasAchievedPerfectScore) {
      state.totalCoins += coinsEarned;
    }
    
    // Mark lesson as completed with quiz score
    if (state.selectedModuleId) {
      const currentProgress = state.lessonProgress[lessonId] || {
        lessonId,
        moduleId: state.selectedModuleId,
        completed: false,
        watchProgress: 0,
        quizCompleted: false,
        quizScore: null,
        timeSpent: 0,
        lastAccessed: new Date().toISOString(),
        completedQuestions: {}
      };

      // Update quiz score - keep the higher score (store as number of correct answers)
      state.lessonProgress[lessonId] = {
        ...currentProgress,
        quizCompleted: true,
        quizScore: Math.max(currentProgress.quizScore || 0, correctAnswers), // Store number of correct answers
        completedQuestions: newlyCompletedQuestions,
        lastAccessed: new Date().toISOString()
      };
      
      // Update module progress
      const module = state.modules.find(m => m.id === state.selectedModuleId!);
      if (module) {
        const moduleProgress = state.moduleProgress[state.selectedModuleId] || {
          moduleId: state.selectedModuleId,
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
        
        state.moduleProgress[state.selectedModuleId] = moduleProgress;
      }
    }
  }
  
  // Reset quiz state but keep results visible
  state.quizState.isActive = false;
},

completeModuleQuiz: (state, action: PayloadAction<{ 
  moduleId: number; 
  score: number; 
  skipCoinIncrement?: boolean; 
}>) => {
  const { moduleId, score, skipCoinIncrement = false } = action.payload;
  
  // Get existing module progress
  const existingModuleProgress = state.moduleProgress[moduleId];
  
  // Calculate total questions and correct answers
  const totalQuestions = state.quizState.questions.length;
  const correctAnswers = Math.round((score / 100) * totalQuestions);
  
  // Get previous score as number of correct answers (for consistency)
  const previousCorrectAnswers = existingModuleProgress?.moduleQuizScore || 0;
  
  // Module quiz specific logic: Only award coins if user gets 100%
  let coinsEarned = 0;
  let shouldAwardCoins = false;
  
  // Check if user achieved perfect score (100%)
  const hasAchievedPerfectScore = correctAnswers === totalQuestions;
  const hadPreviousPerfectScore = previousCorrectAnswers === totalQuestions;
  
  // Only award coins for 100% score and only if they haven't achieved it before
  if (hasAchievedPerfectScore && !hadPreviousPerfectScore) {
    shouldAwardCoins = true;
    coinsEarned = totalQuestions * 10; // 10 coins per question for module quiz
  }
  
  // Add coins if conditions are met
  if (!skipCoinIncrement && shouldAwardCoins) {
    state.totalCoins += coinsEarned;
  }
  
  // Update module progress with quiz completion
  const moduleProgress = state.moduleProgress[moduleId] || {
    moduleId,
    lessonsCompleted: 0,
    totalLessons: state.modules.find(m => m.id === moduleId)?.lessons.length || 0,
    overallProgress: 0,
    status: 'Not Started' as const,
    lastAccessed: new Date().toISOString()
  };
  
  moduleProgress.moduleQuizCompleted = true;
  // Keep the higher score if retaking (store as number of correct answers)
  moduleProgress.moduleQuizScore = Math.max(moduleProgress.moduleQuizScore || 0, correctAnswers);
  moduleProgress.lastAccessed = new Date().toISOString();
  
  // Mark module as completed only if quiz passed with 100%
  if (hasAchievedPerfectScore) {
    moduleProgress.status = 'Completed';
  }
  
  state.moduleProgress[moduleId] = moduleProgress;
  
  // Reset quiz state
  state.quizState.isActive = false;
},
    
    resetQuiz: (state) => {
      state.quizState = {
        ...initialQuizState,
        questions: state.quizState.questions,
        quizType: state.quizState.quizType,
        isActive: true
      };
    },
    
    closeQuiz: (state) => {
      const previousView = state.quizState.quizType === 'module' ? 'modules' : 'lesson';
      state.quizState = initialQuizState;
      state.currentView = previousView;
    },
    
    showQuizFeedback: (state) => {
      state.quizState.showFeedback = true;
    },
    
    hideQuizFeedback: (state) => {
      state.quizState.showFeedback = false;
    },
    
    // UI state management
    toggleSidebar: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    
    setShowCompactLayout: (state, action: PayloadAction<boolean>) => {
      state.showCompactLayout = action.payload;
    },
    
    setActiveTab: (state, action: PayloadAction<'All' | 'In Progress' | 'Completed'>) => {
      state.activeTab = action.payload;
    },
    
    // Error handling
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    }
  }
});

export const {
  setCurrentView,
  setSelectedModule,
  setSelectedLesson,
  setModules,
  addCoins,
  spendCoins,
  setCoins,
  incrementCoinsWithAnimation,
  updateLessonProgress,
  markLessonCompleted,
  startQuiz,
  startModuleQuiz, // NEW
  selectQuizAnswer,
  startQuizTransition,
  nextQuizQuestion,
  startPreviousQuizTransition,
  previousQuizQuestion,
  completeQuiz,
  completeModuleQuiz, // NEW
  resetQuiz,
  closeQuiz,
  showQuizFeedback,
  hideQuizFeedback,
  toggleSidebar,
  setShowCompactLayout,
  setActiveTab,
  setError,
  setLoading
} = moduleSlice.actions;

export default moduleSlice.reducer;