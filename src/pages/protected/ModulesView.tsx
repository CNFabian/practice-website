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
              <div className="flex justify-center border-b border-gray-200">
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
                      bg-white rounded-2xl border border-gray-200 p-6 cursor-pointer 
                      hover:border-blue-300 hover:shadow-lg
                      transition-all duration-700 ease-in-out
                      ${selectedModuleId === module.id ? 'border-blue-400 shadow-lg ring-2 ring-blue-100' : ''}
                      ${isTransitioning ? 'pointer-events-none' : ''}
                      ${isCompactLayout ? 'min-h-[204px]' : 'min-h-[420px]'}
                    `}
                    onClick={() => handleModuleSelect(module.id)}
                    style={{
                      backgroundColor: '#F7F9FF'
                    }}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
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
                      <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                        </svg>
                      </button>
                    </div>

                    {/* Illustration */}
                    <div className={`transition-[margin] duration-700 ease-in-out ${isCompactLayout ? 'mb-0' : 'mb-6'}`}>
                      <div className={`
                        w-full bg-gradient-to-br from-blue-100 via-blue-50 to-yellow-50 
                        rounded-xl flex items-center justify-center relative overflow-hidden 
                        transition-[height] duration-700 ease-in-out
                        ${isCompactLayout ? 'h-0' : 'h-48'}
                      `}>
                        {/* Background decorative elements */}
                        <div className="absolute top-4 left-4">
                          <div className="w-12 h-10 bg-blue-500 rounded-lg flex items-center justify-center relative">
                            <div className="w-8 h-6 bg-yellow-300 rounded-sm"></div>
                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3 h-2 bg-blue-600 rounded-t-sm"></div>
                          </div>
                        </div>
                        
                        {/* Decorative leaves */}
                        <div className="absolute bottom-4 left-8">
                          <div className="w-6 h-8 bg-green-400 rounded-full transform rotate-12 opacity-80"></div>
                        </div>
                        <div className="absolute bottom-6 right-12">
                          <div className="w-8 h-10 bg-green-300 rounded-full transform -rotate-12 opacity-70"></div>
                        </div>
                        
                        {/* Main character - Woman with laptop */}
                        <div className="absolute bottom-0 right-8">
                          <div className="relative">
                            {/* Laptop */}
                            <div className="w-16 h-10 bg-blue-600 rounded-t-lg mb-2 relative">
                              <div className="w-14 h-8 bg-blue-700 rounded-t-md mx-auto"></div>
                              <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-12 h-6 bg-gray-100 rounded-sm"></div>
                            </div>
                            
                            {/* Person */}
                            <div className="relative">
                              {/* Body */}
                              <div className="w-12 h-16 bg-yellow-400 rounded-t-full mx-auto relative">
                                {/* Head */}
                                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-amber-600 rounded-full"></div>
                                {/* Hair */}
                                <div className="absolute -top-9 left-1/2 transform -translate-x-1/2 w-10 h-8 bg-gray-800 rounded-full"></div>
                                {/* Arms */}
                                <div className="absolute top-4 -left-2 w-4 h-8 bg-amber-600 rounded-full transform rotate-12"></div>
                                <div className="absolute top-4 -right-2 w-4 h-8 bg-amber-600 rounded-full transform -rotate-12"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Floating elements */}
                        <div className="absolute top-6 right-6">
                          <div className="w-6 h-6 bg-blue-400 rounded-lg flex items-center justify-center">
                            <span className="text-white text-xs">📊</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="mb-6">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {module.description}
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
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
                                {/* Background decorative elements */}
                                <div className="absolute top-1 left-1">
                                  <div className="w-5 h-5 bg-blue-500 rounded-lg flex items-center justify-center">
                                    <span className="text-white text-xs">🏠</span>
                                  </div>
                                </div>
                                <div className="absolute top-1 right-1">
                                  <div className="w-4 h-4 bg-green-400 rounded-md flex items-center justify-center">
                                    <span className="text-white text-xs">📊</span>
                                  </div>
                                </div>
                                <div className="absolute bottom-1 right-1">
                                  <div className="w-5 h-5 bg-teal-400 rounded-lg flex items-center justify-center">
                                    <span className="text-white text-xs">💰</span>
                                  </div>
                                </div>
                                
                                {/* Main character/person */}
                                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
                                  <div className="w-8 h-10 bg-yellow-400 rounded-t-full relative">
                                    {/* Simple person representation */}
                                    <div className="absolute top-0.5 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-amber-600 rounded-full"></div>
                                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-7 bg-yellow-400 rounded-t-lg"></div>
                                  </div>
                                </div>
                                
                                {/* Bottom leaf decoration */}
                                <div className="absolute bottom-0.5 left-1">
                                  <div className="w-3 h-2 bg-green-300 rounded-full transform rotate-45"></div>
                                </div>
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