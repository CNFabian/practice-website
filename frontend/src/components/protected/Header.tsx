import React, { Fragment } from 'react';
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from '@headlessui/react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../../store/store';
import { logout } from '../../store/slices/authSlice';
import { logoutUser } from '../../services/authAPI';
import { useCoinSystem } from '../../hooks/useCoinSystem';
import { useUnreadCount } from '../../hooks/queries/useNotifications';
import { 
  Logo, 
  CoinIcon, 
  BellIcon, 
  ProfileIcon, 
  RewardsIcon, 
  ShareIcon, 
  GetHelpIcon, 
  SettingsIcon, 
  SignOutIcon,
  OnestFont
} from '../../assets';

const Header: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  // Use the new frontend coin system instead of backend
  const { currentBalance, isAnimating } = useCoinSystem();
  const { data: unreadCountData } = useUnreadCount();
  
  // Use cached balance instead of backend balance
  const totalCoins = currentBalance;
  const unreadCount = unreadCountData?.unread_count || 0;

  const handleLogout = async () => {
    try {      
      // Call the backend logout endpoint
      await logoutUser();
      
      dispatch(logout());
      
      navigate('/login');
      
    } catch (error) {
      console.error('Header: Logout failed:', error);
      
      dispatch(logout());
      navigate('/login');
      
      console.warn('Header: Local logout completed, but server logout may have failed');
    }
  };

  const getDisplayName = () => {
    if (user?.displayName) {
      return user.displayName.split(' ')[0];
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Guest';
  };

  const getUserHandle = () => {
    if (user?.displayName) {
      return `@${user.displayName.replace(/\s+/g, '').toLowerCase()}123`;
    }
    if (user?.email) {
      return `@${user.email.split('@')[0]}`;
    }
    return '@user';
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 h-2 bg-light-background-blue z-10"></div>
      
      <header className="mx-2 mt-2 px-6 py-3 shadow-sm fixed top-0 left-0 right-0 z-10 h-16 rounded-xl bg-light-background-blue">
        <div className="flex items-center justify-between h-full">
        {/* Left Section - Logo and Greeting */}
        <div className="flex items-center space-x-3">
          {/* Logo */}
          <img src={Logo} alt="Nest Navigate" className="w-8 h-8" />
          
          {/* Greeting Section */}
          <div className="flex flex-col">
            <OnestFont as="h1" weight={700} lineHeight="relaxed" className="text-lg text-text-blue-black">
              Hello, {getDisplayName()}
            </OnestFont>
            <OnestFont weight={300} lineHeight="relaxed" className="text-sm text-text-grey">
              Let's begin your journey to land a home!
            </OnestFont>
          </div>
        </div>

        {/* Right Section - Coins, Notifications, Profile */}
        <div className="flex items-center space-x-4">
          {/* Coins Counter with Animation */}
          <div data-walkthrough="coin-display" className={`flex items-center space-x-2 rounded-full px-3 py-2 transition-all duration-500 ${
            isAnimating ? 'scale-110 bg-logo-yellow/20' : 'scale-100'
          }`}>
            <OnestFont 
              weight={700} 
              lineHeight="relaxed" 
              className={`text-lg transition-colors duration-500 ${
                isAnimating ? 'text-logo-yellow' : 'text-text-blue-black'
              }`}
            >
              {totalCoins}
            </OnestFont>
            <img src={CoinIcon} alt="Coins" className={`w-6 h-6 transition-transform duration-500 ${
              isAnimating ? 'rotate-12' : ''
            }`} />
          </div>

          {/* Notification Bell with Headless UI Dropdown */}
          <Menu as="div" className="relative">
            {({ open }) => (
              <>
                {/* Overlay when menu is open */}
                {open && (
                  <div className="fixed inset-0 bg-black/20 z-40" aria-hidden="true" />
                )}
                
                <MenuButton className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-light-background-blue/50 relative z-50">
                  <img src={BellIcon} alt="Notifications" className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-status-red text-pure-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
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
                  <MenuItems className="absolute right-0 mt-2 w-80 bg-pure-white rounded-xl shadow-lg ring-1 ring-black/5 focus:outline-none z-50 max-h-96 overflow-y-auto">
                    <div className="px-6 py-4 border-b border-light-background-blue">
                      <OnestFont as="h3" weight={700} lineHeight="relaxed" className="text-lg text-text-blue-black">
                        Notifications
                      </OnestFont>
                      <OnestFont weight={300} lineHeight="relaxed" className="text-sm text-text-grey mt-1">
                        Stay updated on your progress
                      </OnestFont>
                    </div>
                    
                    <div className="py-2">
                      <MenuItem>
                        {({ active }) => (
                          <div className={`px-6 py-3 ${active ? 'bg-light-background-blue' : ''}`}>
                            <div className="flex items-start space-x-3">
                              <div className="w-8 h-8 bg-logo-blue/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-logo-blue text-sm font-medium">🎓</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <OnestFont weight={500} lineHeight="relaxed" className="text-sm text-text-blue-black">
                                  Course completed!
                                </OnestFont>
                                <OnestFont weight={300} lineHeight="relaxed" className="text-sm text-text-grey mt-1">
                                  You completed "Investment Basics" and earned 50 coins
                                </OnestFont>
                                <OnestFont weight={300} lineHeight="relaxed" className="text-xs text-unavailable-button mt-1">
                                  2 hours ago
                                </OnestFont>
                              </div>
                            </div>
                          </div>
                        )}
                      </MenuItem>

                      <MenuItem>
                        {({ active }) => (
                          <div className={`px-6 py-3 ${active ? 'bg-light-background-blue' : ''}`}>
                            <div className="flex items-start space-x-3">
                              <div className="w-8 h-8 bg-status-green/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-status-green text-sm font-medium">🏆</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <OnestFont weight={500} lineHeight="relaxed" className="text-sm text-text-blue-black">
                                  New badge earned!
                                </OnestFont>
                                <OnestFont weight={300} lineHeight="relaxed" className="text-sm text-text-grey mt-1">
                                  You earned the "Quick Learner" badge
                                </OnestFont>
                                <OnestFont weight={300} lineHeight="relaxed" className="text-xs text-unavailable-button mt-1">
                                  5 hours ago
                                </OnestFont>
                              </div>
                            </div>
                          </div>
                        )}
                      </MenuItem>

                      <MenuItem>
                        {({ active }) => (
                          <div className={`px-6 py-3 ${active ? 'bg-light-background-blue' : ''}`}>
                            <div className="flex items-start space-x-3">
                              <div className="w-8 h-8 bg-elegant-blue/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-elegant-blue text-sm font-medium">📚</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <OnestFont weight={500} lineHeight="relaxed" className="text-sm text-text-blue-black">
                                  New lesson available
                                </OnestFont>
                                <OnestFont weight={300} lineHeight="relaxed" className="text-sm text-text-grey mt-1">
                                  Check out "Advanced Portfolio Management"
                                </OnestFont>
                                <OnestFont weight={300} lineHeight="relaxed" className="text-xs text-unavailable-button mt-1">
                                  1 day ago
                                </OnestFont>
                              </div>
                            </div>
                          </div>
                        )}
                      </MenuItem>
                    </div>

                    <div className="px-6 py-3 border-t border-light-background-blue">
                      <button className="w-full text-logo-blue hover:opacity-90 transition-opacity">
                        <OnestFont weight={500} lineHeight="relaxed" className="text-sm">
                          View all notifications
                        </OnestFont>
                      </button>
                    </div>
                  </MenuItems>
                </Transition>
              </>
            )}
          </Menu>

          {/* Profile Dropdown with Headless UI */}
          <Menu as="div" className="relative">
            {({ open }) => (
              <>
                {/* Overlay when menu is open */}
                {open && (
                  <div className="fixed inset-0 bg-black/20 z-40" aria-hidden="true" />
                )}
                
                <MenuButton className="w-8 h-8 rounded-full overflow-hidden cursor-pointer hover:ring-2 hover:ring-logo-blue transition-all relative z-50">
                  <img src={ProfileIcon} alt="Profile" className="w-full h-full object-cover" />
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
                  <MenuItems className="absolute right-0 mt-2 w-64 bg-pure-white rounded-xl shadow-lg ring-1 ring-black/5 focus:outline-none z-50">
                    {/* Profile Header */}
                    <div className="px-6 py-4 border-b border-light-background-blue">
                      <div className="flex items-center space-x-3">
                        <img src={ProfileIcon} alt="Profile" className="w-10 h-10 rounded-full" />
                        <div>
                          <OnestFont weight={700} lineHeight="relaxed" className="text-sm text-text-blue-black">
                            {getDisplayName()}
                          </OnestFont>
                          <OnestFont weight={300} lineHeight="relaxed" className="text-xs text-text-grey">
                            {getUserHandle()}
                          </OnestFont>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <MenuItem>
                        {({ active }) => (
                          <button
                            onClick={() => navigate('/rewards')}
                            className={`w-full px-6 py-3 text-left flex items-center space-x-3 ${
                              active ? 'bg-light-background-blue' : ''
                            }`}
                          >
                            <img src={RewardsIcon} alt="" className="w-4 h-4" />
                            <OnestFont weight={500} lineHeight="relaxed" className="text-sm text-text-blue-black">
                              Rewards
                            </OnestFont>
                          </button>
                        )}
                      </MenuItem>

                      <MenuItem>
                        {({ active }) => (
                          <button
                            className={`w-full px-6 py-3 text-left flex items-center space-x-3 ${
                              active ? 'bg-light-background-blue' : ''
                            }`}
                          >
                            <img src={ShareIcon} alt="" className="w-4 h-4" />
                            <OnestFont weight={500} lineHeight="relaxed" className="text-sm text-text-blue-black">
                              Share & Earn
                            </OnestFont>
                          </button>
                        )}
                      </MenuItem>

                      <MenuItem>
                        {({ active }) => (
                          <button
                            onClick={() => navigate('/help')}
                            className={`w-full px-6 py-3 text-left flex items-center space-x-3 ${
                              active ? 'bg-light-background-blue' : ''
                            }`}
                          >
                            <img src={GetHelpIcon} alt="" className="w-4 h-4" />
                            <OnestFont weight={500} lineHeight="relaxed" className="text-sm text-text-blue-black">
                              Get Help
                            </OnestFont>
                          </button>
                        )}
                      </MenuItem>

                      <MenuItem>
                        {({ active }) => (
                          <button
                            className={`w-full px-6 py-3 text-left flex items-center space-x-3 ${
                              active ? 'bg-light-background-blue' : ''
                            }`}
                          >
                            <img src={SettingsIcon} alt="" className="w-4 h-4" />
                            <OnestFont weight={500} lineHeight="relaxed" className="text-sm text-text-blue-black">
                              Settings
                            </OnestFont>
                          </button>
                        )}
                      </MenuItem>
                    </div>

                    {/* Logout */}
                    <div className="py-2 border-t border-light-background-blue">
                      <MenuItem>
                        {({ active }) => (
                          <button
                            onClick={handleLogout}
                            className={`w-full px-6 py-3 text-left flex items-center space-x-3 ${
                              active ? 'bg-light-background-blue' : ''
                            }`}
                          >
                            <img src={SignOutIcon} alt="" className="w-4 h-4" />
                            <OnestFont weight={500} lineHeight="relaxed" className="text-sm text-text-blue-black">
                              Sign Out
                            </OnestFont>
                          </button>
                        )}
                      </MenuItem>
                    </div>
                  </MenuItems>
                </Transition>
              </>
            )}
          </Menu>
        </div>
        </div>
      </header>
    </>
  );
};

export default Header;