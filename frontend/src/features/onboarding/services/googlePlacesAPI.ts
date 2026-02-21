// ==================== GOOGLE PLACES API ====================
// Frontend-direct Google Places API integration
// API key stored in .env as VITE_GOOGLE_PLACES_API_KEY
// Will be set as Amplify environment variable upon deployment

const GOOGLE_PLACES_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

// Google Places Autocomplete endpoint (New API)
const PLACES_AUTOCOMPLETE_URL = 'https://places.googleapis.com/v1/places:autocomplete';

// ==================== TYPE DEFINITIONS ====================

export interface PlacePrediction {
  placeId: string;
  city: string;
  state: string;       // 2-letter state abbreviation from secondary text
  fullText: string;     // e.g. "Long Beach, CA, USA"
  displayText: string;  // e.g. "Long Beach, CA"
}

interface GoogleAutocompletePrediction {
  placePrediction: {
    placeId: string;
    text: {
      text: string;
      matches?: Array<{ startOffset?: number; endOffset: number }>;
    };
    structuredFormat: {
      mainText: {
        text: string;
        matches?: Array<{ startOffset?: number; endOffset: number }>;
      };
      secondaryText: {
        text: string;
      };
    };
  };
}

interface GoogleAutocompleteResponse {
  suggestions?: GoogleAutocompletePrediction[];
}

// ==================== US STATE MAPPING ====================

const US_STATE_ABBREVIATIONS: Record<string, string> = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
  'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
  'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
  'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
  'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
  'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
  'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
  'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
  'Wisconsin': 'WI', 'Wyoming': 'WY', 'District of Columbia': 'DC',
};

/**
 * Extract 2-letter state abbreviation from Google Places secondary text.
 * Secondary text is typically "CA, USA" or "California, USA" or "NY, USA".
 */
const extractStateAbbreviation = (secondaryText: string): string => {
  // Split by comma and trim
  const parts = secondaryText.split(',').map(p => p.trim());
  
  if (parts.length === 0) return '';

  const statePart = parts[0];

  // If it's already a 2-letter abbreviation
  if (statePart.length === 2 && statePart === statePart.toUpperCase()) {
    return statePart;
  }

  // If it's a full state name, look it up
  if (US_STATE_ABBREVIATIONS[statePart]) {
    return US_STATE_ABBREVIATIONS[statePart];
  }

  // Fallback: return first part as-is
  return statePart;
};

// ==================== API FUNCTIONS ====================

/**
 * Search for US cities using Google Places Autocomplete (New) API.
 * Returns predictions with city name and 2-letter state abbreviation.
 * 
 * @param input - Search query string (e.g., "Long Beach")
 * @returns Array of PlacePrediction objects
 */
export const searchCities = async (input: string): Promise<PlacePrediction[]> => {
  if (!input || input.trim().length < 3) {
    return [];
  }

  if (!GOOGLE_PLACES_API_KEY) {
    console.error('Google Places API key is not configured. Set VITE_GOOGLE_PLACES_API_KEY in .env');
    throw new Error('Google Places API key not configured');
  }

  try {
    const response = await fetch(PLACES_AUTOCOMPLETE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
      },
      body: JSON.stringify({
        input: input.trim(),
        includedPrimaryTypes: ['(cities)'],
        includedRegionCodes: ['us'],
      }),
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Google Places API key is invalid or restricted.');
      }
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      throw new Error(`Google Places API error: ${response.status}`);
    }

    const data: GoogleAutocompleteResponse = await response.json();

    if (!data.suggestions || data.suggestions.length === 0) {
      return [];
    }

    // Map Google Places response to our format
    const predictions: PlacePrediction[] = data.suggestions
      .filter((suggestion) => suggestion.placePrediction)
      .map((suggestion) => {
        const prediction = suggestion.placePrediction;
        const city = prediction.structuredFormat.mainText.text;
        const state = extractStateAbbreviation(prediction.structuredFormat.secondaryText.text);

        return {
          placeId: prediction.placeId,
          city: city,
          state: state,
          fullText: prediction.text.text,
          displayText: `${city}, ${state}`,
        };
      });

    return predictions;
  } catch (error) {
    console.error('Error searching places:', error);
    throw error;
  }
};