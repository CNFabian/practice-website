import React from 'react';

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
  return (
    <div className="w-full max-w-sm mx-auto mb-4 flex-shrink-0 h-20 relative overflow-hidden">
      {/* Feedback Section with enhanced animation */}
      <div 
        className={`absolute inset-0 transition-all duration-700 ease-out ${
          isVisible 
            ? 'transform translate-y-0 opacity-100 scale-100' 
            : 'transform translate-y-8 opacity-0 scale-95'
        }`}
      >
        <div className={`h-full p-3 rounded-lg border-2 flex items-center justify-center shadow-sm ${
          isCorrect 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="text-center">
            <div className="text-xs font-medium mb-1">
              {isCorrect ? 'Correct!' : 'Not quite right'}
            </div>
            <div className="text-xs leading-tight">
              {isCorrect ? correctMessage : incorrectMessage}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackContainer;