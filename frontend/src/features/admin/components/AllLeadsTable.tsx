import React, { useState, useMemo, useCallback } from 'react';
import { OnestFont } from '../../../assets';
import { useAllLeads, useCalculateUserScore } from '../hooks/useAnalyticsAdmin';
import type { LeadSummary, LeadFilters } from '../../../services/analyticsAPI';

const PAGE_SIZE = 20;

const TEMPERATURE_OPTIONS = [
  { value: '', label: 'All Temperatures' },
  { value: 'hot_lead', label: 'Hot' },
  { value: 'warm_lead', label: 'Warm' },
  { value: 'cold_lead', label: 'Cold' },
  { value: 'dormant', label: 'Dormant' },
];

const INTENT_OPTIONS = [
  { value: '', label: 'All Intents' },
  { value: 'very_high_intent', label: 'Very High' },
  { value: 'high_intent', label: 'High' },
  { value: 'medium_intent', label: 'Medium' },
  { value: 'low_intent', label: 'Low' },
];

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

const getScoreBarColor = (score: number): string => {
  const normalized = score / 10;
  if (normalized <= 25) return 'bg-status-red';
  if (normalized <= 50) return 'bg-status-yellow';
  if (normalized <= 75) return 'bg-logo-blue';
  return 'bg-status-green';
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

type SortField = 'name' | 'composite_score' | 'lead_temperature' | 'intent_band' | 'profile_completion_pct' | 'last_activity_at';
type SortDirection = 'asc' | 'desc';

interface AllLeadsTableProps {
  onViewDetail?: (userId: string) => void;
}

const AllLeadsTable: React.FC<AllLeadsTableProps> = ({ onViewDetail }) => {
  const [temperatureFilter, setTemperatureFilter] = useState('');
  const [intentFilter, setIntentFilter] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [minCompletion, setMinCompletion] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [sortField, setSortField] = useState<SortField>('composite_score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [recalculatingId, setRecalculatingId] = useState<string | null>(null);

  const filters: LeadFilters = useMemo(() => ({
    ...(temperatureFilter ? { temperature: temperatureFilter } : {}),
    ...(intentFilter ? { intent: intentFilter } : {}),
    ...(minScore > 0 ? { min_score: minScore } : {}),
    ...(minCompletion > 0 ? { min_completion: minCompletion } : {}),
    limit: PAGE_SIZE,
    offset: currentPage * PAGE_SIZE,
  }), [temperatureFilter, intentFilter, minScore, minCompletion, currentPage]);

  const { data: leads, isLoading, error, refetch } = useAllLeads(filters);
  const calculateScore = useCalculateUserScore();

  const sortedLeads = useMemo(() => {
    if (!leads) return [];
    const sorted = [...leads];
    sorted.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
          break;
        case 'composite_score':
          comparison = a.composite_score - b.composite_score;
          break;
        case 'lead_temperature': {
          const tempOrder: Record<string, number> = { hot_lead: 4, warm_lead: 3, cold_lead: 2, dormant: 1 };
          comparison = (tempOrder[a.lead_temperature || ''] || 0) - (tempOrder[b.lead_temperature || ''] || 0);
          break;
        }
        case 'intent_band': {
          const intentOrder: Record<string, number> = { very_high_intent: 4, high_intent: 3, medium_intent: 2, low_intent: 1 };
          comparison = (intentOrder[a.intent_band || ''] || 0) - (intentOrder[b.intent_band || ''] || 0);
          break;
        }
        case 'profile_completion_pct':
          comparison = a.profile_completion_pct - b.profile_completion_pct;
          break;
        case 'last_activity_at': {
          const dateA = a.last_activity_at ? new Date(a.last_activity_at).getTime() : 0;
          const dateB = b.last_activity_at ? new Date(b.last_activity_at).getTime() : 0;
          comparison = dateA - dateB;
          break;
        }
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [leads, sortField, sortDirection]);

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  }, [sortField]);

  const handleRecalculate = useCallback(async (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecalculatingId(userId);
    try {
      await calculateScore.mutateAsync(userId);
      refetch();
    } finally {
      setRecalculatingId(null);
    }
  }, [calculateScore, refetch]);

  const handleFilterReset = useCallback(() => {
    setTemperatureFilter('');
    setIntentFilter('');
    setMinScore(0);
    setMinCompletion(0);
    setCurrentPage(0);
  }, []);

  const hasActiveFilters = temperatureFilter || intentFilter || minScore > 0 || minCompletion > 0;
  const hasMore = leads && leads.length === PAGE_SIZE;
  const hasPrevious = currentPage > 0;

  const SortIcon: React.FC<{ field: SortField }> = ({ field }) => {
    if (sortField !== field) return <span className="text-unavailable-button ml-1">↕</span>;
    return <span className="text-logo-blue ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  if (error) {
    return (
      <div className="bg-pure-white rounded-xl p-8 shadow-sm text-center">
        <OnestFont weight={500} lineHeight="relaxed" className="text-status-red text-lg mb-2">
          Failed to load leads data
        </OnestFont>
        <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-sm">
          {error.message || 'An unexpected error occurred.'}
        </OnestFont>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="bg-pure-white rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[160px]">
            <OnestFont weight={500} lineHeight="relaxed" className="text-text-grey text-xs mb-1 block">
              Temperature
            </OnestFont>
            <select
              value={temperatureFilter}
              onChange={(e) => { setTemperatureFilter(e.target.value); setCurrentPage(0); }}
              className="w-full px-3 py-2 bg-text-white border border-unavailable-button/30 rounded-lg text-sm text-text-blue-black focus:outline-none focus:border-logo-blue"
            >
              {TEMPERATURE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[160px]">
            <OnestFont weight={500} lineHeight="relaxed" className="text-text-grey text-xs mb-1 block">
              Intent
            </OnestFont>
            <select
              value={intentFilter}
              onChange={(e) => { setIntentFilter(e.target.value); setCurrentPage(0); }}
              className="w-full px-3 py-2 bg-text-white border border-unavailable-button/30 rounded-lg text-sm text-text-blue-black focus:outline-none focus:border-logo-blue"
            >
              {INTENT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[160px]">
            <OnestFont weight={500} lineHeight="relaxed" className="text-text-grey text-xs mb-1 block">
              Min Score: {minScore}
            </OnestFont>
            <input
              type="range"
              min={0}
              max={1000}
              step={50}
              value={minScore}
              onChange={(e) => { setMinScore(Number(e.target.value)); setCurrentPage(0); }}
              className="w-full accent-logo-blue"
            />
          </div>

          <div className="flex-1 min-w-[160px]">
            <OnestFont weight={500} lineHeight="relaxed" className="text-text-grey text-xs mb-1 block">
              Min Completion: {minCompletion}%
            </OnestFont>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={minCompletion}
              onChange={(e) => { setMinCompletion(Number(e.target.value)); setCurrentPage(0); }}
              className="w-full accent-logo-blue"
            />
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleFilterReset}
              className="px-3 py-2 text-sm text-status-red hover:bg-status-red/10 rounded-lg transition-colors"
            >
              <OnestFont weight={500} lineHeight="relaxed">Clear Filters</OnestFont>
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-pure-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(8)].map((_, i) => (
              <ShimmerBlock key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : sortedLeads.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-light-background-blue">
                    <th
                      className="text-left px-6 py-3 cursor-pointer select-none hover:bg-text-white transition-colors"
                      onClick={() => handleSort('name')}
                    >
                      <OnestFont weight={500} lineHeight="relaxed" className="text-text-grey text-xs uppercase tracking-wider inline-flex items-center">
                        User<SortIcon field="name" />
                      </OnestFont>
                    </th>
                    <th
                      className="text-left px-6 py-3 cursor-pointer select-none hover:bg-text-white transition-colors"
                      onClick={() => handleSort('composite_score')}
                    >
                      <OnestFont weight={500} lineHeight="relaxed" className="text-text-grey text-xs uppercase tracking-wider inline-flex items-center">
                        Score<SortIcon field="composite_score" />
                      </OnestFont>
                    </th>
                    <th
                      className="text-left px-6 py-3 cursor-pointer select-none hover:bg-text-white transition-colors"
                      onClick={() => handleSort('lead_temperature')}
                    >
                      <OnestFont weight={500} lineHeight="relaxed" className="text-text-grey text-xs uppercase tracking-wider inline-flex items-center">
                        Temperature<SortIcon field="lead_temperature" />
                      </OnestFont>
                    </th>
                    <th
                      className="text-left px-6 py-3 cursor-pointer select-none hover:bg-text-white transition-colors"
                      onClick={() => handleSort('intent_band')}
                    >
                      <OnestFont weight={500} lineHeight="relaxed" className="text-text-grey text-xs uppercase tracking-wider inline-flex items-center">
                        Intent<SortIcon field="intent_band" />
                      </OnestFont>
                    </th>
                    <th
                      className="text-left px-6 py-3 cursor-pointer select-none hover:bg-text-white transition-colors"
                      onClick={() => handleSort('profile_completion_pct')}
                    >
                      <OnestFont weight={500} lineHeight="relaxed" className="text-text-grey text-xs uppercase tracking-wider inline-flex items-center">
                        Profile<SortIcon field="profile_completion_pct" />
                      </OnestFont>
                    </th>
                    <th
                      className="text-left px-6 py-3 cursor-pointer select-none hover:bg-text-white transition-colors"
                      onClick={() => handleSort('last_activity_at')}
                    >
                      <OnestFont weight={500} lineHeight="relaxed" className="text-text-grey text-xs uppercase tracking-wider inline-flex items-center">
                        Last Active<SortIcon field="last_activity_at" />
                      </OnestFont>
                    </th>
                    <th className="text-left px-6 py-3">
                      <OnestFont weight={500} lineHeight="relaxed" className="text-text-grey text-xs uppercase tracking-wider">
                        Actions
                      </OnestFont>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedLeads.map((lead: LeadSummary) => {
                    const tempBadge = getTemperatureBadge(lead.lead_temperature);
                    const intentBadge = getIntentBadge(lead.intent_band);
                    const scoreColor = getScoreColor(lead.composite_score);
                    const scoreBarColor = getScoreBarColor(lead.composite_score);
                    const isRecalculating = recalculatingId === lead.user_id;

                    return (
                      <tr
                        key={lead.user_id}
                        className="border-b border-light-background-blue last:border-b-0 hover:bg-text-white transition-colors cursor-pointer"
                        onClick={() => onViewDetail?.(lead.user_id)}
                      >
                        <td className="px-6 py-4">
                          <OnestFont weight={500} lineHeight="relaxed" className="text-text-blue-black text-sm">
                            {lead.first_name} {lead.last_name}
                          </OnestFont>
                          <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-xs">
                            {lead.email}
                          </OnestFont>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <OnestFont weight={700} lineHeight="relaxed" className={`text-sm ${scoreColor}`}>
                              {lead.composite_score}
                            </OnestFont>
                            <div className="w-16 h-1.5 bg-light-background-blue rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${scoreBarColor}`}
                                style={{ width: `${Math.min((lead.composite_score / 1000) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
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
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-light-background-blue rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-elegant-blue"
                                style={{ width: `${Math.min(lead.profile_completion_pct, 100)}%` }}
                              />
                            </div>
                            <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-xs">
                              {Math.round(lead.profile_completion_pct)}%
                            </OnestFont>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-sm">
                            {formatRelativeTime(lead.last_activity_at)}
                          </OnestFont>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); onViewDetail?.(lead.user_id); }}
                              className="px-2 py-1 text-xs text-logo-blue hover:bg-logo-blue/10 rounded transition-colors"
                            >
                              <OnestFont weight={500} lineHeight="relaxed">View</OnestFont>
                            </button>
                            <button
                              onClick={(e) => handleRecalculate(lead.user_id, e)}
                              disabled={isRecalculating}
                              className="px-2 py-1 text-xs text-elegant-blue hover:bg-elegant-blue/10 rounded transition-colors disabled:opacity-50"
                            >
                              <OnestFont weight={500} lineHeight="relaxed">
                                {isRecalculating ? '...' : 'Recalc'}
                              </OnestFont>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-light-background-blue">
              <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-sm">
                Page {currentPage + 1} · Showing {sortedLeads.length} results
              </OnestFont>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                  disabled={!hasPrevious}
                  className="px-3 py-1.5 text-sm bg-text-white border border-unavailable-button/30 rounded-lg text-text-blue-black hover:bg-light-background-blue transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <OnestFont weight={500} lineHeight="relaxed">Previous</OnestFont>
                </button>
                <button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={!hasMore}
                  className="px-3 py-1.5 text-sm bg-text-white border border-unavailable-button/30 rounded-lg text-text-blue-black hover:bg-light-background-blue transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <OnestFont weight={500} lineHeight="relaxed">Next</OnestFont>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-8 text-center">
            <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-sm">
              No leads found matching the current filters
            </OnestFont>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllLeadsTable;