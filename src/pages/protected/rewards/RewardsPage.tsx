import React, { useState } from 'react';
import { RewardsHeader, RewardsNavigation, RewardCard } from './components';
import { RewardOffer, NavigationButton } from './types/rewards.types';

const RewardsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('browse');

  const navigationButtons: NavigationButton[] = [
    {
      label: 'Browse Rewards',
      isActive: activeTab === 'browse',
      onClick: () => setActiveTab('browse')
    },
    {
      label: 'Purchase History',
      isActive: activeTab === 'history',
      onClick: () => setActiveTab('history')
    }
  ];

  const rewardOffers: RewardOffer[] = [
    {
      id: 'home-depot',
      title: '10% Off Home Improvement',
      description: 'Get 10% off your next purchase of $50 or more',
      vendor: 'Home Depot',
      cost: 100,
      discount: '10.00% OFF',
      category: 'featured',
      icon: 'H',
      iconBackgroundColor: '#9333ea'
    },
    {
      id: 'lowes',
      title: '15% Off Tools & Hardware',
      description: 'Special discount on tools and hardware',
      vendor: "Lowe's",
      cost: 120,
      discount: '15.00% OFF',
      category: 'featured',
      icon: 'L',
      iconBackgroundColor: '#2563eb'
    },
    {
      id: 'wayfair',
      title: '20% Off First Furniture Purchase',
      description: 'New customer special on furniture',
      vendor: 'Wayfair',
      cost: 200,
      discount: '20.00% OFF',
      category: 'featured',
      icon: 'W',
      iconBackgroundColor: '#9333ea'
    },
    {
      id: 'amazon',
      title: 'Free Prime Shipping Trial',
      description: '30-day free Prime shipping trial',
      vendor: 'Amazon',
      cost: 50,
      discount: 'FREE SHIPPING',
      category: 'regular',
      icon: 'A',
      iconBackgroundColor: '#2563eb'
    },
    {
      id: 'ikea',
      title: 'Free Delivery on Orders $50+',
      description: 'Free delivery on furniture orders over $50',
      vendor: 'IKEA',
      cost: 75,
      discount: 'FREE SHIPPING',
      category: 'regular',
      icon: 'I',
      iconBackgroundColor: '#eab308'
    },
    {
      id: 'target',
      title: '$10 Off Home Essentials',
      description: 'Save on everyday home essentials',
      vendor: 'Target',
      cost: 80,
      discount: '$10.00 OFF',
      category: 'regular',
      icon: 'T',
      iconBackgroundColor: '#dc2626'
    },
    {
      id: 'walmart',
      title: '$5 Off Grocery Orders $25+',
      description: 'Save on your weekly grocery shopping',
      vendor: 'Walmart',
      cost: 60,
      discount: '$5.00 OFF',
      category: 'regular',
      icon: 'W',
      iconBackgroundColor: '#16a34a'
    }
  ];

  const handleRewardClick = (offer: RewardOffer) => {
    console.log('Reward clicked:', offer.title);
    // Handle reward redemption logic here
  };

  return (
    <div className="bg-gray-50 p-6 min-h-screen overflow-y-auto h-screen pt-20 -mt-8">
      <RewardsHeader coinBalance={50} />
      
      <RewardsNavigation buttons={navigationButtons} />

      {activeTab === 'browse' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {rewardOffers.map((offer) => (
            <RewardCard
              key={offer.id}
              offer={offer}
              onClick={() => handleRewardClick(offer)}
            />
          ))}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="max-w-7xl mx-auto text-center py-12">
          <h3 className="text-xl font-semibold text-gray-600 mb-4">Purchase History</h3>
          <p className="text-gray-500">No purchases yet. Start browsing rewards to redeem your coins!</p>
        </div>
      )}
    </div>
  );
};

export default RewardsPage;