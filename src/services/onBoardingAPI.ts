import { fetchWithAuth } from './authAPI';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// ==================== TYPE DEFINITIONS ====================

export interface OnboardingStatus {
  is_completed: boolean;
  current_step?: number;
  completed_steps?: string[];
  progress_percentage?: number;
}

export interface OnboardingData {
  id: string;
  user_id: string;
  selected_avatar: string;
  has_realtor: boolean;
  has_loan_officer: boolean;
  wants_expert_contact: string;
  homeownership_timeline_months: number;
  zipcode: string;
  completed_at: string;
  updated_at: string;
}

export interface Step1Data {
  selected_avatar: string;
}

export interface Step2Data {
  has_realtor: boolean;
  has_loan_officer: boolean;
}

export interface Step3Data {
  wants_expert_contact: string; // "Yes", "No", "Maybe later"
}

export interface Step4Data {
  homeownership_timeline_months: number;
}

export interface Step5Data {
  zipcode: string;
}

export interface CompleteOnboardingData {
  selected_avatar: string;
  has_realtor: boolean;
  has_loan_officer: boolean;
  wants_expert_contact: string;
  homeownership_timeline_months: number;
  zipcode: string;
}

export interface OnboardingOptions {
  avatars?: string[];
  expert_contact_options?: string[];
  timeline_options?: number[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

// ==================== LOCAL STORAGE FUNCTIONS ====================

const ONBOARDING_STORAGE_KEY = 'onboarding_data';

// Save onboarding data to local storage
export const saveOnboardingDataToLocalStorage = (data: Partial<CompleteOnboardingData>): void => {
  try {
    const existingData = getOnboardingDataFromLocalStorage();
    const updatedData = { ...existingData, ...data };
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(updatedData));
    console.log('Saved onboarding data to localStorage:', updatedData);
  } catch (error) {
    console.error('Error saving onboarding data to localStorage:', error);
  }
};

// Get onboarding data from local storage
export const getOnboardingDataFromLocalStorage = (): Partial<CompleteOnboardingData> => {
  try {
    const data = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return {};
  } catch (error) {
    console.error('Error getting onboarding data from localStorage:', error);
    return {};
  }
};

// Clear onboarding data from local storage
export const clearOnboardingDataFromLocalStorage = (): void => {
  try {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    console.log('Cleared onboarding data from localStorage');
  } catch (error) {
    console.error('Error clearing onboarding data from localStorage:', error);
  }
};

// Check if onboarding data exists in local storage
export const hasOnboardingDataInLocalStorage = (): boolean => {
  try {
    const data = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    return !!data;
  } catch (error) {
    console.error('Error checking onboarding data in localStorage:', error);
    return false;
  }
};

// Save step data to local storage (instead of sending to backend)
export const saveStepToLocalStorage = (stepNumber: number, stepData: any): void => {
  try {
    const key = `onboarding_step_${stepNumber}`;
    localStorage.setItem(key, JSON.stringify(stepData));
    console.log(`Saved step ${stepNumber} to localStorage:`, stepData);
  } catch (error) {
    console.error(`Error saving step ${stepNumber} to localStorage:`, error);
  }
};

// Get current step progress from local storage
export const getCurrentStepFromLocalStorage = (): number => {
  try {
    for (let step = 5; step >= 1; step--) {
      const key = `onboarding_step_${step}`;
      if (localStorage.getItem(key)) {
        return step + 1; // Return next step
      }
    }
    return 1; // Start from step 1 if no data
  } catch (error) {
    console.error('Error getting current step from localStorage:', error);
    return 1;
  }
};

// ==================== ONBOARDING STATUS API FUNCTIONS ====================

// GET /api/onboarding/status - Get user's onboarding completion status
export const getOnboardingStatus = async (): Promise<OnboardingStatus> => {
  try {
    console.log('Fetching onboarding status...');
    
    const response = await fetchWithAuth(`${API_BASE_URL}/api/onboarding/status`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: OnboardingStatus = await response.json();
    console.log('Onboarding status received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching onboarding status:', error);
    throw error;
  }
};

// Helper function to check if user has completed onboarding (for external use)
export const checkOnboardingStatus = async (): Promise<boolean> => {
  try {
    const status = await getOnboardingStatus();
    return status.is_completed;
  } catch (error) {
    if (error instanceof Error && error.message.includes('HTTP error! status: 400')) {
      // Backend returns 400 when onboarding is required
      console.log('Onboarding not completed - backend returned 400');
      return false;
    }
    console.error('Error checking onboarding status:', error);
    throw error;
  }
};

// ==================== MODIFIED ONBOARDING STEP FUNCTIONS ====================
// These now save to localStorage instead of sending to backend immediately

// Save step 1: Avatar selection to localStorage
export const saveStep1ToLocalStorage = (stepData: Step1Data): void => {
  try {
    console.log('Saving step 1 to localStorage:', stepData);
    saveStepToLocalStorage(1, stepData);
    saveOnboardingDataToLocalStorage({ selected_avatar: stepData.selected_avatar });
  } catch (error) {
    console.error('Error saving step 1 to localStorage:', error);
    throw error;
  }
};

// Save step 2: Realtor and loan officer status to localStorage  
export const saveStep2ToLocalStorage = (stepData: Step2Data): void => {
  try {
    console.log('Saving step 2 to localStorage:', stepData);
    saveStepToLocalStorage(2, stepData);
    saveOnboardingDataToLocalStorage({ 
      has_realtor: stepData.has_realtor,
      has_loan_officer: stepData.has_loan_officer 
    });
  } catch (error) {
    console.error('Error saving step 2 to localStorage:', error);
    throw error;
  }
};

// Save step 3: Expert contact preference to localStorage
export const saveStep3ToLocalStorage = (stepData: Step3Data): void => {
  try {
    console.log('Saving step 3 to localStorage:', stepData);
    saveStepToLocalStorage(3, stepData);
    saveOnboardingDataToLocalStorage({ wants_expert_contact: stepData.wants_expert_contact });
  } catch (error) {
    console.error('Error saving step 3 to localStorage:', error);
    throw error;
  }
};

// Save step 4: Homeownership timeline to localStorage
export const saveStep4ToLocalStorage = (stepData: Step4Data): void => {
  try {
    console.log('Saving step 4 to localStorage:', stepData);
    saveStepToLocalStorage(4, stepData);
    saveOnboardingDataToLocalStorage({ homeownership_timeline_months: stepData.homeownership_timeline_months });
  } catch (error) {
    console.error('Error saving step 4 to localStorage:', error);
    throw error;
  }
};

// Save step 5: Zipcode to localStorage
export const saveStep5ToLocalStorage = (stepData: Step5Data): void => {
  try {
    console.log('Saving step 5 to localStorage:', stepData);
    saveStepToLocalStorage(5, stepData);
    saveOnboardingDataToLocalStorage({ zipcode: stepData.zipcode });
  } catch (error) {
    console.error('Error saving step 5 to localStorage:', error);
    throw error;
  }
};

// ==================== LEGACY API FUNCTIONS (for backwards compatibility) ====================
// These are kept to maintain compatibility with existing hooks/components

// POST /api/onboarding/step1 - Complete step 1: Avatar selection
export const completeStep1 = async (stepData: Step1Data): Promise<ApiResponse> => {
  try {
    console.log('completeStep1 called - now saving to localStorage instead:', stepData);
    saveStep1ToLocalStorage(stepData);
    return { success: true, message: 'Step 1 saved to localStorage', data: {} };
  } catch (error) {
    console.error('Error in completeStep1:', error);
    throw error;
  }
};

// POST /api/onboarding/step2 - Complete step 2: Realtor and loan officer status
export const completeStep2 = async (stepData: Step2Data): Promise<ApiResponse> => {
  try {
    console.log('completeStep2 called - now saving to localStorage instead:', stepData);
    saveStep2ToLocalStorage(stepData);
    return { success: true, message: 'Step 2 saved to localStorage', data: {} };
  } catch (error) {
    console.error('Error in completeStep2:', error);
    throw error;
  }
};

// POST /api/onboarding/step3 - Complete step 3: Expert contact preference
export const completeStep3 = async (stepData: Step3Data): Promise<ApiResponse> => {
  try {
    console.log('completeStep3 called - now saving to localStorage instead:', stepData);
    saveStep3ToLocalStorage(stepData);
    return { success: true, message: 'Step 3 saved to localStorage', data: {} };
  } catch (error) {
    console.error('Error in completeStep3:', error);
    throw error;
  }
};

// POST /api/onboarding/step4 - Complete step 4: Homeownership timeline
export const completeStep4 = async (stepData: Step4Data): Promise<ApiResponse> => {
  try {
    console.log('completeStep4 called - now saving to localStorage instead:', stepData);
    saveStep4ToLocalStorage(stepData);
    return { success: true, message: 'Step 4 saved to localStorage', data: {} };
  } catch (error) {
    console.error('Error in completeStep4:', error);
    throw error;
  }
};

// POST /api/onboarding/step5 - Complete step 5: Future home location (zipcode)
export const completeStep5 = async (stepData: Step5Data): Promise<ApiResponse> => {
  try {
    console.log('completeStep5 called - now saving to localStorage instead:', stepData);
    saveStep5ToLocalStorage(stepData);
    return { success: true, message: 'Step 5 saved to localStorage', data: {} };
  } catch (error) {
    console.error('Error in completeStep5:', error);
    throw error;
  }
};

// ==================== ORIGINAL API FUNCTIONS (for completion) ====================

// POST /api/onboarding/complete - Complete all onboarding steps at once
export const completeOnboardingAllSteps = async (onboardingData: CompleteOnboardingData): Promise<ApiResponse> => {
  try {
    console.log('Completing all onboarding steps at once:', onboardingData);
    
    const response = await fetchWithAuth(`${API_BASE_URL}/api/onboarding/complete`, {
      method: 'POST',
      body: JSON.stringify(onboardingData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: ApiResponse = await response.json();
    console.log('All onboarding steps completed:', data);
    
    // Clear localStorage after successful completion
    clearOnboardingDataFromLocalStorage();
    
    return data;
  } catch (error) {
    console.error('Error completing all onboarding steps:', error);
    throw error;
  }
};

// ==================== ONBOARDING DATA API FUNCTIONS ====================

// GET /api/onboarding/data - Get user's onboarding data
export const getOnboardingData = async (): Promise<OnboardingData> => {
  try {
    console.log('Fetching onboarding data...');
    
    const response = await fetchWithAuth(`${API_BASE_URL}/api/onboarding/data`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: OnboardingData = await response.json();
    console.log('Onboarding data received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching onboarding data:', error);
    throw error;
  }
};

// GET /api/onboarding/options - Get available options for onboarding steps
export const getOnboardingOptions = async (): Promise<OnboardingOptions> => {
  try {
    console.log('Fetching onboarding options...');
    
    const response = await fetchWithAuth(`${API_BASE_URL}/api/onboarding/options`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: OnboardingOptions = await response.json();
    console.log('Onboarding options received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching onboarding options:', error);
    throw error;
  }
};

// ==================== VALIDATION FUNCTIONS ====================

// Validate onboarding step data before submission
export const validateStep1Data = (data: Step1Data): boolean => {
  return !!(data.selected_avatar && data.selected_avatar.trim().length > 0);
};

export const validateStep2Data = (data: Step2Data): boolean => {
  return typeof data.has_realtor === 'boolean' && typeof data.has_loan_officer === 'boolean';
};

export const validateStep3Data = (data: Step3Data): boolean => {
  const validOptions = ['Yes', 'No', 'Maybe later'];
  return !!(data.wants_expert_contact && validOptions.includes(data.wants_expert_contact));
};

export const validateStep4Data = (data: Step4Data): boolean => {
  return !!(typeof data.homeownership_timeline_months === 'number' && data.homeownership_timeline_months >= 0);
};

export const validateStep5Data = (data: Step5Data): boolean => {
  // Basic zipcode validation (5 digits)
  const zipcodeRegex = /^\d{5}$/;
  return !!(data.zipcode && zipcodeRegex.test(data.zipcode));
};

export const validateCompleteOnboardingData = (data: CompleteOnboardingData): boolean => {
  return (
    validateStep1Data({ selected_avatar: data.selected_avatar }) &&
    validateStep2Data({ has_realtor: data.has_realtor, has_loan_officer: data.has_loan_officer }) &&
    validateStep3Data({ wants_expert_contact: data.wants_expert_contact }) &&
    validateStep4Data({ homeownership_timeline_months: data.homeownership_timeline_months }) &&
    validateStep5Data({ zipcode: data.zipcode })
  );
};

// ==================== UTILITY FUNCTIONS ====================

// Helper function to determine next step based on current onboarding status
export const getNextOnboardingStep = (status: OnboardingStatus): number => {
  if (status.is_completed) {
    return 0; // Onboarding complete
  }
  
  if (!status.completed_steps || status.completed_steps.length === 0) {
    return 1; // Start with step 1
  }
  
  // Return next step based on completed steps
  return status.completed_steps.length + 1;
};

// Check if a specific step is completed
export const isStepCompleted = (status: OnboardingStatus, step: number): boolean => {
  if (!status.completed_steps) return false;
  return status.completed_steps.includes(`step${step}`);
};

// Get completion percentage
export const getOnboardingProgress = (status: OnboardingStatus): number => {
  if (status.is_completed) return 100;
  if (!status.completed_steps) return 0;
  
  const totalSteps = 5;
  const completedSteps = status.completed_steps.length;
  return Math.round((completedSteps / totalSteps) * 100);
};