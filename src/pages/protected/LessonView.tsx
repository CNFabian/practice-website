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
    <div className="p-6 max-w-7xl mx-auto -mr-6">
      <div className="flex gap-8 h-[calc(100vh-88px)] relative">
        {/* Arrow Toggle */}
        <button
          onClick={toggleLessonInfo}
          disabled={isTransitioning}
          className={`absolute top-60 z-10 w-6 h-12 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${
            lessonInfoCollapsed ? 'left-2' : 'left-[calc(40%-12px)]'
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
          <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 pr-8">
            <div className="space-y-6 pb-6">
              {/* Back to Module button only */}
              <div>
                <button
                  onClick={handleBack}
                  disabled={isTransitioning}
                  className="flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Module
                </button>
              </div>

              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {lesson.title}
                </h1>
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-gray-600">{lesson.duration}</span>
                  <div className="flex gap-2">
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
                </div>
              </div>

              {/* Lesson Illustration */}
              <div className="bg-white rounded-lg p-6 border-2 border-gray-100">
                <div className="flex justify-center items-center">
                  <div className="w-64 h-48 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-yellow-400 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <span className="text-2xl">💰</span>
                      </div>
                      <div className="text-sm text-gray-600">{module.title}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 mb-4">
                  {lesson.description}
                </p>
                <p className="text-sm text-gray-600">
                  When you have finished watching the video, earn rewards by testing your knowledge through a Lesson Quiz!
                </p>
              </div>

              <button 
                disabled={isTransitioning}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Test Your Knowledge
              </button>

              {/* Rewards */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Rewards</h3>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 bg-yellow-50 px-4 py-3 rounded-lg">
                     <div className="flex items-center space-x-2 rounded-full px-3 py-2">
                      <img src={CoinIcon} alt="Coins" className="w-12 h-12" />
                    </div>
                    <span className="font-medium">+{lesson.coins} NestCoins</span>
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
              {nextLesson && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Next Lesson</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">💳</span>
                    </div>
                    <div>
                      <h5 className="font-medium">{nextLesson.title}</h5>
                      <p className="text-sm text-gray-600">{nextLesson.duration}</p>
                      <p className="text-sm text-gray-500">{nextLesson.description}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Video Player */}
        <div className={`transition-all duration-300 ease-in-out ${
          lessonInfoCollapsed ? 'flex-1' : 'w-[60%]'
        }`}>
          <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 pr-8">
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