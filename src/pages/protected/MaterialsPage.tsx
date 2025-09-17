import React, { useState } from 'react';

const MaterialsPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'Calculators' | 'Worksheets' | 'Checklists'>('Calculators');

  const calculators = [
    {
      id: 1,
      title: 'Mortgage Calculator',
      description: 'Calculate your estimated monthly mortgage payments based on loan amount, interest rate, and term.',
      icon: '🏠'
    },
    {
      id: 2,
      title: 'Debt-to-Income Calculator',
      description: 'Determine your debt-to-income ratio to understand your borrowing capacity.',
      icon: '⚖️'
    },
    {
      id: 3,
      title: 'Credit Score Calculator',
      description: 'Estimate your credit score improvement based on your financial actions.',
      icon: '📈'
    }
  ];

  const worksheets = [
    {
      id: 1,
      title: 'Expense Tracking Worksheet',
      description: 'Track your daily expenses and identify spending patterns to better manage your budget.',
      icon: '📊'
    },
    {
      id: 2,
      title: 'Budget Planning Worksheet',
      description: 'Create and manage your monthly budget with our comprehensive planning template.',
      icon: '💰'
    }
  ];

  const checklists = [
    {
      id: 1,
      title: 'First-Time Homebuyer Checklist',
      description: 'Complete guide for first-time homebuyers with essential steps and considerations.',
      icon: '🏠'
    },
    {
      id: 2,
      title: 'Home Inspection Checklist',
      description: 'Ensure you don\'t miss any important details during your home inspection.',
      icon: '🔍'
    }
  ];

  const categories = [
    {
      id: 'Calculators' as const,
      title: 'Calculators',
      description: 'Financial calculation tools',
      icon: '📱'
    },
    {
      id: 'Worksheets' as const,
      title: 'Worksheets',
      description: 'Download and track your progress',
      icon: '📄'
    },
    {
      id: 'Checklists' as const,
      title: 'Checklists',
      description: 'Step-by-step guides',
      icon: '📋'
    }
  ];

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Materials
        </h1>
        <p className="text-gray-600 text-sm">
          Financial tools and resources to help with your homeownership journey
        </p>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {categories.map((category) => (
          <div
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`rounded-2xl border-2 p-6 cursor-pointer transition-all duration-200 ${
              activeCategory === category.id
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-25'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">{category.icon}</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {category.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {category.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Content Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Calculators */}
        {activeCategory === 'Calculators' && calculators.map((calculator) => (
          <div
            key={calculator.id}
            className="bg-white rounded-2xl border border-gray-200 p-8 text-center hover:shadow-lg transition-all duration-200"
          >
            <div className="mb-6">
              <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">{calculator.icon}</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {calculator.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {calculator.description}
              </p>
            </div>
            <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-blue-700 transition-colors">
              Use Calculator
            </button>
          </div>
        ))}

        {/* Worksheets */}
        {activeCategory === 'Worksheets' && worksheets.map((worksheet) => (
          <div
            key={worksheet.id}
            className="bg-white rounded-2xl border border-gray-200 p-8 text-center hover:shadow-lg transition-all duration-200"
          >
            <div className="mb-6">
              <div className="w-20 h-20 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">{worksheet.icon}</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {worksheet.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {worksheet.description}
              </p>
            </div>
            <div className="flex gap-3">
              <button className="flex-1 bg-green-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF
              </button>
              <button className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-gray-700 transition-colors flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Preview
              </button>
            </div>
          </div>
        ))}

        {/* Checklists */}
        {activeCategory === 'Checklists' && checklists.map((checklist) => (
          <div
            key={checklist.id}
            className="bg-white rounded-2xl border border-gray-200 p-8 text-center hover:shadow-lg transition-all duration-200"
          >
            <div className="mb-6">
              <div className="w-20 h-20 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">{checklist.icon}</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {checklist.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {checklist.description}
              </p>
            </div>
            <button className="w-full bg-orange-500 text-white py-3 px-6 rounded-xl font-medium hover:bg-orange-600 transition-colors flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              View Checklist
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MaterialsPage;