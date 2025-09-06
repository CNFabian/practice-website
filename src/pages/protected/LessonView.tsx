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

  return (
    <div className="pt-6 w-full h-[calc(100vh-88px)]">
      <div className="flex h-full w-full relative">
        {/* Arrow Toggle */}
        <button
          onClick={toggleLessonInfo}
          disabled={isTransitioning}
          className={`relative ml-4 top-60 x-10 z-10 w-4 h-12 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${
            lessonInfoCollapsed ? '' : 'left-[calc(40%-12px)]'
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
        <div className={`relative transition-all duration-300 ease-in-out ${
          lessonInfoCollapsed ? 'w-0 overflow-hidden opacity-0' : 'w-[40%] opacity-100'
        }`}>
          <div className="h-full flex flex-col px-4">
            {/* Back Button - Fixed at top */}
            <div className="flex-shrink-0 py-2">
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

            {/* Main Content - Scrollable if needed */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
              <div className="space-y-4 pb-4">
                {/* Lesson Header - Compact */}
                <div>
                  <h1 className="text-xl font-bold text-gray-900 mb-1">
                    {lesson.title}
                  </h1>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm text-gray-600">{lesson.duration}</span>
                    <div className="flex gap-1">
                      {module.tags.map((tag) => (
                        <span 
                          key={tag}
                          className={`px-2 py-0.5 text-xs rounded-full ${
                            tag === 'Beginner' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Compact Lesson Illustration */}
                <div className="bg-white rounded-lg p-3 border border-gray-100">
                  <div className="flex justify-center items-center">
                    <div className="w-32 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-8 h-8 bg-yellow-400 rounded-full mx-auto mb-2 flex items-center justify-center">
                          <span className="text-sm">💰</span>
                        </div>
                        <div className="text-xs text-gray-600">{module.title}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lesson Description - Compact */}
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-gray-700 mb-2 leading-relaxed">
                    {lesson.description}
                  </p>
                  <p className="text-xs text-gray-600">
                    Complete the video to unlock the quiz!
                  </p>
                </div>

                {/* Test Knowledge Button */}
                <button 
                  disabled={isTransitioning}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Test Your Knowledge
                </button>

                {/* Rewards - Compact Layout */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Rewards</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 bg-yellow-50 px-3 py-2 rounded-lg">
                      <img src={CoinIcon} alt="Coins" className="w-6 h-6" />
                      <span className="text-xs font-medium">+{lesson.coins}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-orange-50 px-3 py-2 rounded-lg">
                      <div className="w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">🎖️</span>
                      </div>
                      <span className="text-xs font-medium">Badge</span>
                    </div>
                  </div>
                </div>

                {/* Next Lesson - Compact */}
                {nextLesson && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="text-sm font-semibold mb-2">Next Lesson</h4>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-sm">💳</span>
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-sm font-medium truncate">{nextLesson.title}</h5>
                        <p className="text-xs text-gray-600">{nextLesson.duration}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Buttons - Fixed at bottom */}
            <div className="flex-shrink-0 py-3 border-t border-gray-100">
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
          lessonInfoCollapsed ? 'flex-1' : 'w-[60%]'
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