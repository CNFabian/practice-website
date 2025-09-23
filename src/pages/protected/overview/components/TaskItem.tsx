import React from "react";
import { RobotoFont } from "../../../../assets";
import { Task } from "../types/overview.types";

interface TaskItemProps {
  task: Task;
}

const TaskItem: React.FC<TaskItemProps> = ({ task }) => {
  return (
    <div className="border-b border-gray-300 min-h-14 py-2">
      <div className="flex items-center justify-between h-full gap-2">
        <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 min-w-0 flex-1">
          <div className="w-8 h-8 lg:w-10 lg:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <img
              src={task.icon}
              alt="Avatar"
              className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10"
            />
          </div>
          <RobotoFont 
            weight={400} 
            className={`text-sm sm:text-base lg:text-lg font-medium min-w-0 ${
              task.isWIP ? 'text-blue-600' : 'text-gray-900'
            }`}
            style={{ 
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              hyphens: 'auto'
            }}
          >
            {task.title}
          </RobotoFont>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3 flex-shrink-0">
          <RobotoFont weight={500} className="text-gray-600 text-xs sm:text-sm font-medium whitespace-nowrap">
            {task.points}+
          </RobotoFont>
          <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded flex items-center justify-center ${
            task.completed ? 'bg-green-500' : 'bg-gray-400'
          }`}>
            {task.completed && (
              <svg
                className="w-3 h-3 sm:w-4 sm:h-4 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskItem;