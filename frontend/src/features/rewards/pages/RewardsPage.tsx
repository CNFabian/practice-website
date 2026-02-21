import React, { useEffect, useState } from 'react';
import { NavigationButton } from '../types/rewards.types';
import { type Coupon } from '../services/rewardsAPI';
import { useCoinBalance } from '../../../hooks/queries/useCoinBalance';
import { useRedeemCoupon } from '../hooks/useRedeemCoupon';
import { useMarkRedemptionUsed } from '../hooks/useMarkRedemptionUsed';
import { useCoupons, useMyRedemptions } from '../hooks/useRewardsQueries';
import {
  RewardsHeader,
  RewardsNavigation,
  RewardCard,
  CategoryFilter,
  CoinTransactionHistory,
  RewardStatsSummary,
  RewardPreferences
} from "../components";

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

const RewardsPage: React.FC = () => {
  
  useEffect(() => {
    const bgElement = document.getElementById('section-background');
    if (bgElement) {
      bgElement.className = 'bg-light-background-blue';
      bgElement.style.backgroundSize = 'cover';
    }
  }, []);

  const [activeTab, setActiveTab] = useState('browse');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: coinBalanceData, isLoading: coinsLoading } = useCoinBalance();
  const { data: couponsData, isLoading: couponsLoading } = useCoupons(
    selectedCategory ? { category: selectedCategory } : undefined
  );
  const { data: redemptionHistory = [], isLoading: redemptionsLoading, refetch: refetchRedemptions } = useMyRedemptions();
  const { mutate: redeemCoupon, isPending: isRedeeming } = useRedeemCoupon();
  const { mutate: markUsed, isPending: isMarkingUsed } = useMarkRedemptionUsed();
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
    },
    {
      label: 'Coin History',
      isActive: activeTab === 'transactions',
      onClick: () => setActiveTab('transactions')
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
      <div className="bg-light-background-blue p-6 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-logo-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-grey">Loading rewards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen overflow-y-auto h-screen pb-8 relative">
      {isRedeeming && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 shadow-xl">
            <div className="w-16 h-16 border-4 border-logo-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-text-grey text-center">Redeeming coupon...</p>
          </div>
        </div>
      )}

      <RewardsHeader coinBalance={coinBalance} />
        <div className="max-w-7xl mx-auto">
          <RewardStatsSummary />
        </div>
        <RewardPreferences />  
      <RewardsNavigation buttons={navigationButtons} />

      {activeTab === 'browse' && (
        <div className="max-w-7xl mx-auto mb-8">
          <CategoryFilter
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coupons.map((coupon) => (
              <RewardCard
                key={coupon.id}
                coupon={coupon}
                onClick={() => handleRewardClick(coupon)}
              />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="max-w-7xl mx-auto">
          {redemptionHistory.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-text-grey mb-4">Purchase History</h3>
              <p className="text-unavailable-button">No purchases yet. Start browsing rewards to redeem your coins!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {redemptionHistory.map((redemption) => (
                <div key={redemption.id} className="bg-white p-6 rounded-xl shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{redemption.coupon.title}</h3>
                      <p className="text-text-grey">{redemption.coupon.partner_company}</p>
                      <p className="text-sm text-unavailable-button mt-2">
                        Code: <span className="font-mono font-bold">{redemption.redemption_code}</span>
                      </p>
                      <p className="text-xs text-unavailable-button mt-1">
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
                      <p className="font-semibold text-logo-blue">{redemption.coins_spent} coins</p>
                     {redemption.is_active ? (
                        <div className="flex flex-col items-end gap-2">
                          <span className="inline-block px-3 py-1 bg-status-green/10 text-status-green rounded-full text-xs">
                            Active
                          </span>
                          <button
                            onClick={() => {
                              if (window.confirm('Mark this coupon as used? This cannot be undone.')) {
                                markUsed(redemption.id);
                              }
                            }}
                            disabled={isMarkingUsed}
                            className="px-3 py-1 bg-logo-blue text-pure-white rounded-lg text-xs hover:opacity-90 transition-opacity disabled:opacity-50"
                          >
                            {isMarkingUsed ? 'Marking...' : 'Mark as Used'}
                          </button>
                        </div>
                      ) : (
                        <span className="inline-block mt-2 px-3 py-1 bg-light-background-blue text-text-grey rounded-full text-xs">
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

      {activeTab === 'transactions' && (
        <div className="max-w-7xl mx-auto">
          <CoinTransactionHistory />
        </div>
      )}
    </div>
  );
};

export default RewardsPage;