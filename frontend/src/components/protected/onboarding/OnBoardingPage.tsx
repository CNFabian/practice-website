import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  OnboardingImage1,
  OnboardingImage2,
  OnboardingImage3_5,
  OnboardingImage4,
  TextBox,
  OnestFont
} from '../../../assets';
import {
  getOnboardingOptions,
  completeStep2,
  completeStep3,
  completeStep4,
  completeStep5,
  type OnboardingOptions
} from '../../../services/onBoardingAPI';
import { searchCities as searchCitiesAPI } from '../../../services';
import { useOnboardingStatus } from '../../../hooks/queries/useOnboardingStatus';

interface OnBoardingPageProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface ZipcodeData {
  city: string;
  state: string;
  zipcode: string;
}

const OnBoardingPage: React.FC<OnBoardingPageProps> = ({ isOpen = true, onClose }) => {
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

  // City validation state
  const [cityInput, setCityInput] = useState('');
  const [isValidatingCity, setIsValidatingCity] = useState(false);
  const [cityResults, setCityResults] = useState<ZipcodeData[]>([]);
  const [selectedCities, setSelectedCities] = useState<ZipcodeData[]>([]);
  const [cityError, setCityError] = useState<string | null>(null);

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

    loadOptions();
  }, []);

  // Search cities when user types - NOW USES BACKEND API
  useEffect(() => {
    const searchCities = async () => {
      // Only search if input is at least 2 characters
      if (cityInput.length < 2) {
        setCityResults([]);
        setCityError(null);
        return;
      }

      setIsValidatingCity(true);
      setCityError(null);

      try {
        // ✅ Call backend API instead of Google directly
        const cities = await searchCitiesAPI(cityInput);

        if (cities.length === 0) {
          setCityResults([]);
          setCityError('No cities found. Try a different search.');
          return;
        }

        setCityResults(cities);
        setCityError(null);
      } catch (err) {
        console.error('City search error:', err);
        setCityResults([]);
        
        // Show user-friendly error message
        if (err instanceof Error) {
          setCityError(err.message);
        } else {
          setCityError('Failed to search cities. Please try again.');
        }
      } finally {
        setIsValidatingCity(false);
      }
    };

    // Debounce for better UX (300ms already optimal)
    const timeoutId = setTimeout(searchCities, 300);
    return () => clearTimeout(timeoutId);
  }, [cityInput]);

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
        return selectedCities.length > 0;
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

      // Step 5: Zipcode - send the first selected city's zipcode (or you can modify backend to accept multiple)
      await completeStep5({
        zipcode: selectedCities[0].zipcode // Sending first city's zipcode for now
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
    <div className="fixed inset-0 z-[100] bg-pure-white flex flex-col">
      {/* Progress Bar */}
      <div className="w-full px-8 pt-8 pb-4">
        <div className="max-w-4xl mx-auto">
          <div className="h-3 bg-light-background-blue rounded-full overflow-hidden">
            <div 
              className="h-full bg-elegant-blue rounded-full transition-all duration-500 ease-out"
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
          <div className="flex items-center justify-center">
            <div className="relative inline-block">
              {/* Bird Image */}
              <img src={OnboardingImage1} alt="Welcome" className="w-72 h-72 object-contain" />
              {/* Text Box positioned absolutely above and to the right */}
              <div className="absolute -top-24 left-1/2 translate-x-8 w-80">
                <div className="relative">
                  <img src={TextBox} alt="" className="w-full h-auto" />
                  <div className="absolute inset-0 flex items-center justify-center px-10 pb-3">
                    <OnestFont weight={700} lineHeight="relaxed" className="text-lg text-text-blue-black text-center">
                      Hi! Welcome to<br />NestNavigate!
                    </OnestFont>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={handleNext}
            className="mx-auto block px-12 py-4 bg-elegant-blue hover:opacity-90 text-pure-white rounded-full transition-opacity shadow-md"
          >
            <OnestFont weight={500} lineHeight="relaxed" className="text-lg">
              CONTINUE
            </OnestFont>
          </button>
        </div>
      )}

      {/* Screen 2: Let's Build */}
      {currentStep === 1 && (
        <div className="text-center space-y-8 animate-fadeIn">
          <div className="flex items-center justify-center">
            <div className="relative inline-block">
              {/* Bird Image */}
              <img src={OnboardingImage2} alt="Let's Build" className="w-48 h-72 object-contain" />
              {/* Text Box positioned absolutely above and to the right */}
              <div className="absolute -top-24 left-1/2 translate-x-8 w-80">
                <div className="relative">
                  <img src={TextBox} alt="" className="w-full h-auto" />
                  <div className="absolute inset-0 flex items-center justify-center px-10 pb-3">
                    <OnestFont weight={700} lineHeight="relaxed" className="text-lg text-text-blue-black text-center">
                      Let's build the learning<br />path for you!
                    </OnestFont>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={handleNext}
            className="mx-auto block px-12 py-4 bg-elegant-blue hover:opacity-90 text-pure-white rounded-full transition-opacity shadow-md"
          >
            <OnestFont weight={500} lineHeight="relaxed" className="text-lg">
              CONTINUE
            </OnestFont>
          </button>
        </div>
      )}

          {/* Screen 3: Professionals */}
          {currentStep === 2 && (
            <div className="text-center space-y-8 animate-fadeIn">
              <div className="flex items-center justify-center gap-4 mb-8">
                <img src={OnboardingImage3_5} alt="Question" className="w-16 h-16 object-contain" />
                <OnestFont as="h1" weight={700} lineHeight="tight" className="text-2xl text-text-blue-black">
                  Are you working with a ...
                </OnestFont>
              </div>

              <div className="space-y-8">
                {/* Real Estate Officer */}
                <div>
                  <OnestFont as="h2" weight={700} lineHeight="relaxed" className="text-xl mb-4 text-elegant-blue">
                    Real Estate Officer?
                  </OnestFont>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => setFormData({ ...formData, has_realtor: true })}
                      className={`px-8 py-3 rounded-xl border-2 transition-all ${
                        formData.has_realtor === true 
                          ? 'bg-elegant-blue/10 border-elegant-blue' 
                          : 'bg-pure-white border-light-background-blue'
                      }`}
                    >
                      <OnestFont weight={500} lineHeight="relaxed" className="text-text-blue-black">
                        Yes, I am
                      </OnestFont>
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, has_realtor: false })}
                      className={`px-8 py-3 rounded-xl border-2 transition-all ${
                        formData.has_realtor === false 
                          ? 'bg-elegant-blue/10 border-elegant-blue' 
                          : 'bg-pure-white border-light-background-blue'
                      }`}
                    >
                      <OnestFont weight={500} lineHeight="relaxed" className="text-text-blue-black">
                        Not yet
                      </OnestFont>
                    </button>
                  </div>
                </div>

                {/* Loan Officer */}
                <div>
                  <OnestFont as="h2" weight={700} lineHeight="relaxed" className="text-xl mb-4 text-elegant-blue">
                    Loan Officer?
                  </OnestFont>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => setFormData({ ...formData, has_loan_officer: true })}
                      className={`px-8 py-3 rounded-xl border-2 transition-all ${
                        formData.has_loan_officer === true 
                          ? 'bg-elegant-blue/10 border-elegant-blue' 
                          : 'bg-pure-white border-light-background-blue'
                      }`}
                    >
                      <OnestFont weight={500} lineHeight="relaxed" className="text-text-blue-black">
                        Yes, I am
                      </OnestFont>
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, has_loan_officer: false })}
                      className={`px-8 py-3 rounded-xl border-2 transition-all ${
                        formData.has_loan_officer === false 
                          ? 'bg-elegant-blue/10 border-elegant-blue' 
                          : 'bg-pure-white border-light-background-blue'
                      }`}
                    >
                      <OnestFont weight={500} lineHeight="relaxed" className="text-text-blue-black">
                        Not yet
                      </OnestFont>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Navigation Buttons */}
              <div className="flex gap-8 justify-center pt-8">
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-24 py-2 rounded-full border-2 border-elegant-blue text-elegant-blue bg-pure-white hover:bg-elegant-blue/10 transition-colors"
                >
                  <OnestFont weight={500} lineHeight="relaxed">
                    &lt; Back
                  </OnestFont>
                </button>
                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className={`px-24 py-2 rounded-full transition-opacity text-pure-white ${
                    canProceed() 
                      ? 'bg-elegant-blue hover:opacity-90 cursor-pointer' 
                      : 'bg-elegant-blue/30 cursor-not-allowed'
                  }`}
                >
                  <OnestFont weight={500} lineHeight="relaxed">
                    NEXT &gt;
                  </OnestFont>
                </button>
              </div>
            </div>
          )}

          {/* Screen 4: Expert Contact */}
          {currentStep === 3 && (
            <div className="text-center space-y-8 animate-fadeIn">
              <div className="flex items-center justify-center gap-4 mb-8">
                <img src={OnboardingImage4} alt="Expert Contact" className="w-16 h-16 object-contain" />
                <OnestFont as="h1" weight={700} lineHeight="tight" className="text-xl text-text-blue-black">
                  Would you like to get in contact with an expert?
                </OnestFont>
              </div>

              <div className="space-y-4 max-w-md mx-auto">
                {onboardingOptions?.expert_contact_options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setFormData({ ...formData, wants_expert_contact: option.name })}
                    className={`w-full px-8 py-4 rounded-xl border-2 transition-all ${
                      formData.wants_expert_contact === option.name 
                        ? 'bg-elegant-blue/10 border-elegant-blue' 
                        : 'bg-pure-white border-light-background-blue'
                    }`}
                  >
                    <OnestFont weight={500} lineHeight="relaxed" className="text-text-blue-black">
                      {option.name}
                    </OnestFont>
                  </button>
                ))}
              </div>

              {/* Bottom Navigation Buttons */}
              <div className="flex gap-8 justify-center pt-8">
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-24 py-2 rounded-full border-2 border-elegant-blue text-elegant-blue bg-pure-white hover:bg-elegant-blue/10 transition-colors"
                >
                  <OnestFont weight={500} lineHeight="relaxed">
                    &lt; Back
                  </OnestFont>
                </button>
                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className={`px-24 py-2 rounded-full transition-opacity text-pure-white ${
                    canProceed() 
                      ? 'bg-elegant-blue hover:opacity-90 cursor-pointer' 
                      : 'bg-elegant-blue/30 cursor-not-allowed'
                  }`}
                >
                  <OnestFont weight={500} lineHeight="relaxed">
                    NEXT &gt;
                  </OnestFont>
                </button>
              </div>
            </div>
          )}

          {/* Screen 5: Timeline Slider */}
          {currentStep === 4 && (
            <div className="text-center space-y-8 animate-fadeIn">
              <div className="flex items-center justify-center gap-4 mb-8">
                <img src={OnboardingImage3_5} alt="Timeline" className="w-16 h-16 object-contain" />
                <OnestFont as="h1" weight={700} lineHeight="tight" className="text-xl text-text-blue-black">
                  When do you want to achieve homeownership?
                </OnestFont>
              </div>

              <div className="max-w-xl mx-auto space-y-6">
                <div className="text-center">
                  <OnestFont weight={700} lineHeight="tight" className="text-4xl mb-2 text-elegant-blue">
                    {formatTimeline(formData.homeownership_timeline_months)}
                  </OnestFont>
                  <OnestFont weight={300} lineHeight="relaxed" className="text-sm text-text-grey">
                    Estimated timeline
                  </OnestFont>
                </div>

                <div className="px-4">
                  <input
                    type="range"
                    min="6"
                    max="60"
                    value={formData.homeownership_timeline_months}
                    onChange={(e) => setFormData({ ...formData, homeownership_timeline_months: parseInt(e.target.value) })}
                    className="w-full h-2 bg-light-background-blue rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #6B85F5 0%, #6B85F5 ${((formData.homeownership_timeline_months - 6) / 54) * 100}%, #EBEFFF ${((formData.homeownership_timeline_months - 6) / 54) * 100}%, #EBEFFF 100%)`
                    }}
                  />
                  <div className="flex justify-between mt-2">
                    <OnestFont weight={300} lineHeight="relaxed" className="text-sm text-text-grey">
                      6 months
                    </OnestFont>
                    <OnestFont weight={300} lineHeight="relaxed" className="text-sm text-text-grey">
                      5 years
                    </OnestFont>
                  </div>
                </div>
              </div>

              {/* Bottom Navigation Buttons */}
              <div className="flex gap-8 justify-center pt-8">
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-24 py-2 rounded-full border-2 border-elegant-blue text-elegant-blue bg-pure-white hover:bg-elegant-blue/10 transition-colors"
                >
                  <OnestFont weight={500} lineHeight="relaxed">
                    &lt; Back
                  </OnestFont>
                </button>
                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className={`px-24 py-2 rounded-full transition-opacity text-pure-white ${
                    canProceed() 
                      ? 'bg-elegant-blue hover:opacity-90 cursor-pointer' 
                      : 'bg-elegant-blue/30 cursor-not-allowed'
                  }`}
                >
                  <OnestFont weight={500} lineHeight="relaxed">
                    NEXT &gt;
                  </OnestFont>
                </button>
              </div>
            </div>
          )}

          {/* Screen 6: City Search */}
          {currentStep === 5 && (
            <div className="text-center space-y-8 animate-fadeIn">
              <div className="flex items-center justify-center gap-4 mb-8">
                <img src={OnboardingImage3_5} alt="Location" className="w-16 h-16 object-contain" />
                <OnestFont as="h1" weight={700} lineHeight="tight" className="text-xl text-text-blue-black">
                  Finally, let's find your future home base!
                </OnestFont>
              </div>

              <div className="max-w-xl mx-auto space-y-4">
                <OnestFont weight={300} lineHeight="relaxed" className="text-sm text-elegant-blue">
                  Search and select cities you're interested in
                </OnestFont>
                
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g., San Francisco, Los Angeles"
                    value={cityInput}
                    onChange={(e) => {
                      setCityInput(e.target.value);
                    }}
                    className={`w-full px-6 py-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-elegant-blue text-lg transition-colors ${
                      selectedCities.length > 0 
                        ? 'border-status-green' 
                        : cityError 
                        ? 'border-status-red' 
                        : 'border-elegant-blue'
                    }`}
                  />
                  
                  {/* Loading Spinner */}
                  {isValidatingCity && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <div className="w-6 h-6 border-2 border-elegant-blue border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  
                  {/* Success Checkmark */}
                  {selectedCities.length > 0 && !isValidatingCity && !cityInput && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-status-green text-2xl">
                      ✓
                    </div>
                  )}
                  
                  {/* Error X */}
                  {cityError && !isValidatingCity && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-status-red text-2xl">
                      ✕
                    </div>
                  )}
                </div>

                {/* City Results - Show search results */}
                {cityResults.length > 0 && !isValidatingCity && (
                  <div className="border-2 border-elegant-blue rounded-xl overflow-hidden">
                    <div className="bg-light-background-blue px-4 py-2 border-b-2 border-elegant-blue">
                      <OnestFont weight={500} lineHeight="relaxed" className="text-sm text-text-blue-black">
                        Click to add cities:
                      </OnestFont>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {cityResults.map((city, index) => {
                        const isSelected = selectedCities.some(
                          (selected) => selected.city === city.city && selected.state === city.state
                        );
                        return (
                          <button
                            key={index}
                            onClick={() => {
                              if (isSelected) {
                                // Remove city
                                setSelectedCities(selectedCities.filter(
                                  (selected) => !(selected.city === city.city && selected.state === city.state)
                                ));
                              } else {
                                // Add city
                                setSelectedCities([...selectedCities, city]);
                              }
                            }}
                            className={`w-full px-4 py-3 text-left transition-colors border-b border-light-background-blue last:border-b-0 flex items-center justify-between ${
                              isSelected 
                                ? 'bg-elegant-blue/10' 
                                : 'bg-pure-white hover:bg-light-background-blue'
                            }`}
                          >
                            <div>
                              <OnestFont weight={500} lineHeight="relaxed" className="text-text-blue-black">
                                {city.city}, {city.state}
                              </OnestFont>
                            </div>
                            {isSelected && (
                              <div className="text-status-green text-xl">✓</div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Selected Cities Display */}
                {selectedCities.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-2">
                      <OnestFont weight={500} lineHeight="relaxed" className="text-sm text-text-blue-black">
                        Selected Cities ({selectedCities.length})
                      </OnestFont>
                      <button
                        onClick={() => setSelectedCities([])}
                        className="text-elegant-blue hover:underline"
                      >
                        <OnestFont weight={500} lineHeight="relaxed" className="text-sm">
                          Clear All
                        </OnestFont>
                      </button>
                    </div>
                    <div className="space-y-2">
                      {selectedCities.map((city, index) => (
                        <div
                          key={index}
                          className="bg-status-green/10 border-2 border-status-green rounded-xl p-3 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2 text-status-green">
                            <span className="text-sm">✓</span>
                            <div>
                              <OnestFont weight={700} lineHeight="relaxed" className="text-sm">
                                {city.city}, {city.state}
                              </OnestFont>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedCities(selectedCities.filter((_, i) => i !== index));
                            }}
                            className="text-status-green hover:text-status-green/80 text-xl leading-none"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {cityError && (
                  <OnestFont weight={300} lineHeight="relaxed" className="text-status-red text-sm">
                    {cityError}
                  </OnestFont>
                )}

                {/* Helper Text */}
                {!cityInput && selectedCities.length === 0 && (
                  <OnestFont weight={300} lineHeight="relaxed" className="text-sm text-text-grey">
                    Start typing to search for cities
                  </OnestFont>
                )}
              </div>

              {error && (
                <OnestFont weight={500} lineHeight="relaxed" className="text-status-red text-sm">
                  {error}
                </OnestFont>
              )}

              {/* Bottom Navigation Buttons */}
              <div className="flex gap-8 justify-center pt-8">
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-24 py-2 rounded-full border-2 border-elegant-blue text-elegant-blue bg-pure-white hover:bg-elegant-blue/10 transition-colors"
                >
                  <OnestFont weight={500} lineHeight="relaxed">
                    &lt; Back
                  </OnestFont>
                </button>
                <button
                  onClick={handleComplete}
                  disabled={!canProceed() || isLoading}
                  className={`px-24 py-2 rounded-full transition-opacity text-pure-white ${
                    (canProceed() && !isLoading) 
                      ? 'bg-elegant-blue hover:opacity-90 cursor-pointer' 
                      : 'bg-elegant-blue/30 cursor-not-allowed'
                  }`}
                >
                  <OnestFont weight={500} lineHeight="relaxed">
                    {isLoading ? 'LOADING...' : "LET'S GO"}
                  </OnestFont>
                </button>
              </div>
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
          border: 3px solid #6B85F5;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          border: 3px solid #6B85F5;
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