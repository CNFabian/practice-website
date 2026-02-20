import React, { useState, useEffect, useCallback } from "react";
import { OnestFont, StreakBranch, GrowthPointsProfileIcon } from "../../../assets";

interface StreakCardProps {
  onStreakChange?: (streak: number) => void;
}

interface StreakData {
  currentStreak: number;
  lastCheckInDate: string | null; // ISO date string (YYYY-MM-DD)
}

const STREAK_STORAGE_KEY = "nestnavigate_streak";

const getTodayDateString = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

const getYesterdayDateString = (): string => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
};

const loadStreakData = (): StreakData => {
  try {
    const stored = localStorage.getItem(STREAK_STORAGE_KEY);
    if (stored) {
      const data: StreakData = JSON.parse(stored);
      const today = getTodayDateString();
      const yesterday = getYesterdayDateString();

      // If last check-in was before yesterday, streak resets
      if (data.lastCheckInDate && data.lastCheckInDate !== today && data.lastCheckInDate !== yesterday) {
        return { currentStreak: 0, lastCheckInDate: null };
      }
      return data;
    }
  } catch {
    // Corrupted data, reset
  }
  return { currentStreak: 0, lastCheckInDate: null };
};

const saveStreakData = (data: StreakData): void => {
  try {
    localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or unavailable
  }
};

const StreakCard: React.FC<StreakCardProps> = ({ onStreakChange }) => {
  const [streakData, setStreakData] = useState<StreakData>(loadStreakData);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);

  const maxLeaves = 7;
  const activeLeaves = Math.min(streakData.currentStreak, maxLeaves);

  // Check if already checked in today on mount
  useEffect(() => {
    const today = getTodayDateString();
    const data = loadStreakData();
    setStreakData(data);
    setHasCheckedInToday(data.lastCheckInDate === today);
    onStreakChange?.(data.currentStreak);
  }, []);

  const handleCheckIn = useCallback(() => {
    const today = getTodayDateString();

    // Already checked in today
    if (streakData.lastCheckInDate === today) return;

    const newStreak = streakData.currentStreak + 1;
    const newData: StreakData = {
      currentStreak: newStreak,
      lastCheckInDate: today,
    };

    saveStreakData(newData);
    setStreakData(newData);
    setHasCheckedInToday(true);
    onStreakChange?.(newStreak);
  }, [streakData, onStreakChange]);

  // Leaf positions at branch tips (tuned to streak_branch.png)
  const leafPositions = [
    { left: '20%', top: '33%', rotate: '-30deg' },
    { left: '36%', top: '7%', rotate: '20deg' },
    { left: '40%', top: '27%', rotate: '-20deg' },
    { left: '60%', top: '1%', rotate: '15deg' },
    { left: '65%', top: '24%', rotate: '-15deg' },
    { left: '82%', top: '17%', rotate: '25deg' },
    { left: '75%', top: '42%', rotate: '-20deg' },
  ];

  return (
    <div className="bg-card-gradient rounded-2xl p-5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <OnestFont weight={700} lineHeight="tight" className="text-text-blue-black text-base">
          Learning Streak
        </OnestFont>
        <OnestFont weight={500} lineHeight="relaxed" className="text-text-grey text-xs">
          {streakData.currentStreak} day{streakData.currentStreak !== 1 ? "s" : ""}
        </OnestFont>
      </div>

      {/* Branch + Leaves Visualization */}
      <div className="relative w-full mb-4 flex items-center justify-center" style={{ height: '130px' }}>
        {/* Branch Image — centered */}
        <img
          src={StreakBranch}
          alt="Streak branch"
          className="w-full h-auto object-contain"
        />

        {/* Leaves — positioned at branch tips */}
        {leafPositions.map((pos, index) => {
          const isActive = index < activeLeaves;
          return (
            <img
              key={index}
              src={GrowthPointsProfileIcon}
              alt=""
              className="absolute w-8 h-8 object-contain transition-all duration-500"
              style={{
                left: pos.left,
                top: pos.top,
                transform: `rotate(${pos.rotate})${isActive ? ' scale(1)' : ' scale(0.9)'}`,
                opacity: isActive ? 1 : 0.2,
                filter: isActive ? 'none' : 'grayscale(100%)',
              }}
            />
          );
        })}
      </div>

      {/* Check In Button */}
      <button
        onClick={handleCheckIn}
        disabled={hasCheckedInToday}
        className={`w-full py-2.5 rounded-xl transition-opacity ${
          hasCheckedInToday
            ? "bg-status-green text-pure-white cursor-default"
            : "bg-logo-blue text-pure-white hover:opacity-90"
        }`}
      >
        <OnestFont weight={500} lineHeight="relaxed" className="text-sm">
          {hasCheckedInToday ? "Checked In ✓" : "Check In"}
        </OnestFont>
      </button>
    </div>
  );
};

export default StreakCard;