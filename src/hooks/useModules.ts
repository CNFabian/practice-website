import { useSelector, useDispatch } from 'react-redux'
import { useCallback } from 'react'
import type { RootState, AppDispatch } from '../store/store'
import type { Module } from '../types/modules'
import type { QuizQuestion } from '../store/slices/moduleSlice'
import {
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
  selectQuizAnswer,
  startQuizTransition,
  nextQuizQuestion,
  startPreviousQuizTransition,
  previousQuizQuestion,
  completeQuiz,
  resetQuiz,
  closeQuiz,
  toggleSidebar,
  setShowCompactLayout,
  setActiveTab,
  setLoading,
  setError
} from '../store/slices/moduleSlice'

export const useModules = () => {
  const dispatch = useDispatch<AppDispatch>()
  const moduleState = useSelector
  
  ((state: RootState) => state.modules)

  const incrementCoinsWithAnimationHandler = useCallback((lessonId: number, amount: number, isFromAnimation: boolean = false) => {
  dispatch(incrementCoinsWithAnimation({ lessonId, amount, isFromAnimation }))
}, [dispatch])

  // Navigation actions
  const goToModules = useCallback(() => {
    dispatch(setCurrentView('modules'))
  }, [dispatch])

  const goToLesson = useCallback((lessonId: number, moduleId: number) => {
    dispatch(setSelectedLesson(lessonId))
    dispatch(setSelectedModule(moduleId))
    dispatch(setCurrentView('lesson'))
  }, [dispatch])

  const goToQuiz = useCallback((questions: QuizQuestion[], lessonId: number) => {
    dispatch(startQuiz({ questions, lessonId }))
  }, [dispatch])

  // Module management
  const loadModules = useCallback((modules: Module[]) => {
    dispatch(setModules(modules))
  }, [dispatch])

  const selectModuleById = useCallback((moduleId: number) => {
    dispatch(setSelectedModule(moduleId))
  }, [dispatch])

  // Coin management
  const incrementCoins = useCallback((amount: number) => {
    dispatch(addCoins(amount))
  }, [dispatch])

  const decrementCoins = useCallback((amount: number) => {
    dispatch(spendCoins(amount))
  }, [dispatch])

  const updateTotalCoins = useCallback((amount: number) => {
    dispatch(setCoins(amount))
  }, [dispatch])

  // Progress tracking - Fixed to match expected API
  const updateProgress = useCallback((lessonId: number, updates: any) => {
    // Handle both old API (object) and new API (individual params)
    if (typeof updates === 'object') {
      // Extract required parameters from updates object
      const moduleId = updates.moduleId || moduleState.selectedModuleId;
      const watchProgress = updates.watchProgress || 0;
      const timeSpent = updates.timeSpent || 0;
      
      if (moduleId) {
        dispatch(updateLessonProgress({ lessonId, moduleId, watchProgress, timeSpent }))
      }
    }
  }, [dispatch, moduleState.selectedModuleId])

  const markCompleted = useCallback((lessonId: number, moduleId: number, quizScore?: number) => {
    dispatch(markLessonCompleted({ lessonId, moduleId, quizScore }))
  }, [dispatch])

  // Quiz actions
  const startLessonQuiz = useCallback((questions: QuizQuestion[], lessonId: number) => {
    dispatch(startQuiz({ questions, lessonId }))
  }, [dispatch])

  const selectAnswer = useCallback((questionIndex: number, answer: string) => {
    dispatch(selectQuizAnswer({ questionIndex, answer }))
  }, [dispatch])

  const nextQuestion = useCallback(() => {
    dispatch(startQuizTransition())
    setTimeout(() => {
      dispatch(nextQuizQuestion())
    }, 300)
  }, [dispatch])

  const previousQuestion = useCallback(() => {
    dispatch(startPreviousQuizTransition())
    setTimeout(() => {
      dispatch(previousQuizQuestion())
    }, 300)
  }, [dispatch])

  const completeQuizWithScore = useCallback((lessonId: number, score: number, skipCoinIncrement: boolean = false) => {
  dispatch(completeQuiz({ lessonId, score, skipCoinIncrement }))
}, [dispatch])

  const restartQuiz = useCallback(() => {
    dispatch(resetQuiz())
  }, [dispatch])

  const exitQuiz = useCallback(() => {
    dispatch(closeQuiz())
  }, [dispatch])

  // UI state actions
  const toggleSidebarState = useCallback((collapsed?: boolean) => {
    dispatch(toggleSidebar(collapsed ?? !moduleState.sidebarCollapsed))
  }, [dispatch, moduleState.sidebarCollapsed])

  const toggleCompactLayout = useCallback((compact?: boolean) => {
    dispatch(setShowCompactLayout(compact ?? !moduleState.showCompactLayout))
  }, [dispatch, moduleState.showCompactLayout])

  const changeActiveTab = useCallback((tab: 'All' | 'In Progress' | 'Completed') => {
    dispatch(setActiveTab(tab))
  }, [dispatch])

  // Loading and error management
  const setIsLoading = useCallback((loading: boolean) => {
    dispatch(setLoading(loading))
  }, [dispatch])

  const setErrorMessage = useCallback((error: string | null) => {
    dispatch(setError(error))
  }, [dispatch])

  const clearErrorMessage = useCallback(() => {
    dispatch(setError(null))
  }, [dispatch])

  // Computed properties - keep all your existing getters
  const currentModule = moduleState.selectedModuleId 
    ? moduleState.modules.find(m => m.id === moduleState.selectedModuleId) 
    : undefined;

  const currentLesson = moduleState.selectedLessonId && currentModule
    ? currentModule.lessons.find(l => l.id === moduleState.selectedLessonId)
    : undefined;

  const currentLessonProgress = moduleState.selectedLessonId
    ? moduleState.lessonProgress[moduleState.selectedLessonId]
    : undefined;

  return {
    // State
    currentView: moduleState.currentView,
    selectedModuleId: moduleState.selectedModuleId,
    selectedLessonId: moduleState.selectedLessonId,
    modules: moduleState.modules,
    lessonProgress: moduleState.lessonProgress,
    moduleProgress: moduleState.moduleProgress,
    quizState: moduleState.quizState,
    totalCoins: moduleState.totalCoins,
    sidebarCollapsed: moduleState.sidebarCollapsed,
    showCompactLayout: moduleState.showCompactLayout,
    activeTab: moduleState.activeTab,
    isLoading: moduleState.isLoading,
    error: moduleState.error,

    // Computed properties
    currentModule,
    currentLesson,
    currentLessonProgress,

    // Navigation actions
    goToModules,
    goToLesson,
    goToQuiz,

    // Module management
    loadModules,
    selectModuleById,

    // Coin management
    incrementCoins,
  incrementCoinsWithAnimation: incrementCoinsWithAnimationHandler,
  decrementCoins,
  updateTotalCoins,

    // Progress tracking
    updateProgress,
    markCompleted,

    // Quiz actions
    startQuiz: startLessonQuiz,
  selectAnswer,
  nextQuestion,
  previousQuestion,
  completeQuiz: completeQuizWithScore,
  resetQuiz: restartQuiz,
  closeQuiz: exitQuiz,

    // UI state
    toggleSidebar: toggleSidebarState,
    toggleCompactLayout,
    changeActiveTab,

    // Loading and error
    setLoading: setIsLoading,
    setError: setErrorMessage,
    clearError: clearErrorMessage
  }
}