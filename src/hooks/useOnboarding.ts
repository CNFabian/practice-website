// src/hooks/useOnboarding.ts
import { useState, useEffect, useCallback } from 'react'
import {
  getOnboardingStatus,
  completeStep1,
  completeStep2,
  completeStep3,
  completeStep4,
  completeStep5,
  completeOnboardingAllSteps,
  getOnboardingData,
  getOnboardingProgress,
  isStepCompleted,
  getNextOnboardingStep
} from '../services/onboardingAPI'

export interface OnboardingAnswers {
  avatar?: string
  expert_contact?: string
  'Home Ownership'?: string
  city?: string
  has_realtor?: boolean
  has_loan_officer?: boolean
}

export interface OnboardingState {
  // Data
  answers: OnboardingAnswers
  currentStep: number
  isCompleted: boolean
  progress: number
  
  // Status
  loading: boolean
  error: string | null
  initializing: boolean
  
  // Actions
  setAnswer: (key: string, value: string | boolean) => void
  completeCurrentStep: () => Promise<void>
  completeAllSteps: () => Promise<void>
  goToStep: (step: number) => void
  resetOnboarding: () => void
  
  // Utilities
  canProceed: boolean
  isStepValid: (step: number) => boolean
  getStepData: (step: number) => any
}

export const useOnboarding = (): OnboardingState => {
  const [answers, setAnswers] = useState<OnboardingAnswers>({})
  const [currentStep, setCurrentStep] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initializing, setInitializing] = useState(true)

  // Initialize onboarding state from backend
  const initializeOnboarding = useCallback(async () => {
    setInitializing(true)
    setError(null)
    
    try {
      console.log('useOnboarding: Initializing...')
      
      // Get current status
      const status = await getOnboardingStatus()
      console.log('useOnboarding: Status:', status)
      
      setIsCompleted(status.is_completed)
      setProgress(status.progress_percentage || 0)
      
      if (status.is_completed) {
        setCurrentStep(4) // Last step
        console.log('useOnboarding: Onboarding already completed')
        return
      }
      
      // Set current step (backend is 1-indexed, frontend is 0-indexed)
      const frontendStep = Math.max(0, (status.current_step || 1) - 1)
      setCurrentStep(frontendStep)
      
      // Load existing data if any steps are completed
      if (status.current_step > 1) {
        const existingData = await getOnboardingData()
        console.log('useOnboarding: Existing data:', existingData)
        
        // Map backend data to frontend answers
        const mappedAnswers: OnboardingAnswers = {}
        if (existingData.selected_avatar) mappedAnswers.avatar = existingData.selected_avatar
        if (existingData.wants_expert_contact) mappedAnswers.expert_contact = existingData.wants_expert_contact
        if (existingData.homeownership_timeline_months) mappedAnswers['Home Ownership'] = String(existingData.homeownership_timeline_months)
        if (existingData.zipcode) mappedAnswers.city = existingData.zipcode
        if (existingData.has_realtor !== undefined) mappedAnswers.has_realtor = existingData.has_realtor
        if (existingData.has_loan_officer !== undefined) mappedAnswers.has_loan_officer = existingData.has_loan_officer
        
        setAnswers(mappedAnswers)
      }
      
    } catch (error) {
      console.error('useOnboarding: Initialization error:', error)
      setError('Failed to load onboarding status')
    } finally {
      setInitializing(false)
    }
  }, [])

  // Set answer for a step
  const setAnswer = useCallback((key: string, value: string | boolean) => {
    setAnswers(prev => ({ ...prev, [key]: value }))
    setError(null) // Clear any previous errors
  }, [])

  // Complete current step
  const completeCurrentStep = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log(`useOnboarding: Completing step ${currentStep}...`)
      
      switch (currentStep) {
        case 0: // Avatar step
          if (answers.avatar) {
            await completeStep1({ selected_avatar: answers.avatar })
          }
          break
          
        case 1: // Expert contact step
          if (answers.expert_contact) {
            await completeStep3({ wants_expert_contact: answers.expert_contact })
          }
          break
          
        case 2: // Timeline step
          if (answers['Home Ownership']) {
            await completeStep4({ 
              homeownership_timeline_months: parseInt(answers['Home Ownership']) 
            })
          }
          break
          
        case 3: // City step
          if (answers.city) {
            const zipcode = answers.city.match(/\d{5}/)?.[0] || answers.city
            await completeStep5({ zipcode })
          }
          break
          
        default:
          throw new Error(`Unknown step: ${currentStep}`)
      }
      
      console.log(`useOnboarding: Step ${currentStep} completed`)
      
      // Update progress
      const newProgress = getOnboardingProgress(answers)
      setProgress(newProgress)
      
    } catch (error) {
      console.error(`useOnboarding: Error completing step ${currentStep}:`, error)
      setError(`Failed to complete step ${currentStep + 1}`)
      throw error
    } finally {
      setLoading(false)
    }
  }, [currentStep, answers])

  // Complete all steps at once
  const completeAllSteps = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('useOnboarding: Completing all steps...')
      
      const onboardingData = {
        selected_avatar: answers.avatar || '',
        has_realtor: answers.has_realtor || false,
        has_loan_officer: answers.has_loan_officer || false,
        wants_expert_contact: answers.expert_contact || '',
        homeownership_timeline_months: parseInt(answers['Home Ownership'] || '0'),
        zipcode: answers.city?.match(/\d{5}/)?.[0] || answers.city || ''
      }
      
      await completeOnboardingAllSteps(onboardingData)
      
      setIsCompleted(true)
      setProgress(100)
      setCurrentStep(4)
      
      console.log('useOnboarding: All steps completed successfully')
      
    } catch (error) {
      console.error('useOnboarding: Error completing all steps:', error)
      setError('Failed to complete onboarding')
      throw error
    } finally {
      setLoading(false)
    }
  }, [answers])

  // Go to specific step
  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < 4) {
      setCurrentStep(step)
      setError(null)
    }
  }, [])

  // Reset onboarding
  const resetOnboarding = useCallback(() => {
    setAnswers({})
    setCurrentStep(0)
    setIsCompleted(false)
    setProgress(0)
    setError(null)
  }, [])

  // Check if current step can proceed
  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 0: return !!answers.avatar
      case 1: return !!answers.expert_contact
      case 2: return !!answers['Home Ownership']
      case 3: return !!answers.city
      default: return false
    }
  }, [currentStep, answers])

  // Check if specific step is valid
  const isStepValid = useCallback((step: number): boolean => {
    switch (step) {
      case 0: return !!answers.avatar
      case 1: return !!answers.expert_contact
      case 2: return !!answers['Home Ownership']
      case 3: return !!answers.city
      default: return false
    }
  }, [answers])

  // Get data for specific step
  const getStepData = useCallback((step: number) => {
    switch (step) {
      case 0: return { avatar: answers.avatar }
      case 1: return { expert_contact: answers.expert_contact }
      case 2: return { timeline: answers['Home Ownership'] }
      case 3: return { city: answers.city }
      default: return {}
    }
  }, [answers])

  // Initialize on mount
  useEffect(() => {
    initializeOnboarding()
  }, [initializeOnboarding])

  return {
    // Data
    answers,
    currentStep,
    isCompleted,
    progress,
    
    // Status
    loading,
    error,
    initializing,
    
    // Actions
    setAnswer,
    completeCurrentStep,
    completeAllSteps,
    goToStep,
    resetOnboarding,
    
    // Utilities
    canProceed,
    isStepValid,
    getStepData
  }
}

export default useOnboarding