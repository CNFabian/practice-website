import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Disclosure, Transition } from '@headlessui/react';
import { 
  HomeIcon, 
  ModuleIcon, 
  SavedIcon, 
  RewardsIcon, 
  BadgesIcon, 
  GetHelpIcon, 
  SettingsIcon 
} from '../../assets';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const mainMenuItems = [
    { id: 'overview', label: 'Overview', path: '/app', icon: HomeIcon },
    { id: 'modules', label: 'Modules', path: '/app/modules', icon: ModuleIcon },
    { id: 'rewards', label: 'Rewards', path: '/app/rewards', icon: RewardsIcon },
    { id: 'badges', label: 'Badges', path: '/app/badges', icon: BadgesIcon },
  ];

  const materialSubItems = [
    { id: 'calculators', label: 'Calculators', path: '/app/materials?category=Calculators' },
    { id: 'worksheets', label: 'Worksheets', path: '/app/materials?category=Worksheets' },
    { id: 'checklists', label: 'Checklists', path: '/app/materials?category=Checklists' },
    { id: 'minigames', label: 'Minigames', path: '/app/materials?category=Minigames' },
  ];

  const bottomMenuItems = [
    { id: 'help', label: 'Get Help', path: '/app/help', icon: GetHelpIcon },
    { id: 'settings', label: 'Settings', path: '/app/settings', icon: SettingsIcon },
  ];

  const isActive = (path: string) => {
    if (path === '/app') {
      return location.pathname === '/app';
    }
    // Check if path includes query parameters
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
    <aside className="w-44 h-[calc(100vh-88px)] fixed left-2 top-[80px] flex flex-col rounded-xl shadow-sm" style={{ backgroundColor: '#EFF2FF' }}>
      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          {mainMenuItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200
                ${isActive(item.path) 
                  ? 'font-medium shadow-sm' 
                  : 'hover:bg-white/50'
                } text-gray-700 hover:text-gray-900
              `}
              style={isActive(item.path) ? { backgroundColor: '#D7DEFF' } : {}}
            >
              {/* Icon */}
              <img src={item.icon} alt={item.label} className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}

          {/* Materials Dropdown */}
          <Disclosure defaultOpen={location.pathname.startsWith('/app/materials')}>
            {({ open }) => (
              <>
                <Disclosure.Button
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200
                    ${location.pathname.startsWith('/app/materials')
                      ? 'font-medium shadow-sm' 
                      : 'hover:bg-white/50'
                    } text-gray-700 hover:text-gray-900
                  `}
                  style={location.pathname.startsWith('/app/materials') ? { backgroundColor: '#D7DEFF' } : {}}
                >
                  <img src={SavedIcon} alt="Materials" className="w-5 h-5" />
                  <span className="text-sm flex-1 text-left">Materials</span>
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
                  <Disclosure.Panel className="pl-8 space-y-1 mt-1 overflow-hidden">
                    {materialSubItems.map((subItem) => (
                      <Link
                        key={subItem.id}
                        to={subItem.path}
                        className={`
                          block px-4 py-2 text-sm rounded-lg transition-all duration-200
                          ${isActive(subItem.path)
                            ? 'font-medium bg-white/60'
                            : 'hover:bg-white/40'
                          } text-gray-700 hover:text-gray-900
                        `}
                      >
                        {subItem.label}
                      </Link>
                    ))}
                  </Disclosure.Panel>
                </Transition>
              </>
            )}
          </Disclosure>
        </div>
      </nav>

      {/* Bottom Navigation */}
      <div className="border-t border-white/20 px-3 py-3">
        <div className="space-y-1">
          {bottomMenuItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200
                ${isActive(item.path) 
                  ? 'font-medium shadow-sm' 
                  : 'hover:bg-white/50'
                } text-gray-700 hover:text-gray-900
              `}
              style={isActive(item.path) ? { backgroundColor: '#D7DEFF' } : {}}
            >
              {/* Icon */}
              <img src={item.icon} alt={item.label} className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;