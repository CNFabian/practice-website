import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  OnboardingImage1,
  OnboardingImage2,
  OnboardingImage3_5,
  OnboardingImage4
} from '../../../assets';
import {
  getOnboardingOptions,
  completeStep2,
  completeStep3,
  completeStep4,
  completeStep5,
  type OnboardingOptions
} from '../../../services/onBoardingAPI';
import { useOnboardingStatus } from '../../../hooks/queries/useOnboardingStatus';

interface OnBoardingPageProps {
  isOpen: boolean;
  onClose?: () => void;
}

interface ZipcodeData {
  city: string;
  state: string;
  zipcode: string;
}

const OnBoardingPage: React.FC<OnBoardingPageProps> = ({ isOpen, onClose }) => {
  const nav = useNavigate();
  const { refetch: refetchOnboardingStatus } = useOnboardingStatus();

  // State management
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onboardingOptions, setOnboardingOptions] = useState<OnboardingOptions | null>(null);

  // Form data state
  const [formData, setFormData] = useState({
    has_realtor: null as boolean | null,
    has_loan_officer: null as boolean | null,
    wants_expert_contact: '',
    homeownership_timeline_months: 28, // Default: 2 years 4 months
    zipcode: ''
  });

  // Zipcode validation state
  const [zipcodeInput, setZipcodeInput] = useState('');
  const [isValidatingZipcode, setIsValidatingZipcode] = useState(false);
  const [zipcodeData, setZipcodeData] = useState<ZipcodeData | null>(null);
  const [zipcodeError, setZipcodeError] = useState<string | null>(null);

  // Load onboarding options on mount
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const options = await getOnboardingOptions();
        setOnboardingOptions(options);
      } catch (err) {
        console.error('Failed to load onboarding options:', err);
        setError('Failed to load onboarding options');
      }
    };

    if (isOpen) {
      loadOptions();
    }
  }, [isOpen]);

  // Validate zipcode when user types
  useEffect(() => {
    const validateZipcode = async () => {
      // Only validate if input is exactly 5 digits
      if (zipcodeInput.length !== 5 || !/^\d{5}$/.test(zipcodeInput)) {
        setZipcodeData(null);
        setZipcodeError(null);
        setFormData({ ...formData, zipcode: '' });
        return;
      }

      setIsValidatingZipcode(true);
      setZipcodeError(null);

      try {
        const response = await fetch(`https://api.zippopotam.us/us/${zipcodeInput}`);
        
        if (!response.ok) {
          throw new Error('Invalid zipcode');
        }

        const data = await response.json();
        
        // Extract city and state from response
        const place = data.places[0];
        const zipcodeInfo: ZipcodeData = {
          city: place['place name'],
          state: place['state abbreviation'],
          zipcode: zipcodeInput
        };

        setZipcodeData(zipcodeInfo);
        setFormData({ ...formData, zipcode: zipcodeInput });
        setZipcodeError(null);
      } catch (err) {
        console.error('Zipcode validation error:', err);
        setZipcodeData(null);
        setZipcodeError('Invalid zipcode. Please enter a valid US zipcode.');
        setFormData({ ...formData, zipcode: '' });
      } finally {
        setIsValidatingZipcode(false);
      }
    };

    // Debounce the validation
    const timeoutId = setTimeout(validateZipcode, 500);
    return () => clearTimeout(timeoutId);
  }, [zipcodeInput]);

  // Progress calculation (6 total steps)
  const progress = ((currentStep + 1) / 6) * 100;

  // Handle next button click
  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Check if current step can proceed
  const canProceed = () => {
    switch (currentStep) {
      case 0: // Welcome screen
      case 1: // Intro screen
        return true;
      case 2: // Professionals screen
        return formData.has_realtor !== null && formData.has_loan_officer !== null;
      case 3: // Expert contact
        return formData.wants_expert_contact !== '';
      case 4: // Timeline
        return formData.homeownership_timeline_months > 0;
      case 5: // City/Zipcode
        return formData.zipcode !== '' && zipcodeData !== null;
      default:
        return false;
    }
  };

  // Handle final submission
  const handleComplete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Call individual step endpoints
      
      // Step 2: Professionals (has_realtor, has_loan_officer)
      await completeStep2({
        has_realtor: formData.has_realtor ?? false,
        has_loan_officer: formData.has_loan_officer ?? false
      });

      // Step 3: Expert Contact
      await completeStep3({
        wants_expert_contact: formData.wants_expert_contact
      });

      // Step 4: Timeline
      await completeStep4({
        homeownership_timeline_months: formData.homeownership_timeline_months
      });

      // Step 5: Zipcode
      await completeStep5({
        zipcode: formData.zipcode
      });

      console.log('All onboarding steps completed successfully');

      // Wait for backend to update
      await new Promise(resolve => setTimeout(resolve, 1000));
      await refetchOnboardingStatus();

      // Close or navigate
      if (onClose) {
        onClose();
      } else {
        nav('/app', { replace: true });
      }
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
      setError('Failed to complete onboarding. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Convert months to years and months display
  const formatTimeline = (months: number) => {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (years === 0) {
      return `${months} month${months !== 1 ? 's' : ''}`;
    } else if (remainingMonths === 0) {
      return `${years} year${years !== 1 ? 's' : ''}`;
    } else {
      return `${years} year${years !== 1 ? 's' : ''} ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col">
      {/* Progress Bar */}
      <div className="w-full px-8 pt-8 pb-4">
        <div className="max-w-4xl mx-auto">
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex items-center justify-center px-8 pb-16">
        <div className="max-w-2xl w-full">
          
          {/* Screen 1: Welcome */}
          {currentStep === 0 && (
            <div className="text-center space-y-8 animate-fadeIn">
              <div className="flex flex-col items-center">
                <img src={OnboardingImage1} alt="Welcome" className="w-64 h-64 object-contain mb-6" />
                <div className="bg-white rounded-3xl shadow-lg px-8 py-4 inline-block">
                  <h1 className="text-2xl font-semibold text-gray-800">
                    Hi! Welcome to NestNavigate!
                  </h1>
                </div>
              </div>
              <button
                onClick={handleNext}
                className="mx-auto block px-12 py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full text-lg font-medium transition-colors shadow-md"
              >
                CONTINUE
              </button>
            </div>
          )}

          {/* Screen 2: Let's Build */}
          {currentStep === 1 && (
            <div className="text-center space-y-8 animate-fadeIn">
              <div className="flex flex-col items-center">
                <img src={OnboardingImage2} alt="Let's Build" className="w-64 h-64 object-contain mb-6" />
                <div className="bg-white rounded-3xl shadow-lg px-8 py-4 inline-block">
                  <h1 className="text-2xl font-semibold text-gray-800">
                    Let's build the learning path for you!
                  </h1>
                </div>
              </div>
              <button
                onClick={handleNext}
                className="mx-auto block px-12 py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full text-lg font-medium transition-colors shadow-md"
              >
                CONTINUE
              </button>
            </div>
          )}

          {/* Screen 3: Professionals */}
          {currentStep === 2 && (
            <div className="text-center space-y-8 animate-fadeIn">
              <div className="flex items-center justify-center gap-4 mb-8">
                <img src={OnboardingImage3_5} alt="Question" className="w-16 h-16 object-contain" />
                <h1 className="text-2xl font-semibold text-gray-800">
                  Are you working with a ...
                </h1>
              </div>

              <div className="space-y-8">
                {/* Real Estate Officer */}
                <div>
                  <h2 className="text-xl font-semibold text-indigo-600 mb-4">Real Estate Officer?</h2>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => setFormData({ ...formData, has_realtor: true })}
                      className={`px-8 py-3 rounded-xl border-2 transition-all ${
                        formData.has_realtor === true
                          ? 'bg-indigo-100 border-indigo-500 text-indigo-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-indigo-300'
                      }`}
                    >
                      Yes, I am
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, has_realtor: false })}
                      className={`px-8 py-3 rounded-xl border-2 transition-all ${
                        formData.has_realtor === false
                          ? 'bg-indigo-100 border-indigo-500 text-indigo-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-indigo-300'
                      }`}
                    >
                      Not yet
                    </button>
                  </div>
                </div>

                {/* Loan Officer */}
                <div>
                  <h2 className="text-xl font-semibold text-indigo-600 mb-4">Loan Officer?</h2>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => setFormData({ ...formData, has_loan_officer: true })}
                      className={`px-8 py-3 rounded-xl border-2 transition-all ${
                        formData.has_loan_officer === true
                          ? 'bg-indigo-100 border-indigo-500 text-indigo-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-indigo-300'
                      }`}
                    >
                      Yes, I am
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, has_loan_officer: false })}
                      className={`px-8 py-3 rounded-xl border-2 transition-all ${
                        formData.has_loan_officer === false
                          ? 'bg-indigo-100 border-indigo-500 text-indigo-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-indigo-300'
                      }`}
                    >
                      Not yet
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className={`mx-auto block px-12 py-4 rounded-full text-lg font-medium transition-all shadow-md ${
                  canProceed()
                    ? 'bg-indigo-500 hover:bg-indigo-600 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                CONTINUE
              </button>
            </div>
          )}

          {/* Screen 4: Expert Contact */}
          {currentStep === 3 && (
            <div className="text-center space-y-8 animate-fadeIn">
              <div className="flex items-center justify-center gap-4 mb-8">
                <img src={OnboardingImage4} alt="Expert Contact" className="w-16 h-16 object-contain" />
                <h1 className="text-xl font-semibold text-gray-800">
                  Would you like to get in contact with an expert?
                </h1>
              </div>

              <div className="space-y-4 max-w-md mx-auto">
                {onboardingOptions?.expert_contact_options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setFormData({ ...formData, wants_expert_contact: option.name })}
                    className={`w-full px-8 py-4 rounded-xl border-2 transition-all ${
                      formData.wants_expert_contact === option.name
                        ? 'bg-indigo-100 border-indigo-500 text-indigo-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-indigo-300'
                    }`}
                  >
                    {option.name}
                  </button>
                ))}
              </div>

              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className={`mx-auto block px-12 py-4 rounded-full text-lg font-medium transition-all shadow-md ${
                  canProceed()
                    ? 'bg-indigo-500 hover:bg-indigo-600 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                CONTINUE
              </button>
            </div>
          )}

          {/* Screen 5: Timeline Slider */}
          {currentStep === 4 && (
            <div className="text-center space-y-8 animate-fadeIn">
              <div className="flex items-center justify-center gap-4 mb-8">
                <img src={OnboardingImage3_5} alt="Timeline" className="w-16 h-16 object-contain" />
                <h1 className="text-xl font-semibold text-gray-800">
                  When do you want to achieve homeownership?
                </h1>
              </div>

              <div className="max-w-xl mx-auto space-y-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-indigo-600 mb-2">
                    {formatTimeline(formData.homeownership_timeline_months)}
                  </div>
                  <div className="text-sm text-gray-500">Estimated timeline</div>
                </div>

                <div className="px-4">
                  <input
                    type="range"
                    min="6"
                    max="60"
                    value={formData.homeownership_timeline_months}
                    onChange={(e) => setFormData({ ...formData, homeownership_timeline_months: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${((formData.homeownership_timeline_months - 6) / 54) * 100}%, #e5e7eb ${((formData.homeownership_timeline_months - 6) / 54) * 100}%, #e5e7eb 100%)`
                    }}
                  />
                  <div className="flex justify-between text-sm text-gray-600 mt-2">
                    <span>6 months</span>
                    <span>5 years</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className={`mx-auto block px-12 py-4 rounded-full text-lg font-medium transition-all shadow-md ${
                  canProceed()
                    ? 'bg-indigo-500 hover:bg-indigo-600 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                CONTINUE
              </button>
            </div>
          )}

          {/* Screen 6: Zipcode */}
          {currentStep === 5 && (
            <div className="text-center space-y-8 animate-fadeIn">
              <div className="flex items-center justify-center gap-4 mb-8">
                <img src={OnboardingImage3_5} alt="Location" className="w-16 h-16 object-contain" />
                <h1 className="text-xl font-semibold text-gray-800">
                  Finally, let's find your future home base!
                </h1>
              </div>

              <div className="max-w-xl mx-auto space-y-4">
                <p className="text-sm text-indigo-600">Enter your zipcode</p>
                
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter 5-digit zipcode"
                    value={zipcodeInput}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                      setZipcodeInput(value);
                    }}
                    maxLength={5}
                    className={`w-full px-6 py-4 border-2 rounded-xl focus:outline-none focus:ring-2 text-lg transition-colors ${
                      zipcodeData
                        ? 'border-green-500 focus:ring-green-500'
                        : zipcodeError
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-indigo-500 focus:ring-indigo-500'
                    }`}
                  />
                  
                  {/* Loading Spinner */}
                  {isValidatingZipcode && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  
                  {/* Success Checkmark */}
                  {zipcodeData && !isValidatingZipcode && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500 text-2xl">
                      ✓
                    </div>
                  )}
                  
                  {/* Error X */}
                  {zipcodeError && !isValidatingZipcode && zipcodeInput.length === 5 && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500 text-2xl">
                      ✕
                    </div>
                  )}
                </div>

                {/* Zipcode Info Display */}
                {zipcodeData && (
                  <div className="bg-green-50 border-2 border-green-500 rounded-xl p-4 text-left">
                    <div className="flex items-center gap-2 text-green-700">
                      <span className="text-lg">✓</span>
                      <div>
                        <p className="font-semibold text-lg">{zipcodeData.city}, {zipcodeData.state}</p>
                        <p className="text-sm text-green-600">Zipcode: {zipcodeData.zipcode}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {zipcodeError && (
                  <div className="text-red-600 text-sm">{zipcodeError}</div>
                )}

                {/* Helper Text */}
                {!zipcodeInput && (
                  <p className="text-sm text-gray-500">Please enter a valid 5-digit US zipcode</p>
                )}
              </div>

              {error && (
                <div className="text-red-600 text-sm font-medium">{error}</div>
              )}

              <button
                onClick={handleComplete}
                disabled={!canProceed() || isLoading}
                className={`mx-auto block px-12 py-4 rounded-full text-lg font-medium transition-all shadow-md ${
                  canProceed() && !isLoading
                    ? 'bg-indigo-500 hover:bg-indigo-600 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isLoading ? 'LOADING...' : "LET'S GO"}
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Custom CSS for slider */}
      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          border: 3px solid #6366f1;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          border: 3px solid #6366f1;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default OnBoardingPage;