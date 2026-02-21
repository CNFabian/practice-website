import React from 'react';
import { OnestFont } from '../../../assets/index';
import { NavigationButton } from '../types/rewards.types';

interface RewardsNavigationProps {
  buttons: NavigationButton[];
}

const RewardsNavigation: React.FC<RewardsNavigationProps> = ({ buttons }) => {
  return (
    <div className="flex gap-4 mb-8 max-w-7xl mx-auto">
      {buttons.map((button, index) => (
        <button
          key={index}
          onClick={button.onClick}
          className={`flex-1 py-4 px-6 rounded-2xl font-semibold text-lg transition-colors ${
            button.isActive
              ? 'bg-linear-blue-1 text-white'
              : 'bg-light-background-blue text-text-grey hover:bg-light-background-blue/80'
          }`}
        >
          <OnestFont weight={700} lineHeight="relaxed" className="text-lg">
            {button.label}
          </OnestFont>
        </button>
      ))}
    </div>
  );
};

export default RewardsNavigation;