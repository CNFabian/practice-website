import React from 'react';
import { OnestFont } from '../../../../assets';
import { useRewardStatistics } from '../../../../hooks/queries/useRewardsQueries';

interface RewardStats {
  total_redemptions: number;
  active_redemptions: number;
  used_redemptions: number;
  total_coins_spent: number;
  favorite_categories: Array<{ category: string; redemptions: number }>;
}

/**
 * Extracts stats from the API response, handling both flat and nested shapes.
 */
const extractStats = (data: unknown): RewardStats => {
  const defaults: RewardStats = {
    total_redemptions: 0,
    active_redemptions: 0,
    used_redemptions: 0,
    total_coins_spent: 0,
    favorite_categories: [],
  };

  if (!data || typeof data !== 'object') return defaults;

  const d = data as Record<string, unknown>;

  // Handle nested shape (e.g., { data: { ... } })
  const source = (d.data && typeof d.data === 'object') ? d.data as Record<string, unknown> : d;

  return {
    total_redemptions: typeof source.total_redemptions === 'number' ? source.total_redemptions : defaults.total_redemptions,
    active_redemptions: typeof source.active_redemptions === 'number' ? source.active_redemptions : defaults.active_redemptions,
    used_redemptions: typeof source.used_redemptions === 'number' ? source.used_redemptions : defaults.used_redemptions,
    total_coins_spent: typeof source.total_coins_spent === 'number' ? source.total_coins_spent : defaults.total_coins_spent,
    favorite_categories: Array.isArray(source.favorite_categories) ? source.favorite_categories : defaults.favorite_categories,
  };
};

const RewardStatsSummary: React.FC = () => {
  const { data, isLoading, isError } = useRewardStatistics();

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2 mb-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-pure-white rounded-xl px-4 py-3 shadow-sm min-w-[120px] animate-pulse"
          >
            <div className="h-3 w-16 bg-unavailable-button/30 rounded mb-2" />
            <div className="h-5 w-10 bg-unavailable-button/30 rounded" />
          </div>
        ))}
      </div>
    );
  }

  // Error or no data — render nothing silently
  if (isError || !data) {
    return null;
  }

  const stats = extractStats(data);

  const topCategory =
    stats.favorite_categories.length > 0
      ? stats.favorite_categories[0].category
      : '—';

  const statItems = [
    { label: 'Total Redeemed', value: stats.total_redemptions },
    { label: 'Active Coupons', value: stats.active_redemptions },
    { label: 'Coins Spent', value: stats.total_coins_spent.toLocaleString() },
    { label: 'Top Category', value: topCategory },
  ];

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 mb-4">
      {statItems.map((item) => (
        <div
          key={item.label}
          className="bg-pure-white rounded-xl px-4 py-3 shadow-sm min-w-[120px] flex-shrink-0"
        >
          <OnestFont
            as="p"
            weight={500}
            lineHeight="relaxed"
            className="text-text-grey text-xs mb-1"
          >
            {item.label}
          </OnestFont>
          <OnestFont
            as="p"
            weight={700}
            lineHeight="tight"
            className="text-text-blue-black text-lg"
          >
            {item.value}
          </OnestFont>
        </div>
      ))}
    </div>
  );
};

export default RewardStatsSummary;