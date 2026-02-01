import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  OnboardingImage1,
  OnboardingImage2,
  OnboardingImage3_5,
  OnboardingImage4,
  TextBox
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

    if (isOpen) {
      loadOptions();
    }
  }, [isOpen]);

  // Search cities when user types - GOOGLE PLACES AUTOCOMPLETE
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
        const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
        
        if (!GOOGLE_API_KEY) {
          console.error('Google Places API key not configured');
          setCityResults([]);
          setCityError('Configuration error. Please add VITE_GOOGLE_PLACES_API_KEY to .env');
          setIsValidatingCity(false);
          return;
        }

        // Use Google Places Autocomplete API
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?` +
          `input=${encodeURIComponent(cityInput)}` +
          `&types=(cities)` + // Only cities
          `&components=country:us` + // USA only
          `&key=${GOOGLE_API_KEY}`
        );

        if (!response.ok) {
          throw new Error('Failed to search cities');
        }

        const data = await response.json();

        if (data.status === 'ZERO_RESULTS' || !data.predictions || data.predictions.length === 0) {
          setCityResults([]);
          setCityError('No cities found. Try a different search.');
          return;
        }

        if (data.status === 'REQUEST_DENIED') {
          console.error('Google Places API Error:', data.error_message);
          setCityResults([]);
          setCityError('API access error. Please check your API key configuration.');
          return;
        }

        // Process predictions to get city, state, and zipcode
        const cityPromises = data.predictions.slice(0, 10).map(async (prediction: any) => {
          try {
            // Get place details to fetch zipcode
            const detailsResponse = await fetch(
              `https://maps.googleapis.com/maps/api/place/details/json?` +
              `place_id=${prediction.place_id}` +
              `&fields=address_components` +
              `&key=${GOOGLE_API_KEY}`
            );

            if (!detailsResponse.ok) return null;

            const detailsData = await detailsResponse.json();
            
            if (!detailsData.result?.address_components) return null;

            // Extract city, state, and zipcode from address components
            let city = '';
            let state = '';
            let zipcode = '';

            for (const component of detailsData.result.address_components) {
              if (component.types.includes('locality')) {
                city = component.long_name;
              }
              if (component.types.includes('administrative_area_level_1')) {
                state = component.short_name; // State abbreviation (e.g., CA, TX)
              }
              if (component.types.includes('postal_code')) {
                zipcode = component.long_name;
              }
            }

            // If no zipcode found in this result, try to get a default one for the city
            if (!zipcode && city && state) {
              // Use a geocoding call to get approximate zipcode
              const geocodeResponse = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?` +
                `address=${encodeURIComponent(city + ', ' + state)}` +
                `&key=${GOOGLE_API_KEY}`
              );
              
              if (geocodeResponse.ok) {
                const geocodeData = await geocodeResponse.json();
                if (geocodeData.results?.[0]?.address_components) {
                  for (const component of geocodeData.results[0].address_components) {
                    if (component.types.includes('postal_code')) {
                      zipcode = component.long_name;
                      break;
                    }
                  }
                }
              }
            }

            // Only return if we have city, state, and zipcode
            if (city && state && zipcode) {
              return { city, state, zipcode };
            }

            return null;
          } catch (err) {
            console.error('Error fetching place details:', err);
            return null;
          }
        });

        const cities = (await Promise.all(cityPromises)).filter(Boolean) as ZipcodeData[];

        // Remove duplicates based on city + state
        const uniqueCities = Array.from(
          new Map(cities.map(city => [`${city.city}-${city.state}`, city])).values()
        );

        if (uniqueCities.length === 0) {
          setCityResults([]);
          setCityError('No cities with zipcodes found. Try a different search.');
          return;
        }

        setCityResults(uniqueCities);
        setCityError(null);
      } catch (err) {
        console.error('City search error:', err);
        setCityResults([]);
        setCityError('Failed to search cities. Please try again.');
      } finally {
        setIsValidatingCity(false);
      }
    };

    // Debounce for better UX
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
    <div className="fixed inset-0 z-[100] bg-white flex flex-col">
      {/* Progress Bar */}
      <div className="w-full px-8 pt-8 pb-4">
        <div className="max-w-4xl mx-auto">
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%`, backgroundColor: '#6B85F5' }}
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
                    <h1 className="text-lg font-semibold text-gray-700 text-center leading-relaxed">
                      Hi! Welcome to<br />NestNavigate!
                    </h1>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={handleNext}
            className="mx-auto block px-12 py-4 text-white rounded-full text-lg font-medium transition-colors shadow-md"
            style={{ backgroundColor: '#6B85F5' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5A73E0'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6B85F5'}
          >
            CONTINUE
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
                    <h1 className="text-lg font-semibold text-gray-700 text-center leading-relaxed">
                      Let's build the learning<br />path for you!
                    </h1>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={handleNext}
            className="mx-auto block px-12 py-4 text-white rounded-full text-lg font-medium transition-colors shadow-md"
            style={{ backgroundColor: '#6B85F5' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5A73E0'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6B85F5'}
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
                  <h2 className="text-xl font-semibold mb-4" style={{ color: '#6B85F5' }}>Real Estate Officer?</h2>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => setFormData({ ...formData, has_realtor: true })}
                      className="px-8 py-3 rounded-xl border-2 transition-all text-gray-700"
                      style={formData.has_realtor === true ? { 
                        backgroundColor: '#EBF0FF', 
                        borderColor: '#6B85F5'
                      } : {
                        backgroundColor: 'white',
                        borderColor: '#d1d5db'
                      }}
                    >
                      Yes, I am
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, has_realtor: false })}
                      className="px-8 py-3 rounded-xl border-2 transition-all text-gray-700"
                      style={formData.has_realtor === false ? { 
                        backgroundColor: '#EBF0FF', 
                        borderColor: '#6B85F5'
                      } : {
                        backgroundColor: 'white',
                        borderColor: '#d1d5db'
                      }}
                    >
                      Not yet
                    </button>
                  </div>
                </div>

                {/* Loan Officer */}
                <div>
                  <h2 className="text-xl font-semibold mb-4" style={{ color: '#6B85F5' }}>Loan Officer?</h2>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => setFormData({ ...formData, has_loan_officer: true })}
                      className="px-8 py-3 rounded-xl border-2 transition-all text-gray-700"
                      style={formData.has_loan_officer === true ? { 
                        backgroundColor: '#EBF0FF', 
                        borderColor: '#6B85F5'
                      } : {
                        backgroundColor: 'white',
                        borderColor: '#d1d5db'
                      }}
                    >
                      Yes, I am
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, has_loan_officer: false })}
                      className="px-8 py-3 rounded-xl border-2 transition-all text-gray-700"
                      style={formData.has_loan_officer === false ? { 
                        backgroundColor: '#EBF0FF', 
                        borderColor: '#6B85F5'
                      } : {
                        backgroundColor: 'white',
                        borderColor: '#d1d5db'
                      }}
                    >
                      Not yet
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Navigation Buttons */}
              <div className="flex gap-8 justify-center pt-8">
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-24 py-2 rounded-full border-2 bg-white font-medium transition-all"
                  style={{ borderColor: '#6B85F5', color: '#6B85F5' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5F7FF'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  &lt; Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="px-24 py-2 rounded-full font-medium transition-all text-white"
                  style={{ 
                    backgroundColor: canProceed() ? '#6B85F5' : '#C8D4F9',
                    cursor: canProceed() ? 'pointer' : 'not-allowed'
                  }}
                  onMouseEnter={(e) => {
                    if (canProceed()) {
                      e.currentTarget.style.backgroundColor = '#5A73E0';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (canProceed()) {
                      e.currentTarget.style.backgroundColor = '#6B85F5';
                    }
                  }}
                >
                  NEXT &gt;
                </button>
              </div>
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
                    className="w-full px-8 py-4 rounded-xl border-2 transition-all text-gray-700"
                    style={formData.wants_expert_contact === option.name ? { 
                      backgroundColor: '#EBF0FF', 
                      borderColor: '#6B85F5'
                    } : {
                      backgroundColor: 'white',
                      borderColor: '#d1d5db'
                    }}
                  >
                    {option.name}
                  </button>
                ))}
              </div>

              {/* Bottom Navigation Buttons */}
              <div className="flex gap-8 justify-center pt-8">
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-24 py-2 rounded-full border-2 bg-white font-medium transition-all"
                  style={{ borderColor: '#6B85F5', color: '#6B85F5' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5F7FF'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  &lt; Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="px-24 py-2 rounded-full font-medium transition-all text-white"
                  style={{ 
                    backgroundColor: canProceed() ? '#6B85F5' : '#C8D4F9',
                    cursor: canProceed() ? 'pointer' : 'not-allowed'
                  }}
                  onMouseEnter={(e) => {
                    if (canProceed()) {
                      e.currentTarget.style.backgroundColor = '#5A73E0';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (canProceed()) {
                      e.currentTarget.style.backgroundColor = '#6B85F5';
                    }
                  }}
                >
                  NEXT &gt;
                </button>
              </div>
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
                  <div className="text-4xl font-bold mb-2" style={{ color: '#6B85F5' }}>
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
                      background: `linear-gradient(to right, #6B85F5 0%, #6B85F5 ${((formData.homeownership_timeline_months - 6) / 54) * 100}%, #e5e7eb ${((formData.homeownership_timeline_months - 6) / 54) * 100}%, #e5e7eb 100%)`
                    }}
                  />
                  <div className="flex justify-between text-sm text-gray-600 mt-2">
                    <span>6 months</span>
                    <span>5 years</span>
                  </div>
                </div>
              </div>

              {/* Bottom Navigation Buttons */}
              <div className="flex gap-8 justify-center pt-8">
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-24 py-2 rounded-full border-2 bg-white font-medium transition-all"
                  style={{ borderColor: '#6B85F5', color: '#6B85F5' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5F7FF'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  &lt; Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="px-24 py-2 rounded-full font-medium transition-all text-white"
                  style={{ 
                    backgroundColor: canProceed() ? '#6B85F5' : '#C8D4F9',
                    cursor: canProceed() ? 'pointer' : 'not-allowed'
                  }}
                  onMouseEnter={(e) => {
                    if (canProceed()) {
                      e.currentTarget.style.backgroundColor = '#5A73E0';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (canProceed()) {
                      e.currentTarget.style.backgroundColor = '#6B85F5';
                    }
                  }}
                >
                  NEXT &gt;
                </button>
              </div>
            </div>
          )}

          {/* Screen 6: City Search */}
          {currentStep === 5 && (
            <div className="text-center space-y-8 animate-fadeIn">
              <div className="flex items-center justify-center gap-4 mb-8">
                <img src={OnboardingImage3_5} alt="Location" className="w-16 h-16 object-contain" />
                <h1 className="text-xl font-semibold text-gray-800">
                  Finally, let's find your future home base!
                </h1>
              </div>

              <div className="max-w-xl mx-auto space-y-4">
                <p className="text-sm" style={{ color: '#6B85F5' }}>Search and select cities you're interested in</p>
                
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g., San Francisco, Los Angeles"
                    value={cityInput}
                    onChange={(e) => {
                      setCityInput(e.target.value);
                    }}
                    className="w-full px-6 py-4 border-2 rounded-xl focus:outline-none focus:ring-2 text-lg transition-colors"
                    style={{
                      borderColor: selectedCities.length > 0 ? '#10b981' : cityError ? '#ef4444' : '#6B85F5',
                      ...(selectedCities.length > 0 || cityError ? {} : { '--tw-ring-color': '#6B85F5' } as any)
                    }}
                  />
                  
                  {/* Loading Spinner */}
                  {isValidatingCity && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: '#6B85F5', borderTopColor: 'transparent' }}></div>
                    </div>
                  )}
                  
                  {/* Success Checkmark */}
                  {selectedCities.length > 0 && !isValidatingCity && !cityInput && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500 text-2xl">
                      ✓
                    </div>
                  )}
                  
                  {/* Error X */}
                  {cityError && !isValidatingCity && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500 text-2xl">
                      ✕
                    </div>
                  )}
                </div>

                {/* City Results - Show search results */}
                {cityResults.length > 0 && !isValidatingCity && (
                  <div className="border-2 rounded-xl overflow-hidden" style={{ borderColor: '#6B85F5' }}>
                    <div className="bg-gray-50 px-4 py-2 border-b-2" style={{ borderColor: '#6B85F5' }}>
                      <p className="text-sm font-medium text-gray-700">Click to add cities:</p>
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
                            className="w-full px-4 py-3 text-left transition-colors border-b border-gray-200 last:border-b-0 flex items-center justify-between"
                            style={{
                              backgroundColor: isSelected ? '#EBF0FF' : 'white'
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.backgroundColor = '#F5F7FF';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.backgroundColor = 'white';
                              }
                            }}
                          >
                            <div>
                              <div className="font-medium text-gray-800">{city.city}, {city.state}</div>
                              <div className="text-sm text-gray-500">Zipcode: {city.zipcode}</div>
                            </div>
                            {isSelected && (
                              <div className="text-green-500 text-xl">✓</div>
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
                      <p className="text-sm font-medium text-gray-700">
                        Selected Cities ({selectedCities.length})
                      </p>
                      <button
                        onClick={() => setSelectedCities([])}
                        className="text-sm font-medium hover:underline"
                        style={{ color: '#6B85F5' }}
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="space-y-2">
                      {selectedCities.map((city, index) => (
                        <div
                          key={index}
                          className="bg-green-50 border-2 border-green-500 rounded-xl p-3 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2 text-green-700">
                            <span className="text-sm">✓</span>
                            <div>
                              <p className="font-semibold text-sm">{city.city}, {city.state}</p>
                              <p className="text-xs text-green-600">Zipcode: {city.zipcode}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedCities(selectedCities.filter((_, i) => i !== index));
                            }}
                            className="text-green-700 hover:text-green-900 text-xl leading-none"
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
                  <div className="text-red-600 text-sm">{cityError}</div>
                )}

                {/* Helper Text */}
                {!cityInput && selectedCities.length === 0 && (
                  <p className="text-sm text-gray-500">Start typing to search for cities</p>
                )}
              </div>

              {error && (
                <div className="text-red-600 text-sm font-medium">{error}</div>
              )}

              {/* Bottom Navigation Buttons */}
              <div className="flex gap-8 justify-center pt-8">
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-24 py-2 rounded-full border-2 bg-white font-medium transition-all"
                  style={{ borderColor: '#6B85F5', color: '#6B85F5' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5F7FF'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  &lt; Back
                </button>
                <button
                  onClick={handleComplete}
                  disabled={!canProceed() || isLoading}
                  className="px-24 py-2 rounded-full font-medium transition-all text-white"
                  style={{ 
                    backgroundColor: (canProceed() && !isLoading) ? '#6B85F5' : '#C8D4F9',
                    cursor: (canProceed() && !isLoading) ? 'pointer' : 'not-allowed'
                  }}
                  onMouseEnter={(e) => {
                    if (canProceed() && !isLoading) {
                      e.currentTarget.style.backgroundColor = '#5A73E0';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (canProceed() && !isLoading) {
                      e.currentTarget.style.backgroundColor = '#6B85F5';
                    }
                  }}
                >
                  {isLoading ? 'LOADING...' : "LET'S GO"}
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