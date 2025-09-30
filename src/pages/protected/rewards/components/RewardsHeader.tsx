import React from 'react';
import { CoinIcon, RobotoFont } from '../../../../assets/index';

interface RewardsHeaderProps {
  coinBalance: number;
}

const RewardsHeader: React.FC<RewardsHeaderProps> = ({ coinBalance }) => {
  return (
    <div 
      className="rounded-2xl text-white text-center py-12 px-8 mb-6 mt-8 max-w-7xl mx-auto"
      style={{
        background: 'linear-gradient(135deg, #24368b 0%, #4e46e4 100%)'
      }}
    >
      <RobotoFont as="h1" weight={700} className="text-4xl font-bold mb-4">
        Rewards & Offers
      </RobotoFont>
      <RobotoFont as="p" weight={400} className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
        Exchange your coins for exclusive discounts and special offers from our partners
      </RobotoFont>
      
      {/* Coin Balance */}
      <div className="inline-flex items-center bg-white bg-opacity-20 rounded-full px-6 py-3">
        <RobotoFont as="span" weight={700} className="text-2xl font-bold mr-2">
          {coinBalance}
        </RobotoFont>
        <img src={CoinIcon} alt="Coins" className="w-6 h-6" />
      </div>
    </div>
  );
};

export default RewardsHeader;