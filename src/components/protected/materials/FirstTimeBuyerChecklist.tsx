import React, { useState } from 'react';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: string;
  completed: boolean;
  optional?: boolean;
}

const FirstTimeBuyerChecklist: React.FC = () => {
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([
    // Financial Preparation
    {
      id: 'credit-score',
      title: 'Check Your Credit Score',
      description: 'Obtain a free credit report and ensure your score is 620 or higher for better loan terms.',
      category: 'Financial Preparation',
      completed: false
    },
    {
      id: 'save-down-payment',
      title: 'Save for Down Payment',
      description: 'Aim to save at least 3-20% of the home price for your down payment.',
      category: 'Financial Preparation',
      completed: false
    },
    {
      id: 'emergency-fund',
      title: 'Build Emergency Fund',
      description: 'Set aside 3-6 months of living expenses for unexpected costs.',
      category: 'Financial Preparation',
      completed: false
    },
    {
      id: 'reduce-debt',
      title: 'Pay Down Existing Debt',
      description: 'Lower your debt-to-income ratio to improve loan approval chances.',
      category: 'Financial Preparation',
      completed: false
    },
    {
      id: 'stable-income',
      title: 'Establish Stable Employment',
      description: 'Maintain steady employment for at least 2 years before applying.',
      category: 'Financial Preparation',
      completed: false
    },

    // Pre-Shopping Phase
    {
      id: 'pre-approval',
      title: 'Get Pre-approved for a Mortgage',
      description: 'Obtain a pre-approval letter to show sellers you\'re a serious buyer.',
      category: 'Pre-Shopping Phase',
      completed: false
    },
    {
      id: 'budget-calculation',
      title: 'Calculate Your Budget',
      description: 'Determine how much house you can afford including all monthly costs.',
      category: 'Pre-Shopping Phase',
      completed: false
    },
    {
      id: 'research-neighborhoods',
      title: 'Research Neighborhoods',
      description: 'Explore different areas considering commute, schools, and amenities.',
      category: 'Pre-Shopping Phase',
      completed: false
    },
    {
      id: 'find-realtor',
      title: 'Find a Real Estate Agent',
      description: 'Choose an experienced agent who understands your needs and budget.',
      category: 'Pre-Shopping Phase',
      completed: false
    },
    {
      id: 'home-features',
      title: 'Create Your Wish List',
      description: 'List must-haves vs nice-to-haves for your future home.',
      category: 'Pre-Shopping Phase',
      completed: false
    },

    // House Hunting
    {
      id: 'start-shopping',
      title: 'Begin House Hunting',
      description: 'Start viewing properties that meet your criteria and budget.',
      category: 'House Hunting',
      completed: false
    },
    {
      id: 'take-notes',
      title: 'Take Detailed Notes',
      description: 'Document pros and cons of each property you visit.',
      category: 'House Hunting',
      completed: false
    },
    {
      id: 'research-market',
      title: 'Research Comparable Sales',
      description: 'Look at recent sales of similar homes in the area.',
      category: 'House Hunting',
      completed: false
    },

    // Making an Offer
    {
      id: 'make-offer',
      title: 'Submit Your Offer',
      description: 'Work with your agent to make a competitive offer.',
      category: 'Making an Offer',
      completed: false
    },
    {
      id: 'negotiate-terms',
      title: 'Negotiate Terms',
      description: 'Be prepared to negotiate price, closing date, and contingencies.',
      category: 'Making an Offer',
      completed: false
    },
    {
      id: 'review-contract',
      title: 'Review Purchase Agreement',
      description: 'Carefully read all contract terms before signing.',
      category: 'Making an Offer',
      completed: false
    },

    // After Offer Acceptance
    {
      id: 'home-inspection',
      title: 'Schedule Home Inspection',
      description: 'Hire a qualified inspector to check the property condition.',
      category: 'After Offer Acceptance',
      completed: false
    },
    {
      id: 'appraisal',
      title: 'Complete Appraisal',
      description: 'Your lender will order an appraisal to confirm the home\'s value.',
      category: 'After Offer Acceptance',
      completed: false
    },
    {
      id: 'finalize-mortgage',
      title: 'Finalize Your Mortgage',
      description: 'Complete all required documentation with your lender.',
      category: 'After Offer Acceptance',
      completed: false
    },
    {
      id: 'homeowners-insurance',
      title: 'Secure Homeowner\'s Insurance',
      description: 'Shop for and purchase insurance before closing.',
      category: 'After Offer Acceptance',
      completed: false
    },
    {
      id: 'final-walkthrough',
      title: 'Conduct Final Walkthrough',
      description: 'Inspect the property one last time before closing.',
      category: 'After Offer Acceptance',
      completed: false
    },

    // Closing Process
    {
      id: 'review-documents',
      title: 'Review Closing Documents',
      description: 'Carefully review all closing paperwork in advance.',
      category: 'Closing Process',
      completed: false
    },
    {
      id: 'closing-costs',
      title: 'Prepare Closing Costs',
      description: 'Arrange for certified funds for closing costs and down payment.',
      category: 'Closing Process',
      completed: false
    },
    {
      id: 'attend-closing',
      title: 'Attend Closing Meeting',
      description: 'Sign all documents and receive your keys!',
      category: 'Closing Process',
      completed: false
    }
  ]);

  const toggleItem = (id: string) => {
    setChecklistItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const categories = [...new Set(checklistItems.map(item => item.category))];
  const completedItems = checklistItems.filter(item => item.completed).length;
  const totalItems = checklistItems.length;
  const progressPercentage = (completedItems / totalItems) * 100;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center">
            <span className="text-white text-2xl">🏠</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              First-Time Homebuyer Checklist
            </h1>
            <p className="text-gray-600">
              Complete guide for first-time homebuyers with essential steps and considerations
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Progress: {completedItems} of {totalItems} completed
            </span>
            <span className="text-sm font-medium text-orange-600">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-orange-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{completedItems}</div>
            <div className="text-sm text-green-700">Completed</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{totalItems - completedItems}</div>
            <div className="text-sm text-blue-700">Remaining</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{categories.length}</div>
            <div className="text-sm text-purple-700">Categories</div>
          </div>
        </div>
      </div>

      {/* Checklist Items by Category */}
      <div className="space-y-8">
        {categories.map((category) => {
          const categoryItems = checklistItems.filter(item => item.category === category);
          const categoryCompleted = categoryItems.filter(item => item.completed).length;
          
          return (
            <div key={category} className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">{category}</h2>
                <span className="text-sm text-gray-600">
                  {categoryCompleted}/{categoryItems.length} completed
                </span>
              </div>
              
              <div className="space-y-3">
                {categoryItems.map((item) => (
                  <div 
                    key={item.id}
                    className={`border rounded-lg p-4 transition-all duration-200 cursor-pointer ${
                      item.completed 
                        ? 'border-green-300 bg-green-50' 
                        : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                    }`}
                    onClick={() => toggleItem(item.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                        item.completed 
                          ? 'border-green-500 bg-green-500' 
                          : 'border-gray-300'
                      }`}>
                        {item.completed && (
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-semibold mb-1 ${
                          item.completed ? 'text-green-800 line-through' : 'text-gray-900'
                        }`}>
                          {item.title}
                          {item.optional && (
                            <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              Optional
                            </span>
                          )}
                        </h3>
                        <p className={`text-sm ${
                          item.completed ? 'text-green-700' : 'text-gray-600'
                        }`}>
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Resources</h3>
        <div className="flex gap-4">
          <button className="flex-1 bg-orange-500 text-white py-3 px-6 rounded-xl font-medium hover:bg-orange-600 transition-colors flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download PDF Checklist
          </button>
          <button className="flex-1 bg-white text-orange-500 py-3 px-6 rounded-xl font-medium border border-orange-500 hover:bg-orange-50 transition-colors flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            Share Progress
          </button>
        </div>
      </div>
    </div>
  );
};

export default FirstTimeBuyerChecklist;