import React from "react";
import { OnestFont } from "../../../../assets";
import { useUserStatistics } from "../../../../hooks/queries/useUserStatistics";
import { useMyProgress } from "../../../../hooks/queries/useMyProgress";
import SectionError from "./SectionError";

// ────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────

/** Format minutes into "Xh Ym" or "Xm" */
const formatTime = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

/** Format large numbers with commas */
const formatNumber = (n: number): string => n.toLocaleString();

/**
 * The backend /api/dashboard/statistics returns a NESTED structure:
 * { coin_balance: {...}, badges: {...}, learning: {...}, quizzes: {...} }
 *
 * The frontend UserStatisticsResponse type was defined as FLAT.
 * This extractor handles BOTH shapes defensively so the UI never breaks.
 */
const extractStats = (data: any) => {
  // Nested shape (actual backend response)
  if (data?.learning) {
    const passRate =
      (data.quizzes?.total_taken ?? 0) > 0
        ? Math.round((data.quizzes.passed / data.quizzes.total_taken) * 100)
        : 0;
    return {
      lessonsCompleted: data.learning?.lessons?.completed ?? 0,
      totalLessons: data.learning?.lessons?.total ?? 0,
      quizzesPassed: data.quizzes?.passed ?? 0,
      totalQuizzesTaken: data.quizzes?.total_taken ?? 0,
      passRate,
      totalTimeSpentMinutes: 0,
      currentStreak: 0,
      lifetimeEarned: data.coin_balance?.lifetime_earned ?? 0,
      modulesCompleted: data.learning?.modules?.completed ?? 0,
      totalModules: data.learning?.modules?.total ?? 0,
    };
  }

  // Flat shape (UserStatisticsResponse type)
  const passRate =
    (data?.total_quizzes_taken ?? 0) > 0
      ? Math.round(
          ((data?.quizzes_passed ?? 0) / data.total_quizzes_taken) * 100
        )
      : 0;
  return {
    lessonsCompleted: data?.lessons_completed ?? 0,
    totalLessons: data?.total_lessons ?? 0,
    quizzesPassed: data?.quizzes_passed ?? 0,
    totalQuizzesTaken: data?.total_quizzes_taken ?? 0,
    passRate,
    totalTimeSpentMinutes: data?.total_time_spent_minutes ?? 0,
    currentStreak: data?.current_streak ?? 0,
    lifetimeEarned: data?.lifetime_earned ?? 0,
    modulesCompleted: data?.modules_completed ?? 0,
    totalModules: data?.total_modules ?? 0,
  };
};

// ────────────────────────────────────────────────────────
// Stat card configuration
// ────────────────────────────────────────────────────────

interface StatCardConfig {
  key: string;
  label: string;
  icon: string;
  iconColor: string;
  getValue: (s: ReturnType<typeof extractStats>, progress?: any) => string;
}

const STAT_CARDS: StatCardConfig[] = [
  {
    key: "lessons",
    label: "Lessons",
    icon: "📚",
    iconColor: "text-logo-blue",
    getValue: (s) => `${s.lessonsCompleted} / ${s.totalLessons}`,
  },
  {
    key: "quizRate",
    label: "Quiz Pass Rate",
    icon: "🏆",
    iconColor: "text-logo-blue",
    getValue: (s) => `${s.passRate}%`,
  },
  {
    key: "time",
    label: "Time Invested",
    icon: "⏱️",
    iconColor: "text-logo-blue",
    getValue: (s) => formatTime(s.totalTimeSpentMinutes),
  },
  {
    key: "streak",
    label: "Day Streak",
    icon: "🔥",
    iconColor: "text-status-red",
    getValue: (s) => `${s.currentStreak}`,
  },
  {
    key: "coins",
    label: "Coins Earned",
    icon: "🪙",
    iconColor: "text-logo-yellow",
    getValue: (s) => formatNumber(s.lifetimeEarned),
  },
  {
    key: "modules",
    label: "Modules",
    icon: "✅",
    iconColor: "text-logo-blue",
    getValue: (s) => `${s.modulesCompleted} / ${s.totalModules}`,
  },
  {
    key: "engagement",
    label: "Engagement",
    icon: "📊",
    iconColor: "text-logo-blue",
    getValue: (_s, progress) => progress?.engagement_level ?? "—",
  },
  {
    key: "overallProgress",
    label: "Overall Progress",
    icon: "🎯",
    iconColor: "text-status-green",
    getValue: (_s, progress) =>
      `${Math.round(progress?.progress_percentage ?? 0)}%`,
  },
];

// ────────────────────────────────────────────────────────
// Skeleton loader
// ────────────────────────────────────────────────────────

const StatCardSkeleton: React.FC = () => (
  <div className="bg-pure-white rounded-xl p-4 shadow-sm min-w-[140px] flex-shrink-0">
    <div className="h-6 w-6 bg-light-background-blue animate-pulse rounded mb-2" />
    <div className="h-5 w-16 bg-light-background-blue animate-pulse rounded mb-1" />
    <div className="h-3 w-20 bg-light-background-blue animate-pulse rounded" />
  </div>
);

const SkeletonRow: React.FC = () => (
  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
    {Array.from({ length: 8 }).map((_, i) => (
      <StatCardSkeleton key={i} />
    ))}
  </div>
);

// ────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────

const StatisticsSummary: React.FC = () => {
  const { data, isLoading, isError, refetch } = useUserStatistics();
  const { data: progressData } = useMyProgress();

  if (isLoading) return <SkeletonRow />;
  if (isError)
    return (
      <SectionError
        message="Failed to load your statistics."
        onRetry={refetch}
      />
    );

  const stats = extractStats(data);

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
      {STAT_CARDS.map((card) => (
        <div
          key={card.key}
          className="bg-pure-white rounded-xl p-4 shadow-sm min-w-[140px] flex-shrink-0"
        >
          <span className={`text-xl ${card.iconColor}`}>{card.icon}</span>

          <OnestFont
            as="p"
            weight={700}
            lineHeight="tight"
            className="text-text-blue-black text-lg mt-1"
          >
            {card.getValue(stats, progressData)}
          </OnestFont>

          <OnestFont
            as="p"
            weight={500}
            lineHeight="relaxed"
            className="text-text-grey text-xs"
          >
            {card.label}
          </OnestFont>
        </div>
      ))}
    </div>
  );
};

export default StatisticsSummary;