const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Get authentication token from localStorage
 */
const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

/**
 * Make authenticated fetch request
 */
const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getAuthToken();
  
  if (!token) {
    console.error('No authentication token found');
    throw new Error('No authentication token found');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  try {
    console.log(`Making request to: ${url}`);
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      console.error('Authentication failed - token may be expired');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/auth/login';
      throw new Error('Authentication failed - please log in again');
    }

    if (!response.ok) {
      const responseClone = response.clone();
      const errorText = await responseClone.text();
      console.error(`API Error - Status: ${response.status}, URL: ${url}, Response: ${errorText}`);
    }
    
    return response;
  } catch (error) {
    console.error(`Network error for ${url}:`, error);
    throw error;
  }
};

// ==================== TYPE DEFINITIONS ====================

export interface CityData {
  city: string;
  state: string;
  zipcode: string;
}

export interface CitySearchResponse {
  cities: CityData[];
}

// ==================== API FUNCTIONS ====================

/**
 * Search for US cities
 * 
 * @param query - City name to search (2-100 characters)
 * @returns List of matching cities with complete information
 * 
 * @example
 * const results = await searchCities("los");
 * // Returns: [
 * //   { city: "Los Angeles", state: "CA", zipcode: "90001" },
 * //   { city: "Los Banos", state: "CA", zipcode: "93635" }
 * // ]
 */
export const searchCities = async (query: string): Promise<CityData[]> => {
  try {
    // Validate query on frontend
    if (query.length < 2) {
      console.warn('Query too short, minimum 2 characters required');
      return [];
    }

    if (query.length > 100) {
      console.warn('Query too long, maximum 100 characters allowed');
      return [];
    }

    console.log(`Searching cities for query: ${query}`);
    
    const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/cities/search`, {
      method: 'POST',
      body: JSON.stringify({ query })
    });
    
    if (!response.ok) {
      // Handle specific error cases
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      
      if (response.status === 503) {
        throw new Error('City search service is temporarily unavailable. Please try again later.');
      }
      
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: CitySearchResponse = await response.json();
    console.log(`Found ${data.cities.length} cities for query: ${query}`);
    
    return data.cities;
  } catch (error) {
    console.error('Error searching cities:', error);
    
    // Re-throw with user-friendly message
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Failed to search cities. Please try again.');
  }
};

/**
 * Check health of cities API service
 * Useful for debugging and monitoring
 */
export const checkCitiesHealth = async (): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/cities/health`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Cities service health:', data);
    return data;
  } catch (error) {
    console.error('Error checking cities health:', error);
    throw error;
  }
};