import React from 'react';
import { OnestFont } from '../../../assets';
import type { LeadScoreResponse } from '../../../services/analyticsAPI';

const getBarColor = (score: number): string => {
  if (score <= 25) return 'bg-status-red';
  if (score <= 50) return 'bg-status-yellow';
  if (score <= 75) return 'bg-logo-blue';
  return 'bg-status-green';
};

const getScoreLabel = (score: number): string => {
  if (score <= 25) return 'Low';
  if (score <= 50) return 'Medium';
  if (score <= 75) return 'Good';
  return 'Excellent';
};

const DIMENSIONS = [
  { key: 'engagement_score' as const, label: 'Engagement', weight: '35%' },
  { key: 'learning_velocity_score' as const, label: 'Learning Velocity', weight: '25%' },
  { key: 'rewards_score' as const, label: 'Rewards', weight: '25%' },
  { key: 'timeline_urgency_score' as const, label: 'Timeline Urgency', weight: '15%' },
  { key: 'help_seeking_score' as const, label: 'Help-Seeking', weight: '15%' },
];

interface ScoreBreakdownProps {
  scores: LeadScoreResponse;
}

const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({ scores }) => {
  const compositeColor = (() => {
    const normalized = scores.composite_score / 10;
    if (normalized <= 25) return 'text-status-red';
    if (normalized <= 50) return 'text-status-yellow';
    if (normalized <= 75) return 'text-logo-blue';
    return 'text-status-green';
  })();

  return (
    <div className="bg-pure-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <OnestFont weight={500} lineHeight="tight" className="text-text-blue-black text-lg">
          Score Breakdown
        </OnestFont>
        <div className="text-right">
          <OnestFont weight={700} lineHeight="tight" className={`text-3xl ${compositeColor}`}>
            {Math.round(scores.composite_score)}
          </OnestFont>
          <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-xs">
            / 1000 composite
          </OnestFont>
        </div>
      </div>

      <div className="space-y-4">
        {DIMENSIONS.map((dim) => {
          const value = scores[dim.key];
          const barColor = getBarColor(value);
          const label = getScoreLabel(value);
          return (
            <div key={dim.key}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <OnestFont weight={500} lineHeight="relaxed" className="text-text-blue-black text-sm">
                    {dim.label}
                  </OnestFont>
                  <OnestFont weight={300} lineHeight="relaxed" className="text-unavailable-button text-xs">
                    ({dim.weight})
                  </OnestFont>
                </div>
                <div className="flex items-center gap-2">
                  <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-xs">
                    {label}
                  </OnestFont>
                  <OnestFont weight={500} lineHeight="relaxed" className="text-text-blue-black text-sm">
                    {Math.round(value)}
                  </OnestFont>
                </div>
              </div>
              <div className="w-full h-2 bg-light-background-blue rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                  style={{ width: `${Math.min(value, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-light-background-blue">
        <div className="flex items-center justify-between">
          <OnestFont weight={500} lineHeight="relaxed" className="text-text-grey text-sm">
            Signal Coverage
          </OnestFont>
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {Array.from({ length: scores.total_signals_count }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i < scores.available_signals_count ? 'bg-logo-blue' : 'bg-unavailable-button/30'
                  }`}
                />
              ))}
            </div>
            <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-xs">
              {scores.available_signals_count}/{scores.total_signals_count}
            </OnestFont>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreBreakdown;