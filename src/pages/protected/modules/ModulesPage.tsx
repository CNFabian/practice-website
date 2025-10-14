import React, { useState, useEffect } from 'react';
import { useModules } from '../../../hooks/useModules';
import ModulesView from './ModulesView';
import LessonView from './LessonView';
import ModuleQuizView from './ModuleQuizView';
import { Module, Lesson } from '../../../types/modules';
import { SignupImage } from '../../../assets';
import { getModules } from '../../../services/learningAPI';

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

const modulesData: Module[] = [
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
        title: "Basic Home Repairs",
        duration: "30 minutes",
        description: "Learn to tackle common home repairs like a pro.",
        coins: 30,
        completed: false
      },
      {
        id: 13,
        image: SignupImage,
        title: "When to Call a Professional",
        duration: "20 minutes",
        description: "Know your limits—learn when to call in the pros.",
        coins: 25,
        completed: false
      }
    ]
  },
  {
    id: 5,
    image: SignupImage,
    title: "Home Safety and Security",
    description: "Learn how to keep your home safe and secure.",
    lessonCount: 3,
    status: "Not Started",
    tags: ["Beginner", "Safety"],
    illustration: "home-safety",
    lessons: [
      {
        id: 14,
        image: SignupImage,
        title: "Home Security Systems",
        duration: "25 minutes",
        description: "Explore different types of home security systems.",
        coins: 30,
        completed: false
      },
      {
        id: 15,
        image: SignupImage,
        title: "Fire Safety Tips",
        duration: "30 minutes",
        description: "Learn essential fire safety tips for your home.",
        coins: 30,
        completed: false
      },
      {
        id: 16,
        image: SignupImage,
        title: "Emergency Preparedness",
        duration: "20 minutes",
        description: "Get prepared for emergencies with a solid plan.",
        coins: 25,
        completed: false
      }
    ]
  },
  {
    id: 6,
    image: SignupImage,
    title: "Home Technology Integration",
    description: "Learn how to integrate technology into your home.",
    lessonCount: 3,
    status: "Not Started",
    tags: ["Beginner", "Technology"],
    illustration: "home-technology",
    lessons: [
      {
        id: 17,
        image: SignupImage,
        title: "Smart Home Devices",
        duration: "25 minutes",
        description: "Explore various smart home devices and their benefits.",
        coins: 30,
        completed: false
      },
      {
        id: 18,
        image: SignupImage,
        title: "Home Automation Basics",
        duration: "30 minutes",
        description: "Learn the basics of home automation and control.",
        coins: 30,
        completed: false
      },
      {
        id: 19,
        image: SignupImage,
        title: "Setting Up a Home Network",
        duration: "20 minutes",
        description: "Understand how to set up and secure a home network.",
        coins: 25,
        completed: false
      }
    ]
  }
];

interface ModulesPageProps {}

const ModulesPage: React.FC<ModulesPageProps> = () => {
  // Redux state management
  const {
    currentView,
    currentModule,
    currentLesson,
    modules,
    loadModules,
    goToLesson,
    goToModules,
    goToModuleQuiz,
    setLoading,
    setError
  } = useModules();

  // Local state for transitions
  const [isTransitioning, setIsTransitioning] = useState(false);

  // BACKEND INTEGRATION: Fetch modules from API on component mount
  useEffect(() => {
    const fetchModulesFromBackend = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Call the backend API
        const backendModules = await getModules();
        
        console.log('Backend modules received:', backendModules);
        
        // TODO: Transform backend data to match your Module interface
        // For now, we'll use the static data as fallback
        // Once backend data is confirmed working, map it like:
        // const transformedModules = backendModules.map(module => ({
        //   id: module.id,
        //   title: module.title,
        //   description: module.description,
        //   image: module.thumbnail_url,
        //   ... etc
        // }));
        
        // For now, load static data
        if (modules.length === 0) {
          loadModules(modulesData);
        }
        
      } catch (error) {
        console.error('Error fetching modules from backend:', error);
        setError('Failed to load modules from backend. Using fallback data.');
        
        // Load fallback static data on error
        if (modules.length === 0) {
          loadModules(modulesData);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchModulesFromBackend();
  }, []); // Run only once on mount

  const handleLessonStart = (lesson: Lesson, module: Module) => {
    setIsTransitioning(true);
    goToLesson(lesson.id, module.id);
    
    requestAnimationFrame(() => {
      // currentView will be updated by Redux
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

  // Handle transitions
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
      {/* MODULES VIEW */}
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
        <ModulesView
          modulesData={modules.length > 0 ? modules : modulesData}
          onLessonSelect={handleLessonStart}
          onModuleQuizSelect={handleModuleQuizStart}
          isTransitioning={isTransitioning}
        />
      </div>

      {/* LESSON VIEW */}
      <div
        className={`absolute top-0 left-0 w-full h-full transition-all duration-500 ease-in-out ${
          currentView === 'lesson' || currentView === 'quiz'
            ? 'translate-x-0 opacity-100'
            : 'translate-x-full opacity-0'
        }`}
        style={{ 
          pointerEvents: currentView === 'lesson' || currentView === 'quiz' ? 'auto' : 'none'
        }}
      >
        {currentLesson && currentModule && (
          <LessonView
            lesson={currentLesson}
            module={currentModule}
            onBack={handleBackToModule}
            isTransitioning={isTransitioning}
          />
        )}
      </div>

      {/* MODULE QUIZ VIEW */}
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