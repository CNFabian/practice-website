import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  getOnboardingStatus,
  completeStep1,
  completeStep3,
  completeStep4,
  completeStep5,
  completeOnboardingAllSteps,
  getOnboardingData
} from '../../../services/onBoardingAPI'
import { 
  SliderScreen, 
  CardGridScreen,
  CitySearchScreen,
  ExpertContactScreen
} from './screens'

type Question = { id: string; label: string; options: string[]; helpText?: string }

const STEPS: Question[] = [
  { 
    id: 'avatar', 
    label: 'Choose Your Avatar', 
    options: ['Curious Cat','Celebrating Bird','Careful Elephant','Protective Dog'],
    helpText: 'Select an avatar that represents you on your homeownership journey'
  },
  { 
    id: 'expert_contact', 
    label: 'Would you like to get in contact with an expert?', 
    options: [],
    helpText: 'Buying a home is easier with the right help. Would you like us to connect you with a loan officer or real estate agent?'
  },
  { 
    id: 'Home Ownership', 
    label: 'When do you want to achieve homeownership?', 
    options: [], 
    helpText: 'This helps us customize your learning path and set realistic goals.' 
  },
  { 
    id: 'city', 
    label: "Finally, let's find your future home base!\nSelect the city you're interested in:", 
    options: [],
    helpText: ''
  },
]

const AVATAR_ICON: Record<string,string> = {
  'Curious Cat':'😺','Celebrating Bird':'🐦','Careful Elephant':'🐘','Protective Dog':'🐶',
}

const SLIDER = { min:6, max:60, step:1, defaultValue:28, unit:'months', minLabel:'6 months', maxLabel:'5 years' }

const cx = (...c: (string|false)[]) => c.filter(Boolean).join(' ')

export default function OnBoardingPage() {
  const nav = useNavigate()
  const [answers, setAns] = useState<Record<string,string>>({})
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  
  const cur = STEPS[step]
  const total = STEPS.length

  // Initialize onboarding state from backend
  useEffect(() => {
    const initializeOnboarding = async () => {
      try {
        console.log('OnBoarding: Checking onboarding status...');
        
        // Check if onboarding is already completed
        const status = await getOnboardingStatus();
        console.log('OnBoarding: Status received:', status);
        
        // FIXED: Handle both possible response formats from backend
        const isCompleted = status.is_completed || (status as any).completed;
        const currentStep = status.current_step || (status as any).step;
        
        console.log('OnBoarding: Parsed - isCompleted:', isCompleted, 'currentStep:', currentStep);
        
        if (isCompleted) {
          console.log('OnBoarding: Already completed, redirecting to app...');
          nav('/app', { replace: true });
          return;
        }
        
        // Load existing onboarding data if any steps are completed
        if (currentStep && currentStep > 1) {
          console.log('OnBoarding: Loading existing data...');
          const existingData = await getOnboardingData();
          console.log('OnBoarding: Existing data:', existingData);
          
          // Map backend data to frontend answers
          const existingAnswers: Record<string, string> = {};
          if (existingData.selected_avatar) existingAnswers.avatar = existingData.selected_avatar;
          if (existingData.wants_expert_contact) existingAnswers.expert_contact = existingData.wants_expert_contact;
          if (existingData.homeownership_timeline_months) existingAnswers['Home Ownership'] = String(existingData.homeownership_timeline_months);
          if (existingData.zipcode) existingAnswers.city = existingData.zipcode;
          
          setAns(existingAnswers);
          setStep(Math.max(0, currentStep - 1)); // Backend is 1-indexed, frontend is 0-indexed
        }
        
        console.log('OnBoarding: Initialization complete, showing form');
        
      } catch (error) {
        console.error('OnBoarding: Initialization error:', error);
        setError('Failed to load onboarding status. Please try again.');
      } finally {
        console.log('OnBoarding: Setting isInitializing to false');
        setIsInitializing(false);
      }
    };

    initializeOnboarding();
  }, [nav]);

  // Set default Home Ownership value
  useEffect(() => {
    if (cur.id === 'Home Ownership' && !answers[cur.id]) {
      setAns(p => ({ ...p, [cur.id]: String(SLIDER.defaultValue) }))
    }
  }, [cur.id, answers])

  const allAnswered = useMemo(() => STEPS.every(s => !!answers[s.id]), [answers])
  const progressPct = Math.round(((step + (answers[cur.id] ? 1 : 0)) / total) * 100)

  // Handle individual step completion with backend
  const handleStepCompletion = async (stepId: string, value: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`OnBoarding: Completing step ${stepId} with value:`, value);
      
      // Map frontend step to backend API call
      switch (stepId) {
        case 'avatar':
          await completeStep1({ selected_avatar: value });
          break;
        case 'expert_contact':
          await completeStep3({ wants_expert_contact: value });
          break;
        case 'Home Ownership':
          await completeStep4({ homeownership_timeline_months: parseInt(value) });
          break;
        case 'city':
          // Extract zipcode from city selection (you may need to adjust this based on your city selection logic)
          const zipcode = value.match(/\d{5}/)?.[0] || value; // Extract 5-digit zipcode or use value as-is
          await completeStep5({ zipcode });
          break;
        default:
          console.warn('OnBoarding: Unknown step ID:', stepId);
      }
      
      console.log(`OnBoarding: Step ${stepId} completed successfully`);
      
    } catch (error) {
      console.error(`OnBoarding: Error completing step ${stepId}:`, error);
      setError(`Failed to save ${stepId} information. Please try again.`);
      throw error; // Re-throw to handle in the calling function
    } finally {
      setLoading(false);
    }
  };

  // Handle complete onboarding with backend
  const handleCompleteOnboarding = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('OnBoarding: Completing all steps...');
      
      // Prepare data for bulk completion
      const onboardingData = {
        selected_avatar: answers.avatar,
        has_realtor: false, // You may want to add this to your frontend
        has_loan_officer: false, // You may want to add this to your frontend
        wants_expert_contact: answers.expert_contact,
        homeownership_timeline_months: parseInt(answers['Home Ownership']),
        zipcode: answers.city.match(/\d{5}/)?.[0] || answers.city
      };
      
      console.log('OnBoarding: Sending complete data:', onboardingData);
      await completeOnboardingAllSteps(onboardingData);
      
      console.log('OnBoarding: All steps completed successfully');
      nav('/app', { replace: true });
      
    } catch (error) {
      console.error('OnBoarding: Error completing onboarding:', error);
      setError('Failed to complete onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle next button with backend integration
  const handleNext = async () => {
    if (!answers[cur.id]) return;
    
    try {
      // Save current step to backend
      await handleStepCompletion(cur.id, answers[cur.id]);
      
      // Move to next step
      setStep(s => Math.min(total - 1, s + 1));
      
    } catch (error) {
      // Error handling is done in handleStepCompletion
      console.error('OnBoarding: Failed to proceed to next step');
    }
  };

  // Handle complete button with backend integration
  const handleComplete = async () => {
    if (!allAnswered) return;
    
    try {
      await handleCompleteOnboarding();
    } catch (error) {
      // Error handling is done in handleCompleteOnboarding
      console.error('OnBoarding: Failed to complete onboarding');
    }
  };

  console.log('OnBoarding render - isInitializing:', isInitializing);

  // Show loading spinner during initialization
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-indigo-700">Loading onboarding...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-lg">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Step {step + 1} of {total}</span>
            <span>{progressPct}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-600"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Question Content */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {cur.helpText && (
            <p className="text-sm text-gray-600 mb-4">{cur.helpText}</p>
          )}
          
          <h2 className="text-2xl font-bold text-gray-900 mb-6 whitespace-pre-line">
            {cur.label}
          </h2>

          {/* Render appropriate screen based on step */}
          {cur.id === 'avatar' && (
            <CardGridScreen
              name={cur.id}
              label={cur.label}
              opts={cur.options}
              value={answers[cur.id] || ''}
              onChange={(val: string) => setAns(p => ({ ...p, [cur.id]: val }))}
              iconMap={AVATAR_ICON}
            />
          )}

          {cur.id === 'expert_contact' && (
            <ExpertContactScreen
              value={answers[cur.id] || ''}
              onChange={(val: string) => setAns(p => ({ ...p, [cur.id]: val }))}
            />
          )}

          {cur.id === 'Home Ownership' && (
            <SliderScreen
              value={String(parseInt(answers[cur.id]) || SLIDER.defaultValue)}
              onChange={(val: string) => setAns(p => ({ ...p, [cur.id]: val }))}
            />
          )}

          {cur.id === 'city' && (
            <CitySearchScreen
              value={answers[cur.id] || ''}
              onChange={(val: string) => setAns(p => ({ ...p, [cur.id]: val }))}
            />
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8">
            <button 
              onClick={() => setStep(s => Math.max(0, s - 1))} 
              disabled={step === 0 || loading}
              className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Back
            </button>
            
            {step < total - 1 ? (
              <button 
                onClick={handleNext} 
                disabled={!answers[cur.id] || loading} 
                className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white disabled:opacity-60 disabled:cursor-not-allowed hover:bg-indigo-700 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  'Next'
                )}
              </button>
            ) : (
              <button 
                onClick={handleComplete} 
                disabled={!allAnswered || loading} 
                className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white disabled:opacity-60 disabled:cursor-not-allowed hover:bg-indigo-700 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Completing...
                  </>
                ) : (
                  'Complete'
                )}
              </button>
            )}
          </div>

          {/* Step Indicators */}
          <div className="mt-5 flex items-center justify-center gap-2">
            {STEPS.map((_, i) => (
              <span 
                key={i} 
                className={cx(
                  'h-2 w-2 rounded-full', 
                  i === step ? 'bg-indigo-600' : 'bg-gray-300'
                )} 
                aria-hidden 
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}