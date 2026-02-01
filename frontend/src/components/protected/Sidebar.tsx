import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Disclosure, Transition } from '@headlessui/react';
import { 
  HomeIcon, 
  ModuleIcon, 
  SavedIcon, 
  RewardsIcon, 
  BadgesIcon, 
  GetHelpIcon, 
  SettingsIcon,
  CalculatorDarkIcon,
  DocumentDarkIcon,
  ChecklistDarkIcon,
  ControllerDarkIcon,
  Logo,
  OnestFont
} from '../../assets';
import OnBoardingPage from './onboarding/OnBoardingPage';
import { useSidebar } from '../../contexts/SidebarContext';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { isCollapsed, toggleCollapsed } = useSidebar();

  const mainMenuItems = [
    { id: 'overview', label: 'Overview', path: '/app', icon: HomeIcon },
    { id: 'modules', label: 'Modules', path: '/app/modules', icon: ModuleIcon },
    { id: 'rewards', label: 'Rewards', path: '/app/rewards', icon: RewardsIcon },
    { id: 'badges', label: 'Badges', path: '/app/badges', icon: BadgesIcon },
  ];

  const materialSubItems = [
    { id: 'calculators', label: 'Calculators', path: '/app/materials?category=Calculators', icon: CalculatorDarkIcon },
    { id: 'worksheets', label: 'Worksheets', path: '/app/materials?category=Worksheets', icon: DocumentDarkIcon },
    { id: 'checklists', label: 'Checklists', path: '/app/materials?category=Checklists', icon: ChecklistDarkIcon },
    { id: 'minigames', label: 'Minigames', path: '/app/materials?category=Minigames', icon: ControllerDarkIcon },
  ];

  const bottomMenuItems = [
    { id: 'help', label: 'Get Help', path: '/app/help', icon: GetHelpIcon },
    { id: 'settings', label: 'Settings', path: '/app/settings', icon: SettingsIcon },
  ];

  const isActive = (path: string) => {
    if (path === '/app') {
      return location.pathname === '/app';
    }

    if (path.includes('?')) {
      const [pathname, queryString] = path.split('?');
      const currentParams = new URLSearchParams(location.search);
      const linkParams = new URLSearchParams(queryString);
      
      // Check if pathname matches and all link params are in current params
      if (location.pathname === pathname) {
        for (const [key, value] of linkParams.entries()) {
          if (currentParams.get(key) !== value) {
            return false;
          }
        }
        return true;
      }
      return false;
    }
    return location.pathname === path || location.pathname.startsWith(path.split('?')[0]);
  };

  return (
    <>
      <aside 
        className={`fixed left-2 top-2 bottom-2 flex flex-col rounded-xl shadow-sm z-50 transition-all duration-300 ease-in-out bg-gradient-to-b from-light-background-blue to-tab-active ${
          isCollapsed ? 'w-16' : 'w-44'
        }`}
      >
        {/* Logo at the top */}
        <div className="px-4 pt-4 flex items-center justify-center border-b border-pure-white/20">
          <button 
            onClick={toggleCollapsed}
            className="transition-transform duration-200 hover:scale-110"
          >
            <img src={Logo} alt="Nest Navigate" className="w-16 h-16" />
          </button>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="space-y-1">
            {mainMenuItems.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                className={`
                  flex items-center rounded-2xl transition-all duration-200
                  ${isActive(item.path) 
                    ? 'bg-tab-active font-medium shadow-sm' 
                    : 'hover:bg-pure-white/50'
                  } text-text-blue-black hover:text-text-blue-black
                  ${isCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'}
                `}
              >
                {/* Icon */}
                <img src={item.icon} alt={item.label} className="w-5 h-5 flex-shrink-0" />
                <OnestFont 
                  weight={500}
                  lineHeight="relaxed"
                  className={`text-sm whitespace-nowrap transition-all duration-300 ${
                    isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'
                  }`}
                >
                  {item.label}
                </OnestFont>
              </Link>
            ))}

            {/* Materials Dropdown */}
            {!isCollapsed && (
              <Disclosure defaultOpen={location.pathname.startsWith('/app/materials')}>
                {({ open }) => (
                  <>
                    <Disclosure.Button
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200
                        ${location.pathname.startsWith('/app/materials')
                          ? 'bg-tab-active font-medium shadow-sm' 
                          : 'hover:bg-pure-white/50'
                        } text-text-blue-black hover:text-text-blue-black
                      `}
                    >
                      <img src={SavedIcon} alt="Materials" className="w-5 h-5 flex-shrink-0" />
                      <OnestFont weight={500} lineHeight="relaxed" className="text-sm flex-1 text-left">
                        Materials
                      </OnestFont>
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </Disclosure.Button>
                    <Transition
                      enter="transition duration-200 ease-out"
                      enterFrom="transform scale-95 opacity-0 max-h-0"
                      enterTo="transform scale-100 opacity-100 max-h-96"
                      leave="transition duration-150 ease-in"
                      leaveFrom="transform scale-100 opacity-100 max-h-96"
                      leaveTo="transform scale-95 opacity-0 max-h-0"
                    >
                      <Disclosure.Panel className="space-y-1 mt-1 overflow-hidden">
                        {materialSubItems.map((subItem) => (
                          <Link
                            key={subItem.id}
                            to={subItem.path}
                            className={`
                              flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-all duration-200
                              ${isActive(subItem.path)
                                ? 'font-medium bg-pure-white/60'
                                : 'hover:bg-pure-white/40'
                              } text-text-blue-black hover:text-text-blue-black
                            `}
                          >
                            <img src={subItem.icon} alt={subItem.label} className="w-4 h-4" />
                            <OnestFont weight={500} lineHeight="relaxed">
                              {subItem.label}
                            </OnestFont>
                          </Link>
                        ))}
                      </Disclosure.Panel>
                    </Transition>
                  </>
                )}
              </Disclosure>
            )}

            {/* Collapsed Materials Icon Only */}
            {isCollapsed && (
              <Link
                to="/app/materials"
                className={`
                  flex items-center justify-center rounded-2xl transition-all duration-200 px-2 py-3
                  ${location.pathname.startsWith('/app/materials')
                    ? 'bg-tab-active font-medium shadow-sm' 
                    : 'hover:bg-pure-white/50'
                  } text-text-blue-black hover:text-text-blue-black
                `}
              >
                <img src={SavedIcon} alt="Materials" className="w-5 h-5" />
              </Link>
            )}
          </div>
        </nav>

        {/* Bottom Navigation */}
        <div className="border-t border-pure-white/20 px-3 py-3">
          <div className="space-y-1">
            {/* TEMPORARY TESTING BUTTON */}
            {!isCollapsed && (
              <button
                onClick={() => setShowOnboarding(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl transition-opacity duration-200 bg-status-red hover:opacity-90 text-pure-white font-medium"
              >
                <OnestFont weight={500} lineHeight="relaxed" className="text-sm">
                  🧪 Test Onboarding
                </OnestFont>
              </button>
            )}

            {bottomMenuItems.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                className={`
                  flex items-center rounded-2xl transition-all duration-200
                  ${isActive(item.path) 
                    ? 'bg-tab-active font-medium shadow-sm' 
                    : 'hover:bg-pure-white/50'
                  } text-text-blue-black hover:text-text-blue-black
                  ${isCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'}
                `}
              >
                {/* Icon */}
                <img src={item.icon} alt={item.label} className="w-5 h-5 flex-shrink-0" />
                <OnestFont 
                  weight={500}
                  lineHeight="relaxed"
                  className={`text-sm whitespace-nowrap transition-all duration-300 ${
                    isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'
                  }`}
                >
                  {item.label}
                </OnestFont>
              </Link>
            ))}
          </div>
        </div>
      </aside>

      {/* Onboarding Modal */}
      {showOnboarding && (
        <OnBoardingPage 
          isOpen={showOnboarding} 
          onClose={() => setShowOnboarding(false)} 
        />
      )}
    </>
  );
};

export default Sidebar;