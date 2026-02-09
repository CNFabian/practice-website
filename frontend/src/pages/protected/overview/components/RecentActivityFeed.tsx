import React from "react";
import { OnestFont } from "../../../../assets";
import { useRecentActivity } from "../../../../hooks/queries/useRecentActivity";

// ────────────────────────────────────────────────────────
// Activity type → icon / color mapping
// ────────────────────────────────────────────────────────

interface ActivityStyle {
  icon: string;
  dotColor: string;
}

const ACTIVITY_STYLES: Record<string, ActivityStyle> = {
  lesson_completed: { icon: "✅", dotColor: "bg-status-green" },
  quiz_passed:      { icon: "🏆", dotColor: "bg-logo-blue" },
  quiz_failed:      { icon: "🔄", dotColor: "bg-status-red" },
  badge_earned:     { icon: "🏅", dotColor: "bg-logo-yellow" },
  coupon_redeemed:  { icon: "🎁", dotColor: "bg-status-yellow" },
  coin_earned:      { icon: "🪙", dotColor: "bg-logo-yellow" },
};

const DEFAULT_STYLE: ActivityStyle = { icon: "📌", dotColor: "bg-elegant-blue" };

const getStyle = (type: string): ActivityStyle =>
  ACTIVITY_STYLES[type] ?? DEFAULT_STYLE;

// ────────────────────────────────────────────────────────
// Relative timestamp helper
// ────────────────────────────────────────────────────────

const relativeTime = (iso: string): string => {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return new Date(iso).toLocaleDateString();
};

// ────────────────────────────────────────────────────────
// Skeleton loader
// ────────────────────────────────────────────────────────

const SkeletonItem: React.FC = () => (
  <div className="flex items-start gap-3 py-3">
    <div className="w-8 h-8 bg-light-background-blue animate-pulse rounded-full flex-shrink-0" />
    <div className="flex-1">
      <div className="h-4 w-3/4 bg-light-background-blue animate-pulse rounded mb-2" />
      <div className="h-3 w-20 bg-light-background-blue animate-pulse rounded" />
    </div>
  </div>
);

const SkeletonFeed: React.FC = () => (
  <div className="bg-pure-white rounded-xl p-5 shadow-sm">
    <div className="h-5 w-32 bg-light-background-blue animate-pulse rounded mb-4" />
    {Array.from({ length: 5 }).map((_, i) => (
      <SkeletonItem key={i} />
    ))}
  </div>
);

// ────────────────────────────────────────────────────────
// Empty state
// ────────────────────────────────────────────────────────

const EmptyState: React.FC = () => (
  <div className="text-center py-8">
    <span className="text-unavailable-button text-4xl mb-3 block">📋</span>
    <OnestFont
      as="p"
      weight={500}
      lineHeight="relaxed"
      className="text-text-grey text-sm"
    >
      No activity yet. Complete your first lesson to get started!
    </OnestFont>
  </div>
);

// ────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────

const RecentActivityFeed: React.FC = () => {
  const { data, isLoading } = useRecentActivity(8);

  if (isLoading) return <SkeletonFeed />;

  const activities: any[] = Array.isArray(data) ? data : [];

  return (
    <div className="bg-pure-white rounded-xl p-5 shadow-sm">
      {/* Header */}
      <OnestFont
        as="h3"
        weight={700}
        lineHeight="tight"
        className="text-text-blue-black text-base mb-4"
      >
        Recent Activity
      </OnestFont>

      {activities.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[15px] top-0 bottom-0 border-l-2 border-light-background-blue" />

          {activities.map((item, idx) => {
            const style = getStyle(item.activity_type);
            const coinsEarned = item.metadata?.coins_earned;

            return (
              <div
                key={item.id ?? idx}
                className="relative flex items-start gap-3 py-3"
              >
                {/* Dot / icon */}
                <div
                  className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${style.dotColor} bg-opacity-20`}
                >
                  {style.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <OnestFont
                      as="p"
                      weight={500}
                      lineHeight="relaxed"
                      className="text-text-grey text-sm truncate"
                    >
                      {item.description}
                    </OnestFont>

                    {coinsEarned != null && (
                      <OnestFont
                        as="span"
                        weight={500}
                        className="bg-light-background-blue text-logo-blue text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                      >
                        +{coinsEarned} coins
                      </OnestFont>
                    )}
                  </div>

                  <OnestFont
                    as="span"
                    weight={500}
                    className="text-unavailable-button text-xs"
                  >
                    {relativeTime(item.created_at)}
                  </OnestFont>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecentActivityFeed;