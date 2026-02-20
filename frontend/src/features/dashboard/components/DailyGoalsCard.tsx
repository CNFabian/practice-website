import React from "react";
import { OnestFont } from "../../../assets";

export interface GoalItem {
  id: string;
  title: string;
  current: number;
  target: number;
}

interface GoalsCardProps {
  goals: GoalItem[];
}

const GoalsCard: React.FC<GoalsCardProps> = ({ goals }) => {
  return (
    <div className="bg-card-gradient rounded-2xl p-5">
      {/* Header */}
      <div className="pb-4">
        <OnestFont weight={700} lineHeight="tight" className="text-text-blue-black text-base">
          Goals
        </OnestFont>
      </div>

      {/* Goals Row — scrollable */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        {goals.map((goal) => {
          const isComplete = goal.current >= goal.target;
          const progress = Math.min((goal.current / goal.target) * 100, 100);

          return (
            <div key={goal.id} className="bg-pure-white rounded-xl p-3.5 min-w-[150px] flex-shrink-0">
              {/* Checkmark Icon */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center mb-2 ${
                  isComplete ? "bg-status-green" : "bg-unavailable-button/20"
                }`}
              >
                <svg
                  className={`w-3.5 h-3.5 ${
                    isComplete ? "text-pure-white" : "text-unavailable-button"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              {/* Goal Title */}
              <OnestFont weight={500} lineHeight="tight" className="text-text-blue-black text-sm mb-2">
                {goal.title}
              </OnestFont>

              {/* Progress Bar + Text — hidden when complete */}
              {!isComplete && (
                <>
                  <div className="h-1.5 bg-unavailable-button/20 rounded-full overflow-hidden mb-1.5">
                    <div
                      className="h-full bg-status-green rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-xs">
                    {goal.current}/{goal.target}
                  </OnestFont>
                </>
              )}

              {/* Complete label */}
              {isComplete && (
                <OnestFont weight={500} lineHeight="relaxed" className="text-status-green text-xs">
                  Complete!
                </OnestFont>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GoalsCard;