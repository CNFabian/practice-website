import React, { useState } from 'react';

// Mock data for modules and lessons
const modulesData = [
  {
    id: 1,
    title: "Readiness and Decision Making",
    description: "In this module, you'll learn about the precursor steps to prepare for home ownership.",
    lessonCount: 3,
    status: "In Progress",
    tags: ["Beginner", "Finance"],
    illustration: "readiness", // We'll use a placeholder for now
    lessons: [
      {
        id: 1,
        title: "Mindset and Financial Readiness",
        duration: "20 minutes",
        description: "Get your head in the game—and your wallet in shape—before you shop for your dream home.",
        coins: 25,
        completed: false,
        videoUrl: "https://example.com/video1.mp4",
        transcript: `Welcome to this module on Readiness and Decision Making in your homeownership journey. Buying a home is one of the most significant financial and emotional decisions you'll make. So before diving into listings and neighborhood visits, it's important to take a step back and assess your personal and financial readiness. That means understanding your current income, savings, debt, and how stable your job or life situation is. Are you ready to stay in one place for at least a few years? Do you feel comfortable with the idea of taking on a mortgage and the responsibilities that come with home maintenance?

In this module, we'll walk through key decision-making frameworks to help you evaluate trade-offs — like buying vs. renting, location vs. size, or price vs. future growth. You'll also learn how to differentiate between emotional impulses and data-driven choices. Remember, the goal isn't just to buy a house, it's to buy the right house for your lifestyle and goals. By the end of this section, you'll have a clearer picture of where you stand and what steps to take next to move forward confidently.

We'll also help you identify the people and tools that can support your decision-making process. From real estate agents and loan officers to online calculators and budgeting apps — knowing who to trust and when to ask for help can make the journey smoother and less overwhelming. You don't have to figure it all out alone. Think of this phase as laying the foundation — not just for your future home, but for a more informed, confident version of yourself as a buyer. Let's get started by exploring what "readiness" really means in practice.`
      },
      {
        id: 2,
        title: "Credit and Financial Foundations",
        duration: "20 minutes",
        description: "Build—and protect—the credit score that unlocks your dream home.",
        coins: 25,
        completed: false
      },
      {
        id: 3,
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
    title: "Budgeting and Mortgage Preparation",
    description: "Learn how to budget for your home purchase and understand mortgage options.",
    lessonCount: 4,
    status: "Not Started",
    tags: ["Beginner", "Finance"],
    illustration: "budgeting",
    lessons: [
      {
        id: 4,
        title: "Understanding Your Budget",
        duration: "25 minutes",
        description: "Learn to calculate what you can actually afford.",
        coins: 30,
        completed: false
      },
      {
        id: 5,
        title: "Mortgage Types and Terms",
        duration: "30 minutes",
        description: "Explore different mortgage options available to you.",
        coins: 30,
        completed: false
      },
      {
        id: 6,
        title: "Pre-approval Process",
        duration: "20 minutes",
        description: "Get ready for mortgage pre-approval.",
        coins: 25,
        completed: false
      },
      {
        id: 7,
        title: "Down Payment Strategies",
        duration: "25 minutes",
        description: "Explore different approaches to saving for a down payment.",
        coins: 30,
        completed: false
      }
    ]
  }
];

interface ModulesPageProps {}

const ModulesPage: React.FC<ModulesPageProps> = () => {
  const [activeTab, setActiveTab] = useState<'All' | 'In Progress' | 'Completed'>('All');
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [currentView, setCurrentView] = useState<'modules' | 'lesson'>('modules');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [lessonInfoCollapsed, setLessonInfoCollapsed] = useState(false);

  const handleModuleSelect = (moduleId: number) => {
    setSelectedModule(moduleId);
    // Auto-expand sidebar when selecting a module
    if (sidebarCollapsed) {
      setSidebarCollapsed(false);
    }
  };

  const handleLessonStart = (lesson: any) => {
    setSelectedLesson(lesson);
    setCurrentView('lesson');
  };

  const handleBackToModule = () => {
    setCurrentView('modules');
    setSelectedLesson(null);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleLessonInfo = () => {
    setLessonInfoCollapsed(!lessonInfoCollapsed);
  };

  const selectedModuleData = modulesData.find(m => m.id === selectedModule);

  if (currentView === 'lesson' && selectedLesson) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleBackToModule}
            className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Module
          </button>

          {/* Toggle Button for Lesson Info */}
          <button
            onClick={toggleLessonInfo}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <svg 
              className={`w-4 h-4 transition-transform duration-200 ${lessonInfoCollapsed ? '' : 'rotate-180'}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {lessonInfoCollapsed ? 'Show Lesson Info' : 'Hide Lesson Info'}
          </button>
        </div>

        <div className="flex gap-8">
          {/* Left Column - Lesson Info (Collapsible) */}
          <div className={`transition-all duration-300 ease-in-out ${
            lessonInfoCollapsed ? 'w-0 overflow-hidden opacity-0' : 'w-[40%] opacity-100'
          }`}>
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedLesson.title}
                </h1>
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-gray-600">{selectedLesson.duration}</span>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      Beginner
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      Finance
                    </span>
                  </div>
                </div>
              </div>

              {/* Lesson Illustration */}
              <div className="bg-white rounded-lg p-6 border-2 border-gray-100">
                <div className="flex justify-center items-center">
                  {/* Placeholder for lesson illustration */}
                  <div className="w-64 h-48 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-yellow-400 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <span className="text-2xl">💰</span>
                      </div>
                      <div className="text-sm text-gray-600">Financial Planning</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 mb-4">
                  {selectedLesson.description}
                </p>
                <p className="text-sm text-gray-600">
                  When you have finished watching the video, earn rewards by testing your knowledge through a Lesson Quiz!
                </p>
              </div>

              <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700">
                Test Your Knowledge
              </button>

              {/* Rewards */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Rewards</h3>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 bg-yellow-50 px-4 py-3 rounded-lg">
                    <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">🏆</span>
                    </div>
                    <span className="font-medium">+{selectedLesson.coins} NestCoins</span>
                  </div>
                  <div className="flex items-center gap-2 bg-orange-50 px-4 py-3 rounded-lg">
                    <div className="w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">🎖️</span>
                    </div>
                    <span className="font-medium">Badge Progress</span>
                  </div>
                </div>
              </div>

              {/* Next Lesson */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Next Lesson</h4>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">💳</span>
                  </div>
                  <div>
                    <h5 className="font-medium">Credit & Financial Foundations</h5>
                    <p className="text-sm text-gray-600">20 minutes</p>
                    <p className="text-sm text-gray-500">Build—and protect—the credit score that unlocks your dream home.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Video Player (Always Visible) */}
          <div className={`transition-all duration-300 ease-in-out ${
            lessonInfoCollapsed ? 'flex-1' : 'w-[60%]'
          }`}>
            <div className="space-y-6">
              {/* Video Player */}
              <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                  <div className="text-right text-sm text-gray-500 mt-4">
                    {selectedLesson.duration}
                  </div>
                </div>
              </div>

              {/* Video Transcript */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Video Transcript</h3>
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <span className="text-sm text-gray-500 min-w-[3rem]">0:00</span>
                      <p className="text-sm text-gray-700">{selectedLesson.transcript}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main modules view with collapsible sidebar
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex gap-8">
        {/* Main Content Area */}
        <div className={`transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'flex-1' : 'flex-1 lg:max-w-[calc(66.666%-2rem)]'
        }`}>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">Modules</h1>
              
              {/* Sidebar Toggle Button */}
              <button
                onClick={toggleSidebar}
                className="lg:flex hidden items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <svg 
                  className={`w-4 h-4 transition-transform duration-200 ${sidebarCollapsed ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                {sidebarCollapsed ? 'Show Details' : 'Hide Details'}
              </button>
            </div>
            
            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1 max-w-xs">
              {(['All', 'In Progress', 'Completed'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Module Cards */}
            <div className="space-y-4">
              {modulesData.map((module, index) => (
                <div 
                  key={module.id}
                  className={`bg-white rounded-xl border-2 p-6 cursor-pointer transition-all hover:border-blue-200 ${
                    selectedModule === module.id ? 'border-blue-300 shadow-lg' : 'border-gray-100'
                  }`}
                  onClick={() => handleModuleSelect(module.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{module.title}</h3>
                        <p className="text-sm text-gray-600">{module.lessonCount} lessons</p>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-gray-50 rounded-lg">
                      <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                      </svg>
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {/* Module Illustration Placeholder */}
                      <div className={`h-32 bg-gradient-to-br from-blue-100 to-yellow-100 rounded-lg flex items-center justify-center mb-4 ${
                        sidebarCollapsed ? 'w-full max-w-sm' : 'w-full max-w-xs'
                      }`}>
                        <div className="text-center">
                          <div className="w-12 h-12 bg-yellow-400 rounded-full mx-auto mb-2 flex items-center justify-center">
                            <span className="text-2xl">{index === 0 ? '🏠' : '💰'}</span>
                          </div>
                          <div className="text-xs text-gray-600">{module.title}</div>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mb-4">
                        {module.description}
                      </p>

                      <div className="flex items-center gap-2 mb-4">
                        {module.tags.map((tag) => (
                          <span 
                            key={tag}
                            className={`px-3 py-1 text-xs rounded-full ${
                              tag === 'Beginner' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <button className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        module.status === 'In Progress' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {module.status}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Collapsible Right Sidebar */}
        <div className={`hidden lg:block transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'w-0 overflow-hidden opacity-0' : 'w-80 opacity-100'
        }`}>
          <div className="space-y-6">
            {selectedModuleData ? (
              <>
                <div className="bg-white rounded-xl border-2 border-gray-100 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {selectedModuleData.title}
                  </h2>
                  <p className="text-gray-600 text-sm mb-4">
                    {selectedModuleData.description}
                  </p>
                  <div className="flex gap-2 mb-6">
                    {selectedModuleData.tags.map((tag) => (
                      <span 
                        key={tag}
                        className={`px-3 py-1 text-xs rounded-full ${
                          tag === 'Beginner' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Lessons List */}
                  <div className="space-y-4">
                    {selectedModuleData.lessons.map((lesson, index) => (
                      <div key={lesson.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">
                              {lesson.title}
                            </h4>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm text-gray-600">Lesson {index + 1}</span>
                              <span className="text-sm text-gray-400">•</span>
                              <span className="text-sm text-gray-600">{lesson.duration}</span>
                            </div>
                            <p className="text-xs text-gray-600 mb-3">
                              {lesson.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-yellow-600 ml-4">
                            <span className="text-sm font-medium">+{lesson.coins}</span>
                            <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleLessonStart(lesson)}
                            className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700"
                          >
                            Start Lesson
                          </button>
                          <button className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-200">
                            Lesson Quiz
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Module Actions */}
                  <div className="flex gap-2 mt-6">
                    <button className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700">
                      Quiz Battle
                    </button>
                    <button className="flex-1 bg-gray-600 text-white py-3 rounded-lg font-medium hover:bg-gray-700">
                      Module Quiz
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 p-6 text-center">
                <p className="text-gray-500">Select a module to view lessons and details</p>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Module Details (shown below modules on mobile when sidebar is hidden on desktop) */}
        <div className="lg:hidden w-full mt-6">
          {selectedModuleData && (
            <div className="bg-white rounded-xl border-2 border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {selectedModuleData.title}
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                {selectedModuleData.description}
              </p>
              <div className="flex gap-2 mb-6">
                {selectedModuleData.tags.map((tag) => (
                  <span 
                    key={tag}
                    className={`px-3 py-1 text-xs rounded-full ${
                      tag === 'Beginner' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Lessons List */}
              <div className="space-y-4">
                {selectedModuleData.lessons.map((lesson, index) => (
                  <div key={lesson.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {lesson.title}
                        </h4>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-gray-600">Lesson {index + 1}</span>
                          <span className="text-sm text-gray-400">•</span>
                          <span className="text-sm text-gray-600">{lesson.duration}</span>
                        </div>
                        <p className="text-xs text-gray-600 mb-3">
                          {lesson.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-yellow-600 ml-4">
                        <span className="text-sm font-medium">+{lesson.coins}</span>
                        <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleLessonStart(lesson)}
                        className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700"
                      >
                        Start Lesson
                      </button>
                      <button className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-200">
                        Lesson Quiz
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Module Actions */}
              <div className="flex gap-2 mt-6">
                <button className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700">
                  Quiz Battle
                </button>
                <button className="flex-1 bg-gray-600 text-white py-3 rounded-lg font-medium hover:bg-gray-700">
                  Module Quiz
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModulesPage;