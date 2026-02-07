import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
import { useWalkthrough } from '../../contexts/WalkthroughContext';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { isCollapsed, toggleCollapsed } = useSidebar();
  const { startWalkthrough, isWalkthroughActive } = useWalkthrough();
  const mainMenuItems = [
    { id: 'overview', label: 'Overview', path: '/app/overview', icon: HomeIcon },
    { id: 'modules', label: 'Modules', path: '/app', icon: ModuleIcon },
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

  // Handle starting the walkthrough - navigate to modules first if not there
  const handleStartWalkthrough = () => {
    if (location.pathname !== '/app/modules') {
      navigate('/app/modules');
      // Small delay to ensure navigation completes before starting walkthrough
      setTimeout(() => {
        startWalkthrough();
      }, 300);
    } else {
      startWalkthrough();
    }
  };

  return (
    <>
      <aside 
        data-walkthrough="modules-nav"
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
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </Disclosure.Button>
                    <Transition
                      enter="transition duration-200 ease-out"
                      enterFrom="transform opacity-0 -translate-y-2"
                      enterTo="transform opacity-100 translate-y-0"
                      leave="transition duration-150 ease-in"
                      leaveFrom="transform opacity-100 translate-y-0"
                      leaveTo="transform opacity-0 -translate-y-2"
                    >
                      <Disclosure.Panel className="pl-4 mt-1 space-y-1">
                        {materialSubItems.map((subItem) => (
                          <Link
                            key={subItem.id}
                            to={subItem.path}
                            className={`
                              flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-200
                              ${isActive(subItem.path)
                                ? 'bg-tab-active font-medium' 
                                : 'hover:bg-pure-white/50'
                              } text-text-blue-black hover:text-text-blue-black
                            `}
                          >
                            <img src={subItem.icon} alt={subItem.label} className="w-4 h-4 flex-shrink-0" />
                            <OnestFont weight={300} lineHeight="relaxed" className="text-sm">
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

            {/* Collapsed Materials Icon */}
            {isCollapsed && (
              <Link
                to="/app/materials"
                className={`
                  flex items-center justify-center px-2 py-3 rounded-2xl transition-all duration-200
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
            {/* MODULE WALKTHROUGH BUTTON */}
            {!isCollapsed && (
              <button
                onClick={handleStartWalkthrough}
                disabled={isWalkthroughActive}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl transition-all duration-200 ${
                  isWalkthroughActive 
                    ? 'bg-unavailable-button/50 cursor-not-allowed' 
                    : 'bg-logo-blue hover:opacity-90'
                } text-pure-white font-medium`}
              >
                <svg 
                  className="w-4 h-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" 
                  />
                </svg>
                <OnestFont weight={500} lineHeight="relaxed" className="text-sm">
                  Module Tour
                </OnestFont>
              </button>
            )}

            {/* Collapsed Walkthrough Icon */}
            {isCollapsed && (
              <button
                onClick={handleStartWalkthrough}
                disabled={isWalkthroughActive}
                title="Start Module Tour"
                className={`w-full flex items-center justify-center px-2 py-3 rounded-2xl transition-all duration-200 ${
                  isWalkthroughActive 
                    ? 'bg-unavailable-button/50 cursor-not-allowed' 
                    : 'bg-logo-blue hover:opacity-90'
                } text-pure-white`}
              >
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" 
                  />
                </svg>
              </button>
            )}

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