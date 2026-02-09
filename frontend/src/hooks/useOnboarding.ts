import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  completeStep1,
  completeStep2,
  completeStep3,
  completeStep4,
  completeOnboardingAllSteps,
  getOnboardingData,
  getOnboardingProgress
} from '../services/onBoardingAPI'
import { useOnboardingStatus } from './queries/useOnboardingStatus'

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
  const { data: onboardingStatusData, refetch: refetchOnboardingStatus } = useOnboardingStatus()
  const [answers, setAnswers] = useState<OnboardingAnswers>({})
  const [currentStep, setCurrentStep] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initializing, setInitializing] = useState(true)

  const initializeOnboarding = useCallback(async () => {
    setInitializing(true)
    setError(null)

    try {
      console.log('useOnboarding: Initializing...')

      const status = onboardingStatusData
      console.log('useOnboarding: Status:', status)

      if (!status) {
        console.log('useOnboarding: No status data available yet')
        return
      }

      setIsCompleted(status.completed)
      setProgress(getOnboardingProgress(status))

      if (status.completed) {
        setCurrentStep(4)
        console.log('useOnboarding: Onboarding already completed')
        return
      }

      const frontendStep = Math.max(0, (status.step || 1) - 1)
      setCurrentStep(frontendStep)

      if (status.step && status.step > 1) {
        const existingData = await getOnboardingData()
        console.log('useOnboarding: Existing data:', existingData)

        const mappedAnswers: OnboardingAnswers = {}
        if (existingData.wants_expert_contact) mappedAnswers.expert_contact = existingData.wants_expert_contact
        if (existingData.homeownership_timeline_months) mappedAnswers['Home Ownership'] = String(existingData.homeownership_timeline_months)
        if (existingData.target_cities && existingData.target_cities.length > 0) mappedAnswers.city = existingData.target_cities[0]
        if (existingData.has_realtor !== undefined) mappedAnswers.has_realtor = existingData.has_realtor === 'Yes, I am'
        if (existingData.has_loan_officer !== undefined) mappedAnswers.has_loan_officer = existingData.has_loan_officer === 'Yes, I am'

        setAnswers(mappedAnswers)
      }

    } catch (error) {
      console.error('useOnboarding: Initialization error:', error)
      setError('Failed to load onboarding status')
    } finally {
      setInitializing(false)
    }
  }, [onboardingStatusData])

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
        case 0: // Professionals step → API step1
          await completeStep1({
            has_realtor: answers.has_realtor ? 'Yes, I am' : 'Not yet',
            has_loan_officer: answers.has_loan_officer ? 'Yes, I am' : 'Not yet'
          })
          break
          
        case 1: // Expert contact step → API step2
          if (answers.expert_contact) {
            await completeStep2({ wants_expert_contact: answers.expert_contact })
          }
          break
          
        case 2: // Timeline step → API step3
          if (answers['Home Ownership']) {
            await completeStep3({ 
              homeownership_timeline_months: parseInt(answers['Home Ownership']) 
            })
          }
          break
          
        case 3: // City step → API step4
          if (answers.city) {
            const zipcode = answers.city.match(/\d{5}/)?.[0] || answers.city
            await completeStep4({ target_cities: [zipcode] })
          }
          break
          
        default:
          throw new Error(`Unknown step: ${currentStep}`)
      }
      
      console.log(`useOnboarding: Step ${currentStep} completed`)

      const { data: updatedStatus } = await refetchOnboardingStatus()
      if (updatedStatus) {
        const newProgress = getOnboardingProgress(updatedStatus)
        setProgress(newProgress)
      }
      
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
        has_realtor: answers.has_realtor ? 'Yes, I am' : 'Not yet',
        has_loan_officer: answers.has_loan_officer ? 'Yes, I am' : 'Not yet',
        wants_expert_contact: answers.expert_contact || '',
        homeownership_timeline_months: parseInt(answers['Home Ownership'] || '0'),
        target_cities: [answers.city?.match(/\d{5}/)?.[0] || answers.city || '']
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