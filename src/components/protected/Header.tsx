import React, { Fragment } from 'react';
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from '@headlessui/react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../../store/store';
import { useModules } from '../../hooks/useModules';
import { logout } from '../../store/slices/authSlice';
import { openOnboardingModal } from '../../store/slices/uiSlice';
import { logoutUser } from '../../services/authAPI';
import { clearOnboardingDataFromLocalStorage } from '../../services/onBoardingAPI';
import { 
  Logo, 
  CoinIcon, 
  BellIcon, 
  ProfileIcon, 
  RewardsIcon, 
  ShareIcon, 
  GetHelpIcon, 
  SettingsIcon, 
  SignOutIcon 
} from '../../assets';

const Header: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const { totalCoins } = useModules();

  const handleLogout = async () => {
    try {
      console.log('Header: Starting logout process...');
      
      // Call the backend logout endpoint
      await logoutUser();
      console.log('Header: Backend logout successful');
      
      // Clear Redux state
      dispatch(logout());
      console.log('Header: Redux state cleared');
      
      // Navigate to splash page
      navigate('/splash');
      console.log('Header: Navigated to splash page');
      
    } catch (error) {
      console.error('Header: Logout failed:', error);
      
      // Even if backend logout fails, clear local state
      dispatch(logout());
      navigate('/splash');
      
      // Optionally show a warning that logout may not have completed on server
      console.warn('Header: Local logout completed, but server logout may have failed');
    }
  };

  const handleShowOnboarding = () => {
    // Clear any existing onboarding data to ensure fresh start
    try {
      clearOnboardingDataFromLocalStorage();
      
      // Also clear individual step data
      for (let i = 1; i <= 5; i++) {
        localStorage.removeItem(`onboarding_step_${i}`);
      }
      localStorage.removeItem('onboarding_current_step');
      
      console.log('Header: Cleared all onboarding localStorage for restart');
    } catch (error) {
      console.warn('Header: Error clearing onboarding data:', error);
      // Fallback - manually clear the localStorage keys
      localStorage.removeItem('onboarding_data');
      for (let i = 1; i <= 5; i++) {
        localStorage.removeItem(`onboarding_step_${i}`);
      }
      localStorage.removeItem('onboarding_current_step');
    }
    
    // Set Redux state to show onboarding
    dispatch(openOnboardingModal());
    
    // Navigate to Overview page where onboarding modal will appear
    navigate('/app');
  };

  const handleResetProgress = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to reset your progress? This will:\n\n' +
      '• Reset your coins to 25\n' +
      '• Clear all completed modules\n' +
      '• Remove saved items\n' +
      '• Reset badges and rewards\n\n' +
      'This action cannot be undone.'
    );

    if (confirmed) {
      try {
        // Clear localStorage
        localStorage.clear();
        
        // Reload the page to reset all state
        window.location.reload();
        
      } catch (error) {
        console.error('Header: Error resetting progress:', error);
        alert('Failed to reset progress. Please try again.');
      }
    }
  };

  return (
    <>
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: Logo */}
          <div className="flex-shrink-0">
            <img src={Logo} alt="NestNavigate" className="h-8 w-auto" />
          </div>

          {/* Right: Coins, Notifications, Profile */}
          <div className="flex items-center gap-4">
            {/* Coins Display */}
            <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1.5 rounded-full">
              <img src={CoinIcon} alt="Coins" className="w-5 h-5" />
              <span className="font-medium text-yellow-700">{totalCoins}</span>
            </div>

            {/* Notifications */}
            <button className="p-2 text-gray-400 hover:text-gray-500 transition-colors relative">
              <img src={BellIcon} alt="Notifications" className="w-6 h-6" />
              {/* Notification badge */}
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Profile Dropdown */}
            <Menu as="div" className="relative">
              <MenuButton className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-50 transition-colors">
                <img
                  src={user?.photoURL || ProfileIcon}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover"
                />
              </MenuButton>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <MenuItems className="absolute right-0 mt-2 w-64 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  {/* Profile header */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.displayName || `${user?.firstName} ${user?.lastName}` || 'User'}
                    </p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>

                  {/* Menu items */}
                  <div className="py-2">
                    <MenuItem>
                      {({ focus }) => (
                        <button
                          className={`${
                            focus ? 'bg-blue-50' : ''
                          } group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors`}
                        >
                          <img src={RewardsIcon} alt="Rewards" className="w-5 h-5" />
                          <span className="text-gray-700">Rewards</span>
                        </button>
                      )}
                    </MenuItem>
                    <MenuItem>
                      {({ focus }) => (
                        <button
                          className={`${
                            focus ? 'bg-blue-50' : ''
                          } group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors`}
                        >
                          <img src={ShareIcon} alt="Share" className="w-5 h-5" />
                          <span className="text-gray-700">Share NestNavigate</span>
                        </button>
                      )}
                    </MenuItem>
                    
                    {/* TEMPORARY RESTART ONBOARDING BUTTON */}
                    <MenuItem>
                      {({ focus }) => (
                        <button
                          onClick={handleShowOnboarding}
                          className={`${
                            focus ? 'bg-blue-50' : ''
                          } group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors`}
                        >
                          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span className="text-blue-600 font-medium">🚧 Restart Onboarding (Temp)</span>
                        </button>
                      )}
                    </MenuItem>
                    
                    {/* TEMPORARY RESET PROGRESS BUTTON */}
                    <MenuItem>
                      {({ focus }) => (
                        <button
                          onClick={handleResetProgress}
                          className={`${
                            focus ? 'bg-red-50' : ''
                          } group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors`}
                        >
                          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span className="text-red-600 font-medium">🚧 Reset Progress (Temp)</span>
                        </button>
                      )}
                    </MenuItem>
                    
                    <div className="h-px bg-gray-200 my-1 mx-3" />
                    <MenuItem>
                      {({ focus }) => (
                        <button
                          onClick={() => navigate('/app/help')}
                          className={`${
                            focus ? 'bg-blue-50' : ''
                          } group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors`}
                        >
                          <img src={GetHelpIcon} alt="Get Help" className="w-5 h-5" />
                          <span className="text-gray-700">Get Help</span>
                        </button>
                      )}
                    </MenuItem>
                    <MenuItem>
                      {({ focus }) => (
                        <button
                          onClick={() => navigate('/app/settings')}
                          className={`${
                            focus ? 'bg-blue-50' : ''
                          } group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors`}
                        >
                          <img src={SettingsIcon} alt="Settings" className="w-5 h-5" />
                          <span className="text-gray-700">Account Settings</span>
                        </button>
                      )}
                    </MenuItem>
                    <MenuItem>
                      {({ focus }) => (
                        <button
                          onClick={handleLogout}
                          className={`${
                            focus ? 'bg-blue-50' : ''
                          } group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors`}
                        >
                          <img src={SignOutIcon} alt="Sign Out" className="w-5 h-5" />
                          <span className="text-gray-700">Sign Out</span>
                        </button>
                      )}
                    </MenuItem>
                  </div>
                </MenuItems>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>
    </header>
    </>
  );
};

export default Header;