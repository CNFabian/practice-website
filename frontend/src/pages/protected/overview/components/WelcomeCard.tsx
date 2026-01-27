import React from "react";
import { OnestFont } from "../../../../assets";
import { Task } from "../types/overview.types";
import TaskItem from "./TaskItem";

interface WelcomeCardProps {
  tasks: Task[];
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const WelcomeCard: React.FC<WelcomeCardProps> = ({ 
  tasks, 
  isExpanded, 
  onToggleExpand 
}) => {
  return (
    <div className="bg-[#EFF2FF] rounded-xl p-4 transition-all duration-300 ease-in-out">
      {/* Header with dropdown arrow */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
        <OnestFont 
          as="h2" 
          weight={700} 
          lineHeight="tight"
          className="text-gray-900 text-lg sm:text-xl lg:text-2xl flex-1 min-w-0"
          style={{ 
            wordBreak: 'break-word',
            overflowWrap: 'break-word'
          }}
        >
          Welcome to Nest Navigate!
        </OnestFont>
        <button 
          onClick={onToggleExpand}
          className="p-1 hover:bg-white/50 rounded transition-colors flex-shrink-0"
          aria-label={isExpanded ? "Collapse welcome section" : "Expand welcome section"}
        >
          <svg
            className={`w-5 h-5 sm:w-6 sm:h-6 text-gray-400 flex-shrink-0 transition-transform duration-300 ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {/* Description - Always visible */}
      <OnestFont 
        as="p" 
        weight={300} 
        lineHeight="relaxed"
        className="text-gray-600 mb-4 sm:mb-6 lg:mb-8 text-sm sm:text-base leading-relaxed"
        style={{ 
          wordBreak: 'break-word',
          overflowWrap: 'break-word'
        }}
      >
        Here's a few tasks to get your bearings. Set up your profile to
        personalize your learning experience. Access your first module and
        complete your first lesson. Test your knowledge by completing
        quizzes. Spend your coins on rewards. Battle against other players
        for coins.
      </OnestFont>

      {/* Collapsible Task Items Container */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
        isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="flex flex-col gap-2.5">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default WelcomeCard;