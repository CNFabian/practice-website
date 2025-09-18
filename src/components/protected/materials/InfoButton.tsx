import React from 'react';

interface InfoButtonProps {
  onClick: () => void;
}

const InfoButton: React.FC<InfoButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center w-10 h-10 bg-white hover:bg-gray-50 border border-gray-200 rounded-full shadow-sm transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      aria-label="Calculator information and help"
    >
      <svg
        className="w-5 h-5 text-gray-600 hover:text-blue-600 transition-colors"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
        />
      </svg>
    </button>
  );
};

export default InfoButton;