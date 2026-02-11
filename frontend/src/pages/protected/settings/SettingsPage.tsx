import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { OnestFont } from '../../../assets';
import AccountView from './AccountView';
import ProfileView from './ProfileView';
import AppearanceView from './AppearanceView';
import NotificationView from './NotificationView';
import { logoutUser } from '../../../services/authAPI';
import { logout } from '../../../store/slices/authSlice';

type TabType = 'Account' | 'Profile' | 'Appearance' | 'Notifications';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
    ['Account', 'Profile', 'Appearance', 'Notifications'].includes(initialTab)
      ? initialTab
      : 'Account'
  );

  const tabs: TabType[] = ['Account', 'Profile', 'Appearance', 'Notifications'];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutUser();
      dispatch(logout());
      navigate('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if backend logout fails, clear local state and redirect
      dispatch(logout());
      navigate('/auth/login');
    }
  };

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
            <OnestFont
              as="h1"
              weight={700}
              lineHeight="tight"
              className="text-2xl text-text-blue-black"
            >
              Settings
            </OnestFont>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-4 py-2 bg-status-red text-pure-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <OnestFont weight={500} lineHeight="relaxed">
                {isLoggingOut ? 'Logging out...' : 'Log Out'}
              </OnestFont>
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
                  <OnestFont
                    weight={activeTab === tab ? 700 : 500}
                    lineHeight="relaxed"
                  >
                    {tab}
                  </OnestFont>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="transition-all duration-200">{renderTabContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;