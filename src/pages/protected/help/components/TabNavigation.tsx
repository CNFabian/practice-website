import React from 'react';
import { RobotoFont } from '../../../../assets';

interface TabNavigationProps {
  activeTab: 'faq' | 'contact';
  onTabChange: (tab: 'faq' | 'contact') => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="mb-8">
      <div className="flex space-x-8 border-b border-gray-200">
        <button
          onClick={() => onTabChange('faq')}
          className={`pb-4 px-6 relative transition-colors ${
            activeTab === 'faq'
              ? 'text-[#4f46e5] font-medium bg-[#f8faff] rounded-t-lg'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <RobotoFont as="span" weight={activeTab === 'faq' ? 500 : 400} className="text-base">
            FAQ
          </RobotoFont>
          {activeTab === 'faq' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4f46e5] transition-all duration-300"></div>
          )}
        </button>
        <button
          onClick={() => onTabChange('contact')}
          className={`pb-4 px-6 relative transition-colors ${
            activeTab === 'contact'
              ? 'text-[#4f46e5] font-medium bg-[#f8faff] rounded-t-lg'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <RobotoFont as="span" weight={activeTab === 'contact' ? 500 : 400} className="text-base">
            Contact
          </RobotoFont>
          {activeTab === 'contact' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4f46e5] transition-all duration-300"></div>
          )}
        </button>
      </div>
    </div>
  );
};

export default TabNavigation;