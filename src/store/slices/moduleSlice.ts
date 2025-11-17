import { createSlice, PayloadAction } from '@reduxjs/toolkit'

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
  quizType: 'lesson' | 'module';
  previousQuestionData: QuizQuestion | null;
  previousQuestionNumber: number;
  previousSelectedAnswer: string | null;
}

export interface LessonProgress {
  lessonId: number;
  moduleId: number;
  completed: boolean;
  watchProgress: number;
  quizCompleted: boolean;
  quizScore: number | null;
  timeSpent: number;
  lastAccessed: string;
  completedQuestions: { [questionId: number]: boolean };
}

export interface ModuleProgress {
  moduleId: number;
  lessonsCompleted: number;
  totalLessons: number;
  overallProgress: number;
  status: 'Not Started' | 'In Progress' | 'Completed';
  lastAccessed: string;
  moduleQuizCompleted?: boolean;
  moduleQuizScore?: number | null;
}

interface ModuleState {
  currentView: 'modules' | 'lesson' | 'quiz' | 'moduleQuiz';
  selectedModuleId: number | null;
  selectedLessonId: number | null;

  quizState: QuizState;

  sidebarCollapsed: boolean;
  showCompactLayout: boolean;
  activeTab: 'All' | 'In Progress' | 'Completed';

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
    setCurrentView: (state, action: PayloadAction<'modules' | 'lesson' | 'quiz' | 'moduleQuiz'>) => {
      state.currentView = action.payload;
    },

    setSelectedModule: (state, action: PayloadAction<number>) => {
      state.selectedModuleId = action.payload;
    },

    setSelectedLesson: (state, action: PayloadAction<number>) => {
      state.selectedLessonId = action.payload;
    },

    startQuiz: (state, action: PayloadAction<{ questions: QuizQuestion[]; lessonId: number }>) => {
      state.quizState = {
        ...initialQuizState,
        questions: action.payload.questions,
        isActive: true,
        quizType: 'lesson'
      };
      state.currentView = 'quiz';
    },

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

    startQuizTransition: (state) => {
      const currentQ = state.quizState.questions[state.quizState.currentQuestion];
      state.quizState.previousQuestionData = currentQ;
      state.quizState.previousQuestionNumber = state.quizState.currentQuestion + 1;
      state.quizState.previousSelectedAnswer = state.quizState.selectedAnswer;
      state.quizState.isTransitioning = true;
    },

    nextQuizQuestion: (state) => {
      if (state.quizState.currentQuestion < state.quizState.questions.length - 1) {
        state.quizState.currentQuestion += 1;
        state.quizState.selectedAnswer = state.quizState.answers[state.quizState.currentQuestion] || null;
        state.quizState.showFeedback = false;
      } else {
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

    startPreviousQuizTransition: (state) => {
      state.quizState.isTransitioning = true;
    },

    previousQuizQuestion: (state) => {
      if (state.quizState.currentQuestion > 0) {
        state.quizState.currentQuestion -= 1;
        state.quizState.selectedAnswer = state.quizState.answers[state.quizState.currentQuestion] || null;
        state.quizState.showFeedback = false;
      }
      state.quizState.isTransitioning = false;
    },

    completeQuiz: (state, _action: PayloadAction<{ lessonId: number; score: number }>) => {
      state.quizState.isActive = false;
    },

    completeModuleQuiz: (state, _action: PayloadAction<{ moduleId: number; score: number }>) => {
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

    toggleSidebar: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },

    setShowCompactLayout: (state, action: PayloadAction<boolean>) => {
      state.showCompactLayout = action.payload;
    },

    setActiveTab: (state, action: PayloadAction<'All' | 'In Progress' | 'Completed'>) => {
      state.activeTab = action.payload;
    },

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
  startQuiz,
  startModuleQuiz,
  selectQuizAnswer,
  startQuizTransition,
  nextQuizQuestion,
  startPreviousQuizTransition,
  previousQuizQuestion,
  completeQuiz,
  completeModuleQuiz,
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
