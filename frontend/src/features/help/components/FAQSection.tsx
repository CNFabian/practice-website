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
      <OnestFont as="h2" weight={700} lineHeight="tight" className="text-xl text-text-blue-black mb-3">
        Frequently Asked Questions
      </OnestFont>
      <OnestFont as="p" weight={300} lineHeight="relaxed" className="text-base text-text-grey mb-8">
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
            className="w-full px-4 py-3 pl-10 bg-light-background-blue border border-light-background-blue rounded-lg focus:outline-none focus:ring-2 focus:ring-logo-blue focus:border-transparent transition-all"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-unavailable-button"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-unavailable-button hover:text-text-grey"
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
        <OnestFont as="h3" weight={500} lineHeight="relaxed" className="text-sm text-text-grey mb-3">
          Filter by Category
        </OnestFont>
        <div className="flex flex-wrap gap-2">
          {isLoadingCategories ? (
            <div className="px-4 py-2 bg-light-background-blue rounded-full">
              <OnestFont as="span" weight={500} lineHeight="relaxed" className="text-sm text-unavailable-button">
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
                    ? 'bg-logo-blue text-white'
                    : 'bg-light-background-blue text-text-grey hover:bg-light-background-blue/80'
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
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-logo-blue mb-4"></div>
          <OnestFont as="p" weight={300} lineHeight="relaxed" className="text-text-grey">
            {isSearching ? 'Searching...' : 'Loading FAQs...'}
          </OnestFont>
        </div>
      )}

      {/* Error State */}
      {faqError && (
        <div className="mb-6 p-4 bg-status-red/10 border border-status-red rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-status-red mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <OnestFont as="p" weight={500} lineHeight="relaxed" className="text-status-red">
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
              className="border border-light-background-blue rounded-lg overflow-hidden transition-all hover:shadow-md"
            >
              <button
                onClick={() => toggleFAQ(faq.id)}
                className="w-full px-6 py-4 text-left bg-white hover:bg-light-background-blue focus:outline-none focus:bg-light-background-blue transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <OnestFont as="h3" weight={500} lineHeight="relaxed" className="text-text-blue-black text-base">
                      {faq.question}
                    </OnestFont>
                    {faq.category && (
                      <OnestFont as="span" weight={300} lineHeight="relaxed" className="text-sm text-logo-blue mt-1 inline-block">
                        {faq.category}
                      </OnestFont>
                    )}
                  </div>
                  <svg
                    className={`w-5 h-5 text-unavailable-button transition-transform ${
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
                <div className="px-6 pb-4 bg-light-background-blue border-t border-light-background-blue">
                  <OnestFont as="p" weight={500} lineHeight="relaxed" className="text-text-grey pt-3">
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
          <svg className="w-16 h-16 text-unavailable-button mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <OnestFont as="p" weight={500} lineHeight="relaxed" className="text-unavailable-button mb-2">
            No FAQs found
          </OnestFont>
          <OnestFont as="p" weight={300} lineHeight="relaxed" className="text-unavailable-button text-sm">
            {searchTerm ? 'Try adjusting your search terms' : 'No FAQs available for this category'}
          </OnestFont>
        </div>
      )}
    </div>
  );
};

export default FAQSection;