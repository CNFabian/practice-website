import React, { useState } from "react";
import { OnestFont } from "../../../assets";
import { useCoinTransactions } from "../hooks/useCoinTransactions";

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
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// ────────────────────────────────────────────────────────
// Source type → readable label
// ────────────────────────────────────────────────────────

const SOURCE_LABELS: Record<string, string> = {
  lesson_completion: "Lesson Completion",
  quiz_reward: "Quiz Reward",
  coupon_redemption: "Coupon Redemption",
  module_completion: "Module Completion",
  streak_bonus: "Streak Bonus",
  badge_reward: "Badge Reward",
  daily_bonus: "Daily Bonus",
};

const getSourceLabel = (source: string | null): string => {
  if (!source) return "";
  return SOURCE_LABELS[source] ?? source.replace(/_/g, " ");
};

// ────────────────────────────────────────────────────────
// Skeleton
// ────────────────────────────────────────────────────────

const SkeletonRow: React.FC = () => (
  <div className="bg-pure-white p-4 rounded-xl shadow-sm mb-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-light-background-blue animate-pulse rounded-full" />
        <div>
          <div className="h-4 w-40 bg-light-background-blue animate-pulse rounded mb-1" />
          <div className="h-3 w-24 bg-light-background-blue animate-pulse rounded" />
        </div>
      </div>
      <div className="text-right">
        <div className="h-4 w-16 bg-light-background-blue animate-pulse rounded mb-1 ml-auto" />
        <div className="h-3 w-12 bg-light-background-blue animate-pulse rounded ml-auto" />
      </div>
    </div>
  </div>
);

const SkeletonList: React.FC = () => (
  <div>
    {Array.from({ length: 5 }).map((_, i) => (
      <SkeletonRow key={i} />
    ))}
  </div>
);

// ────────────────────────────────────────────────────────
// Empty state
// ────────────────────────────────────────────────────────

const EmptyState: React.FC = () => (
  <div className="text-center py-8">
    <span className="text-unavailable-button text-4xl mb-3 block">🪙</span>
    <OnestFont
      as="p"
      weight={500}
      lineHeight="relaxed"
      className="text-text-grey text-sm"
    >
      No coin transactions yet. Start completing lessons to earn coins!
    </OnestFont>
  </div>
);

// ────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────

const LIMIT = 20;

const CoinTransactionHistory: React.FC = () => {
  const [offset, setOffset] = useState(0);
  const { data, isLoading } = useCoinTransactions(LIMIT, offset);

  if (isLoading && offset === 0) return <SkeletonList />;

  const transactions: any[] = Array.isArray(data) ? data : [];

  if (transactions.length === 0 && offset === 0) return <EmptyState />;

  const isEarned = (t: any): boolean =>
    t.transaction_type === "earned" || t.amount > 0;

  return (
    <div>
      {transactions.map((t) => {
        const earned = isEarned(t);
        return (
          <div
            key={t.id}
            className="bg-pure-white p-4 rounded-xl shadow-sm mb-3"
          >
            <div className="flex items-center justify-between gap-3">
              {/* Left: icon + description */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    earned ? "bg-status-green/10" : "bg-status-red/10"
                  }`}
                >
                  <span className="text-sm">{earned ? "↑" : "↓"}</span>
                </div>

                <div className="min-w-0">
                  <OnestFont
                    as="p"
                    weight={500}
                    lineHeight="tight"
                    className="text-text-blue-black text-sm truncate"
                  >
                    {t.description || (earned ? "Coins Earned" : "Coins Spent")}
                  </OnestFont>

                  {t.source_type && (
                    <OnestFont
                      as="p"
                      weight={500}
                      className="text-text-grey text-xs"
                    >
                      {getSourceLabel(t.source_type)}
                    </OnestFont>
                  )}
                </div>
              </div>

              {/* Right: amount + timestamp */}
              <div className="text-right flex-shrink-0">
                <OnestFont
                  as="p"
                  weight={700}
                  lineHeight="tight"
                  className={`text-sm ${
                    earned ? "text-status-green" : "text-status-red"
                  }`}
                >
                  {earned ? "+" : ""}
                  {t.amount}
                </OnestFont>

                <OnestFont
                  as="span"
                  weight={500}
                  className="text-unavailable-button text-xs"
                >
                  {relativeTime(t.created_at)}
                </OnestFont>
              </div>
            </div>
          </div>
        );
      })}

      {/* Load More */}
      {transactions.length >= LIMIT && (
        <div className="text-center mt-4">
          <button
            className="bg-light-background-blue text-logo-blue px-4 py-2 rounded-lg text-sm hover:opacity-80 transition-opacity"
            onClick={() => setOffset((prev) => prev + LIMIT)}
          >
            <OnestFont as="span" weight={500}>
              Load More
            </OnestFont>
          </button>
        </div>
      )}
    </div>
  );
};

export default CoinTransactionHistory;