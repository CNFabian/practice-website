import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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
  quizType: 'lesson' | 'module' | 'minigame';
  previousQuestionData: QuizQuestion | null;
  previousQuestionNumber: number;
  previousSelectedAnswer: string | null;
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

const quizSlice = createSlice({
  name: 'quiz',
  initialState: initialQuizState,
  reducers: {
    startQuiz: (state, action: PayloadAction<{ questions: QuizQuestion[]; lessonId: number }>) => {
      Object.assign(state, {
        ...initialQuizState,
        questions: action.payload.questions,
        isActive: true,
        quizType: 'lesson'
      });
    },

    startModuleQuiz: (state, action: PayloadAction<{ questions: QuizQuestion[]; moduleId: number }>) => {
      Object.assign(state, {
        ...initialQuizState,
        questions: action.payload.questions,
        isActive: true,
        quizType: 'module'
      });
    },

    startMinigame: (state, action: PayloadAction<{ questions: QuizQuestion[]; lessonId: number }>) => {
      Object.assign(state, {
        ...initialQuizState,
        questions: action.payload.questions,
        isActive: true,
        quizType: 'minigame'
      });
    },

    selectQuizAnswer: (state, action: PayloadAction<{ questionIndex: number; answer: string }>) => {
      const { questionIndex, answer } = action.payload;
      state.selectedAnswer = answer;
      state.answers[questionIndex] = answer;
    },

    startQuizTransition: (state) => {
      const currentQ = state.questions[state.currentQuestion];
      state.previousQuestionData = currentQ;
      state.previousQuestionNumber = state.currentQuestion + 1;
      state.previousSelectedAnswer = state.selectedAnswer;
      state.isTransitioning = true;
    },

    nextQuizQuestion: (state) => {
      if (state.currentQuestion < state.questions.length - 1) {
        state.currentQuestion += 1;
        state.selectedAnswer = state.answers[state.currentQuestion] || null;
        state.showFeedback = false;
      } else {
        const correctAnswers = state.questions.filter((question, index) => {
          const userAnswer = state.answers[index];
          return question.options.find(option => option.id === userAnswer)?.isCorrect;
        }).length;

        state.score = Math.round((correctAnswers / state.questions.length) * 100);
        state.showResults = true;
        state.showFeedback = false;
      }
      state.isTransitioning = false;
    },

    startPreviousQuizTransition: (state) => {
      state.isTransitioning = true;
    },

    previousQuizQuestion: (state) => {
      if (state.currentQuestion > 0) {
        state.currentQuestion -= 1;
        state.selectedAnswer = state.answers[state.currentQuestion] || null;
        state.showFeedback = false;
      }
      state.isTransitioning = false;
    },

    completeQuiz: (state, _action: PayloadAction<{ lessonId: number; score: number }>) => {
      state.isActive = false;
    },

    completeModuleQuiz: (state, _action: PayloadAction<{ moduleId: number; score: number }>) => {
      state.isActive = false;
    },

    completeMinigame: (state, _action: PayloadAction<{ lessonId: number; score: number }>) => {
      state.isActive = false;
    },

    resetQuiz: (state) => {
      Object.assign(state, {
        ...initialQuizState,
        questions: state.questions,
        quizType: state.quizType,
        isActive: true
      });
    },

    closeQuiz: (state) => {
      Object.assign(state, initialQuizState);
    },

    showQuizFeedback: (state) => {
      state.showFeedback = true;
    },

    hideQuizFeedback: (state) => {
      state.showFeedback = false;
    },
  }
});

export const {
  startQuiz,
  startModuleQuiz,
  startMinigame,
  selectQuizAnswer,
  startQuizTransition,
  nextQuizQuestion,
  startPreviousQuizTransition,
  previousQuizQuestion,
  completeQuiz,
  completeModuleQuiz,
  completeMinigame,
  resetQuiz,
  closeQuiz,
  showQuizFeedback,
  hideQuizFeedback,
} = quizSlice.actions;

export default quizSlice.reducer;