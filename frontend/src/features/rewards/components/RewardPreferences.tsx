import React, { useState } from 'react';
import {
  OnestFont,
  CoffeeRewards,
  TravelRewards,
  ExperienceRewards,
  FoodRewards,
  FurnitureRewards,
  HomeLivingRewards,
  HomeImprovementRewards,
  MovingRewards,
} from '../../../assets';

// ─── Reward category definitions ───
const REWARD_CATEGORIES = [
  { id: 'food_dining', image: FoodRewards, label: 'Food & Everyday Dining' },
  { id: 'coffee_bites', image: CoffeeRewards, label: 'Coffee & Quick Bites' },
  { id: 'home_living', image: HomeLivingRewards, label: 'Home & Living' },
  { id: 'moving_storage', image: MovingRewards, label: 'Moving & Storage' },
  { id: 'home_improvement', image: HomeImprovementRewards, label: 'Home Improvement & Tools' },
  { id: 'furniture_decor', image: FurnitureRewards, label: 'Furniture & Decor' },
  { id: 'local_experiences', image: ExperienceRewards, label: 'Local Experiences & Activities' },
  { id: 'travel_rides', image: TravelRewards, label: 'Travel & Rides' },
];

const MAX_SELECTIONS = 3;

const RewardPreferences: React.FC = () => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const toggleCategory = (id: string) => {
    if (isSubmitted) return;
    if (selectedCategories.includes(id)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== id));
    } else if (selectedCategories.length < MAX_SELECTIONS) {
      setSelectedCategories([...selectedCategories, id]);
    }
  };

  const handleSubmit = () => {
    if (selectedCategories.length > 0) {
      // TODO: Send preferences to backend
      console.log('Reward preferences submitted:', selectedCategories);
      setIsSubmitted(true);
    }
  };

  return (
    <div className="max-w-7xl mx-auto mb-8">
      <div className="bg-pure-white rounded-2xl p-6 sm:p-8 border border-light-background-blue">
        {/* Heading */}
        <div className="text-center space-y-2 mb-6">
          <OnestFont as="h2" weight={700} lineHeight="tight" className="text-xl text-text-blue-black">
            Which types of rewards would you like Nest to prioritize for you?
          </OnestFont>
          <OnestFont as="p" weight={300} lineHeight="relaxed" className="text-text-grey text-sm">
            Pick up to 3. You will earn{' '}
            <OnestFont as="span" weight={700} lineHeight="relaxed" className="text-logo-yellow">
              2x Nest Coins
            </OnestFont>{' '}
            for helping shape future rewards.
          </OnestFont>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-2xl mx-auto mb-6">
          {REWARD_CATEGORIES.map((category) => {
            const isSelected = selectedCategories.includes(category.id);
            const isDisabled =
              (!isSelected && selectedCategories.length >= MAX_SELECTIONS) || isSubmitted;

            return (
              <button
                key={category.id}
                onClick={() => toggleCategory(category.id)}
                disabled={isDisabled && !isSelected}
                className={`
                  flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all
                  ${isSelected
                    ? 'bg-elegant-blue/10 border-elegant-blue'
                    : isDisabled
                    ? 'bg-pure-white border-light-background-blue opacity-40 cursor-not-allowed'
                    : 'bg-pure-white border-light-background-blue hover:border-elegant-blue/50 cursor-pointer'
                  }
                `}
              >
                <img
                  src={category.image}
                  alt={category.label}
                  className="w-16 h-16 object-contain"
                />
                <OnestFont
                  weight={isSelected ? 500 : 300}
                  lineHeight="relaxed"
                  className={`text-xs leading-tight text-center ${
                    isSelected ? 'text-elegant-blue' : 'text-text-grey'
                  }`}
                >
                  {category.label}
                </OnestFont>
              </button>
            );
          })}
        </div>

        {/* Submit Button */}
        {!isSubmitted && selectedCategories.length > 0 && (
          <div className="text-center mb-6">
            <button
              onClick={handleSubmit}
              className="px-8 py-2.5 bg-logo-blue text-pure-white rounded-full hover:opacity-90 transition-opacity"
            >
              <OnestFont weight={500} lineHeight="relaxed" className="text-sm">
                Submit Preferences
              </OnestFont>
            </button>
          </div>
        )}

        {/* Submitted Confirmation */}
        {isSubmitted && (
          <div className="text-center mb-6">
            <OnestFont as="p" weight={500} lineHeight="relaxed" className="text-status-green text-sm">
              ✓ Thanks! Your preferences have been saved.
            </OnestFont>
          </div>
        )}

        {/* Nest Coins Disclaimer */}
        <div className="text-center space-y-1">
          <OnestFont
            as="p"
            weight={300}
            lineHeight="relaxed"
            className="text-unavailable-button text-xs"
          >
            Nest Coins are reward points used only inside Nest. They are not cryptocurrency, are not
            digital assets, and have no cash or monetary value. Nest Coins cannot be sold,
            transferred, or exchanged for money.
          </OnestFont>
          <OnestFont
            as="p"
            weight={300}
            lineHeight="relaxed"
            className="text-unavailable-button"
            style={{ fontSize: '10px' }}
          >
            Rewards and partners may change and are not guaranteed.
          </OnestFont>
        </div>
      </div>
    </div>
  );
};

export default RewardPreferences;