import React, { useState, useEffect } from 'react';
import { OnestFont } from '../../../../assets';
import { useFAQs, useFAQCategories } from '../../../../hooks/queries/useHelpQueries';
import type { FAQ } from '../../../../types/help.types';

const FALLBACK_FAQS: FAQ[] = [
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
];

const FAQSection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { data: categoriesData, isLoading: isLoadingCategories } = useFAQCategories();
  const { data: faqsData, isLoading: isLoadingFAQs, error: faqError } = useFAQs({
    category: selectedCategory !== 'All' ? selectedCategory : undefined,
    search: debouncedSearch || undefined,
    limit: 50,
  });

  const categories = categoriesData ? ['All', ...(Array.isArray(categoriesData) ? categoriesData : [])] : ['All', 'General', 'Account', 'Technical', 'Billing'];
  const faqs = Array.isArray(faqsData) ? faqsData : FALLBACK_FAQS;
  const isSearching = !!debouncedSearch && isLoadingFAQs;

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSearchTerm(''); 
    setExpandedFAQ(null); 
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setSelectedCategory('All'); 
  };

  const toggleFAQ = (faqId: string) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSelectedCategory('All');
  };

  return (
    <div>
      <OnestFont as="h2" weight={700} lineHeight="tight" className="text-xl text-gray-900 mb-3">
        Frequently Asked Questions
      </OnestFont>
      <OnestFont as="p" weight={300} lineHeight="relaxed" className="text-base text-gray-600 mb-8">
        Find quick answers to common questions about our platform and services.
      </OnestFont>

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
        <OnestFont as="h3" weight={500} lineHeight="relaxed" className="text-sm text-gray-700 mb-3">
          Filter by Category
        </OnestFont>
        <div className="flex flex-wrap gap-2">
          {isLoadingCategories ? (
            <div className="px-4 py-2 bg-gray-100 rounded-full">
              <OnestFont as="span" weight={500} lineHeight="relaxed" className="text-sm text-gray-500">
                Loading categories...
              </OnestFont>
            </div>
          ) : (
            categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-4 py-2 rounded-full text-sm transition-all ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <OnestFont as="span" weight={selectedCategory === category ? 500 : 300} lineHeight="relaxed">
                  {category}
                </OnestFont>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Loading State */}
      {(isLoadingFAQs || isSearching) && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <OnestFont as="p" weight={300} lineHeight="relaxed" className="text-gray-600">
            {isSearching ? 'Searching...' : 'Loading FAQs...'}
          </OnestFont>
        </div>
      )}

      {/* Error State */}
      {faqError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <OnestFont as="p" weight={500} lineHeight="relaxed" className="text-red-800">
              Failed to load FAQs. Using fallback data.
            </OnestFont>
          </div>
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
                    <OnestFont as="h3" weight={500} lineHeight="relaxed" className="text-gray-900 text-base">
                      {faq.question}
                    </OnestFont>
                    {faq.category && (
                      <OnestFont as="span" weight={300} lineHeight="relaxed" className="text-sm text-blue-600 mt-1 inline-block">
                        {faq.category}
                      </OnestFont>
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
                  <OnestFont as="p" weight={500} lineHeight="relaxed" className="text-gray-700 pt-3">
                    {faq.answer}
                  </OnestFont>
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
          <OnestFont as="p" weight={500} lineHeight="relaxed" className="text-gray-500 mb-2">
            No FAQs found
          </OnestFont>
          <OnestFont as="p" weight={300} lineHeight="relaxed" className="text-gray-400 text-sm">
            {searchTerm ? 'Try adjusting your search terms' : 'No FAQs available for this category'}
          </OnestFont>
        </div>
      )}
    </div>
  );
};

export default FAQSection;