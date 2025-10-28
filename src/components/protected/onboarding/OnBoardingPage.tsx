import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../shared/LoadingSpinner';
import { 
  getOnboardingStatus, 
  completeOnboardingAllSteps, 
  getOnboardingDataFromLocalStorage,
  saveStep1ToLocalStorage,
  saveStep2ToLocalStorage,
  saveStep3ToLocalStorage,
  saveStep4ToLocalStorage,
  saveStep5ToLocalStorage,
  getCurrentStepFromLocalStorage,
  clearOnboardingDataFromLocalStorage,
  type CompleteOnboardingData
} from '../../../services/onBoardingAPI';

const STEPS = [
  { 
    id: 'avatar', 
    label: "Let's get started!\nChoose your avatar:", 
    options: ['Curious Cat', 'Celebrating Bird', 'Careful Elephant', 'Protective Dog'],
    helpText: 'Your avatar will represent you throughout your learning journey!'
  },
  { 
    id: 'expert_contact', 
    label: "Would you like to be contacted by our real estate experts for personalized guidance?", 
    options: ['Yes', 'No', 'Maybe later'],
    helpText: 'Our experts can help you navigate the home buying process with confidence.'
  },
  { 
    id: 'Home Ownership', 
    label: "When are you looking to buy your home?", 
    options: [],
    helpText: 'This helps us tailor your learning experience to your timeline.'
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

interface OnBoardingPageProps {
  isOpen: boolean;
  onClose?: () => void;
}

export default function OnBoardingPage({ isOpen, onClose }: OnBoardingPageProps) {
  const nav = useNavigate()
  const [answers, setAns] = useState<Record<string,string>>({})
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  
  const cur = STEPS[step]
  const total = STEPS.length

  // Initialize onboarding state from localStorage and backend status
  useEffect(() => {
    if (!isOpen) return;
    
    const initializeOnboarding = async () => {
      try {
        console.log('OnBoarding: Checking onboarding status...');
        
        // Check if onboarding is already completed on backend
        const status = await getOnboardingStatus();
        console.log('OnBoarding: Status received:', status);
        
        // Handle both possible response formats from backend
        const isCompleted = status.is_completed || (status as any).completed;
        
        console.log('OnBoarding: Parsed - isCompleted:', isCompleted);
        
        if (isCompleted && !onClose) {
          console.log('OnBoarding: Already completed, redirecting to app...');
          clearOnboardingDataFromLocalStorage(); // Clean up any leftover localStorage data
          nav('/app', { replace: true });
          return;
        }
        
        // Load existing data from localStorage if available
        const localData = getOnboardingDataFromLocalStorage();
        console.log('OnBoarding: Local storage data:', localData);
        
        if (Object.keys(localData).length > 0) {
          // Map localStorage data to frontend answers
          const existingAnswers: Record<string, string> = {};
          if (localData.selected_avatar) existingAnswers.avatar = localData.selected_avatar;
          if (localData.wants_expert_contact) existingAnswers.expert_contact = localData.wants_expert_contact;
          if (localData.homeownership_timeline_months) existingAnswers['Home Ownership'] = String(localData.homeownership_timeline_months);
          if (localData.zipcode) existingAnswers.city = localData.zipcode;
          
          setAns(existingAnswers);
          
          // Set current step based on localStorage data
          const currentStep = getCurrentStepFromLocalStorage() - 1; // Convert to 0-indexed
          setStep(Math.min(currentStep, total - 1));
          console.log('OnBoarding: Restored step:', currentStep);
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
  }, [isOpen, nav, onClose]);

  // Set default Home Ownership value
  useEffect(() => {
    if (cur.id === 'Home Ownership' && !answers[cur.id]) {
      setAns(p => ({ ...p, [cur.id]: String(SLIDER.defaultValue) }))
    }
  }, [cur.id, answers])

  const allAnswered = useMemo(() => STEPS.every(s => !!answers[s.id]), [answers])
  const progressPct = Math.round(((step + (answers[cur.id] ? 1 : 0)) / total) * 100)

  // Handle individual step completion - now saves to localStorage
  const handleStepCompletion = async (stepId: string, value: string) => {
    try {
      console.log(`OnBoarding: Saving step ${stepId} with value:`, value);
      
      // Save to localStorage instead of backend
      switch (stepId) {
        case 'avatar':
          saveStep1ToLocalStorage({ selected_avatar: value });
          break;
        case 'expert_contact':
          saveStep3ToLocalStorage({ wants_expert_contact: value });
          break;
        case 'Home Ownership':
          saveStep4ToLocalStorage({ homeownership_timeline_months: parseInt(value) });
          break;
        case 'city':
          // Extract zipcode from city selection or use value as-is
          const zipcode = value.match(/\d{5}/)?.[0] || value;
          saveStep5ToLocalStorage({ zipcode });
          break;
        default:
          console.warn('OnBoarding: Unknown step ID:', stepId);
      }
      
      console.log(`OnBoarding: Step ${stepId} saved to localStorage successfully`);
      
    } catch (error) {
      console.error(`OnBoarding: Error saving step ${stepId} to localStorage:`, error);
      setError(`Failed to save ${stepId} information. Please try again.`);
      throw error;
    }
  };

  // Handle complete onboarding - sends all data to backend at once
  const handleCompleteOnboarding = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('OnBoarding: Completing all steps...');
      
      // Get all data from localStorage
      const localData = getOnboardingDataFromLocalStorage();
      console.log('OnBoarding: Final localStorage data:', localData);
      
      // Prepare data for bulk completion
      const onboardingData: CompleteOnboardingData = {
        selected_avatar: localData.selected_avatar || answers.avatar,
        has_realtor: localData.has_realtor ?? false, // Default to false if not set
        has_loan_officer: localData.has_loan_officer ?? false, // Default to false if not set
        wants_expert_contact: localData.wants_expert_contact || answers.expert_contact,
        homeownership_timeline_months: localData.homeownership_timeline_months || parseInt(answers['Home Ownership']),
        zipcode: localData.zipcode || answers.city.match(/\d{5}/)?.[0] || answers.city
      };
      
      console.log('OnBoarding: Sending complete data to backend:', onboardingData);
      await completeOnboardingAllSteps(onboardingData);
      
      console.log('OnBoarding: All steps completed successfully');
      
      // localStorage is cleared automatically in completeOnboardingAllSteps
      
      // Close modal if onClose is provided, otherwise redirect
      if (onClose) {
        onClose();
      } else {
        nav('/app', { replace: true });
      }
      
    } catch (error) {
      console.error('OnBoarding: Error completing onboarding:', error);
      setError('Failed to complete onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle next button - saves to localStorage and moves to next step
  const handleNext = async () => {
    if (!answers[cur.id]) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Save current step to localStorage
      await handleStepCompletion(cur.id, answers[cur.id]);
      
      // Move to next step
      setStep(s => Math.min(total - 1, s + 1));
      
    } catch (error) {
      console.error('OnBoarding: Failed to proceed to next step');
      // Error handling is done in handleStepCompletion
    } finally {
      setLoading(false);
    }
  };

  // Handle complete button - sends all data to backend
  const handleComplete = async () => {
    if (!allAnswered) return;
    
    // Save final step to localStorage first
    setLoading(true);
    setError(null);
    
    try {
      await handleStepCompletion(cur.id, answers[cur.id]);
      await handleCompleteOnboarding();
    } catch (error) {
      console.error('OnBoarding: Failed to complete onboarding');
      // Error handling is done in respective functions
    } finally {
      setLoading(false);
    }
  };

  console.log('OnBoarding render - isInitializing:', isInitializing);

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <>
      {/* Modal Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" />
      
      {/* Modal Content */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="w-full max-w-lg">
          {/* Show loading spinner during initialization */}
          {isInitializing ? (
            <div className="bg-white rounded-xl shadow-xl p-8">
              <div className="flex flex-col items-center space-y-4">
                <LoadingSpinner size="lg" />
                <p className="text-gray-600">Loading onboarding...</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Welcome to Your Home Buying Journey!</h2>
                    <p className="text-blue-100 mt-1">Step {step + 1} of {total}</p>
                  </div>
                  {onClose && (
                    <button
                      onClick={onClose}
                      className="text-white hover:text-gray-200 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-blue-400 rounded-full h-2 mt-4">
                  <div 
                    className="bg-white h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Error Message */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                {/* Current Step Content */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 whitespace-pre-line">
                      {cur.label}
                    </h3>
                    {cur.helpText && (
                      <p className="text-gray-600 text-sm">{cur.helpText}</p>
                    )}
                  </div>

                  {/* Avatar Selection */}
                  {cur.id === 'avatar' && (
                    <div className="grid grid-cols-2 gap-3">
                      {cur.options.map(option => (
                        <button
                          key={option}
                          onClick={() => setAns(p => ({ ...p, [cur.id]: option }))}
                          className={cx(
                            'p-4 rounded-lg border-2 transition-all',
                            'flex flex-col items-center space-y-2',
                            answers[cur.id] === option 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          )}
                        >
                          <span className="text-3xl">{AVATAR_ICON[option]}</span>
                          <span className="text-sm font-medium text-gray-700">{option}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Expert Contact Selection */}
                  {cur.id === 'expert_contact' && (
                    <div className="space-y-3">
                      {cur.options.map(option => (
                        <button
                          key={option}
                          onClick={() => setAns(p => ({ ...p, [cur.id]: option }))}
                          className={cx(
                            'w-full p-4 rounded-lg border-2 transition-all text-left',
                            answers[cur.id] === option 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          )}
                        >
                          <span className="font-medium text-gray-700">{option}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Timeline Slider */}
                  {cur.id === 'Home Ownership' && (
                    <div className="space-y-4">
                      <div className="px-2">
                        <input
                          type="range"
                          min={SLIDER.min}
                          max={SLIDER.max}
                          step={SLIDER.step}
                          value={answers[cur.id] || SLIDER.defaultValue}
                          onChange={(e) => setAns(p => ({ ...p, [cur.id]: e.target.value }))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-2">
                          <span>{SLIDER.minLabel}</span>
                          <span>{SLIDER.maxLabel}</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold">
                          {answers[cur.id] || SLIDER.defaultValue} {SLIDER.unit}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* City Selection (Zipcode) */}
                  {cur.id === 'city' && (
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Enter your zipcode (e.g., 12345)"
                        value={answers[cur.id] || ''}
                        onChange={(e) => setAns(p => ({ ...p, [cur.id]: e.target.value }))}
                        className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                        maxLength={5}
                        pattern="[0-9]{5}"
                      />
                      <p className="text-xs text-gray-500">
                        Enter a 5-digit zipcode for your desired home location
                      </p>
                    </div>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8">
                  <button
                    onClick={() => setStep(s => Math.max(0, s - 1))}
                    disabled={step === 0 || loading}
                    className={cx(
                      'px-6 py-3 rounded-lg font-medium transition-colors',
                      step === 0 || loading
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    )}
                  >
                    Previous
                  </button>

                  {step < total - 1 ? (
                    <button
                      onClick={handleNext}
                      disabled={!answers[cur.id] || loading}
                      className={cx(
                        'px-8 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2',
                        !answers[cur.id] || loading
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      )}
                    >
                      {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                      <span>Next</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleComplete}
                      disabled={!allAnswered || loading}
                      className={cx(
                        'px-8 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2',
                        !allAnswered || loading
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      )}
                    >
                      {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                      <span>Complete</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </>
  );
}