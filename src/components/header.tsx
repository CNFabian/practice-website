import React from 'react';
import { Logo, CoinIcon, BellIcon, ProfileIcon } from '../assets/images/icons';

const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-purple-100 to-blue-50 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Left Section - Logo and Greeting */}
        <div className="flex items-center space-x-3">
          {/* Logo */}
          <img src={Logo} alt="Nest Navigate" className="w-8 h-8" />
          
          {/* Greeting Section */}
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold text-gray-800">
              Hello, [name]
            </h1>
            <p className="text-sm text-gray-600">
              Here's 25 Nest coins to get your started.
            </p>
          </div>
        </div>

        {/* Right Section - Coins, Notifications, Profile */}
        <div className="flex items-center space-x-4">
          {/* Coins Counter */}
          <div className="flex items-center space-x-2  rounded-full px-3 py-2">
            <span className="text-lg font-bold text-gray-800">25</span>
            <img src={CoinIcon} alt="Coins" className="w-6 h-6" />
          </div>

          {/* Notification Bell */}
          <button className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-50">
            <img src={BellIcon} alt="Notifications" className="w-5 h-5" />
          </button>

          {/* Profile Icon */}
          <button className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-50">
            <img src={ProfileIcon} alt="Profile" className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;