import React from "react";
import { OnestFont } from "../../../../assets";
import { LeaderboardEntry } from "../types/overview.types";

interface LeaderboardCardProps {
  entries: LeaderboardEntry[];
  onMenuClick?: () => void;
}

const LeaderboardCard: React.FC<LeaderboardCardProps> = ({
  entries,
  onMenuClick,
}) => {
  // Split entries: top 3 for podium, rest for list
  const podiumEntries = entries.slice(0, 3);
  const listEntries = entries.slice(3);

  // Reorder for podium display: 2nd, 1st, 3rd
  const podiumOrder = [
    podiumEntries[1], // 2nd place (left)
    podiumEntries[0], // 1st place (center)
    podiumEntries[2], // 3rd place (right)
  ].filter(Boolean);

  const getMedalEmoji = (rank: number) => {
    switch (rank) {
      case 1:
        return "👑";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return null;
    }
  };

  const getPodiumHeight = (rank: number) => {
    switch (rank) {
      case 1:
        return "h-16";
      case 2:
        return "h-12";
      case 3:
        return "h-9";
      default:
        return "h-9";
    }
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name[0]?.toUpperCase() || "?";
  };

  return (
    <div className="bg-card-gradient rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <OnestFont
          as="h2"
          weight={700}
          lineHeight="tight"
          className="text-text-blue-black text-base"
        >
          Top Learners
        </OnestFont>
        <button
          className="text-text-grey hover:text-text-blue-black flex-shrink-0"
          onClick={onMenuClick}
          aria-label="Leaderboard menu"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="5" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="19" r="2" />
          </svg>
        </button>
      </div>

      {/* Podium Section */}
      {podiumOrder.length > 0 && (
        <div className="px-5 pb-4">
          <div className="bg-tab-active rounded-xl p-4">
            <div className="flex items-end justify-center gap-3">
              {podiumOrder.map((entry) => {
                if (!entry) return null;
                return (
                  <div
                    key={entry.id}
                    className="flex flex-col items-center"
                    style={{ width: entry.rank === 1 ? "80px" : "68px" }}
                  >
                    {/* Medal */}
                    <span className="text-base mb-1">{getMedalEmoji(entry.rank)}</span>

                    {/* Avatar */}
                    <div
                      className={`rounded-full bg-elegant-blue flex items-center justify-center mb-1.5 ${
                        entry.rank === 1 ? "w-11 h-11" : "w-9 h-9"
                      }`}
                    >
                      <OnestFont
                        weight={700}
                        lineHeight="relaxed"
                        className={`text-pure-white ${entry.rank === 1 ? "text-sm" : "text-xs"}`}
                      >
                        {getInitials(entry.name)}
                      </OnestFont>
                    </div>

                    {/* Name */}
                    <OnestFont
                      weight={500}
                      lineHeight="tight"
                      className="text-text-blue-black text-xs text-center truncate w-full mb-0.5"
                    >
                      {entry.name}
                    </OnestFont>

                    {/* Score */}
                    <OnestFont
                      weight={300}
                      lineHeight="relaxed"
                      className="text-text-grey text-xs mb-1.5"
                    >
                      {entry.coins}
                    </OnestFont>

                    {/* Podium Bar */}
                    <div
                      className={`w-full ${getPodiumHeight(entry.rank)} bg-logo-blue rounded-t-lg`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* List Section (Ranks 4+) */}
      {listEntries.length > 0 && (
        <div className="px-5 pb-4">
          <div className="flex flex-col gap-1">
            {listEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-tab-active/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Rank Number */}
                  <OnestFont
                    weight={500}
                    lineHeight="relaxed"
                    className="text-text-grey text-sm w-5 text-center flex-shrink-0"
                  >
                    {entry.rank}
                  </OnestFont>

                  {/* Avatar */}
                  <div className="w-7 h-7 rounded-full bg-tab-active flex items-center justify-center flex-shrink-0">
                    <OnestFont
                      weight={500}
                      lineHeight="relaxed"
                      className="text-logo-blue text-xs"
                    >
                      {getInitials(entry.name)}
                    </OnestFont>
                  </div>

                  {/* Name */}
                  <OnestFont
                    weight={300}
                    lineHeight="relaxed"
                    className="text-text-blue-black text-sm truncate"
                  >
                    {entry.name}
                  </OnestFont>
                </div>

                {/* Score */}
                <OnestFont
                  weight={500}
                  lineHeight="relaxed"
                  className="text-text-grey text-xs flex-shrink-0"
                >
                  {entry.coins}
                </OnestFont>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaderboardCard;