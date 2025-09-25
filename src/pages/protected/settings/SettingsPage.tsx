import React, { useState } from 'react';
import { RobotoFont } from '../../../assets';
import AccountView from './AccountView';
import ProfileView from './ProfileView';
import AppearanceView from './AppearanceView';
import NotificationView from './NotificationView';

type TabType = 'Account' | 'Profile' | 'Appearance' | 'Notifications';

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('Account');

  const tabs: TabType[] = ['Account', 'Profile', 'Appearance', 'Notifications'];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Account':
        return <AccountView />;
      case 'Profile':
        return <ProfileView />;
      case 'Appearance':
        return <AppearanceView />;
      case 'Notifications':
        return <NotificationView />;
      default:
        return <AccountView />;
    }
  };

  return (
    <div className="h-full overflow-hidden bg-gray-50">
      <div className="h-full overflow-y-auto">
        <div className="max-w-5xl mx-auto py-6">
          {/* Header */}
          <div className="mb-6">
            <RobotoFont as="h1" weight={600} className="text-2xl text-gray-900">
              Settings
            </RobotoFont>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'text-blue-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  style={activeTab === tab ? { backgroundColor: '#D7DEFF' } : {}}
                >
                  <RobotoFont weight={activeTab === tab ? 600 : 500}>
                    {tab}
                  </RobotoFont>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="transition-all duration-200">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;