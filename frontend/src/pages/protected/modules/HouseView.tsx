import React from 'react';

// Sample module data - this should match your actual module structure
const SAMPLE_MODULE = {
  id: 1,
  title: 'Finance Fundamentals',
  description: 'Learn the basics of personal finance and homebuying',
  lessons: [
    {
      id: 101,
      title: 'Introduction to Financial Literacy',
      description: 'Understanding the basics of personal finance and budgeting for your future home.',
      duration: '15 min',
      coins: 50,
      completed: false,
    },
    {
      id: 102,
      title: 'Core Financial Concepts',
      description: 'Essential knowledge for managing your finances and preparing for homeownership.',
      duration: '20 min',
      coins: 50,
      completed: false,
    },
    {
      id: 103,
      title: 'Practical Application',
      description: 'Applying financial principles to real-life homebuying scenarios.',
      duration: '25 min',
      coins: 75,
      completed: false,
    },
  ],
};

interface HouseViewProps {
  houseId?: string;
  onLessonSelect?: (lessonId: string) => void;
  onBackToNeighborhood?: () => void;
  isTransitioning?: boolean;
}

const HouseView: React.FC<HouseViewProps> = ({ 
  houseId,
  onLessonSelect,
  onBackToNeighborhood,
  isTransitioning = false 
}) => {
  const handleLessonClick = (lessonId: number) => {
    if (!isTransitioning && onLessonSelect) {
      onLessonSelect(lessonId.toString());
    }
  };

  return (
    <div className="w-full h-full bg-gradient-to-b from-amber-100 via-orange-50 to-red-100 relative overflow-hidden">
      {/* Back Button */}
      {onBackToNeighborhood && (
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={onBackToNeighborhood}
            disabled={isTransitioning}
            className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:bg-white transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Neighborhood
          </button>
        </div>
      )}

      {/* House Interior with Actual Lessons */}
      <div className="absolute inset-0 overflow-y-auto">
        <div className="min-h-full flex flex-col">
          {/* House Header */}
          <div className="bg-white/90 backdrop-blur-sm border-b border-white/50 p-6">
            <div className="max-w-4xl mx-auto text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-amber-500 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M9 21V8a1 1 0 011-1h4a1 1 0 011 1v13" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {SAMPLE_MODULE.title}
              </h1>
              <p className="text-lg text-gray-600 mb-4">
                {SAMPLE_MODULE.description}
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                <span>{SAMPLE_MODULE.lessons.length} Lessons Available</span>
                <span>•</span>
                <span>{houseId ? `House: ${houseId}` : 'Learning House'}</span>
              </div>
            </div>
          </div>

          {/* Lessons Grid */}
          <div className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {SAMPLE_MODULE.lessons.map((lesson, index) => (
                  <div 
                    key={lesson.id}
                    className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    {/* Lesson Header */}
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          Lesson {index + 1}
                        </span>
                        <div className="flex items-center gap-1 text-amber-600">
                          <span className="text-xs font-semibold">+{lesson.coins}</span>
                          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="12" fill="currentColor"/>
                            <text x="12" y="16" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">C</text>
                          </svg>
                        </div>
                      </div>
                      <h3 className="font-semibold text-gray-800 text-sm leading-tight">
                        {lesson.title}
                      </h3>
                    </div>

                    {/* Lesson Content */}
                    <div className="p-4 space-y-3">
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {lesson.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{lesson.duration}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          lesson.completed 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                          {lesson.completed ? 'Completed' : 'Ready'}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => handleLessonClick(lesson.id)}
                          disabled={isTransitioning}
                          className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            lesson.completed
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {lesson.completed ? 'Review' : 'Start Lesson'}
                        </button>
                        <button
                          disabled={isTransitioning}
                          className="px-3 py-2 bg-gray-200 text-gray-600 rounded-lg text-xs hover:bg-gray-300 transition-colors disabled:opacity-50"
                        >
                          Quiz
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Progress Summary */}
              <div className="mt-8 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Module Progress</h3>
                  <div className="flex items-center justify-center gap-4 text-sm">
                    <span className="text-gray-600">
                      {SAMPLE_MODULE.lessons.filter(l => l.completed).length} / {SAMPLE_MODULE.lessons.length} lessons completed
                    </span>
                    <span className="text-amber-600 font-medium">
                      Total: {SAMPLE_MODULE.lessons.reduce((sum, l) => sum + l.coins, 0)} coins available
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(SAMPLE_MODULE.lessons.filter(l => l.completed).length / SAMPLE_MODULE.lessons.length) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 left-16 w-4 h-4 bg-blue-400 rounded-full opacity-40 animate-pulse"></div>
      <div className="absolute top-32 right-20 w-3 h-3 bg-green-500 rounded-full opacity-60"></div>
      <div className="absolute bottom-24 left-1/4 w-5 h-5 bg-purple-400 rounded-full opacity-30 animate-bounce"></div>
    </div>
  );
};

export default HouseView;