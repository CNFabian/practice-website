import React, { useState } from 'react';
import { RobotoFont } from '../../../assets';

const NotificationsView: React.FC = () => {
  const [newsAndUpdates, setNewsAndUpdates] = useState(true);
  const [tipsAndTutorials, setTipsAndTutorials] = useState(true);
  const [userResearch, setUserResearch] = useState(true);
  const [expertSeminars, setExpertSeminars] = useState('30 minutes before');
  const [lessonReminders, setLessonReminders] = useState('Once a week');

  const handleSaveSettings = () => {
    console.log('Saving notification settings...', {
      newsAndUpdates,
      tipsAndTutorials,
      userResearch,
      expertSeminars,
      lessonReminders
    });
    // Add save logic here
  };

  const Toggle: React.FC<{ enabled: boolean; onChange: (enabled: boolean) => void }> = ({ enabled, onChange }) => (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        enabled ? 'bg-blue-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-300 ease-in-out shadow-sm ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Form Container */}
      <div>
        {/* Notifications From Us */}
        <div className="pb-6">
          <RobotoFont as="h3" weight={600} className="text-base text-gray-900 mb-2">
            Notifications From Us
          </RobotoFont>
          <RobotoFont className="text-sm text-gray-600 mb-6">
            Receive the latest news and updates from Nest Navigate
          </RobotoFont>
          
          <div className="space-y-6">
            {/* News and Updates */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <RobotoFont as="h4" weight={600} className="text-sm text-gray-900 mb-1">
                  News and Updates
                </RobotoFont>
                <RobotoFont className="text-sm text-gray-600">
                  Receive updates on the latest educational content and rewards offered by Nest Navigate
                </RobotoFont>
              </div>
              <Toggle enabled={newsAndUpdates} onChange={setNewsAndUpdates} />
            </div>

            {/* Tips and Tutorials */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <RobotoFont as="h4" weight={600} className="text-sm text-gray-900 mb-1">
                  Tips and Tutorials
                </RobotoFont>
                <RobotoFont className="text-sm text-gray-600">
                  Learn how to use Nest Navigate and make the most of the resources we provide
                </RobotoFont>
              </div>
              <Toggle enabled={tipsAndTutorials} onChange={setTipsAndTutorials} />
            </div>

            {/* User Research */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <RobotoFont as="h4" weight={600} className="text-sm text-gray-900 mb-1">
                  User Research
                </RobotoFont>
                <RobotoFont className="text-sm text-gray-600">
                  Provide feedback on Nest Navigate and help us improve the product
                </RobotoFont>
              </div>
              <Toggle enabled={userResearch} onChange={setUserResearch} />
            </div>
          </div>
        </div>

        {/* Reminders */}
        <div className="border-t border-gray-200 pt-6">
          <RobotoFont as="h3" weight={600} className="text-base text-gray-900 mb-2">
            Reminders
          </RobotoFont>
          <RobotoFont className="text-sm text-gray-600">
            Set reminders to help you stay on track
          </RobotoFont>
          
          <div className="space-y-6">
            {/* Expert Seminars */}
            <div className="flex items-start justify-between">
              <div className="flex-1 mt-6">
                <RobotoFont as="h4" weight={600} className="text-sm text-gray-900 mb-1">
                  Expert Seminars
                </RobotoFont>
                <RobotoFont className="text-sm text-gray-600">
                  Get reminders about seminars hosted by experts
                </RobotoFont>
              </div>
              <div className="relative mt-6">
                <select
                  value={expertSeminars}
                  onChange={(e) => setExpertSeminars(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white cursor-pointer pr-10"
                >
                  <option value="15 minutes before">15 minutes before</option>
                  <option value="30 minutes before">30 minutes before</option>
                  <option value="1 hour before">1 hour before</option>
                  <option value="2 hours before">2 hours before</option>
                  <option value="1 day before">1 day before</option>
                  <option value="Never">Never</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Lesson Reminders */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <RobotoFont as="h4" weight={600} className="text-sm text-gray-900 mb-1">
                  Lesson Reminders
                </RobotoFont>
                <RobotoFont className="text-sm text-gray-600">
                  Receive reminders about incomplete lessons and modules that are in progress
                </RobotoFont>
              </div>
              <div className="relative">
                <select
                  value={lessonReminders}
                  onChange={(e) => setLessonReminders(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white cursor-pointer pr-10"
                >
                  <option value="Daily">Daily</option>
                  <option value="Every 3 days">Every 3 days</option>
                  <option value="Once a week">Once a week</option>
                  <option value="Once a month">Once a month</option>
                  <option value="Never">Never</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div>
          <RobotoFont className="text-sm text-gray-600">
            Last edited 2 minutes ago
          </RobotoFont>
        </div>
        <button
          onClick={handleSaveSettings}
          className="px-6 py-3 rounded-lg text-sm font-medium text-white shadow-sm hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#6B73FF' }}
        >
          <RobotoFont weight={600}>
            Save Settings
          </RobotoFont>
        </button>
      </div>
    </div>
  );
};

export default NotificationsView;