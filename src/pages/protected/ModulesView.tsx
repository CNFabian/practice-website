import React, { useRef, useEffect } from 'react';
import { useModules } from '../../hooks/useModules';
import { Module, Lesson } from '../../types/modules';
import { CoinIcon} from '../../assets';

interface ModulesViewProps {
  modulesData: Module[];
  onLessonSelect: (lesson: Lesson, module: Module) => void;
  onModuleQuizSelect?: (module: Module) => void;
  isTransitioning?: boolean;
}

const ModulesView: React.FC<ModulesViewProps> = ({ 
  modulesData, 
  onLessonSelect, 
  onModuleQuizSelect,
  isTransitioning = false 
}) => {
  const layoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { 
    selectModuleById,
    selectedModuleId,
    sidebarCollapsed,
    toggleSidebar,
    lessonProgress,
    moduleProgress,
    activeTab,
    changeActiveTab,
    showCompactLayout,
    toggleCompactLayout,
    goToQuiz // Add this to access the quiz navigation function
  } = useModules();

  const moduleRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const selectedModuleData = modulesData.find(m => m.id === selectedModuleId);
  const isCompactLayout = selectedModuleId && !sidebarCollapsed && showCompactLayout;

  // Helper function to get module quiz completion status
  const getModuleQuizStatus = (moduleId: number) => {
    const progress = moduleProgress[moduleId];
    return {
      isCompleted: progress?.moduleQuizCompleted || false,
      score: progress?.moduleQuizScore || null
    };
  };

  const getOptimalCardWidth = () => {
    if (typeof window === 'undefined') return 280;
    const screenWidth = window.innerWidth;
    if (screenWidth < 640) return 240;
    if (screenWidth < 768) return 260;
    if (screenWidth < 1024) return 280;
    if (screenWidth < 1280) return 260;
    if (screenWidth < 1536) return 240;
    return 260;
  };

  const getModuleProgress = (module: Module) => {
    const progress = moduleProgress[module.id];
    if (progress) return progress;
    
    // Updated logic: A lesson is completed when quiz is completed (100%)
    const completed = module.lessons.filter(lesson => {
      const lessonProgressData = lessonProgress[lesson.id];
      return lessonProgressData?.quizCompleted || lessonProgressData?.completed;
    }).length;
    
    const total = module.lessons.length;
    return {
      lessonsCompleted: completed,
      totalLessons: total,
      overallProgress: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  };
  

  const getProgressBarColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-500';
      case 'In Progress': return 'bg-blue-500';
      default: return 'bg-gray-300';
    }
  };

  const renderTags = (tags: string[]) => (
    tags.map((tag) => (
      <span 
        key={tag}
        className={`px-3 py-1 text-xs font-medium rounded-full ${
          tag === 'Beginner' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'
        }`}
      >
        {tag}
      </span>
    ))
  );

  // MODIFIED: Enhanced to handle smooth transition from grid to column layout
  const handleModuleSelect = (moduleId: number) => {
    if (isTransitioning) return;

    const wasCollapsed = sidebarCollapsed;
    // FIXED: Removed unused variable `previouslySelected`

    selectModuleById(moduleId);

    if (wasCollapsed) {
        toggleSidebar(false);
    }
    
    // Start the compact layout transition immediately to begin the visual change
    if (layoutTimeoutRef.current) {
        clearTimeout(layoutTimeoutRef.current);
    }
    layoutTimeoutRef.current = setTimeout(() => toggleCompactLayout(true), 0);

    // Calculate scroll timing based on whether sidebar needs to expand
    const sidebarTransitionDelay = wasCollapsed ? 700 : 0;
    // Add extra time for the layout to settle after compact mode activates
    const layoutSettleDelay = 100;
    const totalScrollDelay = sidebarTransitionDelay + layoutSettleDelay;

    setTimeout(() => {
        const moduleElement = moduleRefs.current[moduleId];
        if (!moduleElement) return;

        const filteredModules = modulesData.filter(module =>
            activeTab === 'All' || module.status === activeTab
        );
        const selectedIndex = filteredModules.findIndex(m => m.id === moduleId);
        if (selectedIndex === -1) return;

        const totalModules = filteredModules.length;
        let blockAlignment: 'start' | 'center' | 'end' = 'center';

        if (selectedIndex === 0) {
            blockAlignment = 'start';
        } else if (selectedIndex === totalModules - 1) {
            blockAlignment = 'end';
        }

        moduleElement.scrollIntoView({
            // Use smooth scrolling for both sidebar expansion and layout change
            behavior: 'smooth',
            block: blockAlignment,
        });
    }, totalScrollDelay);
  };

  const toggleSidebarLocal = () => {
    if (isTransitioning) return;
    toggleSidebar(!sidebarCollapsed);
  };

  const handleLessonStart = (lesson: Lesson, module: Module) => {
    if (isTransitioning) return;
    onLessonSelect(lesson, module);
  };

  const handleLessonQuizStart = (lesson: Lesson, module: Module) => {
    if (isTransitioning) return;
    
    // Sample quiz questions for the lesson
    const sampleQuestions = [
      {
        id: 1,
        question: "What is the first step in preparing for homeownership?",
        options: [
          { id: 'a', text: 'Looking at houses online', isCorrect: false },
          { id: 'b', text: 'Assessing your financial readiness', isCorrect: true },
          { id: 'c', text: 'Talking to a real estate agent', isCorrect: false },
          { id: 'd', text: 'Getting pre-approved for a mortgage', isCorrect: false }
        ],
        explanation: {
          correct: "Assessing your financial readiness is crucial because it helps you understand what you can afford and prevents you from looking at homes outside your budget.",
          incorrect: {
            'a': { why_wrong: "Looking at houses online is premature without knowing your budget first.", confusion_reason: "Many people get excited about house hunting, but this can lead to disappointment if you're looking at unaffordable homes." },
            'c': { why_wrong: "While talking to a real estate agent is important, you should know your budget first.", confusion_reason: "Real estate agents can help, but they need to know your financial limits." },
            'd': { why_wrong: "Pre-approval comes after you've assessed your finances and know what you can afford.", confusion_reason: "Pre-approval is important but it's a later step in the process." }
          }
        }
      },
      {
        id: 2,
        question: "What percentage of your monthly income should ideally go toward housing costs?",
        options: [
          { id: 'a', text: '20%', isCorrect: false },
          { id: 'b', text: '28%', isCorrect: true },
          { id: 'c', text: '35%', isCorrect: false },
          { id: 'd', text: '40%', isCorrect: false }
        ],
        explanation: {
          correct: "The 28% rule is a widely accepted guideline that helps ensure you don't become house poor and have money left for other expenses and savings.",
          incorrect: {
            'a': { why_wrong: "20% is too conservative and might limit your housing options unnecessarily.", confusion_reason: "While being conservative with money is good, 20% might be too restrictive for most markets." },
            'c': { why_wrong: "35% is getting into risky territory and could strain your budget.", confusion_reason: "Higher percentages leave less room for other expenses and unexpected costs." },
            'd': { why_wrong: "40% is considered house poor territory and not financially sustainable.", confusion_reason: "Spending this much on housing leaves little room for other necessities and emergencies." }
          }
        }
      }
    ];
    
    // First navigate to the lesson, then start the quiz
    onLessonSelect(lesson, module);
    
    // Use a small delay to ensure the lesson view is rendered before starting the quiz
    setTimeout(() => {
      // Use the goToQuiz function from useModules hook
      goToQuiz(sampleQuestions, lesson.id);
    }, 100);
  };

  const handleModuleQuizStart = (module: Module) => {
    if (isTransitioning || !onModuleQuizSelect) return;
    onModuleQuizSelect(module);
  };

  const handleTabChange = (tab: 'All' | 'In Progress' | 'Completed') => {
    if (!isTransitioning) {
      changeActiveTab(tab);
    }
  };

  useEffect(() => {
    if (!selectedModuleId) {
      toggleCompactLayout(false);
      if (layoutTimeoutRef.current) {
        clearTimeout(layoutTimeoutRef.current);
      }
    }
  }, [selectedModuleId, toggleCompactLayout]);

  const filteredModules = modulesData.filter(module => 
    activeTab === 'All' || module.status === activeTab
  );

  const gridStyles = {
    display: 'grid',
    gap: isCompactLayout ? '1rem' : 'clamp(1rem, 2.5vw, 1.5rem)',
    gridTemplateColumns: isCompactLayout 
      ? '1fr'
      : `repeat(auto-fit, minmax(${getOptimalCardWidth()}px, 320px))`,
    justifyContent: 'center',
  };

  const scrollContainerClass = `h-full overflow-y-auto transition-all duration-300 -mr-10 ${
    selectedModuleId && !sidebarCollapsed 
      ? '' 
      : 'scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 -mr-16'
  }`;

  const scrollContainerStyle: React.CSSProperties = {
    scrollbarWidth: selectedModuleId && !sidebarCollapsed ? 'none' : 'thin',
    msOverflowStyle: selectedModuleId && !sidebarCollapsed ? 'none' : 'auto',
  };

  return (
    <div className="w-full h-full">
      <div className="flex gap-8 h-full">
        <div className={`transition-[width] duration-700 ease-in-out ${
          selectedModuleId && !sidebarCollapsed ? 'w-[30%]' : 'flex-1'
        }`}>
          <div 
            ref={scrollContainerRef}
            className={scrollContainerClass}
            style={scrollContainerStyle}
          >
            <div className="sticky top-0 z-10 bg-gray-50 px-4 pt-6 pb-3">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Modules</h1>
                {selectedModuleId && (
                  <button
                    onClick={toggleSidebarLocal}
                    disabled={isTransitioning}
                    className="lg:flex hidden items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg 
                      className={`w-4 h-4 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {sidebarCollapsed ? 'Show Details' : 'Hide Details'}
                  </button>
                )}
              </div>
              <div className={`flex justify-center border-b border-gray-200 ${sidebarCollapsed ? '-mt-8' : ''}`}>
                {(['All', 'In Progress', 'Completed'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => handleTabChange(tab)}
                    disabled={isTransitioning}
                    className={`px-4 py-3 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-b-2 ${
                      activeTab === tab
                        ? 'text-blue-600 border-blue-600'
                        : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-4 pb-6">
              <div className="transition-all duration-700 ease-in-out" style={gridStyles}>
                {filteredModules.map((module, index) => {
                  const progress = getModuleProgress(module);
                  const isSelected = selectedModuleId === module.id;
                  const quizStatus = getModuleQuizStatus(module.id);
                  
                  return (
                    <div 
                      key={module.id}
                      ref={(el) => { moduleRefs.current[module.id] = el; }}
                      className={`
                        bg-white rounded-2xl border border-gray-200 cursor-pointer 
                        hover:border-blue-300 hover:shadow-lg
                        transition-all duration-700 ease-in-out
                        ${isSelected ? 'border-blue-400 shadow-lg ring-2 ring-blue-100' : ''}
                        ${isTransitioning ? 'pointer-events-none' : ''}
                        ${selectedModuleId && !sidebarCollapsed ? 'min-h-[204px]' : 'min-h-[420px]'}
                        flex flex-col
                        scroll-mt-32
                      `}
                      onClick={() => handleModuleSelect(module.id)}
                      style={{ backgroundColor: '#F7F9FF' }}
                    >
                      <div className="flex items-start justify-between p-6 pb-4 flex-shrink-0">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm p-4"
                            style={{ backgroundColor: '#6B73FF' }}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 leading-tight">
                              {module.title}
                            </h3>
                            <p className="text-sm text-gray-600">{module.lessonCount} lessons</p>
                          </div>
                        </div>
                      </div>

                      <div className={`px-6 transition-[margin] duration-700 ease-in-out ${isCompactLayout ? 'mb-0' : 'mb-6'} flex-shrink-0`}>
                        <div className={`
                          w-full bg-gradient-to-br from-blue-100 via-blue-50 to-yellow-50 
                          rounded-xl items-center justify-center relative overflow-hidden 
                          transition-[height] duration-700 ease-in-out
                          ${isCompactLayout ? 'h-0' : 'h-48'}
                        `}>
                         <img src={module.image} alt={module.title} className="object-cover w-full h-full" />
                         
                         {/* Module Quiz Completion Indicator */}
                         {quizStatus.isCompleted && (
                           <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 shadow-sm border border-green-200">
                             {/* Check mark icon */}
                             <svg 
                               className="w-3 h-3 text-green-600" 
                               fill="currentColor" 
                               viewBox="0 0 20 20"
                             >
                               <path 
                                 fillRule="evenodd" 
                                 d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                                 clipRule="evenodd" 
                               />
                             </svg>
                             
                             {/* Score badge if available */}
                             {quizStatus.score !== null && (
                               <span className="text-xs font-medium text-green-700">
                                 {Math.round((quizStatus.score / 10) * 100)}%
                               </span>
                             )}
                             
                             {/* "Quiz" text */}
                             <span className="text-xs font-medium text-green-700">
                               Quiz
                             </span>
                           </div>
                         )}
                        </div>
                      </div>

                      <div className="px-6 flex-1 flex flex-col">
                        <div className="flex-1 mb-6">
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {module.description}
                          </p>
                        </div>
                        <div className="space-y-4 pb-6">
                          <div className="flex items-center gap-2">
                            {renderTags(module.tags)}
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">
                                {progress.lessonsCompleted}/{progress.totalLessons} lessons completed
                              </span>
                              <span className="text-gray-600">{progress.overallProgress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-500 ${getProgressBarColor(module.status)}`}
                                style={{ width: `${progress.overallProgress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className={`transition-all duration-700 ease-in-out mt-6 m-2 ${
          selectedModuleId && !sidebarCollapsed ? 'w-px bg-gray-200 mx-2' : 'w-0'
        }`} />

        <div className={`transition-[width] duration-700 ease-in-out -ml-6 ${
          selectedModuleId && !sidebarCollapsed ? 'w-[70%]' : 'w-0'
        }`}>
          <div className={`h-full transition-transform duration-700 ease-in-out ${
            selectedModuleId && !sidebarCollapsed ? 'translate-x-0' : 'translate-x-full'
          }`}>
            <div 
              className={`h-full overflow-y-auto transition-all duration-300 ${
                selectedModuleId && !sidebarCollapsed 
                  ? 'scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400' 
                  : ''
              }`}
              style={{
                scrollbarWidth: selectedModuleId && !sidebarCollapsed ? 'thin' : 'none',
                msOverflowStyle: selectedModuleId && !sidebarCollapsed ? 'auto' : 'none'
              }}
            >
              {selectedModuleData && (
                <div className="sticky top-0 z-10 bg-gray-50 mr-4 px-1 pt-6 pb-3">
                  <div className='grid grid-cols-2 gap-4 items-center'>
                    <div className="space-y-1">
                      <h2 className="whitespace-nowrap text-xl font-bold text-gray-900">
                        {selectedModuleData.title}
                      </h2>
                      
                      <p className="text-gray-600 text-sm leading-normal">
                        {selectedModuleData.description}
                      </p>
                      <div className="flex gap-1.5 pt-2">
                        {selectedModuleData.tags.map((tag) => (
                          <span 
                            key={tag}
                            className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                              tag === 'Beginner' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                            }`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="absolute right-0 bottom-5 pr-4 pb-3 w-[calc(50%-1rem)]">
                      {/* Module Quiz Completion Indicator - RIGHT ALIGNED ABOVE BUTTONS */}
                      {getModuleQuizStatus(selectedModuleData.id).isCompleted && (
                        <div className="flex justify-end mb-2">
                          <div className="flex items-center gap-2 text-green-700 bg-green-50 px-2 py-1 rounded-lg border border-green-200">
                            <span className="text-xs font-medium">Quiz Complete</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <button 
                          disabled={isTransitioning}
                          className="flex-1 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Quiz Battle
                        </button>
                        <button 
                          onClick={() => handleModuleQuizStart(selectedModuleData)}
                          disabled={isTransitioning}
                          className="flex-1 bg-gray-600 text-white py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Module Quiz
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mr-4 pb-6">
                {selectedModuleData ? (
                  <div className="space-y-4 px-1">
                    {selectedModuleData.lessons.map((lesson, index) => {
                      const progress = lessonProgress[lesson.id];
                      const isCompleted = progress?.completed || false;
                      const watchProgress = progress?.watchProgress || 0;
                      const quizCompleted = progress?.quizCompleted || false;

                      // UPDATED: Calculate coins dynamically based on quiz questions
                      const getMaxCoinsForLesson = () => {
                        // Use standardized quiz length since we can't access quiz questions until they're loaded
                        const standardQuizQuestions = 5; // Default quiz length - matches current system
                        return standardQuizQuestions * 5; // 5 coins per question = 25 total
                      };

                      const maxCoinsForLesson = getMaxCoinsForLesson();
                      const quizScore = progress?.quizScore || 0; // Number of correct answers
                      const coinsEarned = quizScore * 5; // 5 coins per correct answer
                      const coinsRemaining = Math.max(0, maxCoinsForLesson - coinsEarned);

                      return (
                        <div key={lesson.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm relative">
                          <div className="absolute top-3 right-3 flex items-center gap-1 bg-yellow-100 rounded-full px-2 py-1">
                            <span className="text-xs font-semibold text-gray-900">
                              {coinsRemaining > 0 ? `+${coinsRemaining}` : '✓'}
                            </span>
                            <img src={CoinIcon} alt="Coins" className="w-4 h-4" />
                          </div>
                          <div className="flex gap-4 items-start">
                            <div className="flex-shrink-0">
                              <div className="aspect-square bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center relative overflow-hidden w-20 sm:w-24 md:w-28 lg:w-32 xl:w-36 2xl:w-40">
                                <img 
                                  src={lesson.image} 
                                  alt={lesson.title} 
                                  className="object-contain w-full h-full" 
                                  style={{ imageRendering: 'crisp-edges' }}
                                />
                                {watchProgress > 0 && (
                                  <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                    {watchProgress}%
                                  </div>
                                )}
                                {isCompleted && (
                                  <div className="absolute top-2 left-2 bg-green-500 text-white rounded-full p-1">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex-1 pr-12">
                              <h4 className="text-base font-semibold text-gray-900 mb-1">
                                {lesson.title}
                              </h4>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs text-gray-600 font-medium">Lesson {index + 1}</span>
                                <span className="text-xs text-gray-600">{lesson.duration}</span>
                                {quizCompleted && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                      Quiz ✓
                                    </span>
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                                {lesson.description}
                              </p>
                              <div className="flex gap-3 max-w-xs">
                                <button 
                                  onClick={() => handleLessonStart(lesson, selectedModuleData)}
                                  disabled={isTransitioning}
                                  className={`flex-1 py-2 px-4 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${
                                    isCompleted 
                                      ? 'bg-green-600 text-white hover:bg-green-700'
                                      : 'bg-blue-600 text-white hover:bg-blue-700'
                                  }`}
                                >
                                  {isCompleted ? 'Review' : watchProgress > 0 ? 'Continue' : 'Start Lesson'}
                                </button>
                               <button 
                                onClick={() => handleLessonQuizStart(lesson, selectedModuleData)}
                                disabled={isTransitioning}
                                className={`flex-1 py-2 px-4 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${
                                  quizCompleted ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                                }`}
                              >
                                {quizCompleted ? 'Retake' : 'Lesson Quiz'}
                              </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 p-6 text-center mx-1">
                    <p className="text-gray-500">Select a module to view lessons and details</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModulesView;