import React, { useState, useCallback } from 'react';
import { OnestFont } from '../../../assets';
import { useLeadDetail, useLeadHistory, useCalculateUserScore } from '../hooks/useAnalyticsAdmin';
import ScoreBreakdown from './ScoreBreakdown';
import ScoreHistoryChart from './ScoreHistoryChart';

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

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ShimmerBlock: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-light-background-blue rounded-lg ${className}`} />
);

interface LeadDetailViewProps {
  userId: string;
  onBack?: () => void;
}

const LeadDetailView: React.FC<LeadDetailViewProps> = ({ userId, onBack }) => {
  const { data: lead, isLoading, error, refetch } = useLeadDetail(userId);
  const { data: history, isLoading: historyLoading } = useLeadHistory(userId, 30);
  const calculateScore = useCalculateUserScore();
  const [isRecalculating, setIsRecalculating] = useState(false);

  const handleRecalculate = useCallback(async () => {
    setIsRecalculating(true);
    try {
      await calculateScore.mutateAsync(userId);
      refetch();
    } finally {
      setIsRecalculating(false);
    }
  }, [calculateScore, userId, refetch]);

  if (error) {
    return (
      <div className="space-y-4">
        {onBack && (
          <button onClick={onBack} className="text-logo-blue hover:opacity-80 transition-opacity">
            <OnestFont weight={500} lineHeight="relaxed" className="text-sm">← Back to All Leads</OnestFont>
          </button>
        )}
        <div className="bg-pure-white rounded-xl p-8 shadow-sm text-center">
          <OnestFont weight={500} lineHeight="relaxed" className="text-status-red text-lg mb-2">
            Failed to load lead details
          </OnestFont>
          <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-sm">
            {error.message || 'An unexpected error occurred.'}
          </OnestFont>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {onBack && (
          <button onClick={onBack} className="text-logo-blue hover:opacity-80 transition-opacity">
            <OnestFont weight={500} lineHeight="relaxed" className="text-sm">← Back to All Leads</OnestFont>
          </button>
        )}
        <div className="bg-pure-white rounded-xl p-6 shadow-sm">
          <ShimmerBlock className="h-8 w-48 mb-4" />
          <ShimmerBlock className="h-4 w-64 mb-2" />
          <ShimmerBlock className="h-4 w-40" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-pure-white rounded-xl p-6 shadow-sm">
            <ShimmerBlock className="h-6 w-32 mb-4" />
            {[...Array(5)].map((_, i) => <ShimmerBlock key={i} className="h-8 w-full mb-3" />)}
          </div>
          <div className="bg-pure-white rounded-xl p-6 shadow-sm">
            <ShimmerBlock className="h-6 w-32 mb-4" />
            <ShimmerBlock className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!lead) return null;

  const tempBadge = getTemperatureBadge(lead.temperature);
  const intentBadge = getIntentBadge(lead.intent_band);

  return (
    <div className="space-y-4">
      {/* Back button */}
      {onBack && (
        <button onClick={onBack} className="text-logo-blue hover:opacity-80 transition-opacity">
          <OnestFont weight={500} lineHeight="relaxed" className="text-sm">← Back to All Leads</OnestFont>
        </button>
      )}

      {/* Header */}
      <div className="bg-pure-white rounded-xl p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <OnestFont weight={700} lineHeight="tight" className="text-text-blue-black text-2xl">
              {lead.first_name} {lead.last_name}
            </OnestFont>
            <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-sm mt-1">
              {lead.email}
            </OnestFont>
            {lead.phone && (
              <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-sm">
                {lead.phone}
              </OnestFont>
            )}
            <div className="flex gap-4 mt-3">
              <div>
                <OnestFont weight={300} lineHeight="relaxed" className="text-unavailable-button text-xs">
                  Account Created
                </OnestFont>
                <OnestFont weight={500} lineHeight="relaxed" className="text-text-blue-black text-sm">
                  {formatDate(lead.created_at)}
                </OnestFont>
              </div>
              <div>
                <OnestFont weight={300} lineHeight="relaxed" className="text-unavailable-button text-xs">
                  Last Login
                </OnestFont>
                <OnestFont weight={500} lineHeight="relaxed" className="text-text-blue-black text-sm">
                  {formatDate(lead.last_login_at)}
                </OnestFont>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`inline-flex px-3 py-1.5 rounded-full ${tempBadge.bg}`}>
              <OnestFont weight={500} lineHeight="relaxed" className={`text-sm ${tempBadge.text}`}>
                {lead.temperature_label || tempBadge.label}
              </OnestFont>
            </span>
            <span className={`inline-flex px-3 py-1.5 rounded-full ${intentBadge.bg}`}>
              <OnestFont weight={500} lineHeight="relaxed" className={`text-sm ${intentBadge.text}`}>
                {lead.intent_label || intentBadge.label}
              </OnestFont>
            </span>
            <button
              onClick={handleRecalculate}
              disabled={isRecalculating}
              className="px-4 py-2 bg-logo-blue text-pure-white rounded-lg text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <OnestFont weight={500} lineHeight="relaxed">
                {isRecalculating ? 'Recalculating...' : 'Recalculate Score'}
              </OnestFont>
            </button>
          </div>
        </div>
      </div>

      {/* Score Breakdown + History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ScoreBreakdown scores={lead.scores} />
        {historyLoading ? (
          <div className="bg-pure-white rounded-xl p-6 shadow-sm">
            <ShimmerBlock className="h-6 w-32 mb-4" />
            <ShimmerBlock className="h-40 w-full" />
          </div>
        ) : (
          <ScoreHistoryChart history={history || []} />
        )}
      </div>

      {/* Classification Reasoning */}
      {lead.classification_reasoning && (
        <div className="bg-pure-white rounded-xl p-6 shadow-sm">
          <OnestFont weight={500} lineHeight="tight" className="text-text-blue-black text-lg mb-3">
            Classification Reasoning
          </OnestFont>
          <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-sm whitespace-pre-wrap">
            {lead.classification_reasoning}
          </OnestFont>
        </div>
      )}

      {/* Recommended Actions + Onboarding Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recommended Actions */}
        {lead.recommended_actions && Object.keys(lead.recommended_actions).length > 0 && (
          <div className="bg-pure-white rounded-xl p-6 shadow-sm">
            <OnestFont weight={500} lineHeight="tight" className="text-text-blue-black text-lg mb-3">
              Recommended Actions
            </OnestFont>
            <div className="space-y-2">
              {Object.entries(lead.recommended_actions).map(([key, value]) => (
                <div key={key} className="flex items-start gap-2 p-2 bg-text-white rounded-lg">
                  <div className="w-1.5 h-1.5 rounded-full bg-logo-blue mt-2 flex-shrink-0" />
                  <div>
                    <OnestFont weight={500} lineHeight="relaxed" className="text-text-blue-black text-sm capitalize">
                      {key.replace(/_/g, ' ')}
                    </OnestFont>
                    <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-xs">
                      {typeof value === 'string' ? value : JSON.stringify(value)}
                    </OnestFont>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Onboarding Data */}
        {lead.onboarding_data && Object.keys(lead.onboarding_data).length > 0 && (
          <div className="bg-pure-white rounded-xl p-6 shadow-sm">
            <OnestFont weight={500} lineHeight="tight" className="text-text-blue-black text-lg mb-3">
              Onboarding Data
            </OnestFont>
            <div className="space-y-2">
              {Object.entries(lead.onboarding_data).map(([key, value]) => {
                const displayKey = key.replace(/_/g, ' ');
                let displayValue: string;
                if (value === null || value === undefined) {
                  displayValue = 'N/A';
                } else if (typeof value === 'boolean') {
                  displayValue = value ? 'Yes' : 'No';
                } else {
                  displayValue = String(value);
                }
                return (
                  <div key={key} className="flex items-center justify-between p-2 bg-text-white rounded-lg">
                    <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-sm capitalize">
                      {displayKey}
                    </OnestFont>
                    <OnestFont weight={500} lineHeight="relaxed" className="text-text-blue-black text-sm">
                      {displayValue}
                    </OnestFont>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Last Calculated */}
      <div className="text-center py-2">
        <OnestFont weight={300} lineHeight="relaxed" className="text-unavailable-button text-xs">
          Score last calculated: {formatDate(lead.scores.last_calculated_at)}
        </OnestFont>
      </div>
    </div>
  );
};

export default LeadDetailView;