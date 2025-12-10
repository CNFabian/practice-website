import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../common/LoadingSpinner';
import {
  getOnboardingOptions,
  getOnboardingDataFromLocalStorage,
  saveStep1ToLocalStorage,
  saveStep3ToLocalStorage,
  saveStep4ToLocalStorage,
  saveStep5ToLocalStorage,
  clearOnboardingDataFromLocalStorage,
  type CompleteOnboardingData,
  type OnboardingOptions
} from '../../../services/onBoardingAPI';
import { useOnboardingStatus } from '../../../hooks/queries/useOnboardingStatus';
import { useCompleteOnboardingStep } from '../../../hooks/mutations/useCompleteOnboardingStep';

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
  console.log('OnBoardingPage: Component rendering, isOpen:', isOpen);
  
  const nav = useNavigate();
  const { data: onboardingStatus, refetch: refetchOnboardingStatus } = useOnboardingStatus();
  const { mutate: completeOnboardingMutation, isPending: isCompletingOnboarding } = useCompleteOnboardingStep();

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [onboardingOptions, setOnboardingOptions] = useState<OnboardingOptions | null>(null);

  const loading = isCompletingOnboarding;

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

  useEffect(() => {
    console.log('OnBoarding: useEffect triggered, isOpen:', isOpen);
    
    if (!isOpen) {
      console.log('OnBoarding: Modal is not open, skipping initialization');
      return;
    }

    console.log('OnBoarding: Modal opened, starting initialization...');

    const initializeOnboarding = async () => {
      try {
        console.log('OnBoarding: Checking onboarding status...');
        setIsInitializing(true);

        const options = await getOnboardingOptions();
        setOnboardingOptions(options);
        console.log('OnBoarding: Options loaded:', options);

        const status = onboardingStatus;
        console.log('OnBoarding: Status received:', status);

        const isCompleted = status?.completed === true;
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

        const localData = getOnboardingDataFromLocalStorage();
        console.log('OnBoarding: Local storage data:', localData);

        const mappedAnswers: Record<string, any> = {};

        if (localData.selected_avatar) {
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
  }, [isOpen]);

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

  const handleCompleteOnboarding = () => {
    setError(null);

    console.log('OnBoarding: Completing all steps...');

    const localData = getOnboardingDataFromLocalStorage();
    console.log('OnBoarding: Final localStorage data:', localData);

    const onboardingData: CompleteOnboardingData = {
      selected_avatar: localData.selected_avatar || '',
      has_realtor: localData.has_realtor ?? false,
      has_loan_officer: localData.has_loan_officer ?? false,
      wants_expert_contact: localData.wants_expert_contact || answers.expert_contact,
      homeownership_timeline_months: localData.homeownership_timeline_months || answers['Home Ownership'],
      zipcode: localData.zipcode || answers.city
    };

    console.log('OnBoarding: Final payload to backend:', onboardingData);

    completeOnboardingMutation(onboardingData, {
      onSuccess: async () => {
        console.log('OnBoarding: All steps completed successfully');
        clearOnboardingDataFromLocalStorage();

        console.log('OnBoarding: Waiting for backend status to update...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        let attempts = 0;
        const maxAttempts = 5;
        let isActuallyCompleted = false;

        while (attempts < maxAttempts && !isActuallyCompleted) {
          try {
            console.log(`OnBoarding: Verification attempt ${attempts + 1}`);
            const { data: status } = await refetchOnboardingStatus();
            console.log(`OnBoarding: Status check result:`, status);

            if (status?.completed) {
              isActuallyCompleted = true;
              console.log('OnBoarding: Backend confirms completion!');
              break;
            } else {
              console.log('OnBoarding: Backend still shows incomplete, waiting...');
              await new Promise(resolve => setTimeout(resolve, 1000));
              attempts++;
            }
          } catch (error) {
            console.error('OnBoarding: Error checking status during verification:', error);
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        if (!isActuallyCompleted) {
          console.warn('OnBoarding: Backend never confirmed completion after', maxAttempts, 'attempts');
          console.log('OnBoarding: Proceeding anyway as API confirmed successful completion');
        }

        await new Promise(resolve => setTimeout(resolve, 500));

        if (onClose) {
          console.log('OnBoarding: Calling onClose callback');
          onClose();
        } else {
          console.log('OnBoarding: Navigating to /app');
          nav('/app', { replace: true });
        }
      },
      onError: (error) => {
        console.error('OnBoarding: Error completing onboarding:', error);
        setError('Failed to complete onboarding. Please try again.');
      },
    });
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    if (currentStep === STEPS.length - 1) {
      handleCompleteOnboarding();
    } else {
      handleNext();
    }
  };

  const isCurrentStepCompleted = () => {
    const step = STEPS[currentStep];
    if (!step) return false;
    
    switch (step.id) {
      case 'avatar':
        return !!answers.avatar;
      case 'expert_contact':
        return !!answers.expert_contact;
      case 'Home Ownership':
        return !!answers['Home Ownership'];
      case 'city':
        return !!answers.city && answers.city.length >= 5;
      default:
        return false;
    }
  };

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
            <span className="font-medium text-gray-700">{option.name}</span>
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
            <span className="font-medium text-gray-700">{option.label}</span>
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
          value={answers.city || ''}
          onChange={(e) => handleAnswerSelect(e.target.value)}
          placeholder="Enter your zipcode"
          pattern={onboardingOptions.zipcode_validation.pattern}
          className="w-full p-4 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-lg text-center"
          maxLength={10}
        />
        {answers.city && answers.city.length >= 5 && (
          <p className="mt-2 text-green-600 text-center">✓ Valid zipcode</p>
        )}
      </div>
    );
  };

  if (!isOpen) {
    console.log('OnBoardingPage: isOpen is false, returning null');
    return null;
  }

  if (isInitializing) {
    console.log('OnBoardingPage: Still initializing, showing spinner');
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  const currentStepData = STEPS[currentStep];
  if (!currentStepData) {
    console.log('OnBoardingPage: No current step data, returning null');
    return null;
  }

  console.log('OnBoardingPage: Rendering modal form');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              Welcome to Nest Navigate!
            </h2>
            <div className="text-sm text-gray-500">
              Step {currentStep + 1} of {STEPS.length}
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2 whitespace-pre-line">
              {currentStepData.label}
            </h3>
            {currentStepData.helpText && (
              <p className="text-gray-600">{currentStepData.helpText}</p>
            )}
          </div>

          <div className="mb-8">
            {currentStepData.id === 'avatar' && renderAvatarStep()}
            {currentStepData.id === 'expert_contact' && renderExpertContactStep()}
            {currentStepData.id === 'Home Ownership' && renderTimelineStep()}
            {currentStepData.id === 'city' && renderZipcodeStep()}
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
            disabled={!isCurrentStepCompleted() || loading}
            className="px-8 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading && <LoadingSpinner />}
            {currentStep === STEPS.length - 1 ? 'Complete' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}