const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

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
      window.location.href = '/login';
      throw new Error('Authentication failed - please log in again');
    }

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
    console.log('Fetching help resources');
    
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
    console.log('Fetching quick help topics');
    
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
    console.log('Fetching contact information');
    
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
    console.log('Fetching system status');
    
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
    console.log('Fetching feedback form structure');
    
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

// ==================== ADDITIONAL HELP ENDPOINTS ====================

// POST /api/help/feedback - Submit feedback (if endpoint exists for form submission)
export const submitFeedback = async (feedbackData: {
  category: string;
  message: string;
  rating?: number;
  email?: string;
  [key: string]: any;
}): Promise<any> => {
  try {
    console.log('Submitting feedback:', feedbackData);
    
    const response = await fetchWithAuth(`${API_BASE_URL}/api/help/feedback`, {
      method: 'POST',
      body: JSON.stringify(feedbackData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Feedback submitted successfully:', data);
    return data;
  } catch (error) {
    console.error('Error submitting feedback:', error);
    throw error;
  }
};

// PUT /api/help/tickets/{ticket_id} - Update support ticket (if endpoint exists)
export const updateTicket = async (ticketId: string, updateData: {
  status?: string;
  priority?: string;
  message?: string;
}): Promise<any> => {
  try {
    console.log(`Updating ticket ${ticketId}:`, updateData);
    
    const response = await fetchWithAuth(`${API_BASE_URL}/api/help/tickets/${ticketId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Ticket updated successfully:', data);
    return data;
  } catch (error) {
    console.error('Error updating ticket:', error);
    throw error;
  }
};

// POST /api/help/faqs/{faq_id}/helpful - Mark FAQ as helpful (if endpoint exists)
export const markFAQHelpful = async (faqId: string, isHelpful: boolean): Promise<any> => {
  try {
    console.log(`Marking FAQ ${faqId} as ${isHelpful ? 'helpful' : 'not helpful'}`);
    
    const response = await fetchWithAuth(`${API_BASE_URL}/api/help/faqs/${faqId}/helpful`, {
      method: 'POST',
      body: JSON.stringify({ helpful: isHelpful })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('FAQ feedback submitted:', data);
    return data;
  } catch (error) {
    console.error('Error submitting FAQ feedback:', error);
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

// Helper function to get FAQs by category
export const getFAQsByCategory = async (category: string, limit?: number): Promise<any[]> => {
  try {
    const faqs = await getFAQs({ category, limit });
    console.log(`FAQs for category ${category}:`, faqs);
    return faqs || [];
  } catch (error) {
    console.error(`Error getting FAQs for category ${category}:`, error);
    return [];
  }
};

// Helper function to get pending tickets count
export const getPendingTicketsCount = async (): Promise<number> => {
  try {
    const tickets = await getUserTickets({ status_filter: 'pending' });
    const count = Array.isArray(tickets) ? tickets.length : 0;
    console.log(`User has ${count} pending tickets`);
    return count;
  } catch (error) {
    console.error('Error getting pending tickets count:', error);
    return 0;
  }
};

// Helper function to format support ticket data
export const formatSupportTicketData = (formData: {
  name: string;
  email: string;
  subject: string;
  message: string;
  category: string;
  priority?: string;
}): {
  name: string;
  email: string;
  subject: string;
  message: string;
  category: string;
} => {
  return {
    name: formData.name.trim(),
    email: formData.email.trim().toLowerCase(),
    subject: formData.subject.trim(),
    message: formData.message.trim(),
    category: formData.category
  };
};

// Helper function to validate support ticket data
export const validateSupportTicketData = (ticketData: {
  name: string;
  email: string;
  subject: string;
  message: string;
  category: string;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!ticketData.name || ticketData.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }
  
  if (!ticketData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ticketData.email)) {
    errors.push('Please provide a valid email address');
  }
  
  if (!ticketData.subject || ticketData.subject.trim().length < 5) {
    errors.push('Subject must be at least 5 characters long');
  }
  
  if (!ticketData.message || ticketData.message.trim().length < 10) {
    errors.push('Message must be at least 10 characters long');
  }
  
  if (!ticketData.category) {
    errors.push('Please select a category');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Helper function to get system status summary
export const getSystemStatusSummary = async (): Promise<{
  overall: string;
  incidents: number;
  maintenance: number;
}> => {
  try {
    const status = await getSystemStatus();
    
    return {
      overall: status?.overall_status || 'unknown',
      incidents: Array.isArray(status?.incidents) ? status.incidents.length : 0,
      maintenance: Array.isArray(status?.maintenance) ? status.maintenance.length : 0
    };
  } catch (error) {
    console.error('Error getting system status summary:', error);
    return {
      overall: 'unknown',
      incidents: 0,
      maintenance: 0
    };
  }
};

// ==================== EXPORT ALL FUNCTIONS ====================

export default {
  // FAQ functions
  getFAQs,
  getFAQ,
  getFAQCategories,
  searchFAQs,
  getFAQsByCategory,
  markFAQHelpful,
  
  // Support ticket functions
  submitSupportTicket,
  getUserTickets,
  getTicket,
  updateTicket,
  getPendingTicketsCount,
  formatSupportTicketData,
  validateSupportTicketData,
  
  // Help resource functions
  getHelpResources,
  getQuickHelp,
  getContactInfo,
  getSystemStatus,
  getSystemStatusSummary,
  getFeedbackForm,
  submitFeedback,
  
  // Helper functions
  getAvailableHelpCategories
};