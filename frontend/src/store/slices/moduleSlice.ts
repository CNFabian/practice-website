import { createSlice, PayloadAction } from '@reduxjs/toolkit'

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
  isLoading: boolean;
  error: string | null;
}

const initialState: ModuleState = {
  currentView: 'modules',
  selectedModuleId: null,
  selectedLessonId: null,
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
  setError,
  setLoading
} = moduleSlice.actions;

export default moduleSlice.reducer;