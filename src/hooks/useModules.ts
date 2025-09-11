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

  const completeLessonById = useCallback((lessonId: number, moduleId: number) => {
    dispatch(markLessonCompleted({ lessonId, moduleId }))
  }, [dispatch])

  // Quiz management
  const handleQuizAnswer = useCallback((answerId: string) => {
    dispatch(selectQuizAnswer(answerId))
  }, [dispatch])

  const goToNextQuestion = useCallback(() => {
    dispatch(nextQuizQuestion())
  }, [dispatch])

  const goToPreviousQuestion = useCallback(() => {
    dispatch(previousQuizQuestion())
  }, [dispatch])

  const finishQuiz = useCallback((lessonId: number, score: number) => {
    dispatch(completeQuiz({ lessonId, score }))
  }, [dispatch])

  const restartQuiz = useCallback(() => {
    dispatch(resetQuiz())
  }, [dispatch])

  const exitQuiz = useCallback(() => {
    dispatch(closeQuiz())
  }, [dispatch])

  // UI state management
  const toggleSidebar = useCallback((collapsed: boolean) => {
    dispatch(setSidebarCollapsed(collapsed))
  }, [dispatch])

  const setCompactLayout = useCallback((compact: boolean) => {
    dispatch(setShowCompactLayout(compact))
  }, [dispatch])

  const changeTab = useCallback((tab: 'All' | 'In Progress' | 'Completed') => {
    dispatch(setActiveTab(tab))
  }, [dispatch])

  // Error handling
  const handleError = useCallback((error: string) => {
    dispatch(setError(error))
  }, [dispatch])

  const clearErrors = useCallback(() => {
    dispatch(clearError())
  }, [dispatch])

  // Loading state
  const setLoadingState = useCallback((loading: boolean) => {
    dispatch(setLoading(loading))
  }, [dispatch])

  // Computed values
  const getCurrentModule = useCallback((): Module | null => {
    if (!moduleState.selectedModuleId) return null
    return moduleState.modules.find(m => m.id === moduleState.selectedModuleId) || null
  }, [moduleState.selectedModuleId, moduleState.modules])

  const getCurrentLesson = useCallback((): Lesson | null => {
    if (!moduleState.selectedLessonId || !moduleState.selectedModuleId) return null
    const module = getCurrentModule()
    return module?.lessons.find(l => l.id === moduleState.selectedLessonId) || null
  }, [moduleState.selectedLessonId, moduleState.selectedModuleId, getCurrentModule])

  const getModuleProgress = useCallback((moduleId: number) => {
    return moduleState.moduleProgress[moduleId] || {
      moduleId,
      lessonsCompleted: 0,
      totalLessons: 0,
      overallProgress: 0,
      status: 'Not Started' as const,
      lastAccessed: new Date().toISOString()
    }
  }, [moduleState.moduleProgress])

  const getLessonProgress = useCallback((lessonId: number) => {
    return moduleState.lessonProgress[lessonId] || null
  }, [moduleState.lessonProgress])

  const getFilteredModules = useCallback(() => {
    const { activeTab, modules, moduleProgress } = moduleState
    
    if (activeTab === 'All') return modules
    
    return modules.filter(module => {
      const progress = moduleProgress[module.id]
      if (!progress) return false // If no progress, don't show in 'In Progress' or 'Completed' tabs
      
      return activeTab === 'In Progress' 
        ? progress.status === 'In Progress'
        : progress.status === 'Completed'
    })
  }, [moduleState.activeTab, moduleState.modules, moduleState.moduleProgress])

  // Quiz helpers
  const getCurrentQuizQuestion = useCallback(() => {
    const { quizState } = moduleState
    if (!quizState.isActive || quizState.questions.length === 0) return null
    return quizState.questions[quizState.currentQuestion] || null
  }, [moduleState.quizState])

  const getQuizProgress = useCallback(() => {
    const { quizState } = moduleState
    return {
      current: quizState.currentQuestion + 1,
      total: quizState.questions.length,
      percentage: quizState.questions.length > 0 
        ? Math.round(((quizState.currentQuestion + 1) / quizState.questions.length) * 100)
        : 0
    }
  }, [moduleState.quizState])

  return {
    // State
    ...moduleState,
    
    // Actions
    goToModules,
    goToLesson,
    goToQuiz,
    loadModules,
    selectModuleById,
    updateProgress,
    completeLessonById,
    handleQuizAnswer,
    goToNextQuestion,
    goToPreviousQuestion,
    finishQuiz,
    restartQuiz,
    exitQuiz,
    toggleSidebar,
    setCompactLayout,
    changeTab,
    handleError,
    clearErrors,
    setLoadingState,
    
    // Computed values
    getCurrentModule,
    getCurrentLesson,
    getModuleProgress,
    getLessonProgress,
    getFilteredModules,
    getCurrentQuizQuestion,
    getQuizProgress
  }
}