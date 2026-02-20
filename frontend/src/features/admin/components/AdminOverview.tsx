import React from 'react';
import { OnestFont } from '../../../../assets';
import { useAnalyticsInsights, useHotLeads, useSchedulerStatus } from '../../../../hooks/queries/useAnalyticsAdmin';
import KPICard from '../../admin/components/KPICard';
import DistributionChart from './DistributionChart';
import type { LeadSummary } from '../../../../services/analyticsAPI';

const getTemperatureBadge = (temp: string | null): { bg: string; text: string; label: string } => {
  switch (temp) {
    case 'hot_lead':
      return { bg: 'bg-status-red/10', text: 'text-status-red', label: 'Hot' };
    case 'warm_lead':
      return { bg: 'bg-status-yellow/10', text: 'text-status-yellow', label: 'Warm' };
    case 'cold_lead':
      return { bg: 'bg-logo-blue/10', text: 'text-logo-blue', label: 'Cold' };
    case 'dormant':
      return { bg: 'bg-unavailable-button/10', text: 'text-unavailable-button', label: 'Dormant' };
    default:
      return { bg: 'bg-unavailable-button/10', text: 'text-unavailable-button', label: 'N/A' };
  }
};

const getIntentBadge = (intent: string | null): { bg: string; text: string; label: string } => {
  switch (intent) {
    case 'very_high_intent':
      return { bg: 'bg-status-green/10', text: 'text-status-green', label: 'Very High' };
    case 'high_intent':
      return { bg: 'bg-logo-blue/10', text: 'text-logo-blue', label: 'High' };
    case 'medium_intent':
      return { bg: 'bg-status-yellow/10', text: 'text-status-yellow', label: 'Medium' };
    case 'low_intent':
      return { bg: 'bg-unavailable-button/10', text: 'text-unavailable-button', label: 'Low' };
    default:
      return { bg: 'bg-unavailable-button/10', text: 'text-unavailable-button', label: 'N/A' };
  }
};

const getScoreColor = (score: number): string => {
  const normalized = score / 10;
  if (normalized <= 25) return 'text-status-red';
  if (normalized <= 50) return 'text-status-yellow';
  if (normalized <= 75) return 'text-logo-blue';
  return 'text-status-green';
};

const formatRelativeTime = (dateStr: string | null): string => {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const ShimmerBlock: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-light-background-blue rounded-lg ${className}`} />
);

const AdminOverview: React.FC = () => {
  const { data: insights, isLoading: insightsLoading, error: insightsError } = useAnalyticsInsights();
  const { data: hotLeads, isLoading: hotLeadsLoading, error: hotLeadsError } = useHotLeads(10);
  const { data: schedulerStatus, isLoading: schedulerLoading } = useSchedulerStatus();

  const temperatureData = React.useMemo(() => {
    if (!insights?.temperature_distribution) return [];
    const dist = insights.temperature_distribution;
    return [
      { label: 'Hot', value: dist.hot_lead ?? dist.hot ?? 0, bgColor: 'bg-status-red', textColor: 'text-status-red' },
      { label: 'Warm', value: dist.warm_lead ?? dist.warm ?? 0, bgColor: 'bg-status-yellow', textColor: 'text-status-yellow' },
      { label: 'Cold', value: dist.cold_lead ?? dist.cold ?? 0, bgColor: 'bg-logo-blue', textColor: 'text-logo-blue' },
      { label: 'Dormant', value: dist.dormant ?? 0, bgColor: 'bg-unavailable-button', textColor: 'text-unavailable-button' },
    ];
  }, [insights]);

  const intentData = React.useMemo(() => {
    if (!insights?.intent_distribution) return [];
    const dist = insights.intent_distribution;
    return [
      { label: 'Very High', value: dist.very_high_intent ?? dist.very_high ?? 0, bgColor: 'bg-status-green', textColor: 'text-status-green' },
      { label: 'High', value: dist.high_intent ?? dist.high ?? 0, bgColor: 'bg-logo-blue', textColor: 'text-logo-blue' },
      { label: 'Medium', value: dist.medium_intent ?? dist.medium ?? 0, bgColor: 'bg-status-yellow', textColor: 'text-status-yellow' },
      { label: 'Low', value: dist.low_intent ?? dist.low ?? 0, bgColor: 'bg-unavailable-button', textColor: 'text-unavailable-button' },
    ];
  }, [insights]);

  const getHealthIndicator = (lastRun: string | null | undefined): { color: string; label: string } => {
    if (!lastRun) return { color: 'bg-unavailable-button', label: 'No data' };
    const diffMs = new Date().getTime() - new Date(lastRun).getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours < 25) return { color: 'bg-status-green', label: 'Healthy' };
    if (diffHours < 49) return { color: 'bg-status-yellow', label: 'Delayed' };
    return { color: 'bg-status-red', label: 'Stale' };
  };

  if (insightsError || hotLeadsError) {
    return (
      <div className="bg-pure-white rounded-xl p-8 shadow-sm text-center">
        <OnestFont weight={500} lineHeight="relaxed" className="text-status-red text-lg mb-2">
          Failed to load analytics data
        </OnestFont>
        <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-sm">
          {(insightsError || hotLeadsError)?.message || 'An unexpected error occurred.'}
        </OnestFont>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      {insightsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-pure-white rounded-xl p-6 shadow-sm">
              <ShimmerBlock className="h-4 w-24 mb-3" />
              <ShimmerBlock className="h-8 w-16 mb-1" />
              <ShimmerBlock className="h-3 w-20" />
            </div>
          ))}
        </div>
      ) : insights ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Users"
            value={insights.total_leads}
            icon="👥"
            iconBgColor="bg-logo-blue/10"
            subtitle="Registered users"
          />
          <KPICard
            title="Avg Composite Score"
            value={`${Math.round(insights.average_composite_score)}`}
            icon="📊"
            iconBgColor="bg-elegant-blue/10"
            subtitle="Out of 1000"
          />
          <KPICard
            title="Hot Leads"
            value={insights.high_priority_leads}
            icon="🔥"
            iconBgColor="bg-status-red/10"
            subtitle="Score ≥ 800"
          />
          <KPICard
            title="Avg Profile Completion"
            value={`${Math.round(insights.average_profile_completion)}%`}
            icon="✅"
            iconBgColor="bg-status-green/10"
            subtitle="Across all users"
          />
        </div>
      ) : null}

      {/* Distribution Charts */}
      {insightsLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-pure-white rounded-xl p-6 shadow-sm">
              <ShimmerBlock className="h-5 w-40 mb-4" />
              <ShimmerBlock className="h-6 w-full mb-4" />
              <div className="grid grid-cols-2 gap-3">
                {[...Array(4)].map((__, j) => (
                  <ShimmerBlock key={j} className="h-4 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DistributionChart title="Temperature Distribution" data={temperatureData} />
          <DistributionChart title="Intent Distribution" data={intentData} />
        </div>
      )}

      {/* Hot Leads Table */}
      <div className="bg-pure-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 pb-4">
          <OnestFont weight={500} lineHeight="tight" className="text-text-blue-black text-lg">
            Hot Leads
          </OnestFont>
        </div>

        {hotLeadsLoading ? (
          <div className="px-6 pb-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <ShimmerBlock key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : hotLeads && hotLeads.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-light-background-blue">
                  <th className="text-left px-6 py-3">
                    <OnestFont weight={500} lineHeight="relaxed" className="text-text-grey text-xs uppercase tracking-wider">
                      Name
                    </OnestFont>
                  </th>
                  <th className="text-left px-6 py-3">
                    <OnestFont weight={500} lineHeight="relaxed" className="text-text-grey text-xs uppercase tracking-wider">
                      Email
                    </OnestFont>
                  </th>
                  <th className="text-left px-6 py-3">
                    <OnestFont weight={500} lineHeight="relaxed" className="text-text-grey text-xs uppercase tracking-wider">
                      Score
                    </OnestFont>
                  </th>
                  <th className="text-left px-6 py-3">
                    <OnestFont weight={500} lineHeight="relaxed" className="text-text-grey text-xs uppercase tracking-wider">
                      Temperature
                    </OnestFont>
                  </th>
                  <th className="text-left px-6 py-3">
                    <OnestFont weight={500} lineHeight="relaxed" className="text-text-grey text-xs uppercase tracking-wider">
                      Intent
                    </OnestFont>
                  </th>
                  <th className="text-left px-6 py-3">
                    <OnestFont weight={500} lineHeight="relaxed" className="text-text-grey text-xs uppercase tracking-wider">
                      Last Active
                    </OnestFont>
                  </th>
                </tr>
              </thead>
              <tbody>
                {hotLeads.map((lead: LeadSummary) => {
                  const tempBadge = getTemperatureBadge(lead.lead_temperature);
                  const intentBadge = getIntentBadge(lead.intent_band);
                  const scoreColor = getScoreColor(lead.composite_score);
                  return (
                    <tr
                      key={lead.user_id}
                      className="border-b border-light-background-blue last:border-b-0 hover:bg-text-white transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <OnestFont weight={500} lineHeight="relaxed" className="text-text-blue-black text-sm">
                          {lead.first_name} {lead.last_name}
                        </OnestFont>
                      </td>
                      <td className="px-6 py-4">
                        <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-sm">
                          {lead.email}
                        </OnestFont>
                      </td>
                      <td className="px-6 py-4">
                        <OnestFont weight={700} lineHeight="relaxed" className={`text-sm ${scoreColor}`}>
                          {lead.composite_score}
                        </OnestFont>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 rounded-full ${tempBadge.bg}`}>
                          <OnestFont weight={500} lineHeight="relaxed" className={`text-xs ${tempBadge.text}`}>
                            {lead.temperature_label || tempBadge.label}
                          </OnestFont>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 rounded-full ${intentBadge.bg}`}>
                          <OnestFont weight={500} lineHeight="relaxed" className={`text-xs ${intentBadge.text}`}>
                            {lead.intent_label || intentBadge.label}
                          </OnestFont>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-sm">
                          {formatRelativeTime(lead.last_activity_at)}
                        </OnestFont>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 pb-6 text-center py-8">
            <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-sm">
              No hot leads found
            </OnestFont>
          </div>
        )}
      </div>

      {/* System Health Panel */}
      <div className="bg-pure-white rounded-xl p-6 shadow-sm">
        <OnestFont weight={500} lineHeight="tight" className="text-text-blue-black text-lg mb-4">
          System Health
        </OnestFont>

        {schedulerLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <ShimmerBlock key={i} className="h-6 w-full" />
            ))}
          </div>
        ) : schedulerStatus ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(() => {
              const recalcHealth = getHealthIndicator(schedulerStatus.last_recalculation_at);
              return (
                <div className="flex items-center gap-3 p-3 bg-text-white rounded-lg">
                  <div className={`w-3 h-3 rounded-full ${recalcHealth.color} flex-shrink-0`} />
                  <div>
                    <OnestFont weight={500} lineHeight="relaxed" className="text-text-blue-black text-sm">
                      Score Recalculation
                    </OnestFont>
                    <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-xs">
                      {schedulerStatus.last_recalculation_at
                        ? formatRelativeTime(schedulerStatus.last_recalculation_at)
                        : 'Never run'}
                    </OnestFont>
                  </div>
                </div>
              );
            })()}
            {(() => {
              const snapshotHealth = getHealthIndicator(schedulerStatus.last_snapshot_at);
              return (
                <div className="flex items-center gap-3 p-3 bg-text-white rounded-lg">
                  <div className={`w-3 h-3 rounded-full ${snapshotHealth.color} flex-shrink-0`} />
                  <div>
                    <OnestFont weight={500} lineHeight="relaxed" className="text-text-blue-black text-sm">
                      Snapshot Creation
                    </OnestFont>
                    <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-xs">
                      {schedulerStatus.last_snapshot_at
                        ? formatRelativeTime(schedulerStatus.last_snapshot_at)
                        : 'Never run'}
                    </OnestFont>
                  </div>
                </div>
              );
            })()}
            {(() => {
              const cleanupHealth = getHealthIndicator(schedulerStatus.last_cleanup_at);
              return (
                <div className="flex items-center gap-3 p-3 bg-text-white rounded-lg">
                  <div className={`w-3 h-3 rounded-full ${cleanupHealth.color} flex-shrink-0`} />
                  <div>
                    <OnestFont weight={500} lineHeight="relaxed" className="text-text-blue-black text-sm">
                      Event Cleanup
                    </OnestFont>
                    <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-xs">
                      {schedulerStatus.last_cleanup_at
                        ? formatRelativeTime(schedulerStatus.last_cleanup_at)
                        : 'Never run'}
                    </OnestFont>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-sm">
            Unable to retrieve scheduler status
          </OnestFont>
        )}
      </div>
    </div>
  );
};

export default AdminOverview;