// src/contexts/ModuleStateContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Module, Lesson } from '../types/modules';

interface QuizAnswer {
  questionId: number;
  selectedAnswer: string;
}

interface LessonProgress {
  lessonId: number;
  completed: boolean;
  quizScore?: number;
  quizAnswers?: QuizAnswer[];
  videoProgress?: number;
  lastAccessedAt: string;
}

interface ModuleProgress {
  moduleId: number;
  lessonsProgress: { [lessonId: number]: LessonProgress };
  currentLessonId?: number;
  lastAccessedAt: string;
}

interface ModuleState {
  // Current navigation state
  currentView: 'modules' | 'lesson';
  selectedModule: Module | null;
  selectedLesson: Lesson | null;
  
  // Progress tracking
  modulesProgress: { [moduleId: number]: ModuleProgress };
  
  // Quiz state
  currentQuizAnswers: { [questionIndex: number]: string };
  currentQuizQuestion: number;
  
  // UI state
  lessonInfoCollapsed: boolean;
  descriptionExpanded: boolean;
  showQuiz: boolean;
}

interface ModuleStateContextType {
  state: ModuleState;
  
  // Navigation actions
  setCurrentView: (view: 'modules' | 'lesson') => void;
  setSelectedModule: (module: Module | null) => void;
  setSelectedLesson: (lesson: Lesson | null) => void;
  
  // Progress actions
  updateLessonProgress: (moduleId: number, lessonId: number, progress: Partial<LessonProgress>) => void;
  markLessonComplete: (moduleId: number, lessonId: number, quizScore?: number) => void;
  updateVideoProgress: (moduleId: number, lessonId: number, progress: number) => void;
  
  // Quiz actions
  setQuizAnswer: (questionIndex: number, answer: string) => void;
  setCurrentQuizQuestion: (index: number) => void;
  resetQuizState: () => void;
  getQuizAnswers: () => { [questionIndex: number]: string };
  
  // UI state actions
  setLessonInfoCollapsed: (collapsed: boolean) => void;
  setDescriptionExpanded: (expanded: boolean) => void;
  setShowQuiz: (show: boolean) => void;
  
  // Persistence
  saveState: () => void;
  loadState: () => void;
  clearState: () => void;
}

const ModuleStateContext = createContext<ModuleStateContextType | undefined>(undefined);

const STORAGE_KEY = 'module_progress_state';

export const ModuleStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ModuleState>({
    currentView: 'modules',
    selectedModule: null,
    selectedLesson: null,
    modulesProgress: {},
    currentQuizAnswers: {},
    currentQuizQuestion: 0,
    lessonInfoCollapsed: false,
    descriptionExpanded: false,
    showQuiz: false,
  });

  // Load state from localStorage on mount
  useEffect(() => {
    loadState();
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    saveState();
  }, [state.modulesProgress]);

  const saveState = () => {
    try {
      const persistedState = {
        modulesProgress: state.modulesProgress,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));
    } catch (error) {
      console.error('Failed to save module state:', error);
    }
  };

  const loadState = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setState(prev => ({
          ...prev,
          modulesProgress: parsed.modulesProgress || {},
        }));
      }
    } catch (error) {
      console.error('Failed to load module state:', error);
    }
  };

  const clearState = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState({
      currentView: 'modules',
      selectedModule: null,
      selectedLesson: null,
      modulesProgress: {},
      currentQuizAnswers: {},
      currentQuizQuestion: 0,
      lessonInfoCollapsed: false,
      descriptionExpanded: false,
      showQuiz: false,
    });
  };

  const setCurrentView = (view: 'modules' | 'lesson') => {
    setState(prev => ({ ...prev, currentView: view }));
  };

  const setSelectedModule = (module: Module | null) => {
    setState(prev => ({ ...prev, selectedModule: module }));
  };

  const setSelectedLesson = (lesson: Lesson | null) => {
    setState(prev => ({ ...prev, selectedLesson: lesson }));
    
    // Update last accessed
    if (lesson && state.selectedModule) {
      updateLessonProgress(state.selectedModule.id, lesson.id, {
        lastAccessedAt: new Date().toISOString(),
      });
    }
  };

  const updateLessonProgress = (moduleId: number, lessonId: number, progress: Partial<LessonProgress>) => {
    setState(prev => {
      const moduleProgress = prev.modulesProgress[moduleId] || {
        moduleId,
        lessonsProgress: {},
        lastAccessedAt: new Date().toISOString(),
      };

      const lessonProgress = moduleProgress.lessonsProgress[lessonId] || {
        lessonId,
        completed: false,
        lastAccessedAt: new Date().toISOString(),
      };

      return {
        ...prev,
        modulesProgress: {
          ...prev.modulesProgress,
          [moduleId]: {
            ...moduleProgress,
            currentLessonId: lessonId,
            lastAccessedAt: new Date().toISOString(),
            lessonsProgress: {
              ...moduleProgress.lessonsProgress,
              [lessonId]: {
                ...lessonProgress,
                ...progress,
              },
            },
          },
        },
      };
    });
  };

  const markLessonComplete = (moduleId: number, lessonId: number, quizScore?: number) => {
    updateLessonProgress(moduleId, lessonId, {
      completed: true,
      quizScore,
      lastAccessedAt: new Date().toISOString(),
    });
  };

  const updateVideoProgress = (moduleId: number, lessonId: number, progress: number) => {
    updateLessonProgress(moduleId, lessonId, {
      videoProgress: progress,
    });
  };

  const setQuizAnswer = (questionIndex: number, answer: string) => {
    setState(prev => ({
      ...prev,
      currentQuizAnswers: {
        ...prev.currentQuizAnswers,
        [questionIndex]: answer,
      },
    }));
  };

  const setCurrentQuizQuestion = (index: number) => {
    setState(prev => ({ ...prev, currentQuizQuestion: index }));
  };

  const resetQuizState = () => {
    setState(prev => ({
      ...prev,
      currentQuizAnswers: {},
      currentQuizQuestion: 0,
    }));
  };

  const getQuizAnswers = () => state.currentQuizAnswers;

  const setLessonInfoCollapsed = (collapsed: boolean) => {
    setState(prev => ({ ...prev, lessonInfoCollapsed: collapsed }));
  };

  const setDescriptionExpanded = (expanded: boolean) => {
    setState(prev => ({ ...prev, descriptionExpanded: expanded }));
  };

  const setShowQuiz = (show: boolean) => {
    setState(prev => ({ ...prev, showQuiz: show }));
  };

  const value: ModuleStateContextType = {
    state,
    setCurrentView,
    setSelectedModule,
    setSelectedLesson,
    updateLessonProgress,
    markLessonComplete,
    updateVideoProgress,
    setQuizAnswer,
    setCurrentQuizQuestion,
    resetQuizState,
    getQuizAnswers,
    setLessonInfoCollapsed,
    setDescriptionExpanded,
    setShowQuiz,
    saveState,
    loadState,
    clearState,
  };

  return (
    <ModuleStateContext.Provider value={value}>
      {children}
    </ModuleStateContext.Provider>
  );
};

export const useModuleState = () => {
  const context = useContext(ModuleStateContext);
  if (!context) {
    throw new Error('useModuleState must be used within ModuleStateProvider');
  }
  return context;
};