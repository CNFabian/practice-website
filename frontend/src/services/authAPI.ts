import { mapBackendUserToReduxUser, mapReduxUserToBackendUpdate } from '../utils/authUtils'
import type { BackendUserResponse } from '../utils/authUtils'
import type { SerializableUser } from '../store/slices/authSlice'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
    
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/login')) {
      console.log('AuthAPI: Redirecting to login page');
      window.location.href = '/auth/login';
    }
    
    throw error;
  }
};

// Unified fetch with authentication and automatic token refresh
export const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getAccessToken();
  
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

    if (response.status === 401 || response.status === 403) {
      console.log('AuthAPI: Received 401/403, attempting token refresh...');
      
      try {
        const newToken = await refreshAccessToken();
        console.log('AuthAPI: Token refreshed, retrying request...');
        response = await makeRequest(newToken);
      } catch (_refreshError) {
        console.error('AuthAPI: Token refresh failed, cannot retry request');
        throw new Error('Authentication failed - please log in again');
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AuthAPI: Request failed - Status: ${response.status}, URL: ${url}, Response: ${errorText}`);
      
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.detail) {
          console.error('AuthAPI: Error details:', errorData.detail);
        }
      } catch (_parseError) {
        /* JSON parse failed */
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
    
    let errorDetail = '';
    try {
      const errorData = JSON.parse(errorText);
      if (errorData.detail) {
        console.error('AuthAPI: Error details:', errorData.detail);
        errorDetail = errorData.detail;
      }
    } catch (_parseError) {
      // Response wasn't JSON
    }
    
    const error = new Error(errorDetail || `HTTP error! status: ${response.status}`);
    (error as any).detail = errorDetail;
    (error as any).status = response.status;
    throw error;
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
    await fetchWithAuth(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
    });
    console.log('AuthAPI: Backend logout successful');
  } catch (error) {
    console.error('AuthAPI: Backend logout failed:', error);
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

// ==================== PASSWORD RESET CONFIRMATION ====================

// Confirm password reset with token and new password
// POST /api/auth/password-reset/confirm
// Body: { token: string, new_password: string }
// Response: { success: true, message: "Password reset successfully" }
// NOTE: Uses fetchWithoutAuth — user is not authenticated during password reset
export const confirmPasswordReset = async (
  token: string,
  newPassword: string
): Promise<void> => {
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

// ==================== PRE-REGISTRATION EMAIL VERIFICATION ====================

// Send a 6-digit verification code to email (before sign-up)
// POST /api/auth/send-verification-code
// Body: { email: string }
// Response: { success: true, message: "Verification code sent" }
// NOTE: Uses fetchWithoutAuth — user is not yet registered
export const sendVerificationCode = async (email: string): Promise<void> => {
  console.log('AuthAPI: Sending verification code to email...');

  await fetchWithoutAuth(`${API_BASE_URL}/api/auth/send-verification-code`, {
    method: 'POST',
    body: JSON.stringify({ email }),
  });

  console.log('AuthAPI: Verification code sent successfully');
};

// Verify the 6-digit code for an email (before sign-up)
// POST /api/auth/verify-email-code
// Body: { email: string, code: string }
// Response: { success: true, message: "Email verified" }
// NOTE: Uses fetchWithoutAuth — user is not yet registered
// NOTE: Must call register within a short window after verification
export const verifyEmailCode = async (email: string, code: string): Promise<void> => {
  console.log('AuthAPI: Verifying email code...');

  await fetchWithoutAuth(`${API_BASE_URL}/api/auth/verify-email-code`, {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });

  console.log('AuthAPI: Email code verified successfully');
};

// Resend a 6-digit verification code (before sign-up)
// POST /api/auth/resend-verification-code
// Body: { email: string }
// Response: { success: true, message: "Verification code resent" }
// NOTE: Uses fetchWithoutAuth — user is not yet registered
export const resendVerificationCode = async (email: string): Promise<void> => {
  console.log('AuthAPI: Resending verification code...');

  await fetchWithoutAuth(`${API_BASE_URL}/api/auth/resend-verification-code`, {
    method: 'POST',
    body: JSON.stringify({ email }),
  });

  console.log('AuthAPI: Verification code resent successfully');
};

// ==================== EMAIL VERIFICATION ====================

// Verify email with token
// POST /api/auth/verify-email?token=<token>
// NOTE: Backend expects `token` as a QUERY PARAMETER, not in the body
// Response: { success: true, message: "Email verified successfully" }
// NOTE: Uses fetchWithoutAuth — user may click verification link while logged out
export const verifyEmail = async (token: string): Promise<void> => {
  console.log('AuthAPI: Verifying email with token...');

  await fetchWithoutAuth(
    `${API_BASE_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`,
    {
      method: 'POST',
    }
  );

  console.log('AuthAPI: Email verified successfully');
};

// ==================== RESEND VERIFICATION EMAIL ====================

// Resend email verification
// POST /api/auth/resend-verification
// No body required
// Response: { success: true, message: "Verification email sent" }
// NOTE: Uses fetchWithAuth — user must be logged in to request resend
export const resendVerificationEmail = async (): Promise<void> => {
  console.log('AuthAPI: Resending verification email...');

  await fetchWithAuth(`${API_BASE_URL}/api/auth/resend-verification`, {
    method: 'POST',
  });

  console.log('AuthAPI: Verification email resent successfully');
};

// ==================== WIPE USER DATA (TEMPORARY - BETA TESTING) ====================

// Wipe all user progress and activity data while preserving the account
// POST /api/auth/wipe-data
// Response: { success: true, message: "All user data has been wiped successfully..." }
// NOTE: Uses fetchWithAuth — user must be authenticated
export const wipeUserData = async (): Promise<void> => {
  console.log('AuthAPI: Wiping all user data...');

  await fetchWithAuth(`${API_BASE_URL}/api/auth/wipe-data`, {
    method: 'POST',
  });

  console.log('AuthAPI: User data wiped successfully');
};

// ==================== AUTHENTICATION STATUS CHECKS ====================

// Check if user is authenticated (for route protection)
export const checkAuthStatus = async (): Promise<SerializableUser | null> => {
  try {
    const token = getAccessToken();
    if (!token) {
      console.log('AuthAPI: No token found - user not authenticated');
      return null;
    }
    const userData = await getCurrentUser();
    console.log('AuthAPI: Token validated - user is authenticated');
    return userData;
  } catch (error) {
    console.error('AuthAPI: Authentication check failed:', error);
    clearAuthData();
    return null;
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
  forceLogout,
  confirmPasswordReset,
  verifyEmail,
  resendVerificationEmail,
  wipeUserData,
  sendVerificationCode,
  verifyEmailCode,
  resendVerificationCode,
};