import React, { useState } from 'react';
import { OnestFont } from '../../../assets';

const AppearanceView: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  const languages = [
    'English',
    'Spanish'
  ];

  const handleSaveSettings = () => {
    console.log('Saving appearance settings...', { language: selectedLanguage });
    // Add save logic here
  };

  return (
    <div className="space-y-6">
      {/* Form Container */}
      <div>
        {/* Language Selection */}
        <div>
          <OnestFont as="h3" weight={700} lineHeight="relaxed" className="text-base text-gray-900 mb-2">
            Language Selection
          </OnestFont>
          <OnestFont weight={300} lineHeight="relaxed" className="text-sm text-gray-600 mb-6">
            Select the language that Nest Navigate content will appear in
          </OnestFont>
          
          <div className="max-w-md">
            <label className="block text-sm text-gray-600 mb-2">
              <OnestFont weight={500} lineHeight="relaxed">Language</OnestFont>
            </label>
            <div className="relative">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full px-3 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white cursor-pointer"
              >
                {languages.map((language) => (
                  <option key={language} value={language}>
                    {language}
                  </option>
                ))}
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

      {/* Save Button */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div>
          <OnestFont weight={300} lineHeight="relaxed" className="text-sm text-gray-600">
            Last edited 2 minutes ago
          </OnestFont>
        </div>
        <button
          onClick={handleSaveSettings}
          className="px-6 py-3 rounded-lg text-sm font-medium text-white shadow-sm hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#6B73FF' }}
        >
          <OnestFont weight={700} lineHeight="relaxed">
            Save Settings
          </OnestFont>
        </button>
      </div>
    </div>
  );
};

export default AppearanceView;