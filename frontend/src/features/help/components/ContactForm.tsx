import React, { useState } from 'react';
import { OnestFont } from '../../../../assets';
import { useFAQCategories } from '../../../../hooks/queries/useHelpQueries';
import { useSubmitSupportTicket } from '../../../../hooks/mutations/useSubmitSupportTicket';
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

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const { data: categoriesData, isLoading: isLoadingCategories } = useFAQCategories();
  const { mutate: submitTicketMutation, isPending: isSubmitting } = useSubmitSupportTicket();
  const categories = Array.isArray(categoriesData) ? categoriesData : ['General', 'Technical', 'Account', 'Billing'];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (submitError) {
      setSubmitError(null);
    }
    if (submitSuccess) {
      setSubmitSuccess(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    setSubmitError(null);
    setSubmitSuccess(false);

    const ticketData: SupportTicketRequest = {
      name: `${formData.firstName} ${formData.lastName}`.trim(),
      email: formData.email,
      subject: `Support Request - ${formData.category || 'General'}`,
      message: formData.message,
      category: formData.category || 'General'
    };

    console.log('Submitting support ticket:', ticketData);

    submitTicketMutation(ticketData, {
      onSuccess: (response) => {
        console.log('Support ticket submitted successfully:', response);
        setSubmitSuccess(true);
        setFormData({
          firstName: '',
          lastName: '',
          phone: '',
          email: '',
          message: '',
          category: ''
        });
      },
      onError: (error) => {
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
      },
    });
  };

  return (
    <div>
      <OnestFont as="h2" weight={700} lineHeight="tight" className="text-xl text-text-blue-black mb-3">
        Send Us a message
      </OnestFont>
      <OnestFont as="p" weight={300} lineHeight="relaxed" className="text-base text-text-grey mb-8">
        Find answers to common questions, explore our platform through demos, and get the support you need on your homebuying journey. We're here to help you succeed.
      </OnestFont>

      {/* Success Message */}
      {submitSuccess && (
        <div className="mb-6 p-4 bg-status-green/10 border border-status-green rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-status-green mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <OnestFont as="p" weight={500} lineHeight="relaxed" className="text-status-green">
              Your message has been sent successfully! We'll get back to you soon.
            </OnestFont>
          </div>
        </div>
      )}

      {/* Error Message */}
      {submitError && (
        <div className="mb-6 p-4 bg-status-red/10 border border-status-red rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-status-red mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <OnestFont as="p" weight={500} lineHeight="relaxed" className="text-status-red">
              {submitError}
            </OnestFont>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block mb-2">
              <OnestFont as="span" weight={500} lineHeight="relaxed" className="text-text-grey">
                First Name *
              </OnestFont>
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
              className="w-full px-4 py-3 bg-light-background-blue border border-light-background-blue rounded-lg focus:outline-none focus:ring-2 focus:ring-logo-blue focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block mb-2">
              <OnestFont as="span" weight={500} lineHeight="relaxed" className="text-text-grey">
                Last Name
              </OnestFont>
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              placeholder="Last Name"
              disabled={isSubmitting}
              className="w-full px-4 py-3 bg-light-background-blue border border-light-background-blue rounded-lg focus:outline-none focus:ring-2 focus:ring-logo-blue focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="phone" className="block mb-2">
              <OnestFont as="span" weight={500} lineHeight="relaxed" className="text-text-grey">
                Phone Number
              </OnestFont>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="Phone Number"
              disabled={isSubmitting}
              className="w-full px-4 py-3 bg-light-background-blue border border-light-background-blue rounded-lg focus:outline-none focus:ring-2 focus:ring-logo-blue focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label htmlFor="email" className="block mb-2">
              <OnestFont as="span" weight={500} lineHeight="relaxed" className="text-text-grey">
                Email *
              </OnestFont>
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
              className="w-full px-4 py-3 bg-light-background-blue border border-light-background-blue rounded-lg focus:outline-none focus:ring-2 focus:ring-logo-blue focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <label htmlFor="category" className="block mb-2">
            <OnestFont as="span" weight={500} lineHeight="relaxed" className="text-text-grey">
              Category *
            </OnestFont>
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
            disabled={isSubmitting || isLoadingCategories}
            className="w-full px-4 py-3 bg-light-background-blue border border-light-background-blue rounded-lg focus:outline-none focus:ring-2 focus:ring-logo-blue focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
            <OnestFont as="span" weight={500} lineHeight="relaxed" className="text-text-grey">
              Message *
            </OnestFont>
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
            className="w-full px-4 py-3 bg-light-background-blue border border-light-background-blue rounded-lg focus:outline-none focus:ring-2 focus:ring-logo-blue focus:border-transparent transition-all resize-vertical disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-logo-blue text-white px-8 py-3 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-logo-blue focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm"
          >
            <OnestFont as="span" weight={500} lineHeight="relaxed">
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </OnestFont>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContactForm;