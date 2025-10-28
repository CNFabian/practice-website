// src/services/authAPI.ts - UPDATED VERSION with utility integration
import { mapBackendUserToReduxUser, mapReduxUserToBackendUpdate } from '../utils/authUtils'
import type { BackendUserResponse } from '../utils/authUtils'
import type { SerializableUser } from '../store/slices/authSlice'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// ==================== TOKEN MANAGEMENT ====================

export const getAccessToken = (): string | null => {
  return localStorage.getItem('access_token');
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem('refresh_token');
};

export const setTokens = (accessToken: string, refreshToken: string): void => {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
};

export const clearAuthData = (): void => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  console.log('AuthAPI: All authentication data cleared');
};

export const isAuthenticated = (): boolean => {
  const token = getAccessToken();
  return !!token;
};

// ==================== REQUEST HELPERS ====================

const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  console.log('AuthAPI: Attempting to refresh access token...');

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh?refresh_token=${refreshToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const data = await response.json();
    setTokens(data.access_token, data.refresh_token);
    console.log('AuthAPI: Access token refreshed successfully');
    
    return data.access_token;
  } catch (error) {
    console.error('AuthAPI: Token refresh failed:', error);
    clearAuthData();
    
    // Redirect to login page
    window.location.href = '/auth/login';
    throw error;
  }
};

export const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  // Get auth token from your authentication system
  const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    console.error(`Request failed - Status: ${response.status}, URL: ${url}`);
    const errorText = await response.text();
    console.error(`Response: ${errorText}`);
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response;
};

export const fetchWithoutAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`AuthAPI: Request failed - Status: ${response.status}, URL: ${url}, Response: ${errorText}`);
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response;
};

// ==================== AUTHENTICATION API FUNCTIONS ====================

// Register new user
export const registerUser = async (userData: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  date_of_birth?: string;
}): Promise<void> => {
  console.log('AuthAPI: Starting user registration...');
  
  const response = await fetchWithoutAuth(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    body: JSON.stringify(userData),
  });

  const data = await response.json();
  
  // Store tokens automatically
  setTokens(data.access_token, data.refresh_token);
  console.log('AuthAPI: User registered and tokens stored successfully');
};

// Login user
export const loginUser = async (credentials: {
  email: string;
  password: string;
}): Promise<void> => {
  console.log('AuthAPI: Starting user login...');
  
  const response = await fetchWithoutAuth(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  const data = await response.json();
  
  // Store tokens automatically
  setTokens(data.access_token, data.refresh_token);
  console.log('AuthAPI: User logged in and tokens stored successfully');
};

// Get current user profile - UPDATED with utility mapping
export const getCurrentUser = async (): Promise<SerializableUser> => {
  console.log('AuthAPI: Fetching current user profile...');
  
  const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/me`);
  const backendUser: BackendUserResponse = await response.json();
  
  console.log('AuthAPI: Backend user data received:', backendUser);
  
  // Use utility function to convert backend format to Redux format
  const reduxUser = mapBackendUserToReduxUser(backendUser);
  console.log('AuthAPI: Converted to Redux format:', reduxUser);
  
  return reduxUser;
};

// Update user profile - UPDATED with utility mapping
export const updateUserProfile = async (updates: Partial<SerializableUser>): Promise<SerializableUser> => {
  console.log('AuthAPI: Updating user profile with:', updates);
  
  // Convert Redux format to backend format
  const backendUpdatePayload = mapReduxUserToBackendUpdate(updates);
  console.log('AuthAPI: Backend update payload:', backendUpdatePayload);
  
  const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/profile`, {
    method: 'PUT',
    body: JSON.stringify(backendUpdatePayload),
  });

  const backendUser: BackendUserResponse = await response.json();
  
  // Convert response back to Redux format
  const updatedReduxUser = mapBackendUserToReduxUser(backendUser);
  console.log('AuthAPI: Profile updated successfully:', updatedReduxUser);
  
  return updatedReduxUser;
};

// Logout user
export const logoutUser = async (): Promise<void> => {
  console.log('AuthAPI: Starting logout process...');
  
  try {
    // Call backend logout endpoint
    await fetchWithAuth(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
    });
    console.log('AuthAPI: Backend logout successful');
  } catch (error) {
    console.error('AuthAPI: Backend logout failed:', error);
    // Continue with local cleanup even if backend fails
  }
  
  // Always clear local authentication data
  clearAuthData();
  console.log('AuthAPI: Local logout completed');
};

// Password reset request
export const requestPasswordReset = async (email: string): Promise<void> => {
  console.log('AuthAPI: Requesting password reset for:', email);
  
  await fetchWithoutAuth(`${API_BASE_URL}/api/auth/password-reset`, {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
  
  console.log('AuthAPI: Password reset request sent successfully');
};

// Confirm password reset
export const confirmPasswordReset = async (token: string, newPassword: string): Promise<void> => {
  console.log('AuthAPI: Confirming password reset...');
  
  await fetchWithoutAuth(`${API_BASE_URL}/api/auth/password-reset/confirm`, {
    method: 'POST',
    body: JSON.stringify({
      token,
      new_password: newPassword,
    }),
  });
  
  console.log('AuthAPI: Password reset confirmed successfully');
};

// Verify email
export const verifyEmail = async (token: string): Promise<void> => {
  console.log('AuthAPI: Verifying email with token...');
  
  await fetchWithoutAuth(`${API_BASE_URL}/api/auth/verify-email`, {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
  
  console.log('AuthAPI: Email verified successfully');
};

// Resend email verification
export const resendEmailVerification = async (): Promise<void> => {
  console.log('AuthAPI: Resending email verification...');
  
  await fetchWithAuth(`${API_BASE_URL}/api/auth/resend-verification`, {
    method: 'POST',
  });
  
  console.log('AuthAPI: Email verification resent successfully');
};

export default {
  // Authentication
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  updateUserProfile,
  
  // Password management
  requestPasswordReset,
  confirmPasswordReset,
  
  // Email verification
  verifyEmail,
  resendEmailVerification,
  
  // Token management
  isAuthenticated,
  clearAuthData,
  
  // Request helpers
  fetchWithAuth,
  fetchWithoutAuth,
};