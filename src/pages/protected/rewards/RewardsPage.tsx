import React, { useState } from 'react';
import { RewardsHeader, RewardsNavigation, RewardCard } from './components';
import { NavigationButton } from './types/rewards.types';
import { type Coupon } from '../../../services';
import { useCoinBalance } from '../../../hooks/queries/useCoinBalance';
import { useRedeemCoupon } from '../../../hooks/mutations/useRedeemCoupon';
import { useCoupons, useMyRedemptions } from '../../../hooks/queries/useRewardsQueries';

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

  const { data: coinBalanceData, isLoading: coinsLoading } = useCoinBalance();
  const { data: couponsData, isLoading: couponsLoading } = useCoupons();
  const { data: redemptionHistory = [], isLoading: redemptionsLoading, refetch: refetchRedemptions } = useMyRedemptions();
  const { mutate: redeemCoupon, isPending: isRedeeming } = useRedeemCoupon();

  const coinBalance = coinBalanceData?.current_balance || 50;
  const coupons = couponsData && couponsData.length > 0 ? couponsData : FALLBACK_COUPONS;
  const loading = (activeTab === 'browse' && couponsLoading) || (activeTab === 'history' && redemptionsLoading) || coinsLoading;

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

  const handleRewardClick = (coupon: Coupon) => {
    if (coupon.cost_in_coins > coinBalance) {
      alert(`Not enough coins! You need ${coupon.cost_in_coins} coins but only have ${coinBalance}.`);
      return;
    }

    const confirmRedeem = window.confirm(
      `Redeem "${coupon.title}" for ${coupon.cost_in_coins} coins?`
    );

    if (!confirmRedeem) return;

    redeemCoupon(
      {
        couponId: coupon.id,
        costInCoins: coupon.cost_in_coins,
      },
      {
        onSuccess: (redemption) => {
          alert(`✅ Redeemed successfully!\nRedemption Code: ${redemption.redemption_code}`);
          if (activeTab === 'history') {
            refetchRedemptions();
          }
        },
        onError: (err) => {
          console.error('Redemption error:', err);
          alert('Failed to redeem coupon. Please try again.');
        },
      }
    );
  };

  if (loading || coinsLoading) {
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
    <div className="bg-gray-50 p-6 min-h-screen overflow-y-auto h-screen pt-20 -mt-8 pb-8 relative">
      {isRedeeming && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 shadow-xl">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 text-center">Redeeming coupon...</p>
          </div>
        </div>
      )}
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