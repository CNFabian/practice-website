import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { OnestFont } from '../../../assets';
import AccountView from './AccountView';
import { logoutUser } from '../../../services/authAPI';
import { logout } from '../../../store/slices/authSlice';
import { BetaTooltip } from '../../../components';

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

  const tabs: TabType[] = ['Account', 'Profile', 'Appearance', 'Notifications'];
  const betaTabs: TabType[] = ['Profile', 'Appearance', 'Notifications'];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutUser();
      dispatch(logout());
      navigate('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
      dispatch(logout());
      navigate('/auth/login');
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
              {tabs.map((tab) => {
                const isBeta = betaTabs.includes(tab);

                if (isBeta) {
                  return (
                    <BetaTooltip key={tab} position="bottom">
                      <div
                        className="px-4 py-2 rounded-md text-sm font-medium text-text-grey hover:text-text-blue-black transition-colors cursor-pointer"
                      >
                        <OnestFont weight={500} lineHeight="relaxed">
                          {tab}
                        </OnestFont>
                      </div>
                    </BetaTooltip>
                  );
                }

                return (
                  <div
                    key={tab}
                    className="px-4 py-2 rounded-md text-sm font-medium bg-tab-active text-logo-blue shadow-sm"
                  >
                    <OnestFont weight={700} lineHeight="relaxed">
                      {tab}
                    </OnestFont>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tab Content - Always show Account */}
          <div className="transition-all duration-200">
            <AccountView />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;