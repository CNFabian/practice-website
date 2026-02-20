import React from "react";
import { OnestFont } from "../../../../assets";
import { useRewardCategories } from "../../../../hooks/queries/useRewardsQueries";

// ────────────────────────────────────────────────────────
// Props
// ────────────────────────────────────────────────────────

interface CategoryFilterProps {
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

// ────────────────────────────────────────────────────────
// Skeleton
// ────────────────────────────────────────────────────────

const SkeletonPills: React.FC = () => (
  <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
    {Array.from({ length: 5 }).map((_, i) => (
      <div
        key={i}
        className="h-9 w-24 bg-light-background-blue animate-pulse rounded-full flex-shrink-0"
      />
    ))}
  </div>
);

// ────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  const { data, isLoading } = useRewardCategories();

  if (isLoading) return <SkeletonPills />;

  const categories: string[] = Array.isArray(data) ? data : [];

  // If no categories returned, don't render the filter at all
  if (categories.length === 0) return null;

  const isActive = (cat: string | null) =>
    selectedCategory === cat;

  const pillBase =
    "px-4 py-2 rounded-full text-sm flex-shrink-0 cursor-pointer transition-colors";
  const activeCls = "bg-tab-active text-logo-blue";
  const inactiveCls =
    "bg-pure-white text-text-grey border border-unavailable-button hover:bg-light-background-blue";

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
      {/* "All" pill — always first */}
      <button
        className={`${pillBase} ${isActive(null) ? activeCls : inactiveCls}`}
        onClick={() => onSelectCategory(null)}
      >
        <OnestFont as="span" weight={isActive(null) ? 500 : 300}>
          All
        </OnestFont>
      </button>

      {categories.map((cat) => (
        <button
          key={cat}
          className={`${pillBase} ${isActive(cat) ? activeCls : inactiveCls}`}
          onClick={() => onSelectCategory(cat)}
        >
          <OnestFont as="span" weight={isActive(cat) ? 500 : 300}>
            {cat}
          </OnestFont>
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;