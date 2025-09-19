import React, { useState } from 'react';
import { 
  MortgageCalculator, 
  DebtToIncomeCalculator, 
  CreditScoreCalculator,
  FirstTimeBuyerChecklist,
  HomeInspectionChecklist
} from '../../components';
import { CalculatorIcon, DocumentIcon, ChecklistIcon, MaterialHomeIcon, ScalesIcon, ChartIcon } from '../../assets';

const MaterialsPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'Calculators' | 'Worksheets' | 'Checklists'>('Calculators');
  const [showCalculator, setShowCalculator] = useState<string | null>(null);
  const [showChecklist, setShowChecklist] = useState<string | null>(null);

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
      id: 'first-time-buyer',
      title: 'First-Time Homebuyer Checklist',
      description: 'Complete guide for first-time homebuyers with essential steps and considerations.',
      icon: '🏠'
    },
    {
      id: 'home-inspection',
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
  };

  const handleChecklistClick = (checklistId: string) => {
    setShowChecklist(checklistId);
    setShowCalculator(null);
  };

  const handleCategoryClick = (categoryId: 'Calculators' | 'Worksheets' | 'Checklists') => {
    setActiveCategory(categoryId);
    setShowCalculator(null);
    setShowChecklist(null);
  };

  // Reusable Header Component
  const HeaderSection = () => (
    <div className="flex justify-between items-center mb-8 mr-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Materials
        </h1>
        <p className="text-gray-600 text-sm">
          Financial tools and resources to help with your homeownership journey
        </p>
      </div>
      
      {/* Category Cards */}
      <div className="flex gap-3">
        {categories.map((category) => (
          <div
            key={category.id}
            onClick={() => handleCategoryClick(category.id)}
            className={`rounded-lg border-2 p-3 cursor-pointer transition-all duration-200 ${
              activeCategory === category.id
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-25'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <img 
                  src={category.icon} 
                  alt={category.title}
                  className="w-4 h-4"
                  style={{ filter: 'brightness(0) invert(1)' }}
                />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {category.title}
                </h3>
                <p className="text-xs text-gray-600">
                  {category.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Reusable Material Card Component
  const MaterialCard = ({ 
    item, 
    colorClass, 
    onAction, 
    actionText, 
    actionIcon,
    secondaryAction = null 
  }: { 
    item: any;
    colorClass: string;
    onAction: (id: any) => void;
    actionText: string;
    actionIcon?: React.ReactNode;
    secondaryAction?: { text: string; icon: React.ReactNode; onClick: (id: any) => void } | null;
  }) => (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center hover:shadow-lg transition-all duration-200">
      <div className="mb-6">
        <div className={`w-20 h-20 ${colorClass} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
            <img 
              src={item.icon} 
              alt={item.title}
              className="w-8 h-8"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          {item.title}
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed">
          {item.description}
        </p>
      </div>
      
      {secondaryAction ? (
        <div className="flex gap-3">
          <button 
            onClick={() => onAction(item.id)}
            className={`flex-1 ${colorClass.replace('bg-', 'bg-')} text-white py-3 px-6 rounded-xl font-medium hover:${colorClass.replace('bg-', 'bg-').replace('600', '700')} transition-colors flex items-center justify-center gap-2`}
          >
            {actionIcon}
            {actionText}
          </button>
          <button 
            onClick={() => secondaryAction.onClick(item.id)}
            className={`flex-1 bg-white text-${colorClass.replace('bg-', '').replace('600', '600')} py-3 px-6 rounded-xl font-medium border border-${colorClass.replace('bg-', '').replace('600', '600')} hover:bg-${colorClass.replace('bg-', '').replace('600', '50')} transition-colors flex items-center justify-center gap-2`}
          >
            {secondaryAction.icon}
            {secondaryAction.text}
          </button>
        </div>
      ) : (
        <button 
          onClick={() => onAction(item.id)}
          className={`w-full ${colorClass} text-white py-3 px-6 rounded-xl font-medium hover:${colorClass.replace('600', '700')} transition-colors flex items-center justify-center gap-2`}
        >
          {actionIcon}
          {actionText}
        </button>
      )}
    </div>
  );

  // Render calculator or checklist components
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
                onAction={() => {}} // Download functionality
                actionText="Download"
                actionIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
                secondaryAction={{
                  text: "Preview",
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ),
                  onClick: () => {} // Preview functionality
                }}
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
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MaterialsPage;