import React, { useEffect, useState } from 'react';
import { RobotoFont } from '../../../assets';
import AccountView from './AccountView';
import ProfileView from './ProfileView';
import AppearanceView from './AppearanceView';
import NotificationView from './NotificationView';
import { ProfileCompletionModal } from '../../../components'; // Import your modal component

type TabType = 'Account' | 'Profile' | 'Appearance' | 'Notifications';

const SettingsPage: React.FC = () => {
  useEffect(() => {
  const bgElement = document.getElementById('section-background');
  if (bgElement) {
    bgElement.style.setProperty('background', 'rgb(224, 231, 255)', 'important');
    bgElement.style.backgroundSize = 'cover';
  }
}, []);

  const [activeTab, setActiveTab] = useState<TabType>('Account');
  const [showCompletionModal, setShowCompletionModal] = useState(false);

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
    <div className="h-full overflow-hidden">
      <div className="h-full overflow-y-auto">
        <div className="max-w-5xl mx-auto py-6">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <RobotoFont as="h1" weight={600} className="text-2xl text-gray-900">
              Settings
            </RobotoFont>
            
            {/* Temporary Button */}
            <button
              onClick={() => setShowCompletionModal(true)}
              className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
            >
              Test Profile Complete Modal
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="flex space-x-1 p-1 rounded-lg w-fit">
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

      {/* Profile Completion Modal */}
      {showCompletionModal && (
        <ProfileCompletionModal onClose={() => setShowCompletionModal(false)} />
      )}
    </div>
  );
};

export default SettingsPage;