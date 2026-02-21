import { useState, useEffect, useMemo } from 'react';
import { BadgeHeader, BadgeFilters, BadgeGrid } from '../components';
import { OnestFont } from '../../../assets';
import { useBadges } from '../hooks/useBadges';
import { useMyProgress } from '../../../hooks/queries/useMyProgress';

const BadgesPage = () => {
  const { data: badgesData, isLoading: loading } = useBadges();
  const { data: progressData } = useMyProgress();

  const [activeFilter, setActiveFilter] = useState('all');

  const badges = badgesData?.badges || [];
  const progress = badgesData?.progress || { earned: 0, total: 0 };

  useEffect(() => {
    const bgElement = document.getElementById('section-background');
    if (bgElement) {
      bgElement.className = 'bg-light-background-blue';
      bgElement.style.backgroundSize = 'cover';
    }
  }, []);

  const filteredBadges = useMemo(() => {
    return badges.filter(badge => {
      switch (activeFilter) {
        case 'module': return badge.category === 'module';
        case 'achievement': return badge.category === 'achievement';
        case 'earned': return badge.isEarned;
        case 'locked': return badge.isLocked && !badge.isEarned;
        default: return true;
      }
    });
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
        
        {/* Analytics-backed badge count pill */}
        {progressData?.badges_earned !== undefined && (
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-logo-blue/10 rounded-full">
              <span className="text-lg">📊</span>
              <OnestFont
                as="span"
                weight={500}
                lineHeight="relaxed"
                className="text-logo-blue text-sm"
              >
                Analytics: {progressData.badges_earned} badge{progressData.badges_earned !== 1 ? 's' : ''} earned
              </OnestFont>
            </div>
          </div>
        )}
        
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