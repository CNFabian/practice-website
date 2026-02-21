import React from 'react';
import { CoinIcon, OnestFont } from '../../../assets/index';

interface RewardsHeaderProps {
  coinBalance: number;
}

const RewardsHeader: React.FC<RewardsHeaderProps> = ({ coinBalance }) => {
  return (
    <div 
      className="bg-linear-blue-1 rounded-2xl text-white text-center py-12 px-8 mb-6 mt-8 max-w-7xl mx-auto"
    >
      <OnestFont as="h1" weight={700} lineHeight="tight" className="text-4xl font-bold mb-4">
        Rewards & Offers
      </OnestFont>
      <OnestFont as="p" weight={500} lineHeight="relaxed" className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
        Exchange your coins for exclusive discounts and special offers from our partners
      </OnestFont>
      
      {/* Coin Balance */}
      <div className="inline-flex items-center bg-white bg-opacity-20 rounded-full px-6 py-3">
        <OnestFont as="span" weight={700} lineHeight="tight" className="text-2xl font-bold mr-2">
          {coinBalance}
        </OnestFont>
        <img src={CoinIcon} alt="Coins" className="w-6 h-6" />
      </div>
    </div>
  );
};

export default RewardsHeader;