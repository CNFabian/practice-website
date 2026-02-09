import { fetchWithAuth } from './authAPI';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

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
    return data;
  } catch (error) {
    console.error('Error fetching FAQ:', error);
    throw error;
  }
};

// POST /api/help/faqs/{faq_id}/helpful - Mark FAQ as helpful
export const markFAQHelpful = async (faqId: string): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/help/faqs/${faqId}/helpful`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error marking FAQ as helpful:', error);
    throw error;
  }
};

// GET /api/help/faqs/categories - Get FAQ categories
export const getFAQCategories = async (): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/help/faqs/categories`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching FAQ categories:', error);
    throw error;
  }
};

// ==================== SUPPORT TICKET API FUNCTIONS ====================

// POST /api/help/tickets - Submit support ticket
 export const submitSupportTicket = async (ticketData: {
  name: string;
  email: string;
  subject: string;
  message: string;
  category?: string;
   }): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/help/tickets`, {
      method: 'POST',
      body: JSON.stringify(ticketData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error submitting support ticket:', error);
    throw error;
  }
};

// GET /api/help/tickets/my-tickets - Get user's support tickets
export const getUserTickets = async (params?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<any> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const url = `${API_BASE_URL}/api/help/tickets/my-tickets${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const response = await fetchWithAuth(url, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    throw error;
  }
};

// GET /api/help/tickets/{ticket_id} - Get specific ticket
export const getTicket = async (ticketId: string): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/help/tickets/${ticketId}`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching ticket:', error);
    throw error;
  }
};

// ==================== RESOURCE & UTILITY API FUNCTIONS ====================

// GET /api/help/resources - Get help resources
export const getHelpResources = async (): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/help/resources`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching help resources:', error);
    throw error;
  }
};

// GET /api/help/quick-help - Get quick help
export const getQuickHelp = async (): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/help/quick-help`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching quick help:', error);
    throw error;
  }
};

// GET /api/help/contact - Get contact info
export const getContactInfo = async (): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/help/contact`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching contact info:', error);
    throw error;
  }
};

// GET /api/help/system-status - Get system status
export const getSystemStatus = async (): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/help/system-status`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching system status:', error);
    throw error;
  }
};

// GET /api/help/feedback - Get feedback form
export const getFeedbackForm = async (): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/help/feedback`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching feedback form:', error);
    throw error;
  }
};

// POST /api/help/feedback - Submit feedback
export const submitFeedback = async (feedbackData: {
  rating?: number;
  feedback_type?: string;
  category?: string;
  message: string;
  email?: string;
  page_url?: string;
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