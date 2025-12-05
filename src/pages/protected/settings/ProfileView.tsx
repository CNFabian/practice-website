import React, { useState } from 'react';
import { RobotoFont } from '../../../assets';
import { useSettings } from '../../../hooks/useSettings';

const ProfileView: React.FC = () => {
  const [timelineValue, setTimelineValue] = useState(24); // 2 years = 24 months
  const [selectedLearningPreferences, setSelectedLearningPreferences] = useState<string[]>([]);
  const [workingWithRealtor, setWorkingWithRealtor] = useState('Yes');
  const [workingWithLoanOfficer, setWorkingWithLoanOfficer] = useState('Yes');
  const [selectedRewardPreferences, setSelectedRewardPreferences] = useState<string[]>([]);
  const [creditScore, setCreditScore] = useState('810');

  // Mock data toggle
  const { useMockData, toggleMockDataEnabled } = useSettings();

  const handleTimelineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTimelineValue(Number(e.target.value));
  };

  const getTimelineText = () => {
    if (timelineValue <= 6) return '6 months';
    if (timelineValue <= 12) return '1 year';
    if (timelineValue <= 24) return '2 years';
    if (timelineValue <= 36) return '3 years';
    if (timelineValue <= 48) return '4 years';
    return '5 years';
  };

  const handleLearningPreferenceToggle = (preference: string) => {
    setSelectedLearningPreferences(prev =>
      prev.includes(preference)
        ? prev.filter(p => p !== preference)
        : [...prev, preference]
    );
  };

  const handleRewardPreferenceToggle = (preference: string) => {
    setSelectedRewardPreferences(prev =>
      prev.includes(preference)
        ? prev.filter(p => p !== preference)
        : [...prev, preference]
    );
  };

  const handleSaveSettings = () => {
    console.log('Saving profile settings...');
    // Add save logic here
  };

  const learningPreferences = [
    {
      id: 'reading',
      title: 'Reading',
      description: 'Learn through articles and guides',
      icon: '📚'
    },
    {
      id: 'videos',
      title: 'Videos',
      description: 'Watch educational content',
      icon: '🎥'
    },
    {
      id: 'quizzes',
      title: 'Quizzes/Games',
      description: 'Interactive learning experiences',
      icon: '🎮'
    },
    {
      id: 'other',
      title: 'Other',
      description: 'Mixed learning approaches',
      icon: '💡'
    },
    {
      id: 'webinars',
      title: 'Webinars',
      description: 'Live online sessions with experts',
      icon: '🌐'
    }
  ];

  const rewardPreferences = [
    {
      id: 'home-improvement',
      title: 'Home Improvement',
      description: 'Tools and supplies for your future home',
      icon: '🏠'
    },
    {
      id: 'expert-consultation',
      title: 'Expert Consultation',
      description: 'Sessions with real estate professionals',
      icon: '🏆'
    },
    {
      id: 'in-game-currency',
      title: 'In-Game Currency',
      description: 'Coins to unlock premium features',
      icon: '🪙'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Form Container */}
      <div>
        {/* Desired Homeownership Timeline */}
        <div className="pb-6">
          <RobotoFont as="h3" weight={600} className="text-base text-gray-900 mb-2">
            Desired Homeownership Timeline
          </RobotoFont>
          <RobotoFont className="text-sm text-gray-600 mb-6">
            This helps us customize your learning path and set realistic goals
          </RobotoFont>
          
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="px-3 py-1 rounded-full text-sm font-medium text-white" style={{ backgroundColor: '#6B73FF' }}>
                <RobotoFont weight={500}>{getTimelineText()}</RobotoFont>
              </div>
            </div>
            
            <div className="relative">
              <input
                type="range"
                min="6"
                max="60"
                value={timelineValue}
                onChange={handleTimelineChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  background: `linear-gradient(to right, #6B73FF 0%, #6B73FF ${((timelineValue - 6) / (60 - 6)) * 100}%, #e5e7eb ${((timelineValue - 6) / (60 - 6)) * 100}%, #e5e7eb 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span><RobotoFont>6 months</RobotoFont></span>
                <span><RobotoFont>5 years</RobotoFont></span>
              </div>
            </div>
          </div>
        </div>

        {/* Learning Preferences */}
        <div className="border-t border-gray-200 py-6">
          <RobotoFont as="h3" weight={600} className="text-base text-gray-900 mb-2">
            Learning Preferences
          </RobotoFont>
          <RobotoFont className="text-sm text-gray-600 mb-6">
            We'll personalize your experience based on your learning preferences
          </RobotoFont>
          
          <div className="grid grid-cols-5 gap-4">
            {learningPreferences.map((preference) => (
              <div
                key={preference.id}
                onClick={() => handleLearningPreferenceToggle(preference.id)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all text-center ${
                  selectedLearningPreferences.includes(preference.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-2">{preference.icon}</div>
                <RobotoFont as="h4" weight={600} className="text-sm text-gray-900 mb-1">
                  {preference.title}
                </RobotoFont>
                <RobotoFont className="text-xs text-gray-600">
                  {preference.description}
                </RobotoFont>
              </div>
            ))}
          </div>
        </div>

        {/* Working with Realtor */}
        <div className="border-t border-gray-200 py-6">
          <RobotoFont as="h3" weight={600} className="text-base text-gray-900 mb-2">
            Are you currently working with a realtor?
          </RobotoFont>
          <RobotoFont className="text-sm text-gray-600 mb-4">
            A realtor can help you navigate the home buying process
          </RobotoFont>
          
          <div className="flex gap-6 mt-2">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="realtor"
                value="Yes"
                checked={workingWithRealtor === 'Yes'}
                onChange={(e) => setWorkingWithRealtor(e.target.value)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
              />
              <RobotoFont className="ml-2 text-sm text-gray-700">Yes</RobotoFont>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="realtor"
                value="No"
                checked={workingWithRealtor === 'No'}
                onChange={(e) => setWorkingWithRealtor(e.target.value)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
              />
              <RobotoFont className="ml-2 text-sm text-gray-700">No</RobotoFont>
            </label>
          </div>
        </div>

        {/* Working with Loan Officer */}
        <div className="border-t border-gray-200 py-6">
          <RobotoFont as="h3" weight={600} className="text-base text-gray-900 mb-2">
            Are you currently working with a loan officer?
          </RobotoFont>
          <RobotoFont className="text-sm text-gray-600">
            A realtor can help you navigate the financial processes of home ownership
          </RobotoFont>
          
          <div className="flex gap-6 mt-2">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="loanOfficer"
                value="Yes"
                checked={workingWithLoanOfficer === 'Yes'}
                onChange={(e) => setWorkingWithLoanOfficer(e.target.value)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
              />
              <RobotoFont className="ml-2 text-sm text-gray-700">Yes</RobotoFont>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="loanOfficer"
                value="No"
                checked={workingWithLoanOfficer === 'No'}
                onChange={(e) => setWorkingWithLoanOfficer(e.target.value)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
              />
              <RobotoFont className="ml-2 text-sm text-gray-700">No</RobotoFont>
            </label>
          </div>
        </div>

        {/* Reward Preference */}
        <div className="border-t border-gray-200 py-6">
          <RobotoFont as="h3" weight={600} className="text-base text-gray-900 mb-2">
            Reward Preference
          </RobotoFont>
          <RobotoFont className="text-sm text-gray-600 mb-6">
            We'll customize your reward experience based on your preferences
          </RobotoFont>
          
          <div className="grid grid-cols-3 gap-4">
            {rewardPreferences.map((preference) => (
              <div
                key={preference.id}
                onClick={() => handleRewardPreferenceToggle(preference.id)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all text-center ${
                  selectedRewardPreferences.includes(preference.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-2">{preference.icon}</div>
                <RobotoFont as="h4" weight={600} className="text-sm text-gray-900 mb-1">
                  {preference.title}
                </RobotoFont>
                <RobotoFont className="text-xs text-gray-600">
                  {preference.description}
                </RobotoFont>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Information */}
        <div className="border-t border-gray-200 py-6">
          <RobotoFont as="h3" weight={600} className="text-base text-gray-900 mb-2">
            Financial Information
          </RobotoFont>
          <RobotoFont className="text-sm text-gray-600 mb-6">
            This is optional, but will help us offer you personalized financial advice
          </RobotoFont>
          
          <div className="max-w-md">
            <label className="block text-sm text-gray-600 mb-2">
              <RobotoFont weight={500}>Credit Score</RobotoFont>
            </label>
            <div className="relative">
              <input
                type="text"
                value={creditScore}
                onChange={(e) => setCreditScore(e.target.value)}
                className="w-full px-3 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your credit score"
              />
              <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Developer Settings - Mock Data Toggle */}
        <div className="border-t border-gray-200 py-6">
          <RobotoFont as="h3" weight={600} className="text-base text-gray-900 mb-2">
            Developer Settings
          </RobotoFont>
          <RobotoFont className="text-sm text-gray-600 mb-6">
            Temporarily use mock data for testing and development
          </RobotoFont>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <RobotoFont weight={600} className="text-sm text-gray-900">
                    Use Mock Data
                  </RobotoFont>
                  <span className="px-2 py-0.5 bg-amber-200 text-amber-800 text-xs font-semibold rounded">
                    DEV
                  </span>
                </div>
                <RobotoFont className="text-xs text-gray-600">
                  Toggle between mock data and database. This is temporary and useful for testing without affecting real data.
                </RobotoFont>
              </div>
              <button
                onClick={toggleMockDataEnabled}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ml-4 flex-shrink-0 ${
                  useMockData ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    useMockData ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            {useMockData && (
              <div className="mt-3 pt-3 border-t border-amber-200">
                <div className="flex items-center gap-2 text-amber-800">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <RobotoFont className="text-xs font-medium">
                    Mock data is currently enabled. Data shown may not reflect actual database values.
                  </RobotoFont>
                </div>
              </div>
            )}
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

export default ProfileView;