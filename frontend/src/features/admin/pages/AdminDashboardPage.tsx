import React, { useState, useCallback } from 'react';
import { OnestFont } from '../../../assets';
import {
  AdminOverview,
  AllLeadsTable,
  LeadDetailView,
  SystemControls,
} from './components';

type AdminTab = 'overview' | 'leads' | 'system';

const TABS: { id: AdminTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'leads', label: 'All Leads' },
  { id: 'system', label: 'System' },
];

const AdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  // When a lead is selected from the table, show the detail view
  const handleViewLead = useCallback((userId: string) => {
    setSelectedLeadId(userId);
  }, []);

  // Navigate back from lead detail to leads table
  const handleBackToLeads = useCallback(() => {
    setSelectedLeadId(null);
  }, []);

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden">
      <div className="p-4 lg:p-6 w-full">
        {/* Header */}
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

        {/* Tab Navigation */}
        <div className="bg-pure-white rounded-t-xl shadow-sm border-b border-light-background-blue">
          <div className="flex">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  // Reset lead detail when switching tabs
                  if (tab.id !== 'leads') {
                    setSelectedLeadId(null);
                  }
                }}
                className={`px-6 py-3 transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-logo-blue'
                    : 'text-text-grey hover:text-text-blue-black'
                }`}
              >
                <OnestFont weight={activeTab === tab.id ? 700 : 500} lineHeight="relaxed" className="text-sm">
                  {tab.label}
                </OnestFont>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-logo-blue rounded-t" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'overview' && <AdminOverview />}

          {activeTab === 'leads' && (
            selectedLeadId ? (
              <LeadDetailView
                userId={selectedLeadId}
                onBack={handleBackToLeads}
              />
            ) : (
              <AllLeadsTable onViewDetail={handleViewLead} />
            )
          )}

          {activeTab === 'system' && <SystemControls />}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;