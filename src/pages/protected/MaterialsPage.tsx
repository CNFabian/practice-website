import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import RobotoFont from '../../assets/fonts';
import { 
  MortgageCalculator, 
  DebtToIncomeCalculator, 
  CreditScoreCalculator,
  FirstTimeBuyerChecklist,
  HomeInspectionChecklist,
} from '../../components';
import InfoModal from '../../components/protected/materials/InfoModal';
import { 
  CalculatorIcon, 
  ChecklistIcon, 
  ControllerIcon,
  MaterialHomeIcon, 
  ScalesIcon, 
  ChartIcon,
  ToDoListIcon,
  InfoPurple
 } from '../../assets';

import { 
  getAvailableCalculators, 
  getMaterialChecklists, 
} from '../../services/materialsAPI';

const MaterialsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get('category') as 'Calculators' | 'Checklists' | 'Minigames' | null;
  
  const [activeCategory, setActiveCategory] = useState<'Calculators' | 'Checklists' | 'Minigames'>(
    categoryFromUrl || 'Calculators'
  );
  const [showCalculator, setShowCalculator] = useState<string | null>(null);
  const [showChecklist, setShowChecklist] = useState<string | null>(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Backend integration state
  const [isLoadingBackend, setIsLoadingBackend] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [backendCalculators, setBackendCalculators] = useState<any[]>([]);
  const [backendChecklists, setBackendChecklists] = useState<any[]>([]);

  useEffect(() => {
    console.log('URL changed - categoryFromUrl:', categoryFromUrl);
    if (categoryFromUrl) {
      setActiveCategory(categoryFromUrl);
    }
  }, [categoryFromUrl]);

  // Fetch backend data when component mounts
  useEffect(() => {
    fetchBackendMaterials();
  }, []);

  const fetchBackendMaterials = async () => {
    setIsLoadingBackend(true);
    setBackendError(null);

    try {
      console.log('Fetching materials from backend...');

      // Fetch calculators
      try {
        const calculatorsData = await getAvailableCalculators();
        console.log('Backend calculators received:', calculatorsData);
        setBackendCalculators(Array.isArray(calculatorsData) ? calculatorsData : []);
      } catch (error) {
        console.error('Error fetching calculators:', error);
      }

      // Fetch checklists
      try {
        const checklistsData = await getMaterialChecklists();
        console.log('Backend checklists received:', checklistsData);
        setBackendChecklists(Array.isArray(checklistsData) ? checklistsData : []);
      } catch (error) {
        console.error('Error fetching checklists:', error);
      }

    } catch (error) {
      console.error('Error fetching backend materials:', error);
      setBackendError('Failed to load materials from backend');
    } finally {
      setIsLoadingBackend(false);
    }
  };

  // Frontend fallback data
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

  const checklistInfoData = {
    'first-time-buyer': {
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
    },
    'home-inspection': {
      title: 'Home Inspection Checklist',
      description: 'Comprehensive checklist to ensure you don\'t miss critical areas during inspection.',
      howToUse: [
        'Schedule the inspection after your offer is accepted',
        'Attend the inspection to ask questions and take notes',
        'Check each system methodically (electrical, plumbing, HVAC)',
        'Document any issues with photos and detailed descriptions',
        'Review findings with the inspector before they leave',
        'Use results to negotiate repairs or price adjustments'
      ],
      howToUseTitle: 'How to Conduct a Thorough Inspection',
      terms: [
        {
          term: 'HVAC System',
          definition: 'Heating, Ventilation, and Air Conditioning system'
        },
        {
          term: 'Foundation Issues',
          definition: 'Problems with the structural base of the home'
        },
        {
          term: 'Code Violations',
          definition: 'Areas that don\'t meet current building code standards'
        },
        {
          term: 'Contingency Period',
          definition: 'Time allowed to complete inspection and request repairs'
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
      icon: ToDoListIcon
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
      id: 'Checklists' as const,
      title: 'Checklists',
      description: 'Step-by-step guides',
      icon: ChecklistIcon
    },
    {
      id: 'Minigames' as const,
      title: 'Minigames',
      description: 'Interactive learning games',
      icon: ControllerIcon
    }
  ];

  // Merge backend data with frontend fallback
  const getDisplayData = (category: string) => {
    switch (category) {
      case 'Calculators':
        return backendCalculators.length > 0 ? backendCalculators : calculators;
      case 'Checklists':
        return backendChecklists.length > 0 ? backendChecklists : checklists;
      case 'Minigames':
        return [];
      default:
        return [];
    }
  };

  const handleCalculatorClick = (calculatorId: string) => {
    setShowCalculator(calculatorId);
    setShowChecklist(null);
  };

  const handleChecklistClick = (checklistId: string) => {
    setShowChecklist(checklistId);
    setShowCalculator(null);
  };

  const handleChecklistInfoClick = (checklistId: string) => {
    setShowChecklist(checklistId);
    setIsInfoModalOpen(true);
  };

  const handleCategoryClick = (categoryId: 'Calculators' | 'Checklists' | 'Minigames') => {
    setActiveCategory(categoryId);
    setShowCalculator(null);
    setShowChecklist(null);
  };

  const HeaderSection = () => (
    <div className="flex justify-between items-center mb-8">
      <div>
        <RobotoFont as="h1" weight={700} className="text-2xl text-gray-900 mb-2">
          Materials
        </RobotoFont>
        <RobotoFont className="text-gray-600 text-sm">
          Financial tools and resources to help with your homeownership journey
        </RobotoFont>
        
        {/* Backend Error Banner */}
        {backendError && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <div className="text-yellow-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-2">
                <RobotoFont className="text-xs text-yellow-800">
                  Backend unavailable - using offline materials
                </RobotoFont>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Category Cards */}
      <div className="flex gap-2 ml-10">
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
              case 'Checklists':
                return {
                  iconBg: 'bg-purple-600',
                  activeBorder: 'border-purple-500',
                  activeBg: 'bg-purple-50',
                  hoverBorder: 'hover:border-purple-300',
                  hoverBg: 'hover:bg-purple-25'
                };
              case 'Minigames':
                return {
                  iconBg: 'bg-orange-600',
                  activeBorder: 'border-orange-500',
                  activeBg: 'bg-orange-50',
                  hoverBorder: 'hover:border-orange-300',
                  hoverBg: 'hover:bg-orange-25'
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
              onMouseEnter={() => setHoveredCategory(category.id)}
              onMouseLeave={() => setHoveredCategory(null)}
              className={`rounded-lg border-2 p-4 cursor-pointer transition-all duration-200 relative ${
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
                <div className="min-w-0">
                  <RobotoFont as="h3" weight={600} className="text-sm text-gray-900 truncate">
                    {category.title}
                  </RobotoFont>
                </div>
              </div>

              {/* Tooltip */}
              {hoveredCategory === category.id && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50">
                  <div className="bg-gray-100 border border-gray-200 text-gray-700 text-xs rounded-lg py-2 px-3 shadow-lg whitespace-nowrap">
                    <RobotoFont className="text-gray-700">
                      {category.description}
                    </RobotoFont>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-100"></div>
                  </div>
                </div>
              )}
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
    showInfoButton = false,
    onInfoClick,
  }: { 
    item: any;
    colorClass: string;
    onAction: (id: any) => void;
    actionText: string;
    actionIcon?: React.ReactNode;
    showInfoButton?: boolean;
    onInfoClick?: (id: any) => void;
  }) => {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 xl:p-8 text-center hover:shadow-lg transition-all duration-200 relative max-w-lg mx-auto">
        {/* Info Button */}
        {showInfoButton && onInfoClick && (
          <div className="absolute top-4 right-4">
            <button
              onClick={() => onInfoClick(item.id)}
              className="flex items-center justify-center w-10 h-10 bg-white hover:bg-gray-50 border border-gray-200 rounded-full shadow-sm transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              title="More information about this checklist"
            >
              <img src={InfoPurple} alt="Info" style={{ width: '1.25rem', height: '1.25rem' }} />
            </button>
          </div>
        )}

        <div className="mb-6">
          <div className={`w-16 h-16 xl:w-20 xl:h-20 ${colorClass} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
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
        
        <button 
          onClick={() => onAction(item.id)}
          className={`w-full ${colorClass} text-white py-3 px-6 rounded-xl font-medium hover:${colorClass.replace('600', '700')} transition-colors flex items-center justify-center gap-2`}
        >
          {actionIcon}
          <RobotoFont as="span" weight={500}>
            {actionText}
          </RobotoFont>
        </button>
      </div>
    );
  };

  const renderActiveComponent = () => {
    if (showCalculator === 'mortgage') return (
      <div className="relative">
        <button
          onClick={() => setShowCalculator(null)}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
        >
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <MortgageCalculator />
      </div>
    );
    if (showCalculator === 'debt-to-income') return (
      <div className="relative">
        <button
          onClick={() => setShowCalculator(null)}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
        >
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <DebtToIncomeCalculator />
      </div>
    );
    if (showCalculator === 'credit-score') return (
      <div className="relative">
        <button
          onClick={() => setShowCalculator(null)}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
        >
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <CreditScoreCalculator />
      </div>
    );
    if (showChecklist === 'first-time-buyer') return (
      <div className="relative">
        <button
          onClick={() => setShowChecklist(null)}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
        >
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <FirstTimeBuyerChecklist />
      </div>
    );
    if (showChecklist === 'home-inspection') return (
      <div className="relative">
        <button
          onClick={() => setShowChecklist(null)}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
        >
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <HomeInspectionChecklist />
      </div>
    );
    return null;
  };

  const activeComponent = renderActiveComponent();

  const getCurrentItems = () => {
    if (activeCategory === 'Calculators') return getDisplayData('Calculators');
    if (activeCategory === 'Checklists') return getDisplayData('Checklists');
    if (activeCategory === 'Minigames') return [];
    return [];
  };

  const currentItems = getCurrentItems();

  // Show loading state for initial backend fetch
  if (isLoadingBackend && backendCalculators.length === 0 && backendChecklists.length === 0) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="p-6">
          <HeaderSection />
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-3 text-gray-600">Loading materials...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        <HeaderSection />
        
        {activeComponent ? (
          activeComponent
        ) : (
          <div className={`grid gap-6 ${
            currentItems.length <= 3 
              ? 'grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 max-w-6xl mx-auto' 
              : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
          }`}>
            {/* Calculators */}
            {activeCategory === 'Calculators' && currentItems.map((calculator) => (
              <MaterialCard
                key={calculator.id}
                item={calculator}
                colorClass="bg-blue-600"
                onAction={handleCalculatorClick}
                actionText="Use Calculator"
              />
            ))}

            {/* Checklists */}
            {activeCategory === 'Checklists' && currentItems.map((checklist) => (
              <MaterialCard
                key={checklist.id}
                item={checklist}
                colorClass="bg-purple-600"
                onAction={handleChecklistClick}
                actionText="Use Checklist"
                showInfoButton={true}
                onInfoClick={handleChecklistInfoClick}
              />
            ))}

            {/* Minigames */}
            {activeCategory === 'Minigames' && (
              <div className="col-span-full text-center py-12">
                <RobotoFont className="text-gray-500 text-lg">
                  Minigames coming soon!
                </RobotoFont>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info Modal for Checklists */}
      {showChecklist && (
        <InfoModal
          isOpen={isInfoModalOpen}
          onClose={() => {
            setIsInfoModalOpen(false);
            setShowChecklist(null);
          }}
          title={checklistInfoData[showChecklist as keyof typeof checklistInfoData]?.title || ''}
          description={checklistInfoData[showChecklist as keyof typeof checklistInfoData]?.description || ''}
          howToUse={checklistInfoData[showChecklist as keyof typeof checklistInfoData]?.howToUse || []}
          howToUseTitle={checklistInfoData[showChecklist as keyof typeof checklistInfoData]?.howToUseTitle || ''}
          terms={checklistInfoData[showChecklist as keyof typeof checklistInfoData]?.terms || []}
        />
      )}
    </div>
  );
};

export default MaterialsPage;