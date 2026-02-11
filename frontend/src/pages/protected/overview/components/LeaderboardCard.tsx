import React from "react";
import { OnestFont } from "../../../../assets";
import { LeaderboardEntry } from "../types/overview.types";
import { LeaderboardCrown } from "../../../../assets";

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

  const getPodiumHeight = (rank: number) => {
    switch (rank) {
      case 1:
        return "h-[140px]";
      case 2:
        return "h-[112px]";
      case 3:
        return "h-[92px]";
      default:
        return "h-[92px]";
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
      <div className="flex items-center justify-between px-5 pt-4 pb-1">
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
          <div className="rounded-xl px-2">
            <div className="flex items-end justify-center gap-2">
              {podiumOrder.map((entry) => {
                if (!entry) return null;
                const isFirst = entry.rank === 1;
                return (
                  <div
                    key={entry.id}
                    className="flex flex-col items-center"
                    style={{ width: isFirst ? "90px" : "74px" }}
                  >
                    {/* Crown for 1st place - overlaps avatar on the left */}
                    {isFirst && (
                      <img
                        src={LeaderboardCrown}
                        alt="Crown"
                        className="w-12 h-12 mb-[-20px] ml-[8px] self-start z-20"
                      />
                    )}

                    {/* Avatar Circle */}
                    <div
                      className={`rounded-full bg-elegant-blue flex items-center justify-center mb-[-14px] z-10 border-2 border-pure-white ${
                        isFirst ? "w-14 h-14" : "w-11 h-11"
                      }`}
                    >
                      <OnestFont
                        weight={700}
                        lineHeight="relaxed"
                        className={`text-pure-white ${isFirst ? "text-base" : "text-sm"}`}
                      >
                        {getInitials(entry.name)}
                      </OnestFont>
                    </div>

                    {/* Podium Bar with Rank Number and Initials Tag */}
                    <div
                      className={`w-full ${getPodiumHeight(entry.rank)} bg-elegant-blue rounded-t-xl flex flex-col items-center justify-center relative`}
                    >
                      <OnestFont
                        weight={700}
                        lineHeight="tight"
                        className={`text-pure-white ${
                          entry.rank === 1 ? "text-4xl" : entry.rank === 2 ? "text-3xl" : "text-2xl"
                        }`}
                        style={{ fontStyle: "italic" }}
                      >
                        {entry.rank}
                      </OnestFont>

                      {/* Initials Tag */}
                      <div className="bg-pure-white rounded-full px-3 py-0.5 mt-1">
                        <OnestFont
                          weight={500}
                          lineHeight="tight"
                          className="text-text-blue-black text-xs"
                        >
                          {getInitials(entry.name)}
                        </OnestFont>
                      </div>
                    </div>
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