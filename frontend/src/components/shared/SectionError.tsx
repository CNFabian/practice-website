import React from 'react';
import { OnestFont } from '../../assets';

interface SectionErrorProps {
  message?: string;
  onRetry?: () => void;
}

/**
 * Shared error display for any data-fetching section.
 * Shows a friendly error message with an optional retry link.
 *
 * Usage:
 *   if (isError) return <SectionError message="Could not load stats." onRetry={refetch} />;
 */
const SectionError: React.FC<SectionErrorProps> = ({
  message = 'Something went wrong loading this section.',
  onRetry,
}) => (
  <div className="bg-status-red/5 border border-status-red/20 rounded-xl p-4 text-center">
    <OnestFont
      as="p"
      weight={500}
      lineHeight="relaxed"
      className="text-text-grey text-sm mb-2"
    >
      {message}
    </OnestFont>
    {onRetry && (
      <OnestFont
        as="span"
        weight={500}
        lineHeight="relaxed"
        className="text-logo-blue text-sm underline cursor-pointer hover:opacity-80"
        onClick={onRetry}
      >
        Try again
      </OnestFont>
    )}
  </div>
);

export default SectionError;