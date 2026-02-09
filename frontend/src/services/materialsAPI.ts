import { fetchWithAuth } from './authAPI';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// GET /api/materials/resources - Get all material resources
export const getMaterialResources = async (resourceType?: string, category?: string): Promise<any> => {
  try {
    const queryParams = new URLSearchParams();
    if (resourceType) queryParams.append('resource_type', resourceType);
    if (category) queryParams.append('category', category);
    
    const url = `${API_BASE_URL}/api/materials/resources${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const response = await fetchWithAuth(url, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Material resources received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching material resources:', error);
    throw error;
  }
};

// GET /api/materials/resources/{resource_id} - Get specific resource
export const getMaterialResource = async (resourceId: string): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/materials/resources/${resourceId}`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching material resource:', error);
    throw error;
  }
};

// POST /api/materials/resources/{resource_id}/download - Track download
export const trackMaterialDownload = async (resourceId: string): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/materials/resources/${resourceId}/download`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error tracking material download:', error);
    throw error;
  }
};

// GET /api/materials/calculators - Get available calculators
export const getAvailableCalculators = async (): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/materials/calculators`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching calculators:', error);
    throw error;
  }
};

// POST /api/materials/calculators/calculate - Perform calculation
export const performCalculation = async (calculatorData: {
  calculator_type: string;
  input_data: Record<string, any>;
}): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/materials/calculators/calculate`, {
      method: 'POST',
      body: JSON.stringify(calculatorData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error performing calculation:', error);
    throw error;
  }
};

// GET /api/materials/categories - Get material categories
export const getMaterialCategories = async (): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/materials/categories`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching material categories:', error);
    throw error;
  }
};

// GET /api/materials/checklists - Get material checklists
export const getMaterialChecklists = async (): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/materials/checklists`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching material checklists:', error);
    throw error;
  }
};

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