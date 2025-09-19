import React, { useState } from 'react';

const FirstTimeBuyerChecklist: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

  const [checklistItems, setChecklistItems] = useState([
    // Getting Started
    {
      id: 'check-credit',
      title: 'Check Your Credit Score',
      description: 'Obtain a free credit report and review your credit score.',
      category: 'Getting Started',
      completed: false
    },
    {
      id: 'determine-budget',
      title: 'Determine Your Budget',
      description: 'Calculate how much you can afford for monthly payments.',
      category: 'Getting Started',
      completed: false
    },
    {
      id: 'save-down-payment',
      title: 'Save for Down Payment',
      description: 'Start saving for your down payment and closing costs.',
      category: 'Getting Started',
      completed: false
    },
    {
      id: 'research-programs',
      title: 'Research First-Time Buyer Programs',
      description: 'Look into local and federal first-time homebuyer assistance programs.',
      category: 'Getting Started',
      completed: false,
      optional: true
    },

    // Pre-Approval Process
    {
      id: 'gather-documents',
      title: 'Gather Financial Documents',
      description: 'Collect pay stubs, tax returns, bank statements, and other financial documents.',
      category: 'Pre-Approval Process',
      completed: false
    },
    {
      id: 'shop-lenders',
      title: 'Shop for Lenders',
      description: 'Compare mortgage rates and terms from multiple lenders.',
      category: 'Pre-Approval Process',
      completed: false
    },
    {
      id: 'get-preapproved',
      title: 'Get Pre-Approved',
      description: 'Obtain a pre-approval letter from your chosen lender.',
      category: 'Pre-Approval Process',
      completed: false
    },

    // House Hunting
    {
      id: 'find-realtor',
      title: 'Find a Real Estate Agent',
      description: 'Choose an experienced agent who understands your needs.',
      category: 'House Hunting',
      completed: false
    },
    {
      id: 'define-criteria',
      title: 'Define Your Home Criteria',
      description: 'Create a list of must-haves and nice-to-haves for your future home.',
      category: 'House Hunting',
      completed: false
    },
    {
      id: 'research-neighborhoods',
      title: 'Research Neighborhoods',
      description: 'Investigate different areas considering commute, schools, and amenities.',
      category: 'House Hunting',
      completed: false
    },
    {
      id: 'attend-showings',
      title: 'Attend Home Showings',
      description: 'Visit potential homes and take notes during each showing.',
      category: 'House Hunting',
      completed: false
    },

    // Making an Offer
    {
      id: 'home-inspection',
      title: 'Understand Home Inspection Process',
      description: 'Learn about the importance of home inspections and what they cover.',
      category: 'Making an Offer',
      completed: false
    },
    {
      id: 'make-offer',
      title: 'Make a Competitive Offer',
      description: 'Work with your agent to submit a strong offer on your chosen home.',
      category: 'Making an Offer',
      completed: false
    },
    {
      id: 'negotiate-terms',
      title: 'Negotiate Terms',
      description: 'Be prepared to negotiate price and other terms of the sale.',
      category: 'Making an Offer',
      completed: false
    },

    // After Offer Acceptance
    {
      id: 'schedule-inspection',
      title: 'Schedule Home Inspection',
      description: 'Arrange for a professional home inspection within the contingency period.',
      category: 'After Offer Acceptance',
      completed: false
    },
    {
      id: 'finalize-mortgage',
      title: 'Finalize Mortgage Application',
      description: 'Complete your mortgage application and provide any additional documents.',
      category: 'After Offer Acceptance',
      completed: false
    },
    {
      id: 'get-appraisal',
      title: 'Get Home Appraisal',
      description: 'Your lender will order an appraisal to confirm the home\'s value.',
      category: 'After Offer Acceptance',
      completed: false
    },
    {
      id: 'home-insurance',
      title: 'Secure Homeowner\'s Insurance',
      description: 'Shop for and purchase homeowner\'s insurance before closing.',
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

  // Modal Component
  const Modal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
      <div className="relative z-10 w-full max-w-md mx-4 rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 p-6">
        <div className="text-center">
          <div className="text-4xl mb-4">🚧</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Feature Under Development</h3>
          <p className="text-gray-600 mb-6">This feature is currently being developed and will be available soon.</p>
          <button 
            onClick={() => setShowModal(false)}
            className="w-full bg-orange-500 text-white py-3 px-6 rounded-xl font-medium hover:bg-orange-600 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );

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
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-medium ${
                          item.completed 
                            ? 'text-green-800 line-through' : 'text-gray-900'
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
          <button 
            onClick={() => setShowModal(true)}
            className="flex-1 bg-orange-500 text-white py-3 px-6 rounded-xl font-medium hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download PDF Checklist
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="flex-1 bg-white text-orange-500 py-3 px-6 rounded-xl font-medium border border-orange-500 hover:bg-orange-50 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            Share Progress
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && <Modal />}
    </div>
  );
};

export default FirstTimeBuyerChecklist;