import React from "react";
import { OnestFont } from "../../../../assets";

interface SectionErrorProps {
  message?: string;
  onRetry?: () => void;
}

const SectionError: React.FC<SectionErrorProps> = ({
  message = "Something went wrong loading this section.",
  onRetry,
}) => (
  <div className="bg-pure-white rounded-xl p-5 shadow-sm">
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <span className="text-3xl mb-3">⚠️</span>
      <OnestFont
        as="p"
        weight={500}
        lineHeight="relaxed"
        className="text-text-grey text-sm mb-3"
      >
        {message}
      </OnestFont>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-logo-blue text-pure-white rounded-lg text-sm hover:opacity-90 transition-opacity"
        >
          <OnestFont weight={500} lineHeight="relaxed">
            Try Again
          </OnestFont>
        </button>
      )}
    </div>
  </div>
);

export default SectionError;