import React, { useEffect } from 'react';
import { useCoinBalance } from '../../../hooks/queries/useCoinBalance';
import {
  RewardsHeader,
  RewardPreferences
} from "../components";
import { RoadblockIcon } from '../../../assets';

const RewardsPage: React.FC = () => {

  useEffect(() => {
    const bgElement = document.getElementById('section-background');
    if (bgElement) {
      bgElement.className = 'bg-light-background-blue';
      bgElement.style.backgroundSize = 'cover';
    }
  }, []);

  const { data: coinBalanceData, isLoading: coinsLoading } = useCoinBalance();
  const coinBalance = coinBalanceData?.current_balance || 50;

  if (coinsLoading) {
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
      <RewardsHeader coinBalance={coinBalance} />
      <RewardPreferences />

      {/* Under Development Notice */}
      <div className="max-w-7xl mx-auto mt-10">
        <div className="bg-pure-white rounded-2xl border-2 border-dashed border-elegant-blue/40 p-10 flex flex-col items-center text-center">
          <img
            src={RoadblockIcon}
            alt="Under construction"
            className="w-20 h-20 mb-5 opacity-80"
          />
          <h3 className="text-xl font-bold text-text-blue-black mb-2" style={{ fontFamily: 'Onest, Arial, sans-serif' }}>
            Rewards Shop Coming Soon
          </h3>
          <p className="text-text-grey max-w-md" style={{ fontFamily: 'Onest, Arial, sans-serif' }}>
            We're building something exciting! The rewards shop is currently under development.
            Keep earning coins and check back soon to redeem them for real rewards.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RewardsPage;