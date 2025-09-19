import React, { useState } from 'react';

const FirstTimeBuyerChecklist: React.FC = () => {
  // State to track completed items
  const [completedItems, setCompletedItems] = useState<Set<number>>(new Set());

  // PDF Download Handler
  const handleDownloadPDF = () => {
    try {
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = '/pdfs/first-time-buyer-checklist.pdf';
      link.download = 'first-time-buyer-checklist.pdf';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Sorry, there was an error downloading the file. Please try again.');
    }
  };

  // Share Progress Handler
  const handleShareProgress = () => {
    const completedCount = completedItems.size;
    const totalItems = checklistData.reduce((acc, section) => acc + section.items.length, 0);
    const progressText = `I've completed ${completedCount} out of ${totalItems} items on my First-Time Homebuyer Checklist! 🏠`;
    
    if (navigator.share) {
      navigator.share({
        title: 'My Homebuying Progress',
        text: progressText,
        url: window.location.href
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(progressText)
        .then(() => alert('Progress copied to clipboard!'))
        .catch(() => alert('Unable to share progress. Please try again.'));
    }
  };

  // Toggle item completion
  const toggleItem = (itemId: number) => {
    const newCompleted = new Set(completedItems);
    if (newCompleted.has(itemId)) {
      newCompleted.delete(itemId);
    } else {
      newCompleted.add(itemId);
    }
    setCompletedItems(newCompleted);
  };

  const checklistData = [
    {
      id: 1,
      title: "Financial Preparation",
      items: [
        {
          id: 1,
          title: "Check your credit score",
          description: "Obtain free credit reports from all three bureaus and review for accuracy"
        },
        {
          id: 2,
          title: "Save for down payment",
          description: "Aim for 10-20% of home price, though some loans allow less"
        },
        {
          id: 3,
          title: "Build emergency fund",
          description: "Save 3-6 months of expenses separate from your down payment"
        },
        {
          id: 4,
          title: "Get pre-approved for mortgage",
          description: "Shop around with multiple lenders to compare rates and terms"
        },
        {
          id: 5,
          title: "Research down payment assistance",
          description: "Look into first-time buyer programs in your area",
          optional: true
        }
      ]
    },
    {
      id: 2,
      title: "House Hunting",
      items: [
        {
          id: 6,
          title: "Find a real estate agent",
          description: "Choose someone who specializes in your area and price range"
        },
        {
          id: 7,
          title: "Define your must-haves",
          description: "List essential features vs. nice-to-haves to guide your search"
        },
        {
          id: 8,
          title: "Research neighborhoods",
          description: "Consider schools, commute, amenities, and future development plans"
        },
        {
          id: 9,
          title: "Attend open houses",
          description: "Visit homes to understand the market and refine your preferences"
        }
      ]
    },
    {
      id: 3,
      title: "Making an Offer",
      items: [
        {
          id: 10,
          title: "Research comparable sales",
          description: "Use recent sales data to determine a competitive offer price"
        },
        {
          id: 11,
          title: "Include contingencies",
          description: "Add inspection, appraisal, and financing contingencies for protection"
        },
        {
          id: 12,
          title: "Submit earnest money",
          description: "Typically 1-3% of offer price to show you're a serious buyer"
        }
      ]
    },
    {
      id: 4,
      title: "Under Contract",
      items: [
        {
          id: 13,
          title: "Schedule home inspection",
          description: "Hire a qualified inspector within your contingency period"
        },
        {
          id: 14,
          title: "Finalize mortgage application",
          description: "Submit all required documents to your lender promptly"
        },
        {
          id: 15,
          title: "Order appraisal",
          description: "Your lender will arrange this to confirm the home's value"
        },
        {
          id: 16,
          title: "Shop for homeowner's insurance",
          description: "Get quotes and secure coverage before closing"
        },
        {
          id: 17,
          title: "Review title report",
          description: "Ensure there are no liens or title issues with the property"
        }
      ]
    },
    {
      id: 5,
      title: "Closing Preparation",
      items: [
        {
          id: 18,
          title: "Final walkthrough",
          description: "Inspect the property 24-48 hours before closing"
        },
        {
          id: 19,
          title: "Review closing disclosure",
          description: "Compare final loan terms with your initial estimates"
        },
        {
          id: 20,
          title: "Prepare closing funds",
          description: "Get certified check or arrange wire transfer for closing costs"
        },
        {
          id: 21,
          title: "Arrange utilities transfer",
          description: "Set up electricity, gas, water, internet, and other services"
        }
      ]
    }
  ];

  const totalItems = checklistData.reduce((acc, section) => acc + section.items.length, 0);
  const completedCount = completedItems.size;
  const progressPercentage = (completedCount / totalItems) * 100;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          First-Time Homebuyer Checklist
        </h1>
        <p className="text-gray-600 leading-relaxed">
          A comprehensive guide to help you navigate your first home purchase. 
          Check off items as you complete them to track your progress.
        </p>
        
        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-medium text-gray-700">
              {completedCount}/{totalItems} completed
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-green-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Checklist Sections */}
      <div className="space-y-8">
        {checklistData.map((section) => {
          const sectionCompleted = section.items.filter(item => 
            completedItems.has(item.id)
          ).length;
          
          return (
            <div key={section.id} className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {section.title}
                </h2>
                <span className="text-sm text-gray-500">
                  {sectionCompleted}/{section.items.length}
                </span>
              </div>
              
              <div className="space-y-4">
                {section.items.map((item) => {
                  const isCompleted = completedItems.has(item.id);
                  
                  return (
                    <div 
                      key={item.id}
                      className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => toggleItem(item.id)}
                    >
                      <div className="flex-shrink-0 mt-1">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          isCompleted 
                            ? 'bg-green-500 border-green-500' 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}>
                          {isCompleted && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-medium mb-1 ${
                          isCompleted ? 'text-green-800 line-through' : 'text-gray-900'
                        }`}>
                          {item.title}
                          {item.optional && (
                            <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              Optional
                            </span>
                          )}
                        </h3>
                        <p className={`text-sm ${
                          isCompleted ? 'text-green-700' : 'text-gray-600'
                        }`}>
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
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
            onClick={handleDownloadPDF}
            className="flex-1 bg-orange-500 text-white py-3 px-6 rounded-xl font-medium hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download PDF Checklist
          </button>
          <button 
            onClick={handleShareProgress}
            className="flex-1 bg-white text-orange-500 py-3 px-6 rounded-xl font-medium border border-orange-500 hover:bg-orange-50 transition-colors flex items-center justify-center gap-2"
          >
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