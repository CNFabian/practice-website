import React, { useState } from 'react';
import RobotoFont from '../../assets/fonts';
import { 
  MortgageCalculator, 
  DebtToIncomeCalculator, 
  CreditScoreCalculator,
  FirstTimeBuyerChecklist,
  HomeInspectionChecklist,
} from '../../components';
import InfoButton from '../../components/protected/materials/InfoButton';
import InfoModal from '../../components/protected/materials/InfoModal';
import { 
  CalculatorIcon, 
  DocumentIcon, 
  ChecklistIcon, 
  MaterialHomeIcon, 
  ScalesIcon, 
  ChartIcon,
  SearchIcon,
  ToDoListIcon,
  MoneyBoxIcon,
  AnalyzeIcon,
  ShareIcon,
  InfoGreen
 } from '../../assets';

import ExpenseTrackingPDF from '../../assets/downloadables/expense-tracking-worksheet.pdf';
import BudgetPlanningPDF from '../../assets/downloadables/budget-planning-worksheet.pdf';


const MaterialsPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'Calculators' | 'Worksheets' | 'Checklists'>('Calculators');
  const [showCalculator, setShowCalculator] = useState<string | null>(null);
  const [showChecklist, setShowChecklist] = useState<string | null>(null);
  const [showWorksheet, setShowWorksheet] = useState<string | null>(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const calculators = [
    {
      id: 'mortgage',
      title: 'Mortgage Calculator',
      description: 'Calculate your estimated monthly mortgage payments based on loan amount, interest rate, and term.',
      icon: MaterialHomeIcon
    },
    {
      id: 'debt-to-income',
      title: 'Debt-to-Income Calculator',
      description: 'Determine your debt-to-income ratio to understand your borrowing capacity.',
      icon: ScalesIcon
    },
    {
      id: 'credit-score',
      title: 'Credit Score Calculator',
      description: 'Estimate your credit score improvement based on your financial actions.',
      icon: ChartIcon
    }
  ];

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

  // Worksheet info data for the InfoModal
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

  const checklists = [
    {
      id: 'first-time-buyer',
      title: 'First-Time Homebuyer Checklist',
      description: 'Complete guide for first-time homebuyers with essential steps and considerations.',
      icon: ToDoListIcon
    },
    {
      id: 'home-inspection',
      title: 'Home Inspection Checklist',
      description: 'Ensure you don\'t miss any important details during your home inspection.',
      icon: SearchIcon
    }
  ];

  const categories = [
    {
      id: 'Calculators' as const,
      title: 'Calculators',
      description: 'Financial calculation tools',
      icon: CalculatorIcon
    },
    {
      id: 'Worksheets' as const,
      title: 'Worksheets',
      description: 'Download and track your progress',
      icon: DocumentIcon
    },
    {
      id: 'Checklists' as const,
      title: 'Checklists',
      description: 'Step-by-step guides',
      icon: ChecklistIcon
    }
  ];

  const handleCalculatorClick = (calculatorId: string) => {
    setShowCalculator(calculatorId);
    setShowChecklist(null);
    setShowWorksheet(null);
  };

  const handleChecklistClick = (checklistId: string) => {
    setShowChecklist(checklistId);
    setShowCalculator(null);
    setShowWorksheet(null);
  };

  const handleWorksheetInfoClick = (worksheetId: string) => {
    setShowWorksheet(worksheetId);
    setIsInfoModalOpen(true);
  };

  const handleCategoryClick = (categoryId: 'Calculators' | 'Worksheets' | 'Checklists') => {
    setActiveCategory(categoryId);
    setShowCalculator(null);
    setShowChecklist(null);
    setShowWorksheet(null);
  };

   const handleWorksheetDownload = (worksheetId: string) => {
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
    <div className="flex justify-between items-center mb-8 mr-8">
      <div>
        <RobotoFont as="h1" weight={700} className="text-2xl text-gray-900 mb-2">
          Materials
        </RobotoFont>
        <RobotoFont className="text-gray-600 text-sm">
          Financial tools and resources to help with your homeownership journey
        </RobotoFont>
      </div>
      
      {/* Category Cards */}
      <div className="flex gap-4">
        {categories.map((category) => {
          const getCategoryColors = (categoryId: string) => {
            switch (categoryId) {
              case 'Calculators':
                return {
                  iconBg: 'bg-blue-600',
                  activeBorder: 'border-blue-500',
                  activeBg: 'bg-blue-50',
                  hoverBorder: 'hover:border-blue-300',
                  hoverBg: 'hover:bg-blue-25'
                };
              case 'Worksheets':
                return {
                  iconBg: 'bg-green-600',
                  activeBorder: 'border-green-500',
                  activeBg: 'bg-green-50',
                  hoverBorder: 'hover:border-green-300',
                  hoverBg: 'hover:bg-green-25'
                };
              case 'Checklists':
                return {
                  iconBg: 'bg-purple-600',
                  activeBorder: 'border-purple-500',
                  activeBg: 'bg-purple-50',
                  hoverBorder: 'hover:border-purple-300',
                  hoverBg: 'hover:bg-purple-25'
                };
              default:
                return {
                  iconBg: 'bg-gray-600',
                  activeBorder: 'border-gray-500',
                  activeBg: 'bg-gray-50',
                  hoverBorder: 'hover:border-gray-300',
                  hoverBg: 'hover:bg-gray-25'
                };
            }
          };

          const colors = getCategoryColors(category.id);

          return (
            <div
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className={`rounded-lg border-2 p-4 cursor-pointer transition-all duration-200 min-w-[140px] ${
                activeCategory === category.id
                  ? `${colors.activeBorder} ${colors.activeBg}` 
                  : `border-gray-200 bg-white ${colors.hoverBorder} ${colors.hoverBg}`
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${colors.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <img 
                    src={category.icon} 
                    alt={category.title}
                    className="w-5 h-5"
                    style={{ filter: 'brightness(0) invert(1)' }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <RobotoFont as="h3" weight={600} className="text-sm text-gray-900 truncate">
                    {category.title}
                  </RobotoFont>
                  <RobotoFont className="text-xs text-gray-600 truncate">
                    {category.description}
                  </RobotoFont>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const MaterialCard = ({ 
    item, 
    colorClass, 
    onAction, 
    actionText, 
    actionIcon,
    secondaryAction = null,
    showInfoButton = false,
    onInfoClick
  }: { 
    item: any;
    colorClass: string;
    onAction: (id: any) => void;
    actionText: string;
    actionIcon?: React.ReactNode;
    secondaryAction?: { text: string; icon: React.ReactNode; onClick: (id: any) => void } | null;
    showInfoButton?: boolean;
    onInfoClick?: (id: any) => void;
  }) => (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center hover:shadow-lg transition-all duration-200 relative">
      {/* Info Button */}
      {showInfoButton && onInfoClick && (
        <div className="absolute top-4 right-4">
          <button
            onClick={() => onInfoClick(item.id)}
            className="flex items-center justify-center w-10 h-10 bg-white hover:bg-gray-50 border border-gray-200 rounded-full shadow-sm transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            title="More information about this worksheet"
          >
            <img src={InfoGreen} alt="Info" className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="mb-6">
        <div className={`w-20 h-20 ${colorClass} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
            <img 
              src={item.icon} 
              alt={item.title}
              className="w-8 h-8"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
        </div>
        <RobotoFont as="h3" weight={600} className="text-xl text-gray-900 mb-3">
          {item.title}
        </RobotoFont>
        <RobotoFont className="text-gray-600 text-sm leading-relaxed">
          {item.description}
        </RobotoFont>
      </div>
      
      {secondaryAction ? (
        <div className="flex gap-3">
          <button 
            onClick={() => onAction(item.id)}
            className={`flex-1 ${colorClass.replace('bg-', 'bg-')} text-white py-3 px-6 rounded-xl font-medium hover:${colorClass.replace('bg-', 'bg-').replace('600', '700')} transition-colors flex items-center justify-center gap-2`}
          >
            <RobotoFont weight={500}>
              {actionIcon}
              {actionText}
            </RobotoFont>
          </button>
          <button 
            onClick={() => secondaryAction.onClick(item.id)}
            className={`flex-1 bg-white text-${colorClass.replace('bg-', '').replace('600', '600')} py-3 px-6 rounded-xl font-medium border border-${colorClass.replace('bg-', '').replace('600', '600')} hover:bg-${colorClass.replace('bg-', '').replace('600', '50')} transition-colors flex items-center justify-center gap-2`}
          >
            <RobotoFont weight={500}>
              {secondaryAction.icon}
              {secondaryAction.text}
            </RobotoFont>
          </button>
        </div>
      ) : (
        <button 
          onClick={() => onAction(item.id)}
          className={`w-full ${colorClass} text-white py-3 px-6 rounded-xl font-medium hover:${colorClass.replace('600', '700')} transition-colors flex items-center justify-center gap-2`}
        >
          <RobotoFont weight={500}>
            {actionIcon}
            {actionText}
          </RobotoFont>
        </button>
      )}
    </div>
  );

  const renderActiveComponent = () => {
    if (showCalculator === 'mortgage') return <MortgageCalculator />;
    if (showCalculator === 'debt-to-income') return <DebtToIncomeCalculator />;
    if (showCalculator === 'credit-score') return <CreditScoreCalculator />;
    if (showChecklist === 'first-time-buyer') return <FirstTimeBuyerChecklist />;
    if (showChecklist === 'home-inspection') return <HomeInspectionChecklist />;
    return null;
  };

  const activeComponent = renderActiveComponent();

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        <HeaderSection />
        
        {activeComponent ? (
          activeComponent
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Calculators */}
            {activeCategory === 'Calculators' && calculators.map((calculator) => (
              <MaterialCard
                key={calculator.id}
                item={calculator}
                colorClass="bg-blue-600"
                onAction={handleCalculatorClick}
                actionText="Use Calculator"
              />
            ))}

            {/* Worksheets */}
            {activeCategory === 'Worksheets' && worksheets.map((worksheet) => (
              <MaterialCard
                key={worksheet.id}
                item={worksheet}
                colorClass="bg-green-600"
                onAction={handleWorksheetDownload}
                actionText="Download"
                actionIcon={
                  <img src={ShareIcon} alt="Download" className="w-4 h-4" />
                }
                secondaryAction={{
                  text: "Preview",
                  icon: (
                    <img src={SearchIcon} alt="Preview" className="w-4 h-4" />
                  ),
                  onClick: handleWorksheetPreview
                }}
                showInfoButton={true}
                onInfoClick={handleWorksheetInfoClick}
              />
            ))}

            {/* Checklists */}
            {activeCategory === 'Checklists' && checklists.map((checklist) => (
              <MaterialCard
                key={checklist.id}
                item={checklist}
                colorClass="bg-purple-600"
                onAction={handleChecklistClick}
                actionText="Use Checklist"
                actionIcon={
                  <img src={ChecklistIcon} alt="Checklist" className="w-4 h-4" />
                }
              />
            ))}
          </div>
        )}
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

export default MaterialsPage;