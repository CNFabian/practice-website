import React, { useState, useEffect, useMemo } from 'react';
import { useModules } from '../../../hooks/useModules';
import ModulesView from './ModulesView';
import LessonView from './LessonView';
import ModuleQuizView from './ModuleQuizView';
import { Module, Lesson } from '../../../types/modules';
import { SignupImage } from '../../../assets';
import { getOnboardingProgress } from '../../../services/onBoardingAPI';
import { useOnboardingStatus } from '../../../hooks/queries/useOnboardingStatus';
import { useModules as useModulesQuery } from '../../../hooks/queries/useLearningQueries';

// Sample module quiz questions for testing
const sampleModuleQuizQuestions = [
  {
    id: 1,
    question: "What is the main goal of this module?",
    image: null,
    options: [
      { id: 'a', text: "To learn basic concepts", isCorrect: true },
      { id: 'b', text: "To complete assignments", isCorrect: false },
      { id: 'c', text: "To earn coins", isCorrect: false },
      { id: 'd', text: "To watch videos", isCorrect: false }
    ],
    explanation: {
      correct: "Great! The main goal is to understand and apply the core concepts taught in this module.",
      incorrect: {
        'a': { why_wrong: "This is actually correct, but you may have misunderstood the question.", confusion_reason: "Correct answer selected incorrectly" },
        'b': { why_wrong: "While assignments help, the main goal is conceptual understanding.", confusion_reason: "Common misconception about learning objectives" },
        'c': { why_wrong: "Coins are rewards, not the primary learning objective.", confusion_reason: "Gamification elements vs core purpose" },
        'd': { why_wrong: "Videos are just one delivery method for the content.", confusion_reason: "Medium vs message confusion" }
      }
    }
  },
  {
    id: 2,
    question: "Which of the following represents best practices covered in this module?",
    image: null,
    options: [
      { id: 'a', text: "Following step-by-step procedures", isCorrect: false },
      { id: 'b', text: "Understanding underlying principles", isCorrect: true },
      { id: 'c', text: "Memorizing facts", isCorrect: false },
      { id: 'd', text: "Completing tasks quickly", isCorrect: false }
    ],
    explanation: {
      correct: "Excellent! Understanding principles allows you to apply knowledge flexibly.",
      incorrect: {
        'a': { why_wrong: "Procedures are helpful but understanding principles is more important.", confusion_reason: "Surface vs deep learning approach" },
        'b': { why_wrong: "This is actually correct, but you may have misunderstood the question.", confusion_reason: "Correct answer selected incorrectly" },
        'c': { why_wrong: "Memorization without understanding limits practical application.", confusion_reason: "Rote learning vs comprehension" },
        'd': { why_wrong: "Speed without comprehension can lead to errors.", confusion_reason: "Efficiency vs effectiveness" }
      }
    }
  }
];

// Sample frontend modules data (fallback)
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

// Converter function for backend modules
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

const ModulesPage: React.FC = () => {
  const {
    currentView,
    selectedModuleId,
    selectedLessonId,
    goToLesson,
    goToModules,
    goToModuleQuiz
  } = useModules();

  const { data: onboardingStatusData } = useOnboardingStatus();
  const { data: backendModules, isLoading: isLoadingModules, error: modulesError } = useModulesQuery();

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [backendModulesData, setBackendModulesData] = useState<Module[]>([]);
  const [onboardingRequired, setOnboardingRequired] = useState(false);

  // NEW: Store lessons for modules
  const [moduleLessons, setModuleLessons] = useState<{ [moduleId: number]: Lesson[] }>({});

  const [_onboardingStatus, setOnboardingStatus] = useState<{
    isCompleted: boolean;
    currentStep: number;
    progressPercentage: number;
  } | null>(null);

  const updateModuleLessons = (moduleId: number, lessons: Lesson[]) => {
    setModuleLessons(prev => ({
      ...prev,
      [moduleId]: lessons
    }));
  };

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
    const baseModules = backendModulesData.length > 0 
      ? (() => {
          console.log('Using backend modules data');
          return backendModulesData;
        })()
      : (() => {
          console.log('Using frontend sample data');
          return sampleModulesData;
        })();

    // Integrate lessons from moduleLessons state
    const modulesWithLessons = baseModules.map(module => {
      const lessons = moduleLessons[module.id] || module.lessons;
      return {
        ...module,
        lessons
      };
    });

    return modulesWithLessons;
  }, [backendModulesData, moduleLessons]);

  const currentModule = useMemo(() => {
   
    if (!selectedModuleId) {
      console.log('❌ No selectedModuleId');
      return null;
    }
    
    const module = modulesToDisplay.find(m => m.id === selectedModuleId) || null;
    return module;
  }, [selectedModuleId, modulesToDisplay]);

  const currentLesson = useMemo(() => {
    
    if (!selectedLessonId || !currentModule) {
      return null;
    }
    
    // Check if lessons are loaded yet
    if (!currentModule.lessons || currentModule.lessons.length === 0) {
      return null;
    }
  
    
    // Try multiple lookup strategies for type safety
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

  const handleLessonStart = (lesson: Lesson, module: Module) => {
    
    setIsTransitioning(true);
    goToLesson(lesson.id, module.id);
    
    requestAnimationFrame(() => {
    });
  };

  const handleModuleQuizStart = (module: Module) => {
    setIsTransitioning(true);
    goToModuleQuiz(sampleModuleQuizQuestions, module.id);
  };

  const handleBackToModule = () => {
    setIsTransitioning(true);
    goToModules();
  };

  useEffect(() => {
    if (currentView === 'modules' && isTransitioning) {
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
      
      return () => clearTimeout(timer);
    } else if ((currentView === 'lesson' || currentView === 'quiz' || currentView === 'moduleQuiz') && isTransitioning) {
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [currentView, isTransitioning]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-gray-50">
      {currentView === 'modules' && (
        <div className="absolute top-0 left-0 w-full z-10 p-4">
          {renderBackendStatus()}
        </div>
      )}

      <div
        className={`absolute top-0 left-0 w-full h-full transition-all duration-500 ease-in-out ${
          currentView === 'lesson' || currentView === 'quiz' || currentView === 'moduleQuiz'
            ? '-translate-x-full opacity-0'
            : 'translate-x-0 opacity-100'
        }`}
        style={{ 
          pointerEvents: currentView === 'lesson' || currentView === 'quiz' || currentView === 'moduleQuiz' ? 'none' : 'auto'
        }}
      >
        <div className={`h-full ${renderBackendStatus() ? 'pt-20' : ''}`}>
          <ModulesView
            modulesData={modulesToDisplay}
            onLessonSelect={handleLessonStart}
            onModuleQuizSelect={handleModuleQuizStart}
            isTransitioning={isTransitioning}
            onLessonsUpdate={updateModuleLessons}
          />
        </div>
      </div>

      <div className={`absolute top-0 left-0 w-full h-full transition-all duration-500 ease-in-out ${
        currentView === 'lesson' || currentView === 'quiz'
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0'
      }`}>
        {currentLesson && currentModule ? (
          <LessonView
            lesson={currentLesson}
            module={currentModule}
            onBack={handleBackToModule}
            isTransitioning={isTransitioning}
          />
        ) : currentView === 'lesson' ? (
          <div className="p-8 text-center bg-red-100">
            <p className="text-red-600 text-lg font-bold">DEBUG: Missing Data</p>
            <p>currentView: {currentView}</p>
            <p>currentLesson: {currentLesson ? 'EXISTS' : 'NULL'}</p>
            <p>currentModule: {currentModule ? 'EXISTS' : 'NULL'}</p>
            <p>selectedLessonId: {selectedLessonId}</p>
            <p>selectedModuleId: {selectedModuleId}</p>
          </div>
        ) : null}
      </div>

      <div
        className={`absolute top-0 left-0 w-full h-full transition-all duration-500 ease-in-out ${
          currentView === 'moduleQuiz'
            ? 'translate-x-0 opacity-100'
            : 'translate-x-full opacity-0'
        }`}
        style={{ 
          pointerEvents: currentView === 'moduleQuiz' ? 'auto' : 'none'
        }}
      >
        {currentModule && currentView === 'moduleQuiz' && (
          <ModuleQuizView
            module={currentModule}
            onBack={handleBackToModule}
            isTransitioning={isTransitioning}
          />
        )}
      </div>
    </div>
  );
};

export default ModulesPage;