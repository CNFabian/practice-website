import React from 'react';
import { OnestFont } from '../../../assets';

const AdminDashboardPage: React.FC = () => {
  return (
    <div className="h-full overflow-y-auto overflow-x-hidden">
      <div className="p-4 lg:p-6 w-full">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">🔒</span>
          <OnestFont as="h1" weight={700} lineHeight="tight" className="text-text-blue-black text-2xl">
            Admin Dashboard
          </OnestFont>
          <div className="bg-status-red/10 text-status-red px-3 py-1 rounded-full">
            <OnestFont weight={500} lineHeight="relaxed" className="text-xs">
              Admin
            </OnestFont>
          </div>
        </div>

        <div className="bg-pure-white rounded-xl p-6 shadow-sm">
          <OnestFont weight={500} lineHeight="relaxed" className="text-text-blue-black text-lg mb-4">
            Welcome to the Admin Panel
          </OnestFont>
          <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey">
            Analytics dashboard and lead management features will be implemented in the next steps.
          </OnestFont>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;