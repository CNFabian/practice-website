// ==================== CITIES API ====================
// Phase 1: Standardized to use shared fetchWithAuth from authAPI.ts

import { fetchWithAuth } from './authAPI';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
    console.log(`Found ${data.cities?.length || 0} cities for query: ${query}`);
    return data.cities || [];
  } catch (error) {
    console.error('Error searching cities:', error);
    throw error;
  }
};

/**
 * Format a city result for display
 * @param city - CityData object
 * @returns Formatted string like "Los Angeles, CA 90001"
 */
export const formatCityDisplay = (city: CityData): string => {
  return `${city.city}, ${city.state} ${city.zipcode}`;
};

/**
 * Format a city result for a shorter display
 * @param city - CityData object
 * @returns Formatted string like "Los Angeles, CA"
 */
export const formatCityShort = (city: CityData): string => {
  return `${city.city}, ${city.state}`;
};