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

// ==================== ONBOARDING STEP API FUNCTIONS ====================

// POST /api/onboarding/step1 - Complete step 1: Avatar selection
export const completeStep1 = async (stepData: Step1Data): Promise<ApiResponse> => {
  try {
    console.log('Completing onboarding step 1:', stepData);
    
    const response = await fetchWithAuth(`${API_BASE_URL}/api/onboarding/step1`, {
      method: 'POST',
      body: JSON.stringify(stepData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: ApiResponse = await response.json();
    console.log('Onboarding step 1 completed:', data);
    return data;
  } catch (error) {
    console.error('Error completing onboarding step 1:', error);
    throw error;
  }
};

// POST /api/onboarding/step2 - Complete step 2: Realtor and loan officer status
export const completeStep2 = async (stepData: Step2Data): Promise<ApiResponse> => {
  try {
    console.log('Completing onboarding step 2:', stepData);
    
    const response = await fetchWithAuth(`${API_BASE_URL}/api/onboarding/step2`, {
      method: 'POST',
      body: JSON.stringify(stepData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: ApiResponse = await response.json();
    console.log('Onboarding step 2 completed:', data);
    return data;
  } catch (error) {
    console.error('Error completing onboarding step 2:', error);
    throw error;
  }
};

// POST /api/onboarding/step3 - Complete step 3: Expert contact preference
export const completeStep3 = async (stepData: Step3Data): Promise<ApiResponse> => {
  try {
    console.log('Completing onboarding step 3:', stepData);
    
    const response = await fetchWithAuth(`${API_BASE_URL}/api/onboarding/step3`, {
      method: 'POST',
      body: JSON.stringify(stepData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: ApiResponse = await response.json();
    console.log('Onboarding step 3 completed:', data);
    return data;
  } catch (error) {
    console.error('Error completing onboarding step 3:', error);
    throw error;
  }
};

// POST /api/onboarding/step4 - Complete step 4: Homeownership timeline
export const completeStep4 = async (stepData: Step4Data): Promise<ApiResponse> => {
  try {
    console.log('Completing onboarding step 4:', stepData);
    
    const response = await fetchWithAuth(`${API_BASE_URL}/api/onboarding/step4`, {
      method: 'POST',
      body: JSON.stringify(stepData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: ApiResponse = await response.json();
    console.log('Onboarding step 4 completed:', data);
    return data;
  } catch (error) {
    console.error('Error completing onboarding step 4:', error);
    throw error;
  }
};

// POST /api/onboarding/step5 - Complete step 5: Future home location (zipcode)
export const completeStep5 = async (stepData: Step5Data): Promise<ApiResponse> => {
  try {
    console.log('Completing onboarding step 5:', stepData);
    
    const response = await fetchWithAuth(`${API_BASE_URL}/api/onboarding/step5`, {
      method: 'POST',
      body: JSON.stringify(stepData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: ApiResponse = await response.json();
    console.log('Onboarding step 5 completed:', data);
    return data;
  } catch (error) {
    console.error('Error completing onboarding step 5:', error);
    throw error;
  }
};

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

// ==================== UTILITY FUNCTIONS ====================

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