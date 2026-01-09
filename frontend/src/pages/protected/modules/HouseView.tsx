import React from 'react';

interface HouseViewProps {
  houseId?: string;
  onLessonSelect?: (lessonId: string) => void;  // Keep original interface
  onBackToNeighborhood?: () => void;
  isTransitioning?: boolean;
}

const HouseView: React.FC<HouseViewProps> = ({ 
  houseId,
  onLessonSelect,
  onBackToNeighborhood,
  isTransitioning = false 
}) => {
  const handleLessonClick = (lessonId: string) => {
    if (!isTransitioning && onLessonSelect) {
      onLessonSelect(lessonId);
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

      {/* Placeholder House Interface */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center p-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl max-w-xl">
          <div className="w-16 h-16 mx-auto mb-4 bg-amber-500 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M9 21V8a1 1 0 011-1h4a1 1 0 011 1v13" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            🏠 House View
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            {houseId ? `Inside: ${houseId}` : 'Learning House Interior'}
          </p>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Room Features:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Study rooms with modules</li>
                  <li>• Practice areas</li>
                  <li>• Assessment chambers</li>
                  <li>• Bonus content rooms</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Interactive Elements:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Room-based navigation</li>
                  <li>• Module grouping by theme</li>
                  <li>• Progress tracking per room</li>
                  <li>• Special room mechanics</li>
                </ul>
              </div>
            </div>

            {/* Sample Room Layout Preview */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-700 mb-3">Sample Room Layout:</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-200 p-3 rounded-lg text-center">
                  <div className="text-xs font-medium text-blue-800">Study Room</div>
                  <div className="text-xs text-blue-600 mt-1">3 Modules</div>
                </div>
                <div className="bg-green-200 p-3 rounded-lg text-center">
                  <div className="text-xs font-medium text-green-800">Practice</div>
                  <div className="text-xs text-green-600 mt-1">2 Modules</div>
                </div>
                <div className="bg-purple-200 p-3 rounded-lg text-center">
                  <div className="text-xs font-medium text-purple-800">Assessment</div>
                  <div className="text-xs text-purple-600 mt-1">1 Module</div>
                </div>
              </div>
            </div>

            {/* Demo Lesson Buttons */}
            {onLessonSelect && (
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Preview Lessons:</h4>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => handleLessonClick('lesson-intro')}
                    disabled={isTransitioning}
                    className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50 text-sm"
                  >
                    Intro Lesson
                  </button>
                  <button
                    onClick={() => handleLessonClick('lesson-practice')}
                    disabled={isTransitioning}
                    className="px-3 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50 text-sm"
                  >
                    Practice Lesson
                  </button>
                </div>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-700">
                <strong>Note:</strong> This is a placeholder interface. The final implementation will show actual lessons from your selected module and connect to the full lesson view.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Room Elements */}
      <div className="absolute top-20 left-16 w-6 h-6 bg-blue-500 rounded-full opacity-60 animate-pulse"></div>
      <div className="absolute top-32 right-20 w-4 h-4 bg-green-600 rounded-full opacity-80"></div>
      <div className="absolute bottom-24 left-1/3 w-8 h-8 bg-purple-500 rounded-full opacity-50 animate-bounce"></div>
      <div className="absolute bottom-12 right-16 w-10 h-10 bg-amber-600 rounded-full opacity-70"></div>
    </div>
  );
};

export default HouseView;