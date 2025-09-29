import React from 'react';

import { InfoBlue, InfoGreen, InfoPurple } from '../../../assets';

interface InfoButtonProps {
  onClick: () => void;
  category?: 'blue' | 'green' | 'purple';
}

const InfoButton: React.FC<InfoButtonProps> = ({ onClick, category = 'blue' }) => {
  const getInfoIcon = () => {
    switch (category) {
      case 'blue':
        return InfoBlue;
      case 'green':
        return InfoGreen;
      case 'purple':
        return InfoPurple;
      default:
        return InfoBlue;
    }
  };

  const InfoIcon = getInfoIcon();

  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center w-10 h-10 bg-white hover:bg-gray-50 border border-gray-200 rounded-full shadow-sm transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      aria-label="Calculator information and help"
    >
      <img src={InfoIcon} alt="Info" style={{ width: '1.25rem', height: '1.25rem' }} />
    </button>
  );
};

export default InfoButton;