import React, { useState, useEffect, useMemo } from 'react';
import { useModules } from '../../../hooks/useModules';
import LessonView from './LessonView';
import ModuleQuizView from './ModuleQuizView';
import { Module} from '../../../types/modules.backup';
import { SignupImage } from '../../../assets';
import { getOnboardingProgress } from '../../../services/onBoardingAPI';
import { useOnboardingStatus } from '../../../hooks/queries/useOnboardingStatus';
import { useModules as useModulesQuery } from '../../../hooks/queries/useLearningQueries';

const sampleModulesData: Module[] = [
  {
    id: 1,
    image: SignupImage,
    title: "Readiness and Decision Making",
    description: "In this module, you'll learn about the precursor steps to prepare for home ownership.",
    lessonCount: 3,
    status: "In Progress",
    tags: ["Beginner", "Finance"],
    illustration: "readiness",
    lessons: [
      {
        id: 1,
        image: SignupImage,
        title: "Mindset and Financial Readiness",
        duration: "20 minutes",
        description: "Get your head in the game—and your wallet in shape—before you shop for your dream home.",
        coins: 25,
        completed: false,
        videoUrl: "https://example.com/video1.mp4",
        transcript: `Welcome to this module on Readiness and Decision Making in your homeownership journey. 
        Buying a home is one of the most significant financial and emotional decisions you'll make. 
        So before diving into listings and neighborhood visits, it's important to take a step back and assess your personal and financial readiness. 
        That means understanding your current income, savings, debt, and how stable your job or life situation is. 
        Are you ready to stay in one place for at least a few years? Do you feel comfortable with the idea of taking on a mortgage and the responsibilities that come with home maintenance? 
        In this module, we'll walk through key decision-making frameworks to help you evaluate trade-offs — like buying vs. renting, location vs. size, or price vs. future growth. 
        You'll also learn how to differentiate between emotional impulses and data-driven choices. Remember, the goal isn't just to buy a house, it's to buy the right house for your lifestyle and goals. 
        By the end of this section, you'll have a clearer picture of where you stand and what steps to take next to move forward confidently. 
        We'll also help you identify the people and tools that can support your decision-making process. From real estate agents and loan officers to online calculators and budgeting apps — knowing who to trust and when to ask for help can make the journey smoother and less overwhelming. 
        You don't have to figure it all out alone. Think of this phase as laying the foundation — not just for your future home, but for a more informed, confident version of yourself as a buyer. Let's get started by exploring what "readiness" really means in practice.`
      },
      {
        id: 2,
        image: SignupImage,
        title: "Credit and Financial Foundations",
        duration: "20 minutes",
        description: "Build and protect the credit score that unlocks your dream home.",
        coins: 25,
        completed: false
      },
      {
        id: 3,
        image: SignupImage,
        title: "Real Estate Terminology 101",
        duration: "20 minutes",
        description: "Speak the language of real estate with confidence—decode key terms, know who does what, and spot fees before they surprise you.",
        coins: 25,
        completed: false
      }
    ]
  },
  {
    id: 2,
    image: SignupImage,
    title: "Budgeting and Mortgage Preparation",
    description: "Learn how to budget for your home purchase and understand mortgage options.",
    lessonCount: 4,
    status: "Not Started",
    tags: ["Beginner", "Finance"],
    illustration: "budgeting",
    lessons: [
      {
        id: 4,
        image: SignupImage,
        title: "Understanding Your Budget",
        duration: "25 minutes",
        description: "Learn to calculate what you can actually afford.",
        coins: 30,
        completed: false
      },
      {
        id: 5,
        image: SignupImage,
        title: "Mortgage Types and Terms",
        duration: "30 minutes",
        description: "Explore different mortgage options available to you.",
        coins: 30,
        completed: false
      },
      {
        id: 6,
        image: SignupImage,
        title: "Pre-approval Process",
        duration: "20 minutes",
        description: "Get ready for mortgage pre-approval.",
        coins: 25,
        completed: false
      },
      {
        id: 7,
        image: SignupImage,
        title: "Down Payment Strategies",
        duration: "25 minutes",
        description: "Explore different approaches to saving for a down payment.",
        coins: 30,
        completed: false
      }
    ]
  },
  {
    id: 3,
    image: SignupImage,
    title: "Home Buying Process",
    description: "Understand the steps involved in buying a home.",
    lessonCount: 3,
    status: "Not Started",
    tags: ["Beginner", "Process"],
    illustration: "home-buying",
    lessons: [
      {
        id: 8,
        image: SignupImage,
        title: "The Home Buying Timeline",
        duration: "30 minutes",
        description: "Learn about the typical timeline for buying a home.",
        coins: 30,
        completed: false
      },
      {
        id: 9,
        image: SignupImage,
        title: "Working with Real Estate Agents",
        duration: "25 minutes",
        description: "Understand the role of real estate agents in the buying process.",
        coins: 25,
        completed: false
      },
      {
        id: 10,
        image: SignupImage,
        title: "Making an Offer",
        duration: "20 minutes",
        description: "Learn how to make a competitive offer on a home.",
        coins: 25,
        completed: false
      }
    ]
  },
  {
    id: 4,
    image: SignupImage,
    title: "Home Maintenance Basics",
    description: "Learn essential home maintenance skills to protect your investment.",
    lessonCount: 3,
    status: "Not Started",
    tags: ["Beginner", "Maintenance"],
    illustration: "home-maintenance",
    lessons: [
      {
        id: 11,
        image: SignupImage,
        title: "Seasonal Maintenance Checklist",
        duration: "25 minutes",
        description: "Stay ahead of home maintenance with this seasonal checklist.",
        coins: 30,
        completed: false
      },
      {
        id: 12,
        image: SignupImage,
        title: "Emergency Repairs",
        duration: "20 minutes",
        description: "Know what to do when things go wrong.",
        coins: 25,
        completed: false
      },
      {
        id: 13,
        image: SignupImage,
        title: "Finding Reliable Contractors",
        duration: "25 minutes",
        description: "Learn how to find and work with trusted professionals.",
        coins: 25,
        completed: false
      }
    ]
  }
];

const convertBackendModuleToFrontend = (backendModule: any): Module => {
  return {
    id: parseInt(backendModule.id.slice(-1)) || Math.floor(Math.random() * 1000),
    backendId: backendModule.id,
    image: backendModule.thumbnail_url || SignupImage,
    title: backendModule.title,
    description: backendModule.description,
    lessonCount: backendModule.lesson_count || 0,
    status: backendModule.progress_percentage === "100" ? 'Completed' : 
            backendModule.progress_percentage === "0" ? 'Not Started' : 'In Progress',
    tags: [backendModule.difficulty_level || 'Beginner'],
    illustration: backendModule.illustration || "default",
    lessons: []
  };
};

const PlaceholderModulesView: React.FC<{ moduleCount: number }> = ({ moduleCount }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto text-center p-8">
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Coming Soon: Gamified Learning Experience</h1>
          <p className="text-lg text-gray-600 mb-6">
            We're preparing an exciting new way to learn with maps, neighborhoods, and interactive experiences!
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">What's Coming</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <h3 className="font-medium text-gray-900">Map-Based Navigation</h3>
                <p className="text-sm text-gray-600">Explore modules through an interactive map interface</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <h3 className="font-medium text-gray-900">House Structures</h3>
                <p className="text-sm text-gray-600">Enter houses containing lessons and minigames</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div>
                <h3 className="font-medium text-gray-900">Neighborhood Progression</h3>
                <p className="text-sm text-gray-600">Progress through different homebuying journey stages</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
              <div>
                <h3 className="font-medium text-gray-900">Coin System & Leaderboard</h3>
                <p className="text-sm text-gray-600">Earn coins and compete on regional leaderboards</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-blue-800 font-medium">
            Data Verification: {moduleCount} modules loaded successfully
          </p>
          <p className="text-blue-600 text-sm mt-1">
            All your learning progress and data will be preserved in the new experience
          </p>
        </div>
      </div>
    </div>
  );
};

const ModulesPage: React.FC = () => {
  const {
    currentView,
    selectedModuleId,
    selectedLessonId,
    goToModules,
  } = useModules();

  const { data: onboardingStatusData } = useOnboardingStatus();
  const { data: backendModules, isLoading: isLoadingModules, error: modulesError } = useModulesQuery();

  const [backendModulesData, setBackendModulesData] = useState<Module[]>([]);
  const [onboardingRequired, setOnboardingRequired] = useState(false);

  const [_onboardingStatus, setOnboardingStatus] = useState<{
    isCompleted: boolean;
    currentStep: number;
    progressPercentage: number;
  } | null>(null);

  useEffect(() => {
    if (!onboardingStatusData) {
      return;
    }

    console.log('ModulesPage: Checking onboarding status first...');
    console.log('ModulesPage: Onboarding status:', onboardingStatusData);

    const status = {
      isCompleted: onboardingStatusData.completed,
      currentStep: onboardingStatusData.step || 1,
      progressPercentage: getOnboardingProgress(onboardingStatusData)
    };

    setOnboardingStatus(status);

    if (!status.isCompleted) {
      console.log('ModulesPage: Onboarding not completed, showing banner');
      setOnboardingRequired(true);
      return;
    }

    if (backendModules && Array.isArray(backendModules) && backendModules.length > 0) {
      console.log('ModulesPage: Backend modules received:', backendModules);
      const convertedModules = backendModules.map(convertBackendModuleToFrontend);
      setBackendModulesData(convertedModules);
      console.log('ModulesPage: Successfully converted backend modules:', convertedModules);
    }

    if (modulesError) {
      console.error('ModulesPage: Error fetching modules from backend:', modulesError);
      if (modulesError instanceof Error && modulesError.message === 'ONBOARDING_REQUIRED') {
        setOnboardingStatus({
          isCompleted: false,
          currentStep: 1,
          progressPercentage: 0
        });
        setOnboardingRequired(true);
        console.log('ModulesPage: User needs to complete onboarding first');
      }
    }
  }, [onboardingStatusData, backendModules, modulesError]);

  const renderBackendStatus = () => {
    if (isLoadingModules) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-blue-700">Loading modules from backend...</span>
          </div>
        </div>
      );
    }

    if (onboardingRequired) {
      return null;
    }

    if (modulesError && !onboardingRequired) {
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-amber-800 font-medium">Backend Connection Issue</h4>
              <p className="text-amber-700 text-sm mt-1">
                {modulesError instanceof Error ? modulesError.message : 'Failed to load modules'}
              </p>
              <p className="text-amber-600 text-xs mt-1">Using sample data for now.</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-amber-600 text-white px-3 py-1 rounded text-sm hover:bg-amber-700"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    if (backendModulesData.length > 0) {
      console.log(`Successfully loaded ${backendModulesData.length} modules from backend`);
      return null;
    }

    return null;
  };

  const modulesToDisplay = useMemo(() => {    
    return backendModulesData.length > 0 
      ? (() => {
          console.log('Using backend modules data');
          return backendModulesData;
        })()
      : (() => {
          console.log('Using frontend sample data');
          return sampleModulesData;
        })();
  }, [backendModulesData]);

  const currentModule = useMemo(() => {
    if (!selectedModuleId) {
      return null;
    }
    
    const module = modulesToDisplay.find(m => m.id === selectedModuleId) || null;
    return module;
  }, [selectedModuleId, modulesToDisplay]);

  const currentLesson = useMemo(() => {
    if (!selectedLessonId || !currentModule) {
      return null;
    }
    
    if (!currentModule.lessons || currentModule.lessons.length === 0) {
      return null;
    }
  
    let lesson = currentModule.lessons.find(l => l.id === selectedLessonId);
    
    if (!lesson) {
      lesson = currentModule.lessons.find(l => l.id.toString() === selectedLessonId.toString());
    }
    
    if (!lesson && typeof selectedLessonId === 'string') {
      lesson = currentModule.lessons.find(l => l.id === parseInt(selectedLessonId));
    }

    if (!lesson && currentModule.lessons.length > 0) {
      lesson = currentModule.lessons[0];
    }
    
    return lesson || null;
  }, [selectedLessonId, currentModule]);

  const handleBackToModules = () => {
    goToModules();
  };

  return (
    <>
      {renderBackendStatus()}
      {currentView === 'modules' && (
        <PlaceholderModulesView moduleCount={modulesToDisplay.length} />
      )}
      {currentView === 'lesson' && currentLesson && currentModule && (
        <LessonView 
          lesson={currentLesson}
          module={currentModule}
          onBack={handleBackToModules}
        />
      )}
      {currentView === 'quiz' && currentModule && (
        <ModuleQuizView 
          module={currentModule}
          onBack={handleBackToModules}
        />
      )}
      {currentView === 'moduleQuiz' && currentModule && (
        <ModuleQuizView 
          module={currentModule}
          onBack={handleBackToModules}
        />
      )}
    </>
  );
};

export default ModulesPage;