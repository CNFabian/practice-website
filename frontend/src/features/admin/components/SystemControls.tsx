import React, { useState, useCallback } from 'react';
import { OnestFont } from '../../../assets';
import {
  useSchedulerStatus,
  useRecalculateScores,
  useTriggerBatchRecalculation,
  useTriggerSnapshotCreation,
  useTriggerEventCleanup,
} from '../hooks/useAnalyticsAdmin';

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return 'Never';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getHealthIndicator = (lastRun: string | null | undefined): { color: string; label: string } => {
  if (!lastRun) return { color: 'bg-unavailable-button', label: 'No data' };
  const diffMs = new Date().getTime() - new Date(lastRun).getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  if (diffHours < 25) return { color: 'bg-status-green', label: 'Healthy' };
  if (diffHours < 49) return { color: 'bg-status-yellow', label: 'Delayed' };
  return { color: 'bg-status-red', label: 'Stale' };
};

const ShimmerBlock: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-light-background-blue rounded-lg ${className}`} />
);

interface ActionResult {
  action: string;
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

const SystemControls: React.FC = () => {
  const { data: schedulerStatus, isLoading: statusLoading, refetch: refetchStatus } = useSchedulerStatus();
  const recalculateScores = useRecalculateScores();
  const triggerBatch = useTriggerBatchRecalculation();
  const triggerSnapshot = useTriggerSnapshotCreation();
  const triggerCleanup = useTriggerEventCleanup();

  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [daysToKeep, setDaysToKeep] = useState(90);
  const [runningAction, setRunningAction] = useState<string | null>(null);
  const [results, setResults] = useState<ActionResult[]>([]);

  const addResult = useCallback((result: ActionResult) => {
    setResults(prev => [result, ...prev].slice(0, 10));
  }, []);

  const handleAction = useCallback(async (action: string) => {
    setConfirmAction(null);
    setRunningAction(action);
    try {
      let response: Record<string, unknown> | undefined;
      switch (action) {
        case 'recalculate':
          response = await recalculateScores.mutateAsync({ force: false }) as unknown as Record<string, unknown>;
          break;
        case 'force_recalculate':
          response = await recalculateScores.mutateAsync({ force: true }) as unknown as Record<string, unknown>;
          break;
        case 'batch_recalculate':
          response = await triggerBatch.mutateAsync({ force: false }) as unknown as Record<string, unknown>;
          break;
        case 'snapshot':
          response = await triggerSnapshot.mutateAsync() as unknown as Record<string, unknown>;
          break;
        case 'cleanup':
          response = await triggerCleanup.mutateAsync(daysToKeep) as unknown as Record<string, unknown>;
          break;
      }
      addResult({
        action,
        success: true,
        message: (response as Record<string, unknown>)?.message as string || 'Operation completed successfully',
        details: response as Record<string, unknown>,
        timestamp: new Date().toISOString(),
      });
      refetchStatus();
    } catch (err: unknown) {
      addResult({
        action,
        success: false,
        message: err instanceof Error ? err.message : 'Operation failed',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setRunningAction(null);
    }
  }, [recalculateScores, triggerBatch, triggerSnapshot, triggerCleanup, daysToKeep, addResult, refetchStatus]);

  const ACTION_CONFIG = [
    {
      id: 'recalculate',
      label: 'Recalculate All Scores',
      description: 'Recalculate lead scores for all users (skips recent)',
      confirmMessage: 'This will recalculate scores for all users. Continue?',
      icon: '🔄',
      btnClass: 'bg-logo-blue text-pure-white hover:opacity-90',
    },
    {
      id: 'force_recalculate',
      label: 'Force Recalculate All',
      description: 'Force recalculate even recently calculated scores',
      confirmMessage: 'This will force recalculate ALL scores, even recent ones. This may take longer. Continue?',
      icon: '⚡',
      btnClass: 'bg-status-yellow text-text-blue-black hover:opacity-90',
    },
    {
      id: 'snapshot',
      label: 'Create Daily Snapshots',
      description: 'Manually trigger creation of daily score snapshots',
      confirmMessage: 'This will create daily snapshots for all users. Continue?',
      icon: '📸',
      btnClass: 'bg-elegant-blue text-pure-white hover:opacity-90',
    },
    {
      id: 'cleanup',
      label: 'Clean Old Events',
      description: `Delete behavior events older than ${daysToKeep} days`,
      confirmMessage: `This will permanently delete events older than ${daysToKeep} days. This cannot be undone. Continue?`,
      icon: '🧹',
      btnClass: 'bg-status-red text-pure-white hover:opacity-90',
    },
  ];

  const getActionLabel = (action: string): string => {
    return ACTION_CONFIG.find(a => a.id === action)?.label || action;
  };

  return (
    <div className="space-y-6">
      {/* Scheduler Status Panel */}
      <div className="bg-pure-white rounded-xl p-6 shadow-sm">
        <OnestFont weight={500} lineHeight="tight" className="text-text-blue-black text-lg mb-4">
          Scheduler Status
        </OnestFont>

        {statusLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <ShimmerBlock key={i} className="h-20" />
            ))}
          </div>
        ) : schedulerStatus ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Score Recalculation', key: 'last_recalculation_at' },
              { label: 'Snapshot Creation', key: 'last_snapshot_at' },
              { label: 'Event Cleanup', key: 'last_cleanup_at' },
            ].map((item) => {
              const lastRun = schedulerStatus[item.key as keyof typeof schedulerStatus] as string | null;
              const health = getHealthIndicator(lastRun);
              return (
                <div key={item.key} className="p-4 bg-text-white rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${health.color} flex-shrink-0`} />
                    <OnestFont weight={500} lineHeight="relaxed" className="text-text-blue-black text-sm">
                      {item.label}
                    </OnestFont>
                  </div>
                  <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-xs">
                    Last run: {formatDate(lastRun)}
                  </OnestFont>
                  <OnestFont weight={300} lineHeight="relaxed" className="text-unavailable-button text-xs mt-0.5">
                    Status: {health.label}
                  </OnestFont>
                </div>
              );
            })}
          </div>
        ) : (
          <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-sm">
            Unable to retrieve scheduler status
          </OnestFont>
        )}
      </div>

      {/* Manual Actions */}
      <div className="bg-pure-white rounded-xl p-6 shadow-sm">
        <OnestFont weight={500} lineHeight="tight" className="text-text-blue-black text-lg mb-4">
          Manual Actions
        </OnestFont>

        {/* Cleanup days config */}
        <div className="mb-4 flex items-center gap-3">
          <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-sm">
            Event cleanup retention:
          </OnestFont>
          <input
            type="number"
            min={7}
            max={365}
            value={daysToKeep}
            onChange={(e) => setDaysToKeep(Number(e.target.value))}
            className="w-20 px-2 py-1 bg-text-white border border-unavailable-button/30 rounded-lg text-sm text-text-blue-black text-center focus:outline-none focus:border-logo-blue"
          />
          <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-sm">
            days
          </OnestFont>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ACTION_CONFIG.map((action) => {
            const isRunning = runningAction === action.id;
            const isConfirming = confirmAction === action.id;

            return (
              <div key={action.id} className="p-4 bg-text-white rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="text-xl">{action.icon}</span>
                  <div className="flex-1">
                    <OnestFont weight={500} lineHeight="relaxed" className="text-text-blue-black text-sm">
                      {action.label}
                    </OnestFont>
                    <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-xs mt-0.5">
                      {action.description}
                    </OnestFont>

                    {isConfirming ? (
                      <div className="mt-3">
                        <OnestFont weight={300} lineHeight="relaxed" className="text-status-red text-xs mb-2">
                          {action.confirmMessage}
                        </OnestFont>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAction(action.id)}
                            className="px-3 py-1.5 bg-logo-blue text-pure-white rounded-lg text-xs hover:opacity-90 transition-opacity"
                          >
                            <OnestFont weight={500} lineHeight="relaxed">Confirm</OnestFont>
                          </button>
                          <button
                            onClick={() => setConfirmAction(null)}
                            className="px-3 py-1.5 bg-text-white border border-unavailable-button/30 rounded-lg text-xs text-text-grey hover:bg-light-background-blue transition-colors"
                          >
                            <OnestFont weight={500} lineHeight="relaxed">Cancel</OnestFont>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmAction(action.id)}
                        disabled={isRunning || runningAction !== null}
                        className={`mt-3 px-4 py-1.5 rounded-lg text-xs transition-opacity disabled:opacity-50 ${action.btnClass}`}
                      >
                        <OnestFont weight={500} lineHeight="relaxed">
                          {isRunning ? 'Running...' : 'Execute'}
                        </OnestFont>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Results Log */}
      {results.length > 0 && (
        <div className="bg-pure-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <OnestFont weight={500} lineHeight="tight" className="text-text-blue-black text-lg">
              Execution Log
            </OnestFont>
            <button
              onClick={() => setResults([])}
              className="text-xs text-text-grey hover:text-status-red transition-colors"
            >
              <OnestFont weight={500} lineHeight="relaxed">Clear</OnestFont>
            </button>
          </div>

          <div className="space-y-2">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  result.success
                    ? 'bg-status-green/5 border-status-green/20'
                    : 'bg-status-red/5 border-status-red/20'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">{result.success ? '✅' : '❌'}</span>
                  <OnestFont weight={500} lineHeight="relaxed" className="text-text-blue-black text-sm">
                    {getActionLabel(result.action)}
                  </OnestFont>
                  <OnestFont weight={300} lineHeight="relaxed" className="text-unavailable-button text-xs ml-auto">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </OnestFont>
                </div>
                <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-xs">
                  {result.message}
                </OnestFont>
                {result.details && (
                  <div className="flex flex-wrap gap-3 mt-1">
                    {result.details.total_users !== undefined && (
                      <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-xs">
                        Users: {String(result.details.total_users)}
                      </OnestFont>
                    )}
                    {result.details.successful !== undefined && (
                      <OnestFont weight={300} lineHeight="relaxed" className="text-status-green text-xs">
                        Success: {String(result.details.successful)}
                      </OnestFont>
                    )}
                    {result.details.failed !== undefined && Number(result.details.failed) > 0 && (
                      <OnestFont weight={300} lineHeight="relaxed" className="text-status-red text-xs">
                        Failed: {String(result.details.failed)}
                      </OnestFont>
                    )}
                    {result.details.execution_time_seconds !== undefined && (
                      <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-xs">
                        Time: {Number(result.details.execution_time_seconds).toFixed(2)}s
                      </OnestFont>
                    )}
                    {result.details.snapshots_created !== undefined && (
                      <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-xs">
                        Snapshots: {String(result.details.snapshots_created)}
                      </OnestFont>
                    )}
                    {result.details.deleted_count !== undefined && (
                      <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-xs">
                        Deleted: {String(result.details.deleted_count)}
                      </OnestFont>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemControls;