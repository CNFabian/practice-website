import React, { Fragment } from 'react';
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from '@headlessui/react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../../store/store';
import { useModules } from '../../hooks/useModules';
import { logout } from '../../store/slices/authSlice';
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
      // TODO: Implement AWS Cognito logout here
      dispatch(logout());
      navigate('/splash');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

/*

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
        // Clear localStorage data
        localStorage.removeItem('userProgress');
        localStorage.removeItem('completedModules');
        localStorage.removeItem('savedItems');
        localStorage.removeItem('earnedBadges');
        localStorage.removeItem('userCoins');
        localStorage.removeItem('claimedRewards');
        
        // You can add more specific storage keys based on your app's data structure
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('nest') || key.includes('progress') || key.includes('module'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));

        // Force page reload to reset app state
        window.location.reload();
      } catch (error) {
        console.error('Reset progress failed:', error);
        alert('Failed to reset progress. Please try again.');
      }
    }
  };*/
  return (
    <>
    <header className="h-20 fixed top-0 left-0 right-0 z-50 flex items-center px-4" style={{ backgroundColor: '#EFF2FF' }}>
      <div className="w-full max-w-screen-2xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={Logo} alt="Nest Navigate Logo" className="h-10 w-10" />
          <span className="font-bold text-xl" style={{ color: '#3F6CB9' }}>NEST NAVIGATE</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: '#E8ECF9' }}>
            <img src={CoinIcon} alt="Coins" className="w-6 h-6" />
            <span className="font-semibold text-lg" style={{ color: '#3F6CB9' }}>{totalCoins}</span>
          </div>

          <button className="p-2 hover:bg-blue-50 rounded-full transition-colors">
            <img src={BellIcon} alt="Notifications" className="w-6 h-6" />
          </button>

          <Menu as="div" className="relative">
            {({ open }) => (
              <>
                <MenuButton className="flex items-center gap-2 p-2 hover:bg-blue-50 rounded-full transition-colors">
                  <img 
                    src={user?.photoURL || ProfileIcon} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                </MenuButton>

                <Transition
                  show={open}
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <MenuItems className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none p-2">
                    <MenuItem>
                      {({ focus }) => (
                        <button
                          onClick={() => navigate('/app/rewards')}
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
                          onClick={() => {/* TODO: Implement share */}}
                          className={`${
                            focus ? 'bg-blue-50' : ''
                          } group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors`}
                        >
                          <img src={ShareIcon} alt="Share" className="w-5 h-5" />
                          <span className="text-gray-700">Share</span>
                        </button>
                      )}
                    </MenuItem>
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