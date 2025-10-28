// src/services/authAPI.ts - PRODUCTION-READY UNIFIED VERSION
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
  console.log('AuthAPI: Tokens stored successfully');
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

// Refresh access token using refresh token
const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    console.error('AuthAPI: No refresh token available');
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
      const errorText = await response.text();
      console.error('AuthAPI: Token refresh failed:', response.status, errorText);
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.access_token || !data.refresh_token) {
      throw new Error('Invalid token refresh response');
    }
    
    setTokens(data.access_token, data.refresh_token);
    console.log('AuthAPI: Access token refreshed successfully');
    
    return data.access_token;
  } catch (error) {
    console.error('AuthAPI: Token refresh failed:', error);
    clearAuthData();
    
    // Only redirect if we're in the browser and not already on login page
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/login')) {
      console.log('AuthAPI: Redirecting to login page');
      window.location.href = '/auth/login';
    }
    
    throw error;
  }
};

// Unified fetch with authentication and automatic token refresh
export const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  let token = getAccessToken();
  
  if (!token) {
    console.error('AuthAPI: No authentication token found');
    throw new Error('No authentication token found');
  }

  const makeRequest = async (authToken: string): Promise<Response> => {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    return response;
  };

  try {
    console.log(`AuthAPI: Making request to: ${url}`);
    let response = await makeRequest(token);

    // If we get 401/403, try to refresh the token once
    if (response.status === 401 || response.status === 403) {
      console.log('AuthAPI: Received 401/403, attempting token refresh...');
      
      try {
        const newToken = await refreshAccessToken();
        console.log('AuthAPI: Token refreshed, retrying request...');
        response = await makeRequest(newToken);
      } catch (refreshError) {
        console.error('AuthAPI: Token refresh failed, cannot retry request');
        throw new Error('Authentication failed - please log in again');
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AuthAPI: Request failed - Status: ${response.status}, URL: ${url}, Response: ${errorText}`);
      
      // Parse error details if available
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.detail) {
          console.error('AuthAPI: Error details:', errorData.detail);
        }
      } catch (parseError) {
        // Ignore JSON parse errors
      }
      
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log(`AuthAPI: Request successful - Status: ${response.status}, URL: ${url}`);
    return response;
  } catch (error) {
    console.error(`AuthAPI: Network error for ${url}:`, error);
    throw error;
  }
};

// Fetch without authentication (for login, register, etc.)
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
    
    // Try to parse and provide more detailed error information
    try {
      const errorData = JSON.parse(errorText);
      if (errorData.detail) {
        console.error('AuthAPI: Error details:', errorData.detail);
        throw new Error(`Request failed: ${errorData.detail}`);
      }
    } catch (parseError) {
      // If we can't parse the error, throw a generic one
    }
    
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
  
  // Validate response structure
  if (!data.access_token || !data.refresh_token) {
    throw new Error('Invalid registration response - missing tokens');
  }
  
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
  
  // Validate response structure
  if (!data.access_token || !data.refresh_token) {
    throw new Error('Invalid login response - missing tokens');
  }
  
  // Store tokens automatically
  setTokens(data.access_token, data.refresh_token);
  console.log('AuthAPI: User logged in and tokens stored successfully');
};

// Get current user profile
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

// Update user profile
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

// ==================== AUTHENTICATION STATUS CHECKS ====================

// Check if user is authenticated (for route protection)
export const checkAuthStatus = async (): Promise<boolean> => {
  try {
    const token = getAccessToken();
    
    if (!token) {
      console.log('AuthAPI: No token found - user not authenticated');
      return false;
    }

    // Validate token by making a request to /me endpoint
    await getCurrentUser();
    console.log('AuthAPI: Token validated - user is authenticated');
    return true;
  } catch (error) {
    console.error('AuthAPI: Authentication check failed:', error);
    clearAuthData(); // Clear invalid tokens
    return false;
  }
};

// Force logout (for use when authentication fails)
export const forceLogout = (): void => {
  console.log('AuthAPI: Force logout initiated');
  clearAuthData();
  
  if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/login')) {
    window.location.href = '/auth/login';
  }
};

// ==================== EXPORTS ====================

export default {
  registerUser,
  loginUser,
  getCurrentUser,
  updateUserProfile,
  logoutUser,
  requestPasswordReset,
  checkAuthStatus,
  isAuthenticated,
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearAuthData,
  fetchWithAuth,
  fetchWithoutAuth,
  forceLogout
};