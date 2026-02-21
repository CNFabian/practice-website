import { useState, useCallback } from 'react';
import { 
  getFAQs, 
  getFAQCategories, 
  submitSupportTicket, 
  getUserTickets
} from '../services/helpAPI';
import type { FAQ, SupportTicket, SupportTicketRequest } from '../types/help.types';

export const useHelp = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [userTickets, setUserTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all FAQs
  const fetchFAQs = useCallback(async (params?: {
    category?: string;
    search?: string;
    limit?: number;
  }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getFAQs(params);
      setFaqs(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch FAQs';
      setError(errorMessage);
      console.error('Error fetching FAQs:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch FAQ categories
  const fetchCategories = useCallback(async () => {
    try {
      const data = await getFAQCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      // Set default categories on error
      setCategories(['General', 'Account', 'Technical', 'Billing']);
    }
  }, []);

  // Submit a support ticket
  const submitTicket = useCallback(async (ticketData: SupportTicketRequest) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await submitSupportTicket(ticketData);
      console.log('Support ticket submitted:', response);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit ticket';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch user's support tickets
  const fetchUserTickets = useCallback(async (params?: {
    status_filter?: string;
    limit?: number;
    offset?: number;
  }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getUserTickets(params);
      setUserTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tickets';
      setError(errorMessage);
      console.error('Error fetching user tickets:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Search FAQs
  const searchFAQs = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      await fetchFAQs();
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getFAQs({ search: searchTerm.trim(), limit: 50 });
      setFaqs(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      console.error('Error searching FAQs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFAQs]);

  // Filter FAQs by category
  const filterFAQsByCategory = useCallback(async (category: string) => {
    if (category === 'All' || !category) {
      await fetchFAQs();
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getFAQs({ category, limit: 50 });
      setFaqs(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Filter failed';
      setError(errorMessage);
      console.error('Error filtering FAQs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFAQs]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Reset all state
  const reset = useCallback(() => {
    setFaqs([]);
    setCategories([]);
    setUserTickets([]);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    // State
    faqs,
    categories,
    userTickets,
    isLoading,
    error,
    
    // Actions
    fetchFAQs,
    fetchCategories,
    submitTicket,
    fetchUserTickets,
    searchFAQs,
    filterFAQsByCategory,
    clearError,
    reset
  };
};

export default useHelp;