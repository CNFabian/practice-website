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
} from '../store/slices/moduleSlice'

export const useModules = () => {
  const dispatch = useDispatch<AppDispatch>()
  const moduleState = useSelector((state: RootState) => state.modules)

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
  const handleStartQuiz = useCallback((questions: QuizQuestion[], lessonId: number) => {
    dispatch(startQuiz({ questions, lessonId }))
  }, [dispatch])

  const handleSelectAnswer = useCallback((questionIndex: number, answer: string) => {
    dispatch(selectQuizAnswer({ questionIndex, answer }))
  }, [dispatch])

  // Handle next question with proper transition - FIXED TIMING
  const handleNextQuestion = useCallback(() => {
    dispatch(startQuizTransition())
    // Use setTimeout outside of reducer to handle the transition delay
    setTimeout(() => {
      dispatch(nextQuizQuestion())
    }, 500) // Changed from 300ms to 500ms to match CSS duration
  }, [dispatch])

  // Handle previous question with proper transition - FIXED TIMING  
  const handlePreviousQuestion = useCallback(() => {
    dispatch(startPreviousQuizTransition())
    // Use setTimeout outside of reducer to handle the transition delay
    setTimeout(() => {
      dispatch(previousQuizQuestion())
    }, 500) // Changed from 300ms to 500ms to match CSS duration
  }, [dispatch])

  const handleCompleteQuiz = useCallback((lessonId: number, score: number) => {
    dispatch(completeQuiz({ lessonId, score }))
  }, [dispatch])

  const handleResetQuiz = useCallback(() => {
    dispatch(resetQuiz())
  }, [dispatch])

  const handleCloseQuiz = useCallback(() => {
    dispatch(closeQuiz())
  }, [dispatch])

  // UI state actions
  const toggleSidebar = useCallback((collapsed: boolean) => {
    dispatch(setSidebarCollapsed(collapsed))
  }, [dispatch])

  const toggleCompactLayout = useCallback((compact: boolean) => {
    dispatch(setShowCompactLayout(compact))
  }, [dispatch])

  const changeActiveTab = useCallback((tab: 'All' | 'In Progress' | 'Completed') => {
    dispatch(setActiveTab(tab))
  }, [dispatch])

  // Error handling
  const handleSetError = useCallback((error: string | null) => {
    dispatch(setError(error))
  }, [dispatch])

  const handleClearError = useCallback(() => {
    dispatch(clearError())
  }, [dispatch])

  const handleSetLoading = useCallback((loading: boolean) => {
    dispatch(setLoading(loading))
  }, [dispatch])

  // Computed values
  const currentModule = moduleState.selectedModuleId 
    ? moduleState.modules.find(m => m.id === moduleState.selectedModuleId) 
    : null

  const currentLesson = currentModule && moduleState.selectedLessonId
    ? currentModule.lessons.find(l => l.id === moduleState.selectedLessonId)
    : null

  const currentLessonProgress = moduleState.selectedLessonId
    ? moduleState.lessonProgress[moduleState.selectedLessonId]
    : null

  const currentModuleProgress = moduleState.selectedModuleId
    ? moduleState.moduleProgress[moduleState.selectedModuleId]
    : null

  return {
    // State
    ...moduleState,
    currentModule,
    currentLesson,
    currentLessonProgress,
    currentModuleProgress,
    
    // Navigation
    goToModules,
    goToLesson,
    goToQuiz,
    
    // Module management
    loadModules,
    selectModuleById,
    
    // Progress tracking
    updateProgress,
    markCompleted,
    
    // Quiz actions - using the proper method names expected by components
    startQuiz: handleStartQuiz,
    selectAnswer: handleSelectAnswer,
    nextQuestion: handleNextQuestion,
    previousQuestion: handlePreviousQuestion,
    completeQuiz: handleCompleteQuiz,
    resetQuiz: handleResetQuiz,
    closeQuiz: handleCloseQuiz,
    
    // UI state
    toggleSidebar,
    toggleCompactLayout,
    changeActiveTab,
    
    // Error handling
    setError: handleSetError,
    clearError: handleClearError,
    setLoading: handleSetLoading
  }
}