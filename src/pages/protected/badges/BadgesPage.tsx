// Main badges page - orchestrates data fetching, filtering, and display
// Backend: This component will automatically work with real API once BadgeService is updated

import { useState, useEffect } from 'react';
import { BadgeHeader, BadgeFilters, BadgeGrid } from './components';
import { getBadges } from '../../../services';
import type { Badge, BadgeProgress } from '../../../services';

const BadgesPage = () => {
  // State management for badges data and UI
  const [activeFilter, setActiveFilter] = useState('all');
  const [badges, setBadges] = useState<Badge[]>([]);
  const [filteredBadges, setFilteredBadges] = useState<Badge[]>([]);
  const [progress, setProgress] = useState<BadgeProgress>({ earned: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  // Load badges on component mount
  useEffect(() => {
    const loadBadges = async () => {
      try {
        const response = await getBadges();
        setBadges(response.badges);
        setProgress(response.progress);
        setFilteredBadges(response.badges);
      } catch (error) {
        console.error('Failed to load badges:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBadges();
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
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
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