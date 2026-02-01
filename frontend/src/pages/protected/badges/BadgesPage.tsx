import { useState, useEffect } from 'react';
import { BadgeHeader, BadgeFilters, BadgeGrid } from './components';
import type { Badge } from '../../../services';
import { useBadges } from '../../../hooks/queries/useBadges';

const BadgesPage = () => {
  const { data: badgesData, isLoading: loading } = useBadges();

  const [activeFilter, setActiveFilter] = useState('all');
  const [filteredBadges, setFilteredBadges] = useState<Badge[]>([]);

  const badges = badgesData?.badges || [];
  const progress = badgesData?.progress || { earned: 0, total: 0 };

  useEffect(() => {
  const bgElement = document.getElementById('section-background');
  if (bgElement) {
    bgElement.className = 'bg-light-background-blue';
    bgElement.style.backgroundSize = 'cover';
  }
}, []);

  // Filter badges when filter changes
  useEffect(() => {
    const filterBadges = () => {
      const filtered = badges.filter(badge => {
        switch (activeFilter) {
          case 'module': return badge.category === 'module';
          case 'achievement': return badge.category === 'achievement';
          case 'earned': return badge.isEarned;
          case 'locked': return badge.isLocked && !badge.isEarned;
          default: return true;
        }
      });
      setFilteredBadges(filtered);
    };

    filterBadges();
  }, [activeFilter, badges]);

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-logo-blue"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <BadgeHeader progress={progress} />
        <BadgeFilters 
          activeFilter={activeFilter} 
          onFilterChange={setActiveFilter} 
        />
        <BadgeGrid badges={filteredBadges} />
      </div>
    </div>
  );
};

export default BadgesPage;