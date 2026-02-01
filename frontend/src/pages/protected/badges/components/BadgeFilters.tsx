import { OnestFont } from '../../../../assets';
import { FILTER_BUTTONS } from '../constants';

interface BadgeFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export const BadgeFilters = ({ activeFilter, onFilterChange }: BadgeFiltersProps) => {
  return (
    <div className="flex flex-wrap justify-center gap-3 mb-8">
      {FILTER_BUTTONS.map(button => (
        <button
          key={button.key}
          onClick={() => onFilterChange(button.key)}
          className={`px-6 py-2 rounded-full transition-all duration-200 ${
            activeFilter === button.key
              ? 'bg-logo-blue text-white shadow-lg'
              : 'bg-light-background-blue text-text-grey hover:bg-light-background-blue/80'
          }`}
        >
          <OnestFont weight={500} lineHeight="relaxed">
            {button.label}
          </OnestFont>
        </button>
      ))}
    </div>
  );
};