import { useSelector, useDispatch } from 'react-redux'
import { useCallback } from 'react'
import type { RootState, AppDispatch } from '../store/store'
import type { Module, Lesson } from '../types/modules'
import type { QuizQuestion } from '../store/slices/moduleSlice'
import {
  setCurrentView,
  selectModule,
  selectLesson,
  setModules,
  updateLessonProgress,
  markLessonCompleted,
  startQuiz,
  selectQuizAnswer,
  nextQuizQuestion,
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
    dispatch(selectLesson({ lessonId, moduleId }))
  }, [dispatch])

  const goToQuiz = useCallback((questions: QuizQuestion[], lessonId: number) => {
    dispatch(startQuiz({ questions, lessonId }))
  }, [dispatch])

  // Module management
  const loadModules = useCallback((modules: Module[]) => {
    dispatch(setModules(modules))
  }, [dispatch])

  const selectModuleById = useCallback((moduleId: number) => {
    dispatch(selectModule(moduleId))
  }, [dispatch])

  // Progress tracking
  const updateProgress = useCallback((lessonId: number, updates: any) => {
    dispatch(updateLessonProgress({ lessonId, ...updates }))
  }, [dispatch])

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

  const handleNextQuestion = useCallback(() => {
    dispatch(nextQuizQuestion())
  }, [dispatch])

  const handlePreviousQuestion = useCallback(() => {
    dispatch(previousQuizQuestion())
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
    
    // Computed values
    currentModule,
    currentLesson,
    currentLessonProgress,
    currentModuleProgress,
    
    // Navigation actions
    goToModules,
    goToLesson,
    goToQuiz,
    
    // Module management
    loadModules,
    selectModuleById,
    
    // Progress tracking
    updateProgress,
    markCompleted,
    
    // Quiz actions
    startQuiz: handleStartQuiz,
    selectAnswer: handleSelectAnswer,
    nextQuestion: handleNextQuestion,
    previousQuestion: handlePreviousQuestion,
    completeQuiz: handleCompleteQuiz,
    resetQuiz: handleResetQuiz,
    closeQuiz: handleCloseQuiz,
    
    // UI state actions
    toggleSidebar,
    toggleCompactLayout,
    changeActiveTab,
    
    // Error handling
    setError: handleSetError,
    clearError: handleClearError,
    setLoading: handleSetLoading,
  }
}

export default useModules