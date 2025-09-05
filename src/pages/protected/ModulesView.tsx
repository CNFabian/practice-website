import React, { useState } from 'react';
import { Module, Lesson } from '../../types/modules';

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
    if (isTransitioning) return; // Prevent interaction during transition
    
    setSelectedModuleId(moduleId);
    if (sidebarCollapsed) {
      setSidebarCollapsed(false);
    }
  };

  const handleLessonStart = (lesson: Lesson, module: Module) => {
    if (isTransitioning) return; // Prevent interaction during transition
    onLessonSelect(lesson, module);
  };

  const toggleSidebar = () => {
    if (isTransitioning) return;
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Filter modules based on active tab
  const filteredModules = modulesData.filter(module => {
    if (activeTab === 'All') return true;
    return module.status === activeTab;
  });

  // Determine if we should show the compact layout
  const isCompactLayout = selectedModuleId && !sidebarCollapsed;

  return (
    <div className="p-6 max-w-7xl mx-auto h-[calc(100vh-88px)] overflow-hidden">
      <div className="flex gap-8 h-full">
        {/* Main Content Area - Smooth sliding animation */}
        <div className={`transition-[width] duration-700 ease-in-out ${
          selectedModuleId && !sidebarCollapsed ? 'w-[40%]' : 'flex-1'
        }`}>
          <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 pr-2">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">Modules</h1>
                
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
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1 max-w-xs">
                {(['All', 'In Progress', 'Completed'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => !isTransitioning && setActiveTab(tab)}
                    disabled={isTransitioning}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      activeTab === tab
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Module Cards Container */}
              <div className="pb-6">
                {/* Use CSS Grid with dynamic column sizing instead of switching between grid and flex */}
                <div 
                  className={`
                    grid gap-4 transition-all duration-700 ease-in-out
                    ${isCompactLayout 
                      ? 'grid-cols-1' 
                      : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
                    }
                  `}
                  style={{
                    // Add smooth gap transition
                    gap: isCompactLayout ? '1rem' : '1.5rem'
                  }}
                >
                  {filteredModules.map((module, index) => (
                    <div 
                      key={module.id}
                      className={`
                        bg-white rounded-xl border-2 p-6 cursor-pointer 
                        hover:border-blue-200 transition-all duration-300 
                        ${selectedModuleId === module.id ? 'border-blue-300 shadow-lg' : 'border-gray-100'}
                        ${isTransitioning ? 'pointer-events-none' : ''}
                      `}
                      onClick={() => handleModuleSelect(module.id)}
                      style={{
                        // Ensure consistent sizing during transition
                        minHeight: isCompactLayout ? 'auto' : '400px'
                      }}
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
                          {/* Module Illustration - Hide in compact mode to save space */}
                          <div className={`
                            transition-all duration-700 ease-in-out overflow-hidden
                            ${isCompactLayout ? 'h-0 mb-0 opacity-0' : 'h-32 mb-4 opacity-100'}
                          `}>
                            <div className="w-full max-w-xs bg-gradient-to-br from-blue-100 to-yellow-100 rounded-lg flex items-center justify-center h-full">
                              <div className="text-center">
                                <div className="w-12 h-12 bg-yellow-400 rounded-full mx-auto mb-2 flex items-center justify-center">
                                  <span className="text-2xl">
                                    {index === 0 ? '🏠' : 
                                    index === 1 ? '💰' : 
                                    '🔍'}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-600">{module.title}</div>
                              </div>
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
          </div>
        </div>

        {/* Collapsible Right Sidebar - Made scrollable */}
        <div className={`hidden lg:block overflow-hidden transition-[width] duration-700 ease-in-out ${
          selectedModuleId && !sidebarCollapsed ? 'w-[55%]' : 'w-0'
        }`}>
          <div className={`h-full transition-transform duration-700 ease-in-out ${
            selectedModuleId && !sidebarCollapsed ? 'translate-x-0' : 'translate-x-full'
          }`}>
            <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 pr-2">
              <div className="space-y-6 pb-6">
                {selectedModuleData ? (
                  <>
                    <div className="bg-white rounded-xl border-2 border-gray-100 p-6 shadow-sm">
                      <h2 className="text-xl font-bold text-gray-900 mb-2">
                        {selectedModuleData.title}
                      </h2>
                      <p className="text-gray-600 text-sm mb-4">
                        {selectedModuleData.description}
                      </p>
                      <div className="flex gap-2">
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
                    </div>

                    {/* Lessons List */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 px-2">Lessons</h3>
                      {selectedModuleData.lessons.map((lesson, index) => (
                        <div key={lesson.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
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
                              onClick={() => handleLessonStart(lesson, selectedModuleData)}
                              disabled={isTransitioning}
                              className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Start Lesson
                            </button>
                            <button 
                              disabled={isTransitioning}
                              className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Lesson Quiz
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Module Actions */}
                    <div className="bg-white border-t border-gray-200 pt-4">
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
                  <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 p-6 text-center">
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