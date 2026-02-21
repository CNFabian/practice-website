import { fetchWithAuth } from '../../../services/authAPI';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// ==================== TYPE DEFINITIONS ====================

export interface OnboardingStatus {
  completed: boolean;
  step?: number;
  total_steps?: number;
  data?: any;
}

export interface OnboardingData {
  id: string;
  user_id: string;
  has_realtor: string;
  has_loan_officer: string;
  wants_expert_contact: string;
  homeownership_timeline_months: number;
  target_cities: string[];
  completed_at: string;
  updated_at: string;
}

export interface Step1Data {
  has_realtor: string;
  has_loan_officer: string;
}

export interface Step2Data {
  wants_expert_contact: string;
}

export interface Step3Data {
  homeownership_timeline_months: number;
}

export interface Step4Data {
  target_cities: string[];
}

export interface CompleteOnboardingData {
  has_realtor: string;
  has_loan_officer: string;
  wants_expert_contact: string;
  homeownership_timeline_months: number;
  target_cities: string[];
}

export interface Avatar {
  id: string;
  name: string;
  image_url: string;
}

export interface ExpertContactOption {
  id: string;
  label: string;
}

export interface TimelineOption {
  months: number;
  label: string;
}

export interface ZipcodeValidation {
  pattern: string;
  description: string;
}

export interface OnboardingOptions {
  avatars: Avatar[];
  expert_contact_options: ExpertContactOption[];
  timeline_options: TimelineOption[];
  zipcode_validation: ZipcodeValidation;
}

// ==================== API FUNCTIONS ====================

// GET /api/onboarding/status - Get current onboarding status
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

// GET /api/onboarding/data - Get onboarding data for current user
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

// POST /api/onboarding/step1 - Complete step 1: Professionals
export const completeStep1 = async (data: Step1Data): Promise<{ success: boolean; message: string; data: any }> => {
  try {
    console.log('Completing step 1 with data:', data);
    
    const response = await fetchWithAuth(`${API_BASE_URL}/api/onboarding/step1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Step 1 completed successfully:', result);
    return result;
  } catch (error) {
    console.error('Error completing step 1:', error);
    throw error;
  }
};

// POST /api/onboarding/step2 - Complete step 2: Expert contact
export const completeStep2 = async (data: Step2Data): Promise<{ success: boolean; message: string; data: any }> => {
  try {
    console.log('Completing step 2 with data:', data);
    
    const response = await fetchWithAuth(`${API_BASE_URL}/api/onboarding/step2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Step 2 completed successfully:', result);
    return result;
  } catch (error) {
    console.error('Error completing step 2:', error);
    throw error;
  }
};

// POST /api/onboarding/step3 - Complete step 3: Timeline
export const completeStep3 = async (data: Step3Data): Promise<{ success: boolean; message: string; data: any }> => {
  try {
    console.log('Completing step 3 with data:', data);
    
    const response = await fetchWithAuth(`${API_BASE_URL}/api/onboarding/step3`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Step 3 completed successfully:', result);
    return result;
  } catch (error) {
    console.error('Error completing step 3:', error);
    throw error;
  }
};

// POST /api/onboarding/step4 - Complete step 4: Target cities
export const completeStep4 = async (data: Step4Data): Promise<{ success: boolean; message: string; data: any }> => {
  try {
    console.log('Completing step 4 with data:', data);
    
    const response = await fetchWithAuth(`${API_BASE_URL}/api/onboarding/step4`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Step 4 completed successfully:', result);
    return result;
  } catch (error) {
    console.error('Error completing step 4:', error);
    throw error;
  }
};

// POST /api/onboarding/complete - Complete all onboarding steps at once
export const completeOnboardingAllSteps = async (data: CompleteOnboardingData): Promise<{ success: boolean; message: string; data: any }> => {
  try {
    console.log('Completing all onboarding steps with data:', data);
    
    const response = await fetchWithAuth(`${API_BASE_URL}/api/onboarding/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('All onboarding steps completed successfully:', result);
    return result;
  } catch (error) {
    console.error('Error completing all onboarding steps:', error);
    throw error;
  }
};

// ==================== LOCAL STORAGE FUNCTIONS ====================

const ONBOARDING_STORAGE_KEY = 'onboarding_data';

export const getOnboardingDataFromLocalStorage = (): Partial<CompleteOnboardingData> => {
  try {
    const data = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error reading onboarding data from localStorage:', error);
    return {};
  }
};

export const saveOnboardingDataToLocalStorage = (data: Partial<CompleteOnboardingData>) => {
  try {
    const existing = getOnboardingDataFromLocalStorage();
    const updated = { ...existing, ...data };
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(updated));
    console.log('Saved onboarding data to localStorage:', updated);
  } catch (error) {
    console.error('Error saving onboarding data to localStorage:', error);
  }
};

export const clearOnboardingDataFromLocalStorage = () => {
  try {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    console.log('Cleared onboarding data from localStorage');
  } catch (error) {
    console.error('Error clearing onboarding data from localStorage:', error);
  }
};

// Step-specific localStorage functions
export const saveStep1ToLocalStorage = (data: Step1Data) => {
  saveOnboardingDataToLocalStorage(data);
  console.log('Saved step 1 to localStorage:', data);
};

export const saveStep2ToLocalStorage = (data: Step2Data) => {
  saveOnboardingDataToLocalStorage(data);
  console.log('Saved step 2 to localStorage:', data);
};

export const saveStep3ToLocalStorage = (data: Step3Data) => {
  saveOnboardingDataToLocalStorage(data);
  console.log('Saved step 3 to localStorage:', data);
};

export const saveStep4ToLocalStorage = (data: Step4Data) => {
  saveOnboardingDataToLocalStorage({ target_cities: [String(data.target_cities)] });
  console.log('Saved step 4 to localStorage:', data);
};

// Current step management
const CURRENT_STEP_KEY = 'onboarding_current_step';

export const getCurrentStepFromLocalStorage = (): number => {
  try {
    const step = localStorage.getItem(CURRENT_STEP_KEY);
    return step ? parseInt(step, 10) : 1;
  } catch (error) {
    console.error('Error reading current step from localStorage:', error);
    return 1;
  }
};

export const saveCurrentStepToLocalStorage = (step: number) => {
  try {
    localStorage.setItem(CURRENT_STEP_KEY, step.toString());
    console.log('Saved current step to localStorage:', step);
  } catch (error) {
    console.error('Error saving current step to localStorage:', error);
  }
};

// ==================== VALIDATION FUNCTIONS ====================

export const validateStep1Data = (data: Step1Data): boolean => {
  return !!(data.has_realtor && data.has_loan_officer);
};

export const validateStep2Data = (data: Step2Data): boolean => {
  return !!(data.wants_expert_contact && data.wants_expert_contact.trim().length > 0);
};

export const validateStep3Data = (data: Step3Data): boolean => {
  return typeof data.homeownership_timeline_months === 'number' && data.homeownership_timeline_months >= 0;
};

export const validateStep4Data = (data: Step4Data): boolean => {
  return typeof data.target_cities === 'number' && data.target_cities > 0;
};

export const validateCompleteOnboardingData = (data: CompleteOnboardingData): boolean => {
  return (
    validateStep1Data({ has_realtor: data.has_realtor, has_loan_officer: data.has_loan_officer }) &&
    validateStep2Data({ wants_expert_contact: data.wants_expert_contact }) &&
    validateStep3Data({ homeownership_timeline_months: data.homeownership_timeline_months }) &&
    data.target_cities.length > 0
  );
};

// ==================== UTILITY FUNCTIONS ====================

export const getNextOnboardingStep = (status: OnboardingStatus): number => {
  if (status.completed) {
    return 0;
  }
  
  return status.step || 1;
};

export const isStepCompleted = (status: OnboardingStatus, step: number): boolean => {
  if (status.completed) return true;
  
  return (status.step || 0) > step;
};

export const getOnboardingProgress = (status: OnboardingStatus): number => {
  if (status.completed) return 100;
  
  const currentStep = status.step || 0;
  const totalSteps = status.total_steps || 4;
  
  return Math.round((currentStep / totalSteps) * 100);
};