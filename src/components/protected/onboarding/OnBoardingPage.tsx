import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../common/LoadingSpinner';
import { 
  getOnboardingStatus, 
  getOnboardingOptions,
  completeOnboardingAllSteps, 
  getOnboardingDataFromLocalStorage,
  saveStep1ToLocalStorage,
  saveStep3ToLocalStorage,
  saveStep4ToLocalStorage,
  saveStep5ToLocalStorage,
  clearOnboardingDataFromLocalStorage,
  type CompleteOnboardingData,
  type OnboardingOptions
} from '../../../services/onBoardingAPI';

// Map avatar names to icons - you can update these based on actual avatar images
const AVATAR_ICON: Record<string, string> = {
  'Professional': '👔',
  'Student': '🎓',
  'Family': '👨‍👩‍👧‍👦',
  'Young Professional': '💼',
  'Entrepreneur': '🚀',
}

const cx = (...c: (string | false)[]) => c.filter(Boolean).join(' ')

interface OnBoardingPageProps {
  isOpen: boolean;
  onClose?: () => void;
}

export default function OnBoardingPage({ isOpen, onClose }: OnBoardingPageProps) {
  const nav = useNavigate();
  
  // State management
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [onboardingOptions, setOnboardingOptions] = useState<OnboardingOptions | null>(null);

  // Dynamic step configuration based on API options
  const STEPS = useMemo(() => {
    if (!onboardingOptions) return [];
    
    return [
      { 
        id: 'avatar', 
        label: "Let's get started!\nChoose your avatar:", 
        options: onboardingOptions.avatars.map(avatar => avatar.name),
        helpText: 'Your avatar will represent you throughout your learning journey!'
      },
      { 
        id: 'expert_contact', 
        label: "Would you like to be contacted by our real estate experts for personalized guidance?", 
        options: onboardingOptions.expert_contact_options.map(option => option.name),
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
        label: "Finally, let's find your future home base!\nEnter your zipcode:", 
        options: [],
        helpText: onboardingOptions.zipcode_validation.description
      },
    ];
  }, [onboardingOptions]);

  // Initialize component
  useEffect(() => {
    if (!isOpen) return;
    
    const initializeOnboarding = async () => {
      try {
        console.log('OnBoarding: Checking onboarding status...');
        
        // Fetch onboarding options first
        const options = await getOnboardingOptions();
        setOnboardingOptions(options);
        console.log('OnBoarding: Options loaded:', options);
        
        // Check onboarding status
        const status = await getOnboardingStatus();
        console.log('OnBoarding: Status received:', status);
        
        const isCompleted = status.is_completed;
        console.log('OnBoarding: Parsed - isCompleted:', isCompleted);
        
        if (isCompleted) {
          console.log('OnBoarding: User has already completed onboarding');
          if (onClose) {
            onClose();
          } else {
            nav('/app', { replace: true });
          }
          return;
        }
        
        // Load existing data from localStorage
        const localData = getOnboardingDataFromLocalStorage();
        console.log('OnBoarding: Local storage data:', localData);
        
        // Map backend data to frontend answers format
        const mappedAnswers: Record<string, any> = {};
        
        if (localData.selected_avatar) {
          // Find avatar name by ID
          const avatar = options.avatars.find(a => a.id === localData.selected_avatar);
          if (avatar) {
            mappedAnswers.avatar = avatar.name;
          }
        }
        
        if (localData.wants_expert_contact) {
          mappedAnswers.expert_contact = localData.wants_expert_contact;
        }
        
        if (localData.homeownership_timeline_months) {
          mappedAnswers['Home Ownership'] = localData.homeownership_timeline_months;
        }
        
        if (localData.zipcode) {
          mappedAnswers.city = localData.zipcode;
        }
        
        setAnswers(mappedAnswers);
        
        // Determine current step based on completed data
        let step = 0;
        if (mappedAnswers.avatar) step = Math.max(step, 1);
        if (mappedAnswers.expert_contact) step = Math.max(step, 2);
        if (mappedAnswers['Home Ownership']) step = Math.max(step, 3);
        if (mappedAnswers.city) step = Math.max(step, 4);
        
        setCurrentStep(step);
        console.log('OnBoarding: Restored step:', step);
        
      } catch (error) {
        console.error('OnBoarding: Initialization error:', error);
        setError('Failed to load onboarding. Please try again.');
      } finally {
        console.log('OnBoarding: Initialization complete, showing form');
        setIsInitializing(false);
        console.log('OnBoarding: Setting isInitializing to false');
      }
    };
    
    initializeOnboarding();
  }, [isOpen, nav, onClose]);

  // Handle answer selection
  const handleAnswerSelect = async (value: string | number) => {
    const step = STEPS[currentStep];
    if (!step) return;
    
    setAnswers(prev => ({ ...prev, [step.id]: value }));
    
    try {
      console.log(`OnBoarding: Saving step ${step.id} with value:`, value);
      
      // Save to localStorage based on step
      switch (step.id) {
        case 'avatar':
          // Find avatar ID by name
          const avatar = onboardingOptions?.avatars.find(a => a.name === value);
          if (avatar) {
            saveStep1ToLocalStorage({ selected_avatar: avatar.id });
          }
          break;
        case 'expert_contact':
          saveStep3ToLocalStorage({ wants_expert_contact: value as string });
          break;
        case 'Home Ownership':
          saveStep4ToLocalStorage({ homeownership_timeline_months: value as number });
          break;
        case 'city':
          const zipcode = Array.isArray(value) ? value[0] : value;
          saveStep5ToLocalStorage({ zipcode: zipcode as string });
          break;
        default:
          console.warn('OnBoarding: Unknown step ID:', step.id);
      }
      
      console.log(`OnBoarding: Step ${step.id} saved to localStorage successfully`);
      
    } catch (error) {
      console.error(`OnBoarding: Error saving step ${step.id} to localStorage:`, error);
      setError(`Failed to save ${step.id} information. Please try again.`);
      throw error;
    }
  };

  // Handle complete onboarding
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
        selected_avatar: localData.selected_avatar || '',
        has_realtor: localData.has_realtor ?? false,
        has_loan_officer: localData.has_loan_officer ?? false,
        wants_expert_contact: localData.wants_expert_contact || answers.expert_contact,
        homeownership_timeline_months: localData.homeownership_timeline_months || answers['Home Ownership'],
        zipcode: localData.zipcode || answers.city
      };
      
      console.log('OnBoarding: Final payload to backend:', onboardingData);
      await completeOnboardingAllSteps(onboardingData);
      
      console.log('OnBoarding: All steps completed successfully');
      
      // Clear localStorage after successful completion
      clearOnboardingDataFromLocalStorage();
      
      // Navigate to app or close modal
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

  // Handle next button
  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Handle back button
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle completion
  const handleComplete = async () => {
    if (currentStep === STEPS.length - 1) {
      await handleCompleteOnboarding();
    } else {
      handleNext();
    }
  };

  // Render functions
  const renderAvatarStep = () => {
    if (!onboardingOptions) return null;
    
    return (
      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
        {onboardingOptions.avatars.map((avatar) => (
          <button
            key={avatar.id}
            onClick={() => handleAnswerSelect(avatar.name)}
            className={cx(
              'p-6 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-3',
              answers.avatar === avatar.name
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <div className="text-4xl">
              {AVATAR_ICON[avatar.name] || '👤'}
            </div>
            <span className="font-medium text-gray-700">{avatar.name}</span>
          </button>
        ))}
      </div>
    );
  };

  const renderExpertContactStep = () => {
    if (!onboardingOptions) return null;
    
    return (
      <div className="space-y-3 max-w-md mx-auto">
        {onboardingOptions.expert_contact_options.map((option) => (
          <button
            key={option.id}
            onClick={() => handleAnswerSelect(option.name)}
            className={cx(
              'w-full p-4 rounded-lg border-2 transition-all duration-200 text-left',
              answers.expert_contact === option.name
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <div className="font-medium text-gray-900">{option.name}</div>
            <div className="text-sm text-gray-600 mt-1">{option.description}</div>
          </button>
        ))}
      </div>
    );
  };

  const renderTimelineStep = () => {
    if (!onboardingOptions) return null;
    
    return (
      <div className="space-y-3 max-w-md mx-auto">
        {onboardingOptions.timeline_options.map((option) => (
          <button
            key={option.months}
            onClick={() => handleAnswerSelect(option.months)}
            className={cx(
              'w-full p-4 rounded-lg border-2 transition-all duration-200 text-left',
              answers['Home Ownership'] === option.months
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <div className="font-medium text-gray-900">{option.label}</div>
          </button>
        ))}
      </div>
    );
  };

  const renderZipcodeStep = () => {
    if (!onboardingOptions) return null;
    
    return (
      <div className="max-w-md mx-auto">
        <input
          type="text"
          placeholder="Enter zipcode (e.g., 12345)"
          value={answers.city || ''}
          onChange={(e) => {
            const value = e.target.value;
            setAnswers(prev => ({ ...prev, city: value }));
            handleAnswerSelect(value);
          }}
          className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-center text-lg"
          pattern={onboardingOptions.zipcode_validation.pattern}
        />
        <p className="text-sm text-gray-600 mt-2 text-center">
          {onboardingOptions.zipcode_validation.description}
        </p>
      </div>
    );
  };

  // Check if current step is completed
  const isCurrentStepCompleted = () => {
    const step = STEPS[currentStep];
    if (!step) return false;
    
    const answer = answers[step.id];
    
    switch (step.id) {
      case 'avatar':
        return !!answer;
      case 'expert_contact':
        return !!answer;
      case 'Home Ownership':
        return typeof answer === 'number' && answer > 0;
      case 'city':
        if (!onboardingOptions) return false;
        const pattern = new RegExp(onboardingOptions.zipcode_validation.pattern);
        return !!(answer && pattern.test(answer));
      default:
        return false;
    }
  };

  // Loading states
  if (!isOpen) return null;
  
  if (isInitializing || !onboardingOptions) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <LoadingSpinner />
          <p className="text-center mt-4 text-gray-600">Loading onboarding...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <LoadingSpinner />
          <p className="text-center mt-4 text-gray-600">Completing onboarding...</p>
        </div>
      </div>
    );
  }

  const step = STEPS[currentStep];
  if (!step) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Getting Started</h2>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            )}
          </div>
          
          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Step {currentStep + 1} of {STEPS.length}</span>
              <span>{Math.round(((currentStep + 1) / STEPS.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="text-center mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-2 whitespace-pre-line">
              {step.label}
            </h3>
            {step.helpText && (
              <p className="text-gray-600">{step.helpText}</p>
            )}
          </div>

          <div className="mb-8">
            {step.id === 'avatar' && renderAvatarStep()}
            {step.id === 'expert_contact' && renderExpertContactStep()}
            {step.id === 'Home Ownership' && renderTimelineStep()}
            {step.id === 'city' && renderZipcodeStep()}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
          
          <button
            onClick={handleComplete}
            disabled={!isCurrentStepCompleted()}
            className="px-8 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {currentStep === STEPS.length - 1 ? 'Complete' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}