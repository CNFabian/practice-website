import React, { useMemo } from 'react';
import { OnestFont } from '../../../../assets';
import type { LeadScoreHistoryResponse } from '../../../../services/analyticsAPI';

interface ScoreHistoryChartProps {
  history: LeadScoreHistoryResponse[];
}

const getTemperatureLabel = (temp: string | null): string => {
  switch (temp) {
    case 'hot_lead': return 'Hot';
    case 'warm_lead': return 'Warm';
    case 'cold_lead': return 'Cold';
    case 'dormant': return 'Dormant';
    default: return 'N/A';
  }
};

const ScoreHistoryChart: React.FC<ScoreHistoryChartProps> = ({ history }) => {
  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => new Date(a.snapshot_date).getTime() - new Date(b.snapshot_date).getTime());
  }, [history]);

  if (sortedHistory.length === 0) {
    return (
      <div className="bg-pure-white rounded-xl p-6 shadow-sm">
        <OnestFont weight={500} lineHeight="tight" className="text-text-blue-black text-lg mb-4">
          Score History
        </OnestFont>
        <div className="flex items-center justify-center h-40">
          <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-sm">
            No history data available yet
          </OnestFont>
        </div>
      </div>
    );
  }

  const maxScore = 1000;
  const chartHeight = 200;
  const chartWidth = 100;

  const bands = [
    { min: 800, max: 1000, color: 'bg-status-green/10', label: 'Hot' },
    { min: 500, max: 800, color: 'bg-status-yellow/10', label: 'Warm' },
    { min: 200, max: 500, color: 'bg-logo-blue/10', label: 'Cold' },
    { min: 0, max: 200, color: 'bg-unavailable-button/10', label: 'Dormant' },
  ];

  const points = sortedHistory.map((entry, index) => ({
    x: sortedHistory.length > 1 ? (index / (sortedHistory.length - 1)) * chartWidth : 50,
    y: ((maxScore - entry.composite_score) / maxScore) * 100,
    score: entry.composite_score,
    date: entry.snapshot_date,
    temperature: entry.lead_temperature,
    intent: entry.intent_band,
  }));

  const pathD = points.length > 1
    ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    : '';

  return (
    <div className="bg-pure-white rounded-xl p-6 shadow-sm">
      <OnestFont weight={500} lineHeight="tight" className="text-text-blue-black text-lg mb-4">
        Score History
      </OnestFont>

      <div className="relative" style={{ height: `${chartHeight}px` }}>
        {/* Background bands */}
        {bands.map((band) => {
          const top = ((maxScore - band.max) / maxScore) * 100;
          const height = ((band.max - band.min) / maxScore) * 100;
          return (
            <div
              key={band.label}
              className={`absolute left-0 right-0 ${band.color}`}
              style={{ top: `${top}%`, height: `${height}%` }}
            >
              <OnestFont weight={300} lineHeight="relaxed" className="text-unavailable-button text-[10px] absolute right-1 top-0">
                {band.label}
              </OnestFont>
            </div>
          );
        })}

        {/* Y-axis labels */}
        <div className="absolute -left-1 top-0 bottom-0 flex flex-col justify-between pointer-events-none" style={{ width: '0px' }}>
          {[1000, 800, 500, 200, 0].map((val) => (
            <OnestFont key={val} weight={300} lineHeight="relaxed" className="text-unavailable-button text-[10px] -translate-x-8">
              {val}
            </OnestFont>
          ))}
        </div>

        {/* SVG chart */}
        {points.length > 1 ? (
          <svg
            viewBox={`0 0 ${chartWidth} 100`}
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full ml-0"
            style={{ overflow: 'visible' }}
          >
            <path
              d={pathD}
              fill="none"
              stroke="#3658EC"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
            {points.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r="3"
                fill="#3658EC"
                stroke="#FFFFFF"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-3 h-3 rounded-full bg-logo-blue border-2 border-pure-white"
              style={{ position: 'absolute', top: `${points[0]?.y ?? 50}%` }}
            />
          </div>
        )}
      </div>

      {/* X-axis date labels */}
      {sortedHistory.length > 1 && (
        <div className="flex justify-between mt-2">
          {sortedHistory.length <= 7 ? (
            sortedHistory.map((entry, i) => (
              <OnestFont key={i} weight={300} lineHeight="relaxed" className="text-unavailable-button text-[10px]">
                {new Date(entry.snapshot_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </OnestFont>
            ))
          ) : (
            <>
              <OnestFont weight={300} lineHeight="relaxed" className="text-unavailable-button text-[10px]">
                {new Date(sortedHistory[0].snapshot_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </OnestFont>
              <OnestFont weight={300} lineHeight="relaxed" className="text-unavailable-button text-[10px]">
                {new Date(sortedHistory[Math.floor(sortedHistory.length / 2)].snapshot_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </OnestFont>
              <OnestFont weight={300} lineHeight="relaxed" className="text-unavailable-button text-[10px]">
                {new Date(sortedHistory[sortedHistory.length - 1].snapshot_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </OnestFont>
            </>
          )}
        </div>
      )}

      {/* Legend with latest data point */}
      {sortedHistory.length > 0 && (
        <div className="mt-4 pt-3 border-t border-light-background-blue flex flex-wrap gap-4">
          <div>
            <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-xs">
              Latest Score
            </OnestFont>
            <OnestFont weight={700} lineHeight="tight" className="text-text-blue-black text-sm">
              {Math.round(sortedHistory[sortedHistory.length - 1].composite_score)}
            </OnestFont>
          </div>
          <div>
            <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-xs">
              Temperature
            </OnestFont>
            <OnestFont weight={500} lineHeight="tight" className="text-text-blue-black text-sm">
              {getTemperatureLabel(sortedHistory[sortedHistory.length - 1].lead_temperature)}
            </OnestFont>
          </div>
          <div>
            <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-xs">
              Data Points
            </OnestFont>
            <OnestFont weight={500} lineHeight="tight" className="text-text-blue-black text-sm">
              {sortedHistory.length}
            </OnestFont>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScoreHistoryChart;