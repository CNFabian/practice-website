import { useSelector, useDispatch } from 'react-redux'
import { useCallback } from 'react'
import type { RootState, AppDispatch } from '../store/store'
import type { QuizQuestion } from '../store/slices/moduleSlice'
import {
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
  toggleSidebar,
  setShowCompactLayout,
  setActiveTab,
  setLoading,
  setError
} from '../store/slices/moduleSlice'

export const useModules = () => {
  const dispatch = useDispatch<AppDispatch>()
  const moduleState = useSelector((state: RootState) => state.modules)

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

  const goToModuleQuiz = useCallback((questions: QuizQuestion[], moduleId: number) => {
    dispatch(setSelectedModule(moduleId))
    dispatch(startModuleQuiz({ questions, moduleId }))
  }, [dispatch])

  const selectModuleById = useCallback((moduleId: number) => {
    dispatch(setSelectedModule(moduleId))
  }, [dispatch])

  const startLessonQuiz = useCallback((questions: QuizQuestion[], lessonId: number) => {
    dispatch(startQuiz({ questions, lessonId }))
  }, [dispatch])

  const startModuleQuizAction = useCallback((questions: QuizQuestion[], moduleId: number) => {
    dispatch(startModuleQuiz({ questions, moduleId }))
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

  const completeQuizWithScore = useCallback((lessonId: number, score: number) => {
    dispatch(completeQuiz({ lessonId, score }))
  }, [dispatch])

  const completeModuleQuizWithScore = useCallback((moduleId: number, score: number) => {
    dispatch(completeModuleQuiz({ moduleId, score }))
  }, [dispatch])

  const restartQuiz = useCallback(() => {
    dispatch(resetQuiz())
  }, [dispatch])

  const exitQuiz = useCallback(() => {
    dispatch(closeQuiz())
  }, [dispatch])

  const toggleSidebarState = useCallback((collapsed?: boolean) => {
    dispatch(toggleSidebar(collapsed ?? !moduleState.sidebarCollapsed))
  }, [dispatch, moduleState.sidebarCollapsed])

  const toggleCompactLayout = useCallback((compact?: boolean) => {
    dispatch(setShowCompactLayout(compact ?? !moduleState.showCompactLayout))
  }, [dispatch, moduleState.showCompactLayout])

  const changeActiveTab = useCallback((tab: 'All' | 'In Progress' | 'Completed') => {
    dispatch(setActiveTab(tab))
  }, [dispatch])

  const setIsLoading = useCallback((loading: boolean) => {
    dispatch(setLoading(loading))
  }, [dispatch])

  const setErrorMessage = useCallback((error: string | null) => {
    dispatch(setError(error))
  }, [dispatch])

  const clearErrorMessage = useCallback(() => {
    dispatch(setError(null))
  }, [dispatch])

  return {
    currentView: moduleState.currentView,
    selectedModuleId: moduleState.selectedModuleId,
    selectedLessonId: moduleState.selectedLessonId,
    quizState: moduleState.quizState,
    sidebarCollapsed: moduleState.sidebarCollapsed,
    showCompactLayout: moduleState.showCompactLayout,
    activeTab: moduleState.activeTab,
    isLoading: moduleState.isLoading,
    error: moduleState.error,

    goToModules,
    goToLesson,
    goToQuiz,
    goToModuleQuiz,

    selectModuleById,

    startQuiz: startLessonQuiz,
    startModuleQuiz: startModuleQuizAction,
    selectAnswer,
    nextQuestion,
    previousQuestion,
    completeQuiz: completeQuizWithScore,
    completeModuleQuiz: completeModuleQuizWithScore,
    resetQuiz: restartQuiz,
    closeQuiz: exitQuiz,

    toggleSidebar: toggleSidebarState,
    toggleCompactLayout,
    changeActiveTab,

    setLoading: setIsLoading,
    setError: setErrorMessage,
    clearError: clearErrorMessage
  }
}
