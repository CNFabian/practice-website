// Help & Support API Service Functions
// Backend integration for help, FAQ, and support ticket functionality

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Authentication helper function (reuse from existing services)
const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

// Fetch with authentication helper
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

    // Handle authentication errors
    if (response.status === 401) {
      console.error('Authentication failed - token may be expired');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
      throw new Error('Authentication failed - please log in again');
    }

    // Handle other error statuses
    if (!response.ok) {
      const responseClone = response.clone();
      const errorText = await responseClone.text();
      console.error(`API Error - Status: ${response.status}, URL: ${url}, Response: ${errorText}`);
      
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.detail) {
          console.error('Validation errors:', errorData.detail);
        }
      } catch (parseError) {
        console.error('Could not parse error response as JSON');
      }
    }
    
    return response;
  } catch (error) {
    console.error(`Network error for ${url}:`, error);
    throw error;
  }
};

// ==================== FAQ API FUNCTIONS ====================

// GET /api/help/faqs - Get frequently asked questions
export const getFAQs = async (params?: {
  category?: string;
  search?: string;
  limit?: number;
}): Promise<any> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const url = `${API_BASE_URL}/api/help/faqs${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const response = await fetchWithAuth(url, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('FAQs data received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    throw error;
  }
};

// GET /api/help/faqs/{faq_id} - Get specific FAQ by ID
export const getFAQ = async (faqId: string): Promise<any> => {
  try {
    console.log(`Fetching FAQ with ID: ${faqId}`);
    
    const response = await fetchWithAuth(`${API_BASE_URL}/api/help/faqs/${faqId}`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('FAQ data received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching FAQ:', error);
    throw error;
  }
};

// GET /api/help/faq-categories - Get available FAQ categories
export const getFAQCategories = async (): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/help/faq-categories`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('FAQ categories received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching FAQ categories:', error);
    throw error;
  }
};

// ==================== SUPPORT TICKET API FUNCTIONS ====================

// POST /api/help/contact - Submit support ticket
export const submitSupportTicket = async (ticketData: {
  name: string;
  email: string;
  subject: string;
  message: string;
  category: string;
}): Promise<any> => {
  try {
    console.log('Submitting support ticket:', ticketData);
    
    const response = await fetchWithAuth(`${API_BASE_URL}/api/help/contact`, {
      method: 'POST',
      body: JSON.stringify(ticketData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Support ticket created:', data);
    return data;
  } catch (error) {
    console.error('Error submitting support ticket:', error);
    throw error;
  }
};

// GET /api/help/my-tickets - Get user's support tickets
export const getUserTickets = async (params?: {
  status_filter?: string;
  limit?: number;
  offset?: number;
}): Promise<any> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.status_filter) queryParams.append('status_filter', params.status_filter);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const url = `${API_BASE_URL}/api/help/my-tickets${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const response = await fetchWithAuth(url, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('User tickets received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    throw error;
  }
};

// GET /api/help/tickets/{ticket_id} - Get specific support ticket
export const getTicket = async (ticketId: string): Promise<any> => {
  try {
    console.log(`Fetching ticket with ID: ${ticketId}`);
    
    const response = await fetchWithAuth(`${API_BASE_URL}/api/help/tickets/${ticketId}`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Ticket data received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching ticket:', error);
    throw error;
  }
};

// ==================== HELP RESOURCES API FUNCTIONS ====================

// GET /api/help/resources - Get help resources and guides
export const getHelpResources = async (): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/help/resources`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Help resources received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching help resources:', error);
    throw error;
  }
};

// GET /api/help/quick-help - Get quick help topics and solutions
export const getQuickHelp = async (): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/help/quick-help`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Quick help received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching quick help:', error);
    throw error;
  }
};

// GET /api/help/contact-info - Get contact information and support hours
export const getContactInfo = async (): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/help/contact-info`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Contact info received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching contact info:', error);
    throw error;
  }
};

// GET /api/help/system-status - Get current system status and known issues
export const getSystemStatus = async (): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/help/system-status`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('System status received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching system status:', error);
    throw error;
  }
};

// GET /api/help/feedback-form - Get feedback form structure
export const getFeedbackForm = async (): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/help/feedback-form`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Feedback form structure received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching feedback form:', error);
    throw error;
  }
};

// ==================== HELPER FUNCTIONS ====================

// Helper function to get available help categories
export const getAvailableHelpCategories = async (): Promise<any[]> => {
  try {
    const categories = await getFAQCategories();
    console.log('Available help categories:', categories);
    return categories || [];
  } catch (error) {
    console.error('Error getting available help categories:', error);
    return [];
  }
};

// Helper function to search FAQs across all categories
export const searchFAQs = async (searchTerm: string, limit?: number): Promise<any[]> => {
  try {
    const faqs = await getFAQs({ search: searchTerm, limit });
    console.log('FAQ search results:', faqs);
    return faqs || [];
  } catch (error) {
    console.error('Error searching FAQs:', error);
    return [];
  }
};