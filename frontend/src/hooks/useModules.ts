import { useSelector, useDispatch } from 'react-redux'
import { useCallback } from 'react'
import type { RootState, AppDispatch } from '../store/store'
import type { QuizQuestion } from '../store/slices/quizSlice'
import {
  setCurrentView,
  setSelectedModule,
  setSelectedLesson,
  setLoading,
  setError
} from '../store/slices/moduleSlice'
import {
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
  closeQuiz
} from '../store/slices/quizSlice'

export const useModules = () => {
  const dispatch = useDispatch<AppDispatch>()
  const moduleState = useSelector((state: RootState) => state.modules)
  const quizState = useSelector((state: RootState) => state.quiz)

  const goToModules = useCallback(() => {
    dispatch(setCurrentView('modules'))
  }, [dispatch])

  const goToLesson = useCallback((lessonId: string | number, moduleId: number) => {    
    const lessonIdNumber = typeof lessonId === 'string' ? parseInt(lessonId, 10) : lessonId;
    
    dispatch(setSelectedLesson(lessonIdNumber));
    dispatch(setSelectedModule(moduleId));
    dispatch(setCurrentView('lesson'));
  }, [dispatch])

  const goToQuiz = useCallback((questions: QuizQuestion[], lessonId: number) => {
    dispatch(startQuiz({ questions, lessonId }))
    dispatch(setCurrentView('quiz'))
  }, [dispatch])

  const goToModuleQuiz = useCallback((questions: QuizQuestion[], moduleId: number) => {
    dispatch(setSelectedModule(moduleId))
    dispatch(startModuleQuiz({ questions, moduleId }))
    dispatch(setCurrentView('moduleQuiz'))
  }, [dispatch])

  const goToMinigame = useCallback((questions: QuizQuestion[], lessonId: number) => {
    dispatch(startMinigame({ questions, lessonId }))
    dispatch(setCurrentView('quiz'))
  }, [dispatch])

  const selectModuleById = useCallback((moduleId: number) => {
    dispatch(setSelectedModule(moduleId))
  }, [dispatch])

  const startLessonQuiz = useCallback((questions: QuizQuestion[], lessonId: number) => {
    dispatch(startQuiz({ questions, lessonId }))
    dispatch(setCurrentView('quiz'))
  }, [dispatch])

  const startModuleQuizAction = useCallback((questions: QuizQuestion[], moduleId: number) => {
    dispatch(startModuleQuiz({ questions, moduleId }))
    dispatch(setCurrentView('moduleQuiz'))
  }, [dispatch])

  const startMinigameAction = useCallback((questions: QuizQuestion[], lessonId: number) => {
    dispatch(startMinigame({ questions, lessonId }))
    dispatch(setCurrentView('quiz'))
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

  const completeMinigameWithScore = useCallback((lessonId: number, score: number) => {
    dispatch(completeMinigame({ lessonId, score }))
  }, [dispatch])

  const restartQuiz = useCallback(() => {
    dispatch(resetQuiz())
  }, [dispatch])

  const exitQuiz = useCallback(() => {
    dispatch(closeQuiz())
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
    // Core navigation state
    currentView: moduleState.currentView,
    selectedModuleId: moduleState.selectedModuleId,
    selectedLessonId: moduleState.selectedLessonId,
    isLoading: moduleState.isLoading,
    error: moduleState.error,

    // Quiz state from separate slice
    quizState,

    // Navigation actions
    goToModules,
    goToLesson,
    goToQuiz,
    goToModuleQuiz,
    goToMinigame,
    selectModuleById,

    // Quiz actions
    startQuiz: startLessonQuiz,
    startModuleQuiz: startModuleQuizAction,
    startMinigame: startMinigameAction,
    selectAnswer,
    nextQuestion,
    previousQuestion,
    completeQuiz: completeQuizWithScore,
    completeModuleQuiz: completeModuleQuizWithScore,
    completeMinigame: completeMinigameWithScore,
    resetQuiz: restartQuiz,
    closeQuiz: exitQuiz,

    // Utility actions
    setLoading: setIsLoading,
    setError: setErrorMessage,
    clearError: clearErrorMessage
  }
}