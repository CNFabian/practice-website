import React from "react";
import { OnestFont } from "../../../assets";
import { useMyProgress } from "../../../hooks/queries/useMyProgress";
import SectionError from "./SectionError";

// ────────────────────────────────────────────────────────
// Engagement level → style mapping
// ────────────────────────────────────────────────────────

interface EngagementStyle {
  label: string;
  emoji: string;
  strokeColor: string;
  pillBg: string;
  pillText: string;
}

const ENGAGEMENT_MAP: Record<string, EngagementStyle> = {
  High: {
    label: "High Engagement",
    emoji: "🔥",
    strokeColor: "#76DC94", // status-green
    pillBg: "bg-status-green/10",
    pillText: "text-status-green",
  },
  Medium: {
    label: "Building Momentum",
    emoji: "⚡",
    strokeColor: "#FAC86D", // status-yellow
    pillBg: "bg-status-yellow/10",
    pillText: "text-status-yellow",
  },
  Low: {
    label: "Getting Started",
    emoji: "🌱",
    strokeColor: "#3658EC", // logo-blue
    pillBg: "bg-logo-blue/10",
    pillText: "text-logo-blue",
  },
};

const DEFAULT_ENGAGEMENT: EngagementStyle = ENGAGEMENT_MAP.Low;

const getEngagement = (level: string | undefined): EngagementStyle => {
  if (level && ENGAGEMENT_MAP[level]) return ENGAGEMENT_MAP[level];
  return DEFAULT_ENGAGEMENT;
};

// ────────────────────────────────────────────────────────
// SVG ring constants
// ────────────────────────────────────────────────────────

const SIZE = 60;
const STROKE_WIDTH = 5;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const TRACK_COLOR = "#EBEFFF"; // light-background-blue

// ────────────────────────────────────────────────────────
// Skeleton
// ────────────────────────────────────────────────────────

const Skeleton: React.FC = () => (
  <div className="flex items-center gap-3">
    <div className="w-[60px] h-[60px] bg-light-background-blue animate-pulse rounded-full flex-shrink-0" />
    <div>
      <div className="h-4 w-20 bg-light-background-blue animate-pulse rounded mb-1" />
      <div className="h-3 w-28 bg-light-background-blue animate-pulse rounded" />
    </div>
  </div>
);

// ────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────

const ProgressRing: React.FC = () => {
  const { data, isLoading, isError, refetch } = useMyProgress();

  if (isLoading) return <Skeleton />;
  if (isError)
    return (
      <SectionError
        message="Failed to load progress data."
        onRetry={refetch}
      />
    );

  const pct = data?.progress_percentage ?? 0;
  const engagement = getEngagement(data?.engagement_level);
  const offset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE;

  return (
    <div className="flex items-center gap-3">
      {/* SVG Ring */}
      <div
        className="relative flex-shrink-0"
        style={{ width: SIZE, height: SIZE }}
      >
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          {/* Track */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={TRACK_COLOR}
            strokeWidth={STROKE_WIDTH}
          />
          {/* Fill */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={engagement.strokeColor}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>

        {/* Percentage in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <OnestFont
            as="span"
            weight={700}
            lineHeight="tight"
            className="text-text-blue-black text-sm"
          >
            {Math.round(pct)}%
          </OnestFont>
        </div>
      </div>

      {/* Engagement label */}
      <div>
        <div
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${engagement.pillBg}`}
        >
          <span className="text-xs">{engagement.emoji}</span>
          <OnestFont
            as="span"
            weight={500}
            className={`text-xs ${engagement.pillText}`}
          >
            {engagement.label}
          </OnestFont>
        </div>

        <OnestFont
          as="p"
          weight={300}
          lineHeight="relaxed"
          className="text-text-grey text-xs mt-0.5"
        >
          Overall Progress
        </OnestFont>
      </div>
    </div>
  );
};

export default ProgressRing;