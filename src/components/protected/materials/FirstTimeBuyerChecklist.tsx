import React, { useState } from 'react';
import RobotoFont from '../../../assets/fonts';
import InfoButton from './InfoButton';
import InfoModal from './InfoModal';

const FirstTimeBuyerChecklist: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

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

  const checklistInfoData = {
    title: 'First-Time Homebuyer Checklist',
    description: 'Complete guide with essential steps and considerations for first-time homebuyers.',
    howToUse: [
      'Start with financial preparation and credit score improvement',
      'Get pre-approved for a mortgage to understand your budget',
      'Research neighborhoods and property types that fit your needs',
      'Work with a qualified real estate agent for guidance',
      'Complete home inspection and appraisal processes',
      'Review all documents carefully before closing'
    ],
    howToUseTitle: 'How to Use This Checklist',
    terms: [
      {
        term: 'Pre-approval',
        definition: 'Conditional commitment from a lender for a specific loan amount'
      },
      {
        term: 'Down Payment',
        definition: 'Upfront payment typically 3-20% of the home\'s purchase price'
      },
      {
        term: 'Closing Costs',
        definition: 'Fees and expenses paid at the final step of the home buying process'
      },
      {
        term: 'Home Inspection',
        definition: 'Professional examination of the property\'s condition and systems'
      }
    ]
  };

  const toggleItem = (id: string) => {
    setChecklistItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const categories = ['Getting Started', 'Pre-Approval Process', 'House Hunting', 'Making an Offer', 'After Offer Acceptance', 'Closing Process'];
  
  const getProgress = () => {
    const completed = checklistItems.filter(item => item.completed).length;
    const total = checklistItems.length;
    return { completed, total, percentage: Math.round((completed / total) * 100) };
  };

  const progress = getProgress();

  const Modal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <RobotoFont as="h3" weight={600} className="text-lg text-gray-900 mb-4">
          🎉 Congratulations!
        </RobotoFont>
        <RobotoFont className="text-gray-600 mb-6">
          You've completed all the essential steps for first-time homebuying! You're well-prepared for your homebuying journey.
        </RobotoFont>
        <button
          onClick={() => setShowModal(false)}
          className="w-full bg-purple-600 text-white py-3 rounded-xl font-medium hover:bg-purple-700 transition-colors"
        >
          <RobotoFont weight={500}>
            Awesome!
          </RobotoFont>
        </button>
      </div>
    </div>
  );

  React.useEffect(() => {
    if (progress.percentage === 100) {
      setShowModal(true);
    }
  }, [progress.percentage]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header with Progress */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 relative">
        {/* Info Button - positioned in top right */}
        <div className="absolute top-4 right-4">
          <InfoButton onClick={() => setIsInfoModalOpen(true)} category="purple" />
        </div>

        <div className="flex items-center justify-between mb-4 pr-12">
          <div>
            <RobotoFont as="h2" weight={700} className="text-2xl text-gray-900 mb-2">
              First-Time Homebuyer Checklist
            </RobotoFont>
            <RobotoFont className="text-gray-600">
              Your complete guide to buying your first home
            </RobotoFont>
          </div>
          <div className="text-right">
            <RobotoFont weight={700} className="text-3xl text-purple-600">
              {progress.percentage}%
            </RobotoFont>
            <RobotoFont className="text-sm text-gray-500">
              Complete
            </RobotoFont>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-purple-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          ></div>
        </div>
        <RobotoFont className="text-sm text-gray-500 mt-2">
          {progress.completed} of {progress.total} tasks completed
        </RobotoFont>
      </div>

      {/* Checklist Items by Category */}
      {categories.map((category) => {
        const categoryItems = checklistItems.filter(item => item.category === category);
        const categoryCompleted = categoryItems.filter(item => item.completed).length;
        
        return (
          <div key={category} className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <RobotoFont as="h3" weight={600} className="text-xl text-gray-900">
                {category}
              </RobotoFont>
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  categoryCompleted === categoryItems.length 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-purple-100 text-purple-700'
                }`}>
                  <RobotoFont weight={600}>
                    {categoryCompleted}
                  </RobotoFont>
                </div>
                <RobotoFont className="text-sm text-gray-500">
                  / {categoryItems.length}
                </RobotoFont>
              </div>
            </div>
            
            <div className="space-y-3">
              {categoryItems.map((item) => (
                <div 
                  key={item.id}
                  className={`border rounded-xl p-4 transition-all cursor-pointer ${
                    item.completed 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gray-200 bg-white hover:border-purple-300'
                  }`}
                  onClick={() => toggleItem(item.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 transition-colors ${
                      item.completed 
                        ? 'border-green-500 bg-green-500' 
                        : 'border-gray-300 hover:border-purple-500'
                    }`}>
                      {item.completed && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <RobotoFont weight={600} className={`text-sm ${
                          item.completed ? 'text-green-800 line-through' : 'text-gray-900'
                        }`}>
                          {item.title}
                        </RobotoFont>
                        {item.optional && (
                          <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                            <RobotoFont weight={500}>
                              Optional
                            </RobotoFont>
                          </span>
                        )}
                      </div>
                      <RobotoFont className={`text-sm mt-1 ${
                        item.completed ? 'text-green-700' : 'text-gray-600'
                      }`}>
                        {item.description}
                      </RobotoFont>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Tips Section */}
      <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6">
        <RobotoFont as="h3" weight={600} className="text-lg text-purple-900 mb-3">
          💡 Pro Tips for Success
        </RobotoFont>
        <div className="space-y-3 text-sm text-purple-800">
          <div className="flex items-start gap-2">
            <span className="text-purple-500 mt-1">•</span>
            <RobotoFont>Start early - the homebuying process typically takes 30-60 days from offer to closing</RobotoFont>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-purple-500 mt-1">•</span>
            <RobotoFont>Keep all financial documents organized and easily accessible</RobotoFont>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-purple-500 mt-1">•</span>
            <RobotoFont>Don't make any major financial changes during the process (new loans, job changes, etc.)</RobotoFont>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-purple-500 mt-1">•</span>
            <RobotoFont>Ask questions! Your real estate agent and lender are there to help guide you</RobotoFont>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && <Modal />}

      {/* Info Modal */}
      <InfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        title={checklistInfoData.title}
        description={checklistInfoData.description}
        howToUse={checklistInfoData.howToUse}
        howToUseTitle={checklistInfoData.howToUseTitle}
        terms={checklistInfoData.terms}
      />
    </div>
  );
};

export default FirstTimeBuyerChecklist;