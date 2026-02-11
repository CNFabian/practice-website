import React, { useEffect, useState } from 'react';
import { OnestFont } from '../../../assets';
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
    bgElement.className = 'bg-light-background-blue';
    bgElement.style.backgroundSize = 'cover';
  }
}, []);

  const searchParams = new URLSearchParams(window.location.search);
  const initialTab = (searchParams.get('tab') as TabType) || 'Account';
  const [activeTab, setActiveTab] = useState<TabType>(
    ['Account', 'Profile', 'Appearance', 'Notifications'].includes(initialTab) ? initialTab : 'Account'
  );
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
            <OnestFont as="h1" weight={700} lineHeight="tight" className="text-2xl text-text-blue-black">
              Settings
            </OnestFont>
            
            {/* Temporary Button */}
            <button
              onClick={() => setShowCompletionModal(true)}
              className="px-4 py-2 bg-status-green text-white rounded-lg text-sm font-medium hover:opacity-90 transition-colors"
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
                      ? 'bg-tab-active text-logo-blue shadow-sm'
                      : 'text-text-grey hover:text-text-blue-black'
                  }`}
                >
                  <OnestFont weight={activeTab === tab ? 700 : 500} lineHeight="relaxed">
                    {tab}
                  </OnestFont>
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