import React from "react";
import { RobotoFont } from "../../../../assets";
import { LeaderboardEntry } from "../types/overview.types";

interface LeaderboardCardProps {
  entries: LeaderboardEntry[];
  onMenuClick?: () => void;
}

const LeaderboardCard: React.FC<LeaderboardCardProps> = ({ 
  entries, 
  onMenuClick 
}) => {
  return (
    <div className="bg-[#EFF2FF] rounded-xl">
      {/* Header section */}
      <div className="flex items-center justify-between h-16 sm:h-20 px-4 py-2 gap-2">
        <RobotoFont 
          as="h2" 
          weight={500} 
          className="text-gray-900 text-lg sm:text-xl lg:text-2xl font-bold flex-1 min-w-0"
          style={{ 
            wordBreak: 'break-word',
            overflowWrap: 'break-word'
          }}
        >
          Weekly Leaderboard
        </RobotoFont>
        <button 
          className="text-gray-600 hover:text-gray-800 flex-shrink-0"
          onClick={onMenuClick}
          aria-label="Leaderboard menu"
        >
          <svg
            className="w-5 h-5 sm:w-6 sm:h-6"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="5" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="19" r="2" />
          </svg>
        </button>
      </div>

      {/* Leaderboard entries */}
      <div className="flex flex-col">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between h-12 px-4 gap-2"
          >
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-[#D7DEFF] flex-shrink-0">
                <img
                  src={entry.avatar}
                  alt="Avatar"
                  className="w-5 h-5 sm:w-6 sm:h-6"
                />
              </div>
              <RobotoFont 
                weight={400} 
                className="text-gray-900 text-sm sm:text-base font-medium truncate"
              >
                {entry.name}
              </RobotoFont>
            </div>
            <RobotoFont 
              weight={500} 
              className="text-gray-600 text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0"
            >
              {entry.coins} Coins
            </RobotoFont>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeaderboardCard;