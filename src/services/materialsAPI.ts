const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const getHeaders = (): HeadersInit => {
  const token = localStorage.getItem('access_token');
  
  if (!token) {
    console.warn('No authentication token found in localStorage.');
    throw new Error('No authentication token found');
  }
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// Helper function to refresh token
const refreshAccessToken = async (): Promise<boolean> => {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) {
    console.error('No refresh token available');
    return false;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh?refresh_token=${refreshToken}`, {
      method: 'POST'
    });
    
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      console.log('Token refreshed successfully');
      return true;
    } else {
      console.error('Token refresh failed:', response.status);
      return false;
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    return false;
  }
};

// Enhanced fetch with automatic token refresh
const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  try {
    console.log(`Making request to: ${url}`);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getHeaders(),
        ...options.headers
      }
    });
    
    console.log(`Response status: ${response.status} for ${url}`);
    
    // Handle unauthorized
    if (response.status === 401) {
      console.log('Received 401, attempting token refresh...');
      const refreshed = await refreshAccessToken();
      
      if (refreshed) {
        const retryResponse = await fetch(url, {
          ...options,
          headers: {
            ...getHeaders(),
            ...options.headers
          }
        });
        console.log(`Retry response status: ${retryResponse.status} for ${url}`);
        return retryResponse;
      } else {
        console.error('Token refresh failed. User needs to re-authenticate.');
        throw new Error('Authentication failed - please log in again');
      }
    }
    
    return response;
  } catch (error) {
    console.error(`Network error for ${url}:`, error);
    throw error;
  }
};

// GET /api/materials/resources - Get all material resources
export const getMaterialResources = async (resourceType?: string, category?: string): Promise<any> => {
  try {
    let url = `${API_BASE_URL}/api/materials/resources`;
    const params = new URLSearchParams();
    
    if (resourceType) {
      params.append('resource_type', resourceType);
    }
    if (category) {
      params.append('category', category);
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    console.log(`Fetching material resources from: ${url}`);
    
    const response = await fetchWithAuth(url, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Material resources data received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching material resources:', error);
    throw error;
  }
};

// GET /api/materials/resources/{resource_id} - Get specific material resource
export const getMaterialResource = async (resourceId: string): Promise<any> => {
  try {
    console.log(`Fetching material resource with ID: ${resourceId}`);
    
    const response = await fetchWithAuth(`${API_BASE_URL}/api/materials/resources/${resourceId}`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Material resource data received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching material resource:', error);
    throw error;
  }
};

// POST /api/materials/resources/{resource_id}/download - Track material download
export const trackMaterialDownload = async (resourceId: string): Promise<any> => {
  try {
    console.log(`Tracking download for material resource ID: ${resourceId}`);
    
    const response = await fetchWithAuth(`${API_BASE_URL}/api/materials/resources/${resourceId}/download`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Download tracking response:', data);
    return data;
  } catch (error) {
    console.error('Error tracking material download:', error);
    throw error;
  }
};

// GET /api/materials/calculators - Get available calculators
export const getAvailableCalculators = async (): Promise<any> => {
  try {
    console.log('Fetching available calculators');
    
    const response = await fetchWithAuth(`${API_BASE_URL}/api/materials/calculators`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Available calculators data received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching available calculators:', error);
    throw error;
  }
};

// POST /api/materials/calculators/calculate - Perform calculation
export const performCalculation = async (calculatorType: string, inputData: any): Promise<any> => {
  try {
    console.log(`Performing calculation with type: ${calculatorType}`, inputData);
    
    const response = await fetchWithAuth(`${API_BASE_URL}/api/materials/calculators/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        calculator_type: calculatorType,
        input_data: inputData
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Calculation result:', data);
    return data;
  } catch (error) {
    console.error('Error performing calculation:', error);
    throw error;
  }
};

// GET /api/materials/categories - Get material categories
export const getMaterialCategories = async (): Promise<any> => {
  try {
    console.log('Fetching material categories');
    
    const response = await fetchWithAuth(`${API_BASE_URL}/api/materials/categories`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Material categories data received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching material categories:', error);
    throw error;
  }
};

// GET /api/materials/checklists - Get all available checklists
export const getMaterialChecklists = async (): Promise<any> => {
  try {
    console.log('Fetching material checklists');
    
    const response = await fetchWithAuth(`${API_BASE_URL}/api/materials/checklists`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Material checklists data received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching material checklists:', error);
    throw error;
  }
};

// Helper function to convert backend material resource to frontend format
export const convertBackendResourceToFrontend = (backendResource: any) => {
  return {
    id: backendResource.id,
    title: backendResource.title,
    description: backendResource.description,
    resourceType: backendResource.resource_type,
    fileUrl: backendResource.file_url,
    externalUrl: backendResource.external_url,
    thumbnailUrl: backendResource.thumbnail_url,
    category: backendResource.category,
    tags: backendResource.tags || [],
    downloadCount: backendResource.download_count || 0,
    orderIndex: backendResource.order_index || 0,
    createdAt: backendResource.created_at
  };
};

// Helper function to get materials by type
export const getMaterialsByType = async (type: 'calculators' | 'worksheets' | 'checklists'): Promise<any[]> => {
  try {
    let data;
    
    switch (type) {
      case 'calculators':
        data = await getAvailableCalculators();
        break;
      case 'checklists':
        data = await getMaterialChecklists();
        break;
      case 'worksheets':
        data = await getMaterialResources('worksheet');
        break;
      default:
        data = await getMaterialResources();
    }
    
    if (Array.isArray(data)) {
      return data.map(convertBackendResourceToFrontend);
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching materials by type ${type}:`, error);
    throw error;
  }
};