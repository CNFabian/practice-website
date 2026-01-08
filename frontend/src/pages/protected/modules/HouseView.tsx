import React from 'react';

interface HouseViewProps {
  houseId?: string;
  onLessonSelect?: (lessonId: string) => void;
  onBackToNeighborhood?: () => void;
}

const HouseView: React.FC<HouseViewProps> = ({ 
  houseId, 
  onLessonSelect, 
  onBackToNeighborhood 
}) => {
  // TODO: Implement lesson selection functionality
  const handleLessonClick = (lessonId: string) => {
    if (onLessonSelect) {
      onLessonSelect(lessonId);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 to-pink-100">
      <div className="max-w-2xl mx-auto text-center p-8">
        <div className="mb-8">
          <div className="w-32 h-32 mx-auto mb-6 bg-purple-500 rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {houseId ? `${houseId} House` : 'Learning House'}
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Enter different rooms to access lessons and activities within this module!
          </p>
          
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Coming Soon Features:</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-gray-700">Room-based lesson organization</span>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-gray-700">Interactive lesson selection</span>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-gray-700">Progress tracking per room</span>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-gray-700">Special activity rooms</span>
              </div>
            </div>
          </div>
          
          {/* Placeholder lesson buttons */}
          <div className="mb-6">
            <button
              onClick={() => handleLessonClick('lesson-1')}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors mr-4"
            >
              Introduction Lesson
            </button>
            <button
              onClick={() => handleLessonClick('lesson-2')}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors mr-4"
            >
              Practice Activities
            </button>
            <button
              onClick={() => handleLessonClick('lesson-3')}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
              disabled
            >
              Assessment (Locked)
            </button>
          </div>

          {onBackToNeighborhood && (
            <button 
              onClick={onBackToNeighborhood}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors mb-4"
            >
              ← Back to Neighborhood
            </button>
          )}
          
          <div className="text-sm text-gray-500">
            🏠 House view will organize lessons within a module by rooms/categories
          </div>
        </div>
      </div>
    </div>
  );
};

export default HouseView;