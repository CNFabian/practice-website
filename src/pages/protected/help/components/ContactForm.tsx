import React, { useState, useEffect } from 'react';
import { RobotoFont } from '../../../../assets';
import { submitSupportTicket, getFAQCategories } from '../../../../services/helpAPI';
import type { SupportTicketRequest } from '../../../../types/help.types';

interface FormData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  message: string;
  category: string;
}

const ContactForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    message: '',
    category: ''
  });

  // Backend integration state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  // Fetch categories when component mounts
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoadingCategories(true);
    try {
      console.log('Fetching support categories...');
      const categoriesData = await getFAQCategories();
      console.log('Categories received:', categoriesData);
      
      // Handle different possible response formats
      if (Array.isArray(categoriesData)) {
        setCategories(categoriesData);
      } else if (typeof categoriesData === 'string') {
        // If backend returns a string, try to parse it
        try {
          const parsed = JSON.parse(categoriesData);
          setCategories(Array.isArray(parsed) ? parsed : []);
        } catch {
          // If not parseable, create default categories
          setCategories(['General', 'Technical', 'Account', 'Billing']);
        }
      } else {
        // Fallback to default categories
        setCategories(['General', 'Technical', 'Account', 'Billing']);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Use default categories if fetch fails
      setCategories(['General', 'Technical', 'Account', 'Billing']);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user starts typing
    if (submitError) {
      setSubmitError(null);
    }
    if (submitSuccess) {
      setSubmitSuccess(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      // Prepare ticket data for backend
      const ticketData: SupportTicketRequest = {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        subject: `Support Request - ${formData.category || 'General'}`,
        message: formData.message,
        category: formData.category || 'General'
      };

      console.log('Submitting support ticket:', ticketData);
      
      const response = await submitSupportTicket(ticketData);
      console.log('Support ticket submitted successfully:', response);
      
      setSubmitSuccess(true);
      
      // Reset form after successful submission
      setFormData({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        message: '',
        category: ''
      });

    } catch (error) {
      console.error('Error submitting support ticket:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('HTTP error! status: 400')) {
          setSubmitError('Please check your input and try again.');
        } else if (error.message.includes('HTTP error! status: 422')) {
          setSubmitError('Please fill in all required fields correctly.');
        } else if (error.message.includes('Authentication failed')) {
          setSubmitError('Please log in again to submit a support ticket.');
        } else if (error.message.includes('Network error')) {
          setSubmitError('Network error. Please check your connection and try again.');
        } else {
          setSubmitError(`Failed to submit ticket: ${error.message}`);
        }
      } else {
        setSubmitError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <RobotoFont as="h2" weight={600} className="text-xl text-gray-900 mb-3">
        Send Us a message
      </RobotoFont>
      <RobotoFont as="p" weight={400} className="text-base text-gray-600 leading-relaxed mb-8">
        Find answers to common questions, explore our platform through demos, and get the support you need on your homebuying journey. We're here to help you succeed.
      </RobotoFont>

      {/* Success Message */}
      {submitSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <RobotoFont as="p" weight={500} className="text-green-800">
              Your message has been sent successfully! We'll get back to you soon.
            </RobotoFont>
          </div>
        </div>
      )}

      {/* Error Message */}
      {submitError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <RobotoFont as="p" weight={500} className="text-red-800">
              {submitError}
            </RobotoFont>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block mb-2">
              <RobotoFont as="span" weight={500} className="text-gray-700">
                First Name *
              </RobotoFont>
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              placeholder="First Name"
              required
              disabled={isSubmitting}
              className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block mb-2">
              <RobotoFont as="span" weight={500} className="text-gray-700">
                Last Name
              </RobotoFont>
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              placeholder="Last Name"
              disabled={isSubmitting}
              className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="phone" className="block mb-2">
              <RobotoFont as="span" weight={500} className="text-gray-700">
                Phone Number
              </RobotoFont>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="Phone Number"
              disabled={isSubmitting}
              className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label htmlFor="email" className="block mb-2">
              <RobotoFont as="span" weight={500} className="text-gray-700">
                Email *
              </RobotoFont>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Email Address"
              required
              disabled={isSubmitting}
              className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <label htmlFor="category" className="block mb-2">
            <RobotoFont as="span" weight={500} className="text-gray-700">
              Category *
            </RobotoFont>
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
            disabled={isSubmitting || isLoadingCategories}
            className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">
              {isLoadingCategories ? 'Loading categories...' : 'Select a category'}
            </option>
            {categories.map((category, index) => (
              <option key={index} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="message" className="block mb-2">
            <RobotoFont as="span" weight={500} className="text-gray-700">
              Message *
            </RobotoFont>
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleInputChange}
            placeholder="Your message here..."
            required
            rows={5}
            disabled={isSubmitting}
            className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-vertical disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm"
          >
            <RobotoFont as="span" weight={500}>
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </RobotoFont>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContactForm;