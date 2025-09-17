import React from 'react';
import { Link, useLocation } from 'react-router-dom';
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
    { id: 'materials', label: 'Materials', path: '/app/materials', icon: SavedIcon },
    { id: 'rewards', label: 'Rewards', path: '/app/rewards', icon: RewardsIcon },
    { id: 'badges', label: 'Badges', path: '/app/badges', icon: BadgesIcon },
  ];

  const bottomMenuItems = [
    { id: 'help', label: 'Get Help', path: '/app/help', icon: GetHelpIcon },
    { id: 'settings', label: 'Settings', path: '/app/settings', icon: SettingsIcon },
  ];

  const isActive = (path: string) => {
    if (path === '/app') {
      return location.pathname === '/app';
    }
    return location.pathname === path;
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