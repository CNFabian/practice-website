import React, { useState, useEffect } from 'react';
import { RewardsHeader, RewardsNavigation, RewardCard } from './components';
import { NavigationButton } from './types/rewards.types';
import { rewardsAPI, type Coupon, type Redemption } from '../../../services';

// Fallback mock data for when API is empty or fails
const FALLBACK_COUPONS: Coupon[] = [
  {
    id: 'home-depot-fallback',
    title: '10% Off Home Improvement',
    description: 'Get 10% off your next purchase of $50 or more',
    partner_company: 'Home Depot',
    cost_in_coins: 100,
    max_redemptions: 100,
    current_redemptions: 23,
    expires_at: '2025-12-31T23:59:59Z',
    image_url: '',
    terms_conditions: 'Valid on purchases over $50. Cannot be combined with other offers.',
    is_active: true
  },
  {
    id: 'lowes-fallback',
    title: '15% Off Tools & Hardware',
    description: 'Special discount on tools and hardware',
    partner_company: "Lowe's",
    cost_in_coins: 120,
    max_redemptions: 75,
    current_redemptions: 45,
    expires_at: '2025-11-30T23:59:59Z',
    image_url: '',
    terms_conditions: 'Valid on tools and hardware only. Excludes sale items.',
    is_active: true
  },
  {
    id: 'wayfair-fallback',
    title: '20% Off First Furniture Purchase',
    description: 'New customer special on furniture',
    partner_company: 'Wayfair',
    cost_in_coins: 200,
    max_redemptions: 50,
    current_redemptions: 8,
    expires_at: '2025-12-15T23:59:59Z',
    image_url: '',
    terms_conditions: 'Valid for new customers only on furniture purchases over $100.',
    is_active: true
  },
  {
    id: 'amazon-fallback',
    title: 'Free Prime Shipping Trial',
    description: '30-day free Prime shipping trial',
    partner_company: 'Amazon',
    cost_in_coins: 50,
    max_redemptions: 200,
    current_redemptions: 156,
    expires_at: '2025-12-31T23:59:59Z',
    image_url: '',
    terms_conditions: 'Valid for new Prime members only.',
    is_active: true
  },
  {
    id: 'target-fallback',
    title: '$10 Off Home Essentials',
    description: 'Save on everyday home essentials',
    partner_company: 'Target',
    cost_in_coins: 80,
    max_redemptions: 150,
    current_redemptions: 67,
    expires_at: '2025-11-30T23:59:59Z',
    image_url: '',
    terms_conditions: 'Valid on home essentials over $30.',
    is_active: true
  }
];

// Mock fallback data

const RewardsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('browse');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [redemptionHistory, setRedemptionHistory] = useState<Redemption[]>([]);
  const [coinBalance, setCoinBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [_error, _setError] = useState<string | null>(null);

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

  // Fetch data on mount
  useEffect(() => {
    const fetchRewardsData = async () => {
      try {
        setLoading(true);
        _setError(null);

        // Fetch coin balance
        try {
          const coinData = await rewardsAPI.getCoinBalance();
          setCoinBalance(coinData.current_balance);
        } catch (err) {
          console.log('📝 Could not fetch coin balance, using default');
          setCoinBalance(50); // Fallback
        }

        // Fetch available coupons
        try {
          const apiCoupons = await rewardsAPI.getCoupons();
          
          if (apiCoupons && apiCoupons.length > 0) {
            console.log('🎁 Raw coupons from API:', apiCoupons);
            setCoupons(apiCoupons);
            console.log('✅ Loaded coupons from API:', apiCoupons.length);
          } else {
            console.log('📝 No coupons from API, using fallback data');
            console.log('🔄 Fallback coupons:', FALLBACK_COUPONS);
            setCoupons(FALLBACK_COUPONS);
          }
        } catch (err) {
          console.log('📝 Error fetching coupons, using fallback data:', err);
          console.log('🔄 Error fallback coupons:', FALLBACK_COUPONS);
          setCoupons(FALLBACK_COUPONS);
        }

        // Fetch redemption history
        if (activeTab === 'history') {
          try {
            const redemptions = await rewardsAPI.getMyRedemptions();
            console.log('📋 Raw redemptions from API:', redemptions);
            setRedemptionHistory(redemptions);
          } catch (err) {
            console.log('📝 Could not fetch redemption history');
            setRedemptionHistory([]);
          }
        }
      } catch (err) {
        console.error('Error fetching rewards data:', err);
        _setError('Failed to load rewards');
        // Use fallback data even on general error
        setCoupons(FALLBACK_COUPONS);
        setCoinBalance(250); // Give users some coins to try the fallback rewards
      } finally {
        setLoading(false);
      }
    };

    fetchRewardsData();
  }, [activeTab]);

  const handleRewardClick = async (coupon: Coupon) => {
    if (coupon.cost_in_coins > coinBalance) {
      alert(`Not enough coins! You need ${coupon.cost_in_coins} coins but only have ${coinBalance}.`);
      return;
    }

    const confirmRedeem = window.confirm(
      `Redeem "${coupon.title}" for ${coupon.cost_in_coins} coins?`
    );

    if (!confirmRedeem) return;

    try {
      const redemption = await rewardsAPI.redeemCoupon(coupon.id);
      
      alert(`✅ Redeemed successfully!\nRedemption Code: ${redemption.redemption_code}`);
      
      // Update coin balance
      setCoinBalance(prev => prev - coupon.cost_in_coins);
      
      // Refresh data
      window.location.reload();
    } catch (err) {
      console.error('Redemption error:', err);
      alert('Failed to redeem coupon. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 p-6 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading rewards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-6 min-h-screen overflow-y-auto h-screen pt-20 -mt-8 pb-8">
      <RewardsHeader coinBalance={coinBalance} />
      <RewardsNavigation buttons={navigationButtons} />

      {activeTab === 'browse' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto mb-8">
          {coupons.map((coupon) => (
            <RewardCard
              key={coupon.id}
              coupon={coupon}
              onClick={() => handleRewardClick(coupon)}
            />
          ))}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="max-w-7xl mx-auto">
          {redemptionHistory.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-gray-600 mb-4">Purchase History</h3>
              <p className="text-gray-500">No purchases yet. Start browsing rewards to redeem your coins!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {redemptionHistory.map((redemption) => (
                <div key={redemption.id} className="bg-white p-6 rounded-xl shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{redemption.coupon.title}</h3>
                      <p className="text-gray-600">{redemption.coupon.partner_company}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Code: <span className="font-mono font-bold">{redemption.redemption_code}</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Redeemed: {new Date(redemption.redeemed_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })} • Expires: {new Date(redemption.expires_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-blue-600">{redemption.coins_spent} coins</p>
                      {redemption.is_active ? (
                        <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                          Active
                        </span>
                      ) : (
                        <span className="inline-block mt-2 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                          Used
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RewardsPage;