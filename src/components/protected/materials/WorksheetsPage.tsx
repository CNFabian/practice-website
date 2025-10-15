import React, { useState, useEffect } from 'react';
import RobotoFont from '../../assets/fonts';
import InfoModal from '../../components/protected/materials/InfoModal';
import { 
  DocumentIcon,
  AnalyzeIcon,
  MoneyBoxIcon,
  InfoGreen
} from '../../assets';

import ExpenseTrackingPDF from '../../assets/downloadables/expense-tracking-worksheet.pdf';
import BudgetPlanningPDF from '../../assets/downloadables/budget-planning-worksheet.pdf';

import { 
  getMaterialsByType, 
  trackMaterialDownload 
} from '../../services/materialsAPI';

const WorksheetsPage: React.FC = () => {
  const [showWorksheet, setShowWorksheet] = useState<string | null>(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  // Backend integration state
  const [isLoadingBackend, setIsLoadingBackend] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [backendWorksheets, setBackendWorksheets] = useState<any[]>([]);

  // Fetch backend data when component mounts
  useEffect(() => {
    fetchBackendWorksheets();
  }, []);

  const fetchBackendWorksheets = async () => {
    setIsLoadingBackend(true);
    setBackendError(null);

    try {
      console.log('Fetching worksheets from backend...');
      const worksheetsData = await getMaterialsByType('worksheets');
      console.log('Backend worksheets received:', worksheetsData);
      setBackendWorksheets(Array.isArray(worksheetsData) ? worksheetsData : []);
    } catch (error) {
      console.error('Error fetching worksheets:', error);
      setBackendError('Failed to load worksheets from backend');
    } finally {
      setIsLoadingBackend(false);
    }
  };

  // Frontend fallback data
  const worksheets = [
    {
      id: 'expense-tracking',
      title: 'Expense Tracking Worksheet',
      description: 'Track your daily expenses and identify spending patterns to better manage your budget.',
      icon: AnalyzeIcon,
      pdfFileName: 'expense-tracking-worksheet.pdf',
      purpose: 'Help you understand where your money goes by tracking daily expenses and identifying spending patterns.',
      bestPractices: [
        'Record every expense, no matter how small',
        'Categorize expenses (housing, food, transportation, etc.)',
        'Review weekly to identify spending patterns',
        'Use receipts and bank statements for accuracy',
        'Set aside time daily for entry (5-10 minutes)',
        'Be honest about discretionary spending'
      ]
    },
    {
      id: 'budget-planning',
      title: 'Budget Planning Worksheet',
      description: 'Create and manage your monthly budget with our comprehensive planning template.',
      icon: MoneyBoxIcon,
      pdfFileName: 'budget-planning-worksheet.pdf',
      purpose: 'Create a comprehensive monthly budget that allocates your income effectively and helps you save for homeownership goals.',
      bestPractices: [
        'Start with your net (after-tax) income',
        'List all fixed expenses first (rent, insurance, loans)',
        'Allocate 20% for savings and debt repayment',
        'Set realistic limits for variable expenses',
        'Include a buffer for unexpected costs (5-10%)',
        'Review and adjust monthly based on actual spending',
        'Prioritize building an emergency fund'
      ]
    }
  ];

  const worksheetInfoData = {
    'expense-tracking': {
      title: 'Expense Tracking Worksheet',
      description: 'Learn how to effectively track your daily expenses and identify spending patterns.',
      howToUse: [
        'Download and print the worksheet or fill it out digitally',
        'Record every expense, no matter how small the amount',
        'Categorize each expense (housing, food, transportation, etc.)',
        'Review your spending weekly to identify patterns',
        'Use receipts and bank statements to ensure accuracy',
        'Set aside 5-10 minutes daily for consistent entry'
      ],
      howToUseTitle: 'How to Use This Worksheet',
      terms: [
        {
          term: 'Fixed Expenses',
          definition: 'Regular monthly costs that stay the same (rent, insurance, loan payments)'
        },
        {
          term: 'Variable Expenses',
          definition: 'Costs that change month to month (groceries, entertainment, gas)'
        },
        {
          term: 'Discretionary Spending',
          definition: 'Non-essential purchases you can control or eliminate'
        },
        {
          term: 'Spending Pattern',
          definition: 'Recurring habits in how and when you spend money'
        }
      ]
    },
    'budget-planning': {
      title: 'Budget Planning Worksheet',
      description: 'Create a comprehensive monthly budget that helps you save for homeownership.',
      howToUse: [
        'Start by calculating your net (after-tax) monthly income',
        'List all fixed expenses first (rent, insurance, loans)',
        'Allocate 20% of income for savings and debt repayment',
        'Set realistic limits for variable expenses',
        'Include a 5-10% buffer for unexpected costs',
        'Review and adjust monthly based on actual spending'
      ],
      howToUseTitle: 'How to Create Your Budget',
      terms: [
        {
          term: '50/30/20 Rule',
          definition: '50% for needs, 30% for wants, 20% for savings and debt repayment'
        },
        {
          term: 'Net Income',
          definition: 'Your take-home pay after taxes and deductions'
        },
        {
          term: 'Emergency Fund',
          definition: '3-6 months of expenses saved for unexpected situations'
        },
        {
          term: 'Debt-to-Income Ratio',
          definition: 'Percentage of monthly income used to pay debts'
        }
      ]
    }
  };

  // Merge backend data with frontend fallback
  const getDisplayWorksheets = () => {
    return backendWorksheets.length > 0 ? backendWorksheets : worksheets;
  };

  const handleWorksheetInfoClick = (worksheetId: string) => {
    setShowWorksheet(worksheetId);
    setIsInfoModalOpen(true);
  };

  // Handle file download with backend tracking
  const handleWorksheetDownload = async (worksheetId: string) => {
    try {
      // Track download in backend if we have backend data
      const backendItem = backendWorksheets.find(item => item.id === worksheetId);
      if (backendItem && backendItem.id) {
        await trackMaterialDownload(backendItem.id);
        console.log('Download tracked for resource:', backendItem.id);
      }
    } catch (error) {
      console.error('Error tracking download:', error);
      // Continue with download even if tracking fails
    }

    // Original download logic
    const worksheetPaths: Record<string, string> = {
      'expense-tracking': ExpenseTrackingPDF,
      'budget-planning': BudgetPlanningPDF
    };
    
    const pdfPath = worksheetPaths[worksheetId];
    if (pdfPath) {
      try {
        const worksheet = worksheets.find(w => w.id === worksheetId);
        const link = document.createElement('a');
        link.href = pdfPath;
        link.download = `${worksheet?.title.replace(/\s+/g, '-').toLowerCase()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error('Download error:', error);
        window.open(pdfPath, '_blank');
      }
    }
  };

  const handleWorksheetPreview = (worksheetId: string) => {
    const worksheetPaths: Record<string, string> = {
      'expense-tracking': ExpenseTrackingPDF,
      'budget-planning': BudgetPlanningPDF
    };
    
    const pdfPath = worksheetPaths[worksheetId];
    if (pdfPath) {
      window.open(pdfPath, '_blank');
    }
  };

  const HeaderSection = () => (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
          <img 
            src={DocumentIcon} 
            alt="Worksheets"
            className="w-6 h-6"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
        </div>
        <div>
          <RobotoFont as="h1" weight={700} className="text-2xl text-gray-900">
            Worksheets
          </RobotoFont>
          <RobotoFont className="text-gray-600 text-sm">
            Download and track your financial progress with our planning tools
          </RobotoFont>
        </div>
      </div>
      
      {/* Backend Error Banner */}
      {backendError && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <div className="text-yellow-600">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-2">
              <RobotoFont className="text-xs text-yellow-800">
                Backend unavailable - using offline worksheets
              </RobotoFont>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const WorksheetCard = ({ 
    item, 
    onDownload, 
    onPreview,
    onInfoClick
  }: { 
    item: any;
    onDownload: (id: any) => void;
    onPreview: (id: any) => void;
    onInfoClick: (id: any) => void;
  }) => {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 xl:p-8 text-center hover:shadow-lg transition-all duration-200 relative max-w-lg mx-auto">
        {/* Info Button */}
        <div className="absolute top-4 right-4">
          <button
            onClick={() => onInfoClick(item.id)}
            className="flex items-center justify-center w-10 h-10 bg-white hover:bg-gray-50 border border-gray-200 rounded-full shadow-sm transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            title="More information about this worksheet"
          >
            <img src={InfoGreen} alt="Info" style={{ width: '1.25rem', height: '1.25rem' }} />
          </button>
        </div>

        <div className="mb-6">
          <div className="w-16 h-16 xl:w-20 xl:h-20 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <img 
              src={item.icon || item.thumbnailUrl} 
              alt={item.title}
              className="w-6 h-6 xl:w-8 xl:h-8"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </div>
          <RobotoFont as="h3" weight={600} className="text-lg xl:text-xl text-gray-900 mb-3">
            {item.title}
          </RobotoFont>
          <RobotoFont className="text-gray-600 text-sm leading-relaxed">
            {item.description}
          </RobotoFont>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => onDownload(item.id)}
            className="flex-1 bg-green-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <RobotoFont as="span" weight={500}>
              Download
            </RobotoFont>
          </button>
          <button 
            onClick={() => onPreview(item.id)}
            className="flex-1 bg-white text-green-600 py-3 px-6 rounded-xl font-medium border border-green-600 hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
          >
            <RobotoFont as="span" weight={500}>
              Preview
            </RobotoFont>
          </button>
        </div>
      </div>
    );
  };

  const currentWorksheets = getDisplayWorksheets();

  // Show loading state for initial backend fetch
  if (isLoadingBackend && backendWorksheets.length === 0) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="p-6">
          <HeaderSection />
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span className="ml-3 text-gray-600">Loading worksheets...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        <HeaderSection />
        
        <div className={`grid gap-6 ${
          currentWorksheets.length <= 3 
            ? 'grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 max-w-6xl mx-auto' 
            : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
        }`}>
          {currentWorksheets.map((worksheet) => (
            <WorksheetCard
              key={worksheet.id}
              item={worksheet}
              onDownload={handleWorksheetDownload}
              onPreview={handleWorksheetPreview}
              onInfoClick={handleWorksheetInfoClick}
            />
          ))}
        </div>
      </div>

      {/* Info Modal for Worksheets */}
      {showWorksheet && (
        <InfoModal
          isOpen={isInfoModalOpen}
          onClose={() => {
            setIsInfoModalOpen(false);
            setShowWorksheet(null);
          }}
          title={worksheetInfoData[showWorksheet as keyof typeof worksheetInfoData]?.title || ''}
          description={worksheetInfoData[showWorksheet as keyof typeof worksheetInfoData]?.description || ''}
          howToUse={worksheetInfoData[showWorksheet as keyof typeof worksheetInfoData]?.howToUse || []}
          howToUseTitle={worksheetInfoData[showWorksheet as keyof typeof worksheetInfoData]?.howToUseTitle || ''}
          terms={worksheetInfoData[showWorksheet as keyof typeof worksheetInfoData]?.terms || []}
        />
      )}
    </div>
  );
};

export default WorksheetsPage;