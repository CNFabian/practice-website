import React, { useState, useEffect } from 'react';
import ModulesView from './ModulesView';
import LessonView from './LessonView';
import { Module, Lesson } from '../../types/modules';
import { SignupImage } from '../../assets';

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
        description: "Get your head in the game—and your wallet in shape—before you shop for your dream homeq weoifwoe ifmnwoiwenfowi enfoweinfoweiffsfa",
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
  }
];

interface ModulesPageProps {}

const ModulesPage: React.FC<ModulesPageProps> = () => {
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [currentView, setCurrentView] = useState<'modules' | 'lesson'>('modules');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleLessonStart = (lesson: Lesson, module: Module) => {
    setIsTransitioning(true);
    setSelectedLesson(lesson);
    setSelectedModule(module);
    
    requestAnimationFrame(() => {
      setCurrentView('lesson');
    });
  };

  const handleBackToModule = () => {
    setIsTransitioning(true);
    setCurrentView('modules');
  };

  useEffect(() => {
    if (currentView === 'modules' && isTransitioning) {
      const timer = setTimeout(() => {
        setSelectedLesson(null);
        setIsTransitioning(false);
      }, 500);
      
      return () => clearTimeout(timer);
    } else if (currentView === 'lesson' && isTransitioning) {
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
          currentView === 'lesson'
            ? '-translate-x-full opacity-0'
            : 'translate-x-0 opacity-100'
        }`}
        style={{ 
          pointerEvents: currentView === 'lesson' ? 'none' : 'auto'
        }}
      >
        <ModulesView
          modulesData={modulesData}
          onLessonSelect={handleLessonStart}
          isTransitioning={isTransitioning}
        />
      </div>

      {/* LESSON VIEW */}
      <div
        className={`absolute top-0 left-0 w-full h-full transition-all duration-500 ease-in-out ${
          currentView === 'lesson'
            ? 'translate-x-0 opacity-100'
            : 'translate-x-full opacity-0'
        }`}
        style={{ 
          pointerEvents: currentView === 'lesson' ? 'auto' : 'none'
        }}
      >
        {selectedLesson && selectedModule && (
          <LessonView
            lesson={selectedLesson}
            module={selectedModule}
            onBack={handleBackToModule}
            isTransitioning={isTransitioning}
          />
        )}
      </div>
    </div>
  );
};

export default ModulesPage;