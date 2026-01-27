import { OnestFont } from '../../../../assets';
import type { Badge } from '../../../../services';
import { BadgeCard } from './BadgeCard';

interface BadgeGridProps {
  badges: Badge[];
}

export const BadgeGrid = ({ badges }: BadgeGridProps) => {
  if (badges.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <OnestFont as="h3" weight={500} lineHeight="relaxed" className="text-lg text-gray-500 mb-2">
          No badges found
        </OnestFont>
        <OnestFont as="p" weight={300} lineHeight="relaxed" className="text-gray-400">
          Try adjusting your filter selection
        </OnestFont>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {badges.map(badge => (
        <BadgeCard key={badge.id} badge={badge} />
      ))}
    </div>
  );
};