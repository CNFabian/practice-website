// Header component - displays page title and progress indicator

import { RobotoFont } from '../../../../assets';
import type { BadgeProgress } from '../types';

interface BadgeHeaderProps {
  progress: BadgeProgress;
}

export const BadgeHeader = ({ progress }: BadgeHeaderProps) => {
  return (
    <div className="text-center mb-8">
      <RobotoFont as="h1" weight={700} className="text-4xl text-gray-800 mb-4">
        Your Badge Collection
      </RobotoFont>
      <RobotoFont as="p" weight={400} className="text-gray-600 mb-6">
        Collect badges by completing modules and achieving milestones in your homeownership journey
      </RobotoFont>
      
      <div className="inline-flex items-center justify-center px-6 py-3 text-white rounded-2xl mb-6" style={{background: 'linear-gradient(135deg, #677ae5 0%, #7650a7 100%)'}}>
        <div className="text-center">
          <RobotoFont as="div" weight={700} className="text-xl">
            {progress.earned}
          </RobotoFont>
          <RobotoFont as="div" weight={400} className="text-xs opacity-75">
            EARNED
          </RobotoFont>
        </div>
        <RobotoFont as="div" weight={400} className="mx-3 text-lg opacity-50">
          /
        </RobotoFont>
        <div className="text-center">
          <RobotoFont as="div" weight={700} className="text-xl">
            {progress.total}
          </RobotoFont>
          <RobotoFont as="div" weight={400} className="text-xs opacity-75">
            TOTAL
          </RobotoFont>
        </div>
      </div>
    </div>
  );
};