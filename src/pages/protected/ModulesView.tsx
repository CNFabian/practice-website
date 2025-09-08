import React, { useState } from 'react';
import { Module, Lesson } from '../../types/modules';
import { 
  CoinIcon, 
} from '../../assets';

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const selectedModuleData = modulesData.find(m => m.id === selectedModuleId);

  const handleModuleSelect = (moduleId: number) => {
    if (isTransitioning) return;
    
    setSelectedModuleId(moduleId);
    if (sidebarCollapsed) {
      setSidebarCollapsed(false);
    }
  };

  const handleLessonStart = (lesson: Lesson, module: Module) => {
    if (isTransitioning) return;
    onLessonSelect(lesson, module);
  };

  const toggleSidebar = () => {
    if (isTransitioning) return;
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const filteredModules = modulesData.filter(module => {
    if (activeTab === 'All') return true;
    return module.status === activeTab;
  });

  const isCompactLayout = selectedModuleId && !sidebarCollapsed;

  return (
    <div className="max-w-7xl mx-auto h-full">
      <div className="flex gap-8 h-full">
        {/* Main Content Area */}
        <div className={`transition-[width] duration-700 ease-in-out ${
          selectedModuleId && !sidebarCollapsed ? 'w-[30%]' : 'flex-1'
        }`}>
          <div 
            className={`h-full overflow-y-auto transition-all duration-300 -mr-10 ${
              selectedModuleId && !sidebarCollapsed 
                ? '' 
                : 'scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 -mr-16'
            }`}
            style={{
              // Hide scrollbar visually but keep functionality when sidebar is visible
              scrollbarWidth: selectedModuleId && !sidebarCollapsed ? 'none' : 'thin',
              msOverflowStyle: selectedModuleId && !sidebarCollapsed ? 'none' : 'auto'
            }}
          >
            {/* Sticky Header for Main Content */}
            <div className="sticky top-0 z-10 bg-gray-50 px-4 pt-6 pb-3">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Modules</h1>
                
                {/* Sidebar Toggle Button */}
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
              <div className={`flex justify-center border-b border-gray-200 ${
              sidebarCollapsed ? '-mt-8' : ''}`}>
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

            {/* Module Cards Container */}
            <div className="px-4 pb-6">
              <div 
                className={`
                  grid gap-6 transition-all duration-700 ease-in-out
                  ${isCompactLayout 
                    ? 'grid-cols-1' 
                    : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
                  }
                `}
              >
                {filteredModules.map((module, index) => (
                  <div 
                    key={module.id}
                    className={`
                      bg-white rounded-2xl border border-gray-200 cursor-pointer 
                      hover:border-blue-300 hover:shadow-lg
                      transition-all duration-700 ease-in-out
                      ${selectedModuleId === module.id ? 'border-blue-400 shadow-lg ring-2 ring-blue-100' : ''}
                      ${isTransitioning ? 'pointer-events-none' : ''}
                      ${isCompactLayout ? 'min-h-[204px]' : 'min-h-[420px]'}
                      flex flex-col
                    `}
                    onClick={() => handleModuleSelect(module.id)}
                    style={{
                      backgroundColor: '#F7F9FF'
                    }}
                  >
                    {/* Header - Fixed height */}
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

                    {/* Illustration - Dynamic height in normal view, hidden in compact */}
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

                    {/* Content Area - Flexible height */}
                    <div className="px-6 flex-1 flex flex-col">
                      {/* Description - Takes available space */}
                      <div className="flex-1 mb-6">
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {module.description}
                        </p>
                      </div>

                      {/* Footer - Fixed position at bottom */}
                      <div className="flex items-center justify-between pb-6">
                        <div className="flex items-center gap-2">
                          {module.tags.map((tag) => (
                            <span 
                              key={tag}
                              className={`px-3 py-1 text-xs font-medium rounded-full ${
                                tag === 'Beginner' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        
                        <button 
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                            module.status === 'In Progress' 
                              ? 'bg-blue-600 text-white hover:bg-blue-700' 
                              : module.status === 'Completed'
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {module.status}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Separator Line */}
        <div className={`transition-all duration-700 ease-in-out mt-6 m-2 ${
          selectedModuleId && !sidebarCollapsed ? 'w-px bg-gray-200 mx-2' : 'w-0'
        }`} />

        {/* Collapsible Right Sidebar */}
        <div className={`transition-[width] duration-700 ease-in-out -ml-6 ${
          selectedModuleId && !sidebarCollapsed ? 'w-[70%]' : 'w-0'
        }`}>
          <div className={`h-full transition-transform duration-700 ease-in-out ${
            selectedModuleId && !sidebarCollapsed ? 'translate-x-0' : 'translate-x-full'
          }`}>
            <div className={`h-full overflow-y-auto transition-all duration-300 ${
              selectedModuleId && !sidebarCollapsed 
                ? 'scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400' 
                : ''
            }`}
            style={{
              // Hide scrollbar when sidebar is not visible
              scrollbarWidth: selectedModuleId && !sidebarCollapsed ? 'thin' : 'none',
              msOverflowStyle: selectedModuleId && !sidebarCollapsed ? 'auto' : 'none'
            }}>
              {/* Sticky Header for Lesson List */}
              {selectedModuleData && (
                <div className="sticky top-0 z-10 bg-gray-50 mr-4 px-1 pt-6 pb-3">
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold text-gray-900">
                      {selectedModuleData.title}
                    </h2>
                    <p className="text-gray-600 text-sm leading-normal">
                      {selectedModuleData.description}
                    </p>
                    <div className="flex gap-1.5">
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
                </div>
              )}

              <div className="mr-4 pb-6">
                {selectedModuleData ? (
                  <>
                    {/* Lessons List */}
                    <div className="space-y-4 px-1">
                      {selectedModuleData.lessons.map((lesson, index) => (
                        <div key={lesson.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm relative">
                          {/* Coin Reward - Top Right */}
                          <div className="absolute top-3 right-3 flex items-center gap-1 bg-yellow-100 rounded-full px-2 py-1">
                            <span className="text-xs font-semibold text-gray-900">+{lesson.coins}</span>
                            <img src={CoinIcon} alt="Coins" className="w-4 h-4" />
                          </div>

                          <div className="flex gap-4 items-start">
                            {/* Left Side - Illustration */}
                            <div className="flex-shrink-0">
                              <div className="aspect-square w-28 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center relative overflow-hidden">
                                <img src={lesson.image} alt={lesson.title} className="object-cover w-full h-full" />
                              </div>
                            </div>

                            {/* Right Side - Content */}
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
                              
                              {/* Action Buttons */}
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleLessonStart(lesson, selectedModuleData)}
                                  disabled={isTransitioning}
                                  className="bg-blue-600 text-white py-2 px-4 rounded-full text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Start Lesson
                                </button>
                                <button 
                                  disabled={isTransitioning}
                                  className="bg-gray-500 text-white py-2 px-4 rounded-full text-xs font-medium hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Lesson Quiz
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Module Actions */}
                    <div className="bg-white border-t border-gray-200 pt-4 px-1 mt-6">
                      <div className="flex gap-2">
                        <button 
                          disabled={isTransitioning}
                          className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                  </>
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