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
              ? 'bg-indigo-500 text-white shadow-lg'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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