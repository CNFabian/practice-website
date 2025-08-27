import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, ModuleIcon, SavedIcon, RewardsIcon, BadgesIcon, GetHelpIcon, SettingsIcon } from '../assets/images/icons';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const mainMenuItems = [
    { id: 'overview', label: 'Overview', path: '/', icon: HomeIcon },
    { id: 'modules', label: 'Modules', path: '/modules', icon: ModuleIcon },
    { id: 'saved', label: 'Saved', path: '/saved', icon: SavedIcon },
    { id: 'rewards', label: 'Rewards', path: '/rewards', icon: RewardsIcon },
    { id: 'badges', label: 'Badges', path: '/badges', icon: BadgesIcon },
  ];

  const bottomMenuItems = [
    { id: 'help', label: 'Get Help', path: '/help', icon: GetHelpIcon },
    { id: 'settings', label: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="w-44 bg-gray-50 border-r border-gray-200 h-[calc(100vh-64px)] fixed left-0 top-16 flex flex-col">
      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          {mainMenuItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                ${isActive(item.path) 
                  ? 'bg-purple-50 text-purple-700 font-medium' 
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              {/* Icon */}
              <img src={item.icon} alt={item.label} className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Bottom Navigation */}
      <div className="border-t border-gray-200 px-3 py-3">
        <div className="space-y-1">
          {bottomMenuItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                ${isActive(item.path) 
                  ? 'bg-purple-50 text-purple-700 font-medium' 
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
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