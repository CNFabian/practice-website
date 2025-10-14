import React, { useState, useEffect } from 'react';
import { RobotoFont } from '../../../../assets';
import { getFAQs, getFAQCategories, searchFAQs } from '../../../../services/helpAPI';
import type { FAQ } from '../../../../types/help.types';

const FAQSection: React.FC = () => {
  // Backend integration state
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoadingFAQs, setIsLoadingFAQs] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [faqError, setFaqError] = useState<string | null>(null);
  
  // UI state
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch categories and FAQs when component mounts
  useEffect(() => {
    fetchCategories();
    fetchFAQs();
  }, []);

  // Handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        handleSearch();
      } else {
        fetchFAQs();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Handle category filter
  useEffect(() => {
    if (selectedCategory && selectedCategory !== 'All') {
      fetchFAQsByCategory(selectedCategory);
    } else {
      fetchFAQs();
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    setIsLoadingCategories(true);
    try {
      console.log('Fetching FAQ categories...');
      const categoriesData = await getFAQCategories();
      console.log('FAQ categories received:', categoriesData);
      
      // Handle different possible response formats
      if (Array.isArray(categoriesData)) {
        setCategories(['All', ...categoriesData]);
      } else if (typeof categoriesData === 'string') {
        try {
          const parsed = JSON.parse(categoriesData);
          setCategories(['All', ...(Array.isArray(parsed) ? parsed : [])]);
        } catch {
          // Fallback categories
          setCategories(['All', 'General', 'Account', 'Technical', 'Billing']);
        }
      } else {
        // Fallback categories
        setCategories(['All', 'General', 'Account', 'Technical', 'Billing']);
      }
    } catch (error) {
      console.error('Error fetching FAQ categories:', error);
      setCategories(['All', 'General', 'Account', 'Technical', 'Billing']);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const fetchFAQs = async () => {
    setIsLoadingFAQs(true);
    setFaqError(null);
    
    try {
      console.log('Fetching FAQs...');
      const faqsData = await getFAQs({ limit: 50 });
      console.log('FAQs received:', faqsData);
      
      if (Array.isArray(faqsData)) {
        setFaqs(faqsData);
      } else {
        console.warn('Invalid FAQ data format:', faqsData);
        setFaqs([]);
        setFaqError('Invalid FAQ data format received from server');
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      setFaqError('Failed to load FAQs. Please try again later.');
      
      // Fallback to sample FAQs for better user experience
      setFaqs([
        {
          id: '1',
          question: 'How do I get started with the platform?',
          answer: 'Getting started is easy! Simply complete your profile, browse our learning modules, and begin your homebuying journey.',
          category: 'General',
          order_index: 1,
          view_count: 0
        },
        {
          id: '2',
          question: 'How do I reset my password?',
          answer: 'You can reset your password by clicking the "Forgot Password" link on the login page and following the instructions sent to your email.',
          category: 'Account',
          order_index: 2,
          view_count: 0
        },
        {
          id: '3',
          question: 'What if I encounter technical issues?',
          answer: 'If you experience technical difficulties, please contact our support team through the contact form or check our system status page.',
          category: 'Technical',
          order_index: 3,
          view_count: 0
        }
      ]);
    } finally {
      setIsLoadingFAQs(false);
    }
  };

  const fetchFAQsByCategory = async (category: string) => {
    setIsLoadingFAQs(true);
    setFaqError(null);
    
    try {
      console.log(`Fetching FAQs for category: ${category}`);
      const faqsData = await getFAQs({ category, limit: 50 });
      console.log('Category FAQs received:', faqsData);
      
      if (Array.isArray(faqsData)) {
        setFaqs(faqsData);
      } else {
        setFaqs([]);
      }
    } catch (error) {
      console.error('Error fetching FAQs by category:', error);
      setFaqError('Failed to load FAQs for this category.');
      setFaqs([]);
    } finally {
      setIsLoadingFAQs(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    setFaqError(null);
    
    try {
      console.log(`Searching FAQs for: ${searchTerm}`);
      const searchResults = await searchFAQs(searchTerm.trim(), 50);
      console.log('Search results:', searchResults);
      
      if (Array.isArray(searchResults)) {
        setFaqs(searchResults);
        if (searchResults.length === 0) {
          setFaqError('No FAQs found matching your search.');
        }
      } else {
        setFaqs([]);
        setFaqError('Search failed. Please try again.');
      }
    } catch (error) {
      console.error('Error searching FAQs:', error);
      setFaqError('Search failed. Please try again.');
      setFaqs([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSearchTerm(''); // Clear search when changing category
    setExpandedFAQ(null); // Collapse any expanded FAQ
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setSelectedCategory('All'); // Reset category when searching
  };

  const toggleFAQ = (faqId: string) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    fetchFAQs();
  };

  return (
    <div>
      <RobotoFont as="h2" weight={600} className="text-xl text-gray-900 mb-3">
        Frequently Asked Questions
      </RobotoFont>
      <RobotoFont as="p" weight={400} className="text-base text-gray-600 leading-relaxed mb-8">
        Find quick answers to common questions about our platform and services.
      </RobotoFont>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full px-4 py-3 pl-10 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Category Filters */}
      <div className="mb-8">
        <RobotoFont as="h3" weight={500} className="text-sm text-gray-700 mb-3">
          Filter by Category
        </RobotoFont>
        <div className="flex flex-wrap gap-2">
          {isLoadingCategories ? (
            <div className="px-4 py-2 bg-gray-100 rounded-full">
              <RobotoFont as="span" weight={400} className="text-sm text-gray-500">
                Loading categories...
              </RobotoFont>
            </div>
          ) : (
            categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <RobotoFont as="span" weight={selectedCategory === category ? 500 : 400}>
                  {category}
                </RobotoFont>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Loading State */}
      {(isLoadingFAQs || isSearching) && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <RobotoFont as="p" weight={400} className="text-gray-600">
            {isSearching ? 'Searching...' : 'Loading FAQs...'}
          </RobotoFont>
        </div>
      )}

      {/* Error State */}
      {faqError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <RobotoFont as="p" weight={500} className="text-red-800">
              {faqError}
            </RobotoFont>
          </div>
          <button
            onClick={() => {
              setFaqError(null);
              fetchFAQs();
            }}
            className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* FAQ List */}
      {!isLoadingFAQs && !isSearching && faqs.length > 0 && (
        <div className="space-y-4">
          {faqs.map((faq) => (
            <div
              key={faq.id}
              className="border border-gray-200 rounded-lg overflow-hidden transition-all hover:shadow-md"
            >
              <button
                onClick={() => toggleFAQ(faq.id)}
                className="w-full px-6 py-4 text-left bg-white hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <RobotoFont as="h3" weight={500} className="text-gray-900 text-base">
                      {faq.question}
                    </RobotoFont>
                    {faq.category && (
                      <RobotoFont as="span" weight={400} className="text-sm text-blue-600 mt-1 inline-block">
                        {faq.category}
                      </RobotoFont>
                    )}
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      expandedFAQ === faq.id ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              
              {expandedFAQ === faq.id && (
                <div className="px-6 pb-4 bg-gray-50 border-t border-gray-200">
                  <RobotoFont as="p" weight={400} className="text-gray-700 leading-relaxed pt-3">
                    {faq.answer}
                  </RobotoFont>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* No Results State */}
      {!isLoadingFAQs && !isSearching && faqs.length === 0 && !faqError && (
        <div className="text-center py-8">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <RobotoFont as="p" weight={500} className="text-gray-500 mb-2">
            No FAQs found
          </RobotoFont>
          <RobotoFont as="p" weight={400} className="text-gray-400 text-sm">
            {searchTerm ? 'Try adjusting your search terms' : 'No FAQs available for this category'}
          </RobotoFont>
        </div>
      )}
    </div>
  );
};

export default FAQSection;