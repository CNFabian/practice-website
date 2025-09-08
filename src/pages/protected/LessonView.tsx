import React, { useState } from 'react';
import { Module, Lesson } from '../../types/modules';
import { 
  CoinIcon, 
} from '../../assets';

interface LessonViewProps {
  lesson: Lesson;
  module: Module;
  onBack: () => void;
  isTransitioning?: boolean;
}

const LessonView: React.FC<LessonViewProps> = ({ 
  lesson, 
  module, 
  onBack, 
  isTransitioning = false 
}) => {
  const [lessonInfoCollapsed, setLessonInfoCollapsed] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  const handleBack = () => {
    if (isTransitioning) return;
    onBack();
  };

  const toggleLessonInfo = () => {
    if (isTransitioning) return;
    setLessonInfoCollapsed(!lessonInfoCollapsed);
  };

  // Get next lesson
  const currentLessonIndex = module.lessons.findIndex(l => l.id === lesson.id);
  const nextLesson = currentLessonIndex < module.lessons.length - 1 
    ? module.lessons[currentLessonIndex + 1] 
    : null;

  // Use lesson description, fallback to a default description
  const lessonDescription = lesson.description || "In this lesson, you'll learn the key financial steps to prepare for home ownership and understand why lenders evaluate.";

  return (
    <div className="pt-6 w-full h-full">
      <div className="flex h-full w-full relative">
        {/* Arrow Toggle */}
        <button
          onClick={toggleLessonInfo}
          disabled={isTransitioning}
          className={`relative ml-4 top-60 x-10 z-10 w-4 h-12 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${
            lessonInfoCollapsed ? '' : 'left-[calc(25%+4px)]'
          }`}
        >
          <svg 
            className={`w-3 h-3 text-gray-600 transition-transform duration-200 ${lessonInfoCollapsed ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Left Column - Lesson Info */}
        <div className={`transition-all duration-300 ease-in-out ${
          lessonInfoCollapsed ? 'w-0 overflow-hidden opacity-0' : 'w-[25%] opacity-100'
        }`}>
          <div 
            className="h-full px-2 flex flex-col overflow-y-auto -ml-8" 
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none'
            }}
          >
            {/* Top Fixed Content */}
            <div className="flex-shrink-0">
              {/* Back Button */}
              <div className="py-2">
                <button
                  onClick={handleBack}
                  disabled={isTransitioning}
                  className="flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Module
                </button>
              </div>

              {/* Lesson Header */}
              <div className="space-y-3 pb-3">
                <div>
                  <h1 className="text-xl font-bold text-gray-900 mb-1 leading-tight">
                    {lesson.title}
                  </h1>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-600">{lesson.duration}</span>
                    <div className="flex gap-1">
                      {module.tags.map((tag) => (
                        <span 
                          key={tag}
                          className={`px-1.5 py-0.5 text-xs rounded-full ${
                            tag === 'Beginner' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* EXPANDING IMAGE SECTION */}
            <div className="flex-1 flex items-center justify-center">
              <div 
                className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg w-full transition-all duration-700 ease-in-out overflow-hidden"
                style={{ 
                  height: descriptionExpanded ? '64px' : 'min(calc(100vh - 600px), 300px)',
                  minHeight: descriptionExpanded ? '64px' : '120px'
                }}
              >
                <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center relative overflow-hidden">
                  <img src={lesson.image} alt={lesson.title} className="object-contain w-full h-full" />
                </div>
              </div>
            </div>

            {/* Bottom Fixed Content - Pinned to bottom */}
            <div className="flex-shrink-0 py-3 border-t border-gray-100 space-y-3">
              {/* Lesson Description */}
              <div className="bg-blue-50 rounded-lg p-2">
                <div 
                  className={`text-xs text-gray-700 mb-1 leading-tight cursor-pointer transition-all duration-300 hover:text-gray-900 ${
                    lessonDescription.length > 120 ? 'cursor-pointer' : 'cursor-default'
                  }`}
                  onClick={() => {
                    if (lessonDescription.length > 120) {
                      setDescriptionExpanded(!descriptionExpanded);
                    }
                  }}
                >
                  {descriptionExpanded || lessonDescription.length <= 120 ? (
                    lessonDescription
                  ) : (
                    <>
                      {lessonDescription.substring(0, 120)}
                      <span className="text-blue-600 font-medium">...</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-600">
                  When you have finished watching the video, earn rewards by testing your knowledge through a Lesson Quiz!
                </p>
              </div>

              {/* Test Knowledge Button */}
              <button 
                disabled={isTransitioning}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Test Your Knowledge
              </button>

              {/* Rewards */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Rewards</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1.5 rounded-lg">
                    <img src={CoinIcon} alt="Coins" className="w-5 h-5" />
                    <span className="text-xs font-medium">+{lesson.coins} NestCoins</span>
                  </div>
                  <div className="flex items-center gap-1 bg-orange-50 px-2 py-1.5 rounded-lg">
                    <div className="w-5 h-5 bg-orange-400 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">🎖️</span>
                    </div>
                    <span className="text-xs font-medium">Badge Progress</span>
                  </div>
                </div>
              </div>

              {/* Next Lesson */}
              {nextLesson && (
                <div className="bg-gray-50 rounded-lg p-2">
                  <h4 className="text-sm font-semibold mb-1">Next Lesson</h4>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xs">💳</span>
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-xs font-medium truncate">{nextLesson.title}</h5>
                      <p className="text-xs text-gray-600">{nextLesson.duration}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-2">
                <button 
                  disabled={isTransitioning || currentLessonIndex === 0}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {nextLesson ? (
                  <button 
                    disabled={isTransitioning}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                ) : (
                  <button 
                    onClick={handleBack}
                    disabled={isTransitioning}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Complete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Separator Line */}
        <div className={`transition-all duration-300 ease-in-out ${
          lessonInfoCollapsed ? 'w-0' : 'w-px bg-gray-200 mx-2'
        }`} />

        {/* Right Column - Video Player */}
        <div className={`transition-all duration-300 ease-in-out ${
          lessonInfoCollapsed ? 'flex-1' : 'w-[75%]'
        }`}>
          <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 px-4">
            <div className="space-y-6 pb-6">
              {/* Video Player */}
              <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                  <div className="text-right text-sm text-gray-500 mt-4">
                    {lesson.duration}
                  </div>
                </div>
              </div>

              {/* Video Transcript */}
              {lesson.transcript && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Video Transcript</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <span className="text-sm text-gray-500 min-w-[3rem]">0:00</span>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {lesson.transcript}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Lesson Navigation */}
              <div className="flex gap-3">
                <button 
                  disabled={isTransitioning || currentLessonIndex === 0}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous Lesson
                </button>
                {nextLesson ? (
                  <button 
                    disabled={isTransitioning}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next Lesson
                  </button>
                ) : (
                  <button 
                    onClick={handleBack}
                    disabled={isTransitioning}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Complete Module
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonView;