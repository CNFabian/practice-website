import React, { Fragment } from 'react';
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from '@headlessui/react';
import { Logo, CoinIcon, BellIcon, ProfileIcon, RewardsIcon, ShareIcon, GetHelpIcon, SettingsIcon, SignOutIcon } from '../assets/images/icons';

const Header: React.FC = () => {
  return (
    <header className="mx-2 mt-2 px-6 py-3 shadow-sm fixed top-0 left-0 right-0 z-10 h-16 rounded-xl" style={{ backgroundColor: '#EFF2FF' }}>
      <div className="flex items-center justify-between h-full">
        {/* Left Section - Logo and Greeting */}
        <div className="flex items-center space-x-3">
          {/* Logo */}
          <img src={Logo} alt="Nest Navigate" className="w-8 h-8" />
          
          {/* Greeting Section */}
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold text-gray-800">
              Hello, [name]
            </h1>
            <p className="text-sm text-gray-600">
              Here's 25 Nest coins to get your started.
            </p>
          </div>
        </div>

        {/* Right Section - Coins, Notifications, Profile */}
        <div className="flex items-center space-x-4">
          {/* Coins Counter */}
          <div className="flex items-center space-x-2 rounded-full px-3 py-2">
            <span className="text-lg font-bold text-gray-800">25</span>
            <img src={CoinIcon} alt="Coins" className="w-6 h-6" />
          </div>

          {/* Notification Bell with Headless UI Dropdown */}
          <Menu as="div" className="relative">
            {({ open }) => (
              <>
                {/* Overlay when menu is open */}
                {open && (
                  <div className="fixed inset-0 bg-black/20 z-40" aria-hidden="true" />
                )}
                
                <MenuButton className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-50 relative z-50">
                  <img src={BellIcon} alt="Notifications" className="w-5 h-5" />
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
                  <MenuItems className="absolute right-0 mt-2 w-64 origin-top-right bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="p-4">
                      <p className="text-sm text-gray-600">No new notifications</p>
                    </div>
                  </MenuItems>
                </Transition>
              </>
            )}
          </Menu>

          {/* Profile Icon with Headless UI Dropdown */}
          <Menu as="div" className="relative">
            {({ open }) => (
              <>
                {/* Overlay when menu is open */}
                {open && (
                  <div className="fixed inset-0 bg-black/20 z-40" aria-hidden="true" />
                )}
                
                <MenuButton className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-50 relative z-50">
                  <img src={ProfileIcon} alt="Profile" className="w-5 h-5" />
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
                  <MenuItems className="absolute right-0 mt-2 w-72 origin-top-right bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none p-2 z-50">
                    <MenuItem>
                      {({ focus }) => (
                        <button
                          className={`${
                            focus ? 'bg-purple-50' : ''
                          } group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors`}
                        >
                          <img src={ProfileIcon} alt="Profile" className="w-5 h-5" />
                          <span className="text-gray-700">My Profile @Jordan123</span>
                        </button>
                      )}
                    </MenuItem>
                    <MenuItem>
                      {({ focus }) => (
                        <button
                          className={`${
                            focus ? 'bg-purple-50' : ''
                          } group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors`}
                        >
                          <img src={RewardsIcon} alt="Rewards" className="w-5 h-5" />
                          <span className="text-gray-700">Saved Rewards</span>
                        </button>
                      )}
                    </MenuItem>
                    <MenuItem>
                      {({ focus }) => (
                        <button
                          className={`${
                            focus ? 'bg-purple-50' : ''
                          } group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors`}
                        >
                          <img src={ShareIcon} alt="Share" className="w-5 h-5" />
                          <span className="text-gray-700">Share NestNavigate</span>
                        </button>
                      )}
                    </MenuItem>
                    <div className="h-px bg-gray-200 my-1 mx-3" />
                    <MenuItem>
                      {({ focus }) => (
                        <button
                          className={`${
                            focus ? 'bg-purple-50' : ''
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
                          className={`${
                            focus ? 'bg-purple-50' : ''
                          } group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors`}
                        >
                          <img src={SettingsIcon} alt="Settings" className="w-5 h-5" />
                          <span className="text-gray-700">Account Settings</span>
                        </button>
                      )}
                    </MenuItem>
                    <div className="h-px bg-gray-200 my-1 mx-3" />
                    <MenuItem>
                      {({ focus }) => (
                        <button
                          className={`${
                            focus ? 'bg-purple-50' : ''
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
  );
};

export default Header;