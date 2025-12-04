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
      const timer = setTimeout(() => setShouldAnimate(true), 50);
      return () => clearTimeout(timer);
    } else {
      setShouldAnimate(false);
    }
  }, [isVisible]);

  // Only render if visible
  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className={`absolute inset-0 bg-black/10 transition-opacity duration-300 rounded-xl ${
          isVisible && shouldAnimate ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ 
          backdropFilter: 'blur(2px)',
          zIndex: 10
        }}
      />
      
      {/* Feedback overlay positioned over the center of the quiz options */}
      <div 
        className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
      >
        <div 
          className={`transition-all duration-500 ease-in-out pointer-events-auto ${
            isVisible && shouldAnimate
              ? 'transform translate-y-0 opacity-100 scale-100' 
              : 'transform translate-y-4 opacity-0 scale-90'
          }`}
        >
          <div 
            className={`max-w-xs w-full mx-4 p-4 rounded-xl border-2 flex items-center justify-center shadow-xl backdrop-blur-sm feedback-bounce ${
              isCorrect 
                ? 'bg-green-50/95 border-green-300 text-green-800 shadow-green-200/50' 
                : 'bg-red-50/95 border-red-300 text-red-800 shadow-red-200/50'
            }`}
            key={`feedback-${isCorrect}-${Date.now()}`}
          >
            <div className="text-center w-full">
              <div className={`text-sm font-semibold mb-2 flex items-center justify-center gap-2 ${
                isCorrect ? 'text-green-700' : 'text-red-700'
              }`}>
                {isCorrect ? (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Correct!
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Not quite right
                  </>
                )}
              </div>
              <div className="text-sm leading-tight text-gray-700">
                {isCorrect ? correctMessage : incorrectMessage}
              </div>
            </div>
          </div>
        </div>
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
    </>
  );
};

export default FeedbackContainer;