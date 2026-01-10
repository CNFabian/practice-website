import React, { useEffect } from 'react';

// Sample module data - this should match your actual module structure
const SAMPLE_MODULE = {
  id: 1,
  title: 'Homebuying Foundations',
  lessons: [
    {
      id: 101,
      title: 'Renting vs Buying',
      type: 'Video/Reading',
      completed: false,
      locked: false,
    },
    {
      id: 102,
      title: 'Preparing Your Documents',
      type: 'Video/Reading',
      completed: true,
      locked: false,
    },
    {
      id: 103,
      title: 'Financial Basics',
      type: 'Video/Reading',
      completed: true,
      locked: false,
    },
    {
      id: 104,
      title: 'Setting a Timeline',
      type: 'Video/Reading',
      completed: false,
      locked: true,
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
  // Set the background for this section
  useEffect(() => {
    const bgElement = document.getElementById('section-background');
    if (bgElement) {
      bgElement.style.setProperty('background', 'linear-gradient(to bottom, rgb(254, 243, 199), rgb(255, 247, 237), rgb(254, 226, 226))', 'important');
      bgElement.style.backgroundSize = 'cover';
    }
  }, [houseId, isTransitioning]);

  const handleLessonClick = (lessonId: number, isLocked: boolean) => {
    if (!isTransitioning && onLessonSelect && !isLocked) {
      const lessonNumber = lessonId - 100;
      onLessonSelect(`lesson-${lessonNumber}`);
    }
  };

  const completedCount = SAMPLE_MODULE.lessons.filter(l => l.completed).length;
  const totalCount = SAMPLE_MODULE.lessons.length;

  return (
    <div className="w-full h-full relative overflow-hidden">
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

      {/* Main Content */}
      <div className="absolute inset-0 flex items-center justify-center p-8">
        <div className="w-full max-w-5xl">
          {/* Header */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {SAMPLE_MODULE.title}
            </h1>
            <p className="text-lg text-gray-600">
              {completedCount}/{totalCount} Rooms Completed
            </p>
          </div>

          {/* 2x2 Grid of Lessons */}
          <div className="backdrop-blur-sm rounded-b-2xl shadow-lg p-8">
            <div className="grid grid-cols-2 gap-6">
              {SAMPLE_MODULE.lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className={`
                    relative flex flex-col items-center
                    
                  `}
                >
                  {/* Title and Type - Semi-transparent background */}
                  <div className="relative bg-white/70 backdrop-blur-sm rounded-xl shadow-md p-8 text-center">
                    <h3 className="text-2xl font-bold text-gray-800 mb-3">
                      {lesson.title}
                    </h3>
                    <p className="text-base text-gray-600">
                      {lesson.type}
                    </p>
                    
                    {/* Lock Icon Overlay for locked lessons */}
                    {lesson.locked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50 rounded-xl">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Action Button - Outside the background */}
                  <div className="w-full mt-4 px-4 items-center flex justify-center">
                    {lesson.locked ? (
                      <button
                        disabled
                        className="py-3 px-6 bg-gray-300 text-gray-500 rounded-full font-medium cursor-not-allowed"
                      >
                        Locked
                      </button>
                    ) : (
                      <button
                        onClick={() => handleLessonClick(lesson.id, lesson.locked)}
                        disabled={isTransitioning}
                        className={`
                          py-3 px-6 rounded-full font-medium
                          transition-all duration-300 disabled:opacity-50
                          ${lesson.completed
                            ? 'bg-white border-2 border-blue-500 text-blue-600 hover:bg-blue-50'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                          }
                        `}
                      >
                        {lesson.completed ? 'Re-read Lesson' : 'Start Lesson'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HouseView;