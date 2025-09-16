import React, { useEffect, useState } from 'react';

interface FeedbackContainerProps {
  isVisible: boolean;
  isCorrect: boolean;
  correctMessage: string;
  incorrectMessage: string;
}

const FeedbackContainer: React.FC<FeedbackContainerProps> = ({
  isVisible,
  isCorrect,
  correctMessage,
  incorrectMessage
}) => {
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Trigger enter animation after a small delay to ensure it's visible
      const timer = setTimeout(() => setShouldAnimate(true), 50);
      return () => clearTimeout(timer);
    } else {
      setShouldAnimate(false);
    }
  }, [isVisible]);

  return (
    <div className="w-full max-w-sm mx-auto mb-4 flex-shrink-0 relative" style={{ height: '80px' }}>
      {/* Feedback Section with enter and exit animations */}
      <div 
        className={`absolute inset-0 transition-all duration-500 ease-in-out ${
          isVisible && shouldAnimate
            ? 'transform translate-y-0 opacity-100 scale-100' 
            : 'transform translate-y-4 opacity-0 scale-95 pointer-events-none'
        }`}
      >
        {isVisible && (
          <div 
            className={`w-full h-full p-3 rounded-lg border-2 flex items-center justify-center shadow-lg feedback-bounce ${
              isCorrect 
                ? 'bg-green-50 border-green-300 text-green-800 shadow-green-200/50' 
                : 'bg-red-50 border-red-300 text-red-800 shadow-red-200/50'
            }`}
            key={`feedback-${isCorrect}-${Date.now()}`}
          >
            <div className="text-center w-full">
              <div className={`text-xs font-medium mb-1 ${
                isCorrect ? 'text-green-700' : 'text-red-700'
              }`}>
                {isCorrect ? '✓ Correct!' : '✗ Not quite right'}
              </div>
              <div className="text-xs leading-tight text-gray-700">
                {isCorrect ? correctMessage : incorrectMessage}
              </div>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          .feedback-bounce {
            animation: feedbackBounceIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          }
          
          @keyframes feedbackBounceIn {
            0% {
              transform: translateY(20px) scale(0.9);
              opacity: 0;
            }
            100% {
              transform: translateY(0) scale(1);
              opacity: 1;
            }
          }
        `
      }} />
    </div>
  );
};

export default FeedbackContainer;