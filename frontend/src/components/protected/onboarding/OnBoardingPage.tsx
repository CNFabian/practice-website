import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingImage1, OnboardingImage2, OnboardingImage3_5, OnboardingImage4, TextBox, OnestFont } from '../../../assets';
import { getOnboardingOptions, completeStep1, completeStep2, completeStep3, completeStep4, type OnboardingOptions } from '../../../services/onBoardingAPI';
import { useOnboardingStatus } from '../../../hooks/queries/useOnboardingStatus';
import { searchCities, type PlacePrediction } from '../../../services/googlePlacesAPI';

interface OnBoardingPageProps {
  isOpen?: boolean;
  onClose?: () => void;
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
    target_cities: [] as string[] // Will hold ["Long Beach, CA", "San Jose, CA"]
  });

  // City search state
  const [cityInput, setCityInput] = useState('');
  const [cityResults, setCityResults] = useState<PlacePrediction[]>([]);
  const [selectedCities, setSelectedCities] = useState<PlacePrediction[]>([]);
  const [isSearchingCity, setIsSearchingCity] = useState(false);
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

  // Search cities when user types (debounced)
  useEffect(() => {
    if (cityInput.length < 3) {
      setCityResults([]);
      setCityError(null);
      return;
    }

    setIsSearchingCity(true);
    setCityError(null);

    const timeoutId = setTimeout(async () => {
      try {
        const results = await searchCities(cityInput);
        setCityResults(results);
        if (results.length === 0 && cityInput.length >= 3) {
          setCityError('No cities found. Try a different search.');
        }
      } catch (err) {
        console.error('City search error:', err);
        setCityResults([]);
        setCityError('Failed to search cities. Please try again.');
      } finally {
        setIsSearchingCity(false);
      }
    }, 600);

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
      case 5: // City
        return selectedCities.length > 0;
      default:
        return false;
    }
  };

  // Handle city selection from dropdown
  const handleCitySelect = (city: PlacePrediction) => {
    // Prevent duplicates
    if (selectedCities.some((c) => c.placeId === city.placeId)) {
      setCityInput('');
      setCityResults([]);
      return;
    }

    const updatedCities = [...selectedCities, city];
    setSelectedCities(updatedCities);
    setCityInput('');
    setCityResults([]);
    setCityError(null);
    setFormData({ ...formData, target_cities: updatedCities.map((c) => c.displayText) });
  };

  // Handle removing a selected city chip
  const handleCityRemove = (placeId: string) => {
    const updatedCities = selectedCities.filter((c) => c.placeId !== placeId);
    setSelectedCities(updatedCities);
    setFormData({ ...formData, target_cities: updatedCities.map((c) => c.displayText) });
  };

  // Handle final submission
  const handleComplete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Professionals (strings, not booleans)
      await completeStep1({
        has_realtor: formData.has_realtor ? 'Yes, I am' : 'Not yet',
        has_loan_officer: formData.has_loan_officer ? 'Yes, I am' : 'Not yet'
      });

      console.log('formData at submission:', formData);
      console.log('expert contact value:', formData.wants_expert_contact);

      // Step 2: Expert Contact
      await completeStep2({
        wants_expert_contact: formData.wants_expert_contact
      });

      // Step 3: Timeline
      await completeStep3({
        homeownership_timeline_months: formData.homeownership_timeline_months
      });

      // Step 4: Target Cities - sends array e.g. ["Long Beach, CA", "San Jose, CA"]
      await completeStep4({
        target_cities: formData.target_cities
      });

      console.log('All onboarding steps completed successfully');

      // Wait for backend to update
      await new Promise(resolve => setTimeout(resolve, 1000));
      await refetchOnboardingStatus();

      // ═══════════════════════════════════════════════════════════
      // Dispatch custom event BEFORE navigating so App.tsx can
      // synchronously set needsOnboarding = false. Without this,
      // navigating to /app hits the stale needsOnboarding === true
      // route guard and redirects back to /onboarding (loop).
      // ═══════════════════════════════════════════════════════════
      window.dispatchEvent(new Event('onboarding-completed'));

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
    <div className="fixed inset-0 z-[9999] bg-pure-white flex flex-col">
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
                    onClick={() => setFormData({ ...formData, wants_expert_contact: option.id })}
                    className={`w-full px-8 py-4 rounded-xl border-2 transition-all ${
                      formData.wants_expert_contact === option.id
                        ? 'bg-elegant-blue/10 border-elegant-blue'
                        : 'bg-pure-white border-light-background-blue'
                    }`}
                  >
                    <OnestFont weight={500} lineHeight="relaxed" className="text-text-blue-black">
                      {option.label}
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
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        homeownership_timeline_months: parseInt(e.target.value)
                      })
                    }
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
                  <br />
                  Select cities you're interested in:
                </OnestFont>
              </div>

              <div className="max-w-xl mx-auto space-y-2">
                <OnestFont weight={300} lineHeight="relaxed" className="text-sm text-elegant-blue text-right">
                  Search by City Name or ZIP Code
                </OnestFont>
                <div className="relative">
                  {/* Search Input */}
                  <div
                    className={`flex items-center gap-2 w-full px-4 py-3 border-2 rounded-xl transition-colors bg-pure-white ${
                      cityError ? 'border-status-red' : 'border-elegant-blue'
                    }`}
                  >
                    {/* Search Icon */}
                    <svg className="w-5 h-5 text-text-grey flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>

                    {/* Text Input */}
                    <input
                      type="text"
                      placeholder={selectedCities.length > 0 ? 'Add another city...' : 'e.g., Long Beach, San Francisco'}
                      value={cityInput}
                      onChange={(e) => {
                        setCityInput(e.target.value);
                      }}
                      className="flex-1 min-w-0 outline-none text-lg text-text-blue-black bg-transparent placeholder:text-unavailable-button"
                    />

                    {/* Clear Input Button */}
                    {cityInput && (
                      <button
                        onClick={() => {
                          setCityInput('');
                          setCityResults([]);
                          setCityError(null);
                        }}
                        className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-text-grey hover:text-text-blue-black transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
                        </svg>
                      </button>
                    )}

                    {/* Loading Spinner */}
                    {isSearchingCity && (
                      <div className="flex-shrink-0">
                        <div className="w-5 h-5 border-2 border-elegant-blue border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>

                  {/* Dropdown Results */}
                  {cityResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-0 bg-pure-white border-2 border-t-0 border-elegant-blue rounded-b-xl shadow-lg max-h-60 overflow-y-auto">
                      {cityResults
                        .filter((city) => !selectedCities.some((sc) => sc.placeId === city.placeId))
                        .map((city) => (
                          <button
                            key={city.placeId}
                            onClick={() => handleCitySelect(city)}
                            className="w-full px-6 py-3 text-left hover:bg-light-background-blue transition-colors last:rounded-b-xl"
                          >
                            <OnestFont weight={500} lineHeight="relaxed" className="text-text-blue-black">
                              {city.city}
                            </OnestFont>
                            <OnestFont weight={300} lineHeight="relaxed" className="text-sm text-text-grey ml-1">
                              , {city.state}
                            </OnestFont>
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                {/* Selected City Chips - Below Input */}
                {selectedCities.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    {selectedCities.map((city) => (
                      <span
                        key={city.placeId}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-light-background-blue border border-elegant-blue rounded-lg"
                      >
                        <OnestFont weight={500} lineHeight="relaxed" className="text-sm text-text-blue-black">
                          {city.city}, {city.state}
                        </OnestFont>
                        <button
                          onClick={() => handleCityRemove(city.placeId)}
                          className="text-text-grey hover:text-text-blue-black transition-colors"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                          </svg>
                        </button>
                      </span>
                    ))}
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
                    Start typing to search for your city
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
                    {isLoading ? 'LOADING...' : 'NEXT >'}
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
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default OnBoardingPage;