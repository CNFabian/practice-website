import React from 'react';
import { OnestFont } from '../../../../assets';

interface TabNavigationProps {
  activeTab: 'faq' | 'contact';
  onTabChange: (tab: 'faq' | 'contact') => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    {
      id: 'faq' as const,
      label: 'FAQ',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'contact' as const,
      label: 'Contact Support',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    }
  ];

  return (
    <div className="mb-8">
      <div className="border-b border-light-background-blue">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`py-4 px-1 border-b-2 text-sm transition-all duration-200 flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-logo-blue text-logo-blue'
                  : 'border-transparent text-unavailable-button hover:text-text-grey hover:border-light-background-blue'
              }`}
            >
              <span className={activeTab === tab.id ? 'text-logo-blue' : 'text-unavailable-button'}>
                {tab.icon}
              </span>
              <OnestFont as="span" weight={activeTab === tab.id ? 500 : 300} lineHeight="relaxed">
                {tab.label}
              </OnestFont>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default TabNavigation;