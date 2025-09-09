import React, { useState, useRef, useEffect } from 'react';
import { Module, Lesson } from '../../types/modules';
import { CoinIcon } from '../../assets';

interface ModulesViewProps {
  modulesData: Module[];
  onLessonSelect: (lesson: Lesson, module: Module) => void;
  isTransitioning?: boolean;
}

const ModulesView: React.FC<ModulesViewProps> = ({ 
  modulesData, 
  onLessonSelect, 
  isTransitioning = false 
}) => {
  const [activeTab, setActiveTab] = useState<'All' | 'In Progress' | 'Completed'>('All');
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [showCompactLayout, setShowCompactLayout] = useState(false);
  
  const moduleRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const layoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const selectedModuleData = modulesData.find(m => m.id === selectedModuleId);
  const isCompactLayout = selectedModuleId && !sidebarCollapsed && showCompactLayout;

  // Helper functions
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
    const completed = module.lessons.filter(lesson => lesson.completed).length;
    const total = module.lessons.length;
    const percentage = Math.round((completed / total) * 100);
    return { completed, total, percentage };
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

  const smoothScrollTo = (container: HTMLElement, targetScrollTop: number, duration: number = 600) => {
    const startScrollTop = container.scrollTop;
    const distance = targetScrollTop - startScrollTop;
    
    if (Math.abs(distance) < 10) return;
    
    const startTime = performance.now();
    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = progress < 0.5 
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      
      container.scrollTop = startScrollTop + (distance * easeProgress);

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };
    requestAnimationFrame(animateScroll);
  };

  const scrollToSelectedModule = () => {
    if (!selectedModuleId || sidebarCollapsed || !scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const filteredModules = modulesData.filter(module => 
      activeTab === 'All' || module.status === activeTab
    );
    
    const selectedIndex = filteredModules.findIndex(m => m.id === selectedModuleId);
    if (selectedIndex === -1) return;
    
    if (isCompactLayout) {
      const cardHeight = 220;
      const stickyHeaderHeight = 120;
      const containerHeight = container.clientHeight;
      const availableHeight = containerHeight - stickyHeaderHeight;
      
      const moduleTop = selectedIndex * cardHeight;
      const targetScrollTop = moduleTop - (availableHeight / 2) + (cardHeight / 2) + stickyHeaderHeight;
      const finalScrollTop = Math.max(0, Math.min(targetScrollTop, container.scrollHeight - containerHeight));
      
      const currentScrollTop = container.scrollTop;
      const moduleVisibleTop = moduleTop - currentScrollTop;
      const moduleVisibleBottom = moduleVisibleTop + cardHeight;
      
      const isReasonablyVisible = moduleVisibleTop > stickyHeaderHeight + 50 && 
                                  moduleVisibleBottom < containerHeight - 50;
      
      if (!isReasonablyVisible) {
        smoothScrollTo(container, finalScrollTop, 600);
      }
    } else {
      const moduleElement = moduleRefs.current[selectedModuleId];
      if (moduleElement) {
        const moduleRect = moduleElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const stickyHeaderHeight = 120;
        
        const isVisible = moduleRect.top >= containerRect.top + stickyHeaderHeight &&
                         moduleRect.bottom <= containerRect.bottom;
        
        if (!isVisible) {
          const containerHeight = container.clientHeight;
          const availableHeight = containerHeight - stickyHeaderHeight;
          const moduleHeight = moduleRect.height;
          
          const targetScrollTop = container.scrollTop + 
            (moduleRect.top - containerRect.top) - 
            stickyHeaderHeight - 
            (availableHeight / 2) + 
            (moduleHeight / 2);
          
          smoothScrollTo(container, Math.max(0, targetScrollTop), 600);
        }
      }
    }
  };

  const handleModuleSelect = (moduleId: number) => {
    if (isTransitioning) return;
    
    setSelectedModuleId(moduleId);
    
    if (sidebarCollapsed) {
      setSidebarCollapsed(false);
    }

    if (layoutTimeoutRef.current) {
      clearTimeout(layoutTimeoutRef.current);
    }

    layoutTimeoutRef.current = setTimeout(() => setShowCompactLayout(true), 0);
  };

  const toggleSidebar = () => {
    if (isTransitioning) return;
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleLessonStart = (lesson: Lesson, module: Module) => {
    if (isTransitioning) return;
    onLessonSelect(lesson, module);
  };

  useEffect(() => {
    if (selectedModuleId && !sidebarCollapsed && showCompactLayout) {
      const timer = setTimeout(scrollToSelectedModule, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedModuleId, sidebarCollapsed, showCompactLayout]);

  useEffect(() => {
    if (!selectedModuleId) {
      setShowCompactLayout(false);
      if (layoutTimeoutRef.current) {
        clearTimeout(layoutTimeoutRef.current);
      }
    }
  }, [selectedModuleId]);

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

  const scrollContainerStyle = {
    scrollbarWidth: selectedModuleId && !sidebarCollapsed ? 'none' : 'thin',
    msOverflowStyle: selectedModuleId && !sidebarCollapsed ? 'none' : 'auto',
    scrollBehavior: 'auto'
  };

  return (
    <div className="w-full h-full">
      <div className="flex gap-8 h-full">
        {/* Main Content Area */}
        <div className={`transition-[width] duration-700 ease-in-out ${
          selectedModuleId && !sidebarCollapsed ? 'w-[30%]' : 'flex-1'
        }`}>
          <div 
            ref={scrollContainerRef}
            className={scrollContainerClass}
            style={scrollContainerStyle}
          >
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-gray-50 px-4 pt-6 pb-3">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Modules</h1>
                
                {selectedModuleId && (
                  <button
                    onClick={toggleSidebar}
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
              
              {/* Tabs */}
              <div className={`flex justify-center border-b border-gray-200 ${sidebarCollapsed ? '-mt-8' : ''}`}>
                {(['All', 'In Progress', 'Completed'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => !isTransitioning && setActiveTab(tab)}
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

            {/* Module Cards */}
            <div className="px-4 pb-6">
              <div className="transition-all duration-700 ease-in-out" style={gridStyles}>
                {filteredModules.map((module, index) => {
                  const progress = getModuleProgress(module);
                  const isSelected = selectedModuleId === module.id;
                  
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
                        ${isCompactLayout ? 'min-h-[204px]' : 'min-h-[420px]'}
                        flex flex-col
                      `}
                      onClick={() => handleModuleSelect(module.id)}
                      style={{ backgroundColor: '#F7F9FF' }}
                    >
                      {/* Header */}
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

                      {/* Image */}
                      <div className={`px-6 transition-[margin] duration-700 ease-in-out ${isCompactLayout ? 'mb-0' : 'mb-6'} flex-shrink-0`}>
                        <div className={`
                          w-full bg-gradient-to-br from-blue-100 via-blue-50 to-yellow-50 
                          rounded-xl items-center justify-center relative overflow-hidden 
                          transition-[height] duration-700 ease-in-out
                          ${isCompactLayout ? 'h-0' : 'h-48'}
                        `}>
                         <img src={module.image} alt={module.title} className="object-cover w-full h-full" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="px-6 flex-1 flex flex-col">
                        <div className="flex-1 mb-6">
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {module.description}
                          </p>
                        </div>

                        {/* Footer */}
                        <div className="space-y-4 pb-6">
                          <div className="flex items-center gap-2">
                            {renderTags(module.tags)}
                          </div>

                          {/* Progress Bar */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">
                                {progress.completed}/{progress.total} lessons completed
                              </span>
                              <span className="text-gray-600">{progress.percentage}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-500 ${getProgressBarColor(module.status)}`}
                                style={{ width: `${progress.percentage}%` }}
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

        {/* Separator Line */}
        <div className={`transition-all duration-700 ease-in-out mt-6 m-2 ${
          selectedModuleId && !sidebarCollapsed ? 'w-px bg-gray-200 mx-2' : 'w-0'
        }`} />

        {/* Right Sidebar */}
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
                      <div className="flex gap-2">
                        <button 
                          disabled={isTransitioning}
                          className="flex-1 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Quiz Battle
                        </button>
                        <button 
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
                    {selectedModuleData.lessons.map((lesson, index) => (
                      <div key={lesson.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm relative">
                        <div className="absolute top-3 right-3 flex items-center gap-1 bg-yellow-100 rounded-full px-2 py-1">
                          <span className="text-xs font-semibold text-gray-900">+{lesson.coins}</span>
                          <img src={CoinIcon} alt="Coins" className="w-4 h-4" />
                        </div>

                        <div className="flex gap-4 items-start">
                          <div className="flex-shrink-0">
                            <div className="aspect-square w-28 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center relative overflow-hidden">
                              <img 
                                src={lesson.image} 
                                alt={lesson.title} 
                                className="object-contain w-full h-full" 
                                style={{ imageRendering: 'crisp-edges' }}
                              />
                            </div>
                          </div>

                          <div className="flex-1 pr-12">
                            <h4 className="text-base font-semibold text-gray-900 mb-1">
                              {lesson.title}
                            </h4>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs text-gray-600 font-medium">Lesson {index + 1}</span>
                              <span className="text-xs text-gray-600">{lesson.duration}</span>
                            </div>
                            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                              {lesson.description}
                            </p>
                            
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleLessonStart(lesson, selectedModuleData)}
                                disabled={isTransitioning}
                                className="bg-blue-600 w-full mx-5 text-white py-2 px-4 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Start Lesson
                              </button>
                              <button 
                                disabled={isTransitioning}
                                className="bg-gray-500 w-full mx-5 text-white py-2 px-4 rounded-lg text-xs font-medium hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Lesson Quiz
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
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