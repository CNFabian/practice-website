import React, { useState } from 'react';
import { OnestFont } from '../../../assets';

const ProfileView: React.FC = () => {
  const [timelineValue, setTimelineValue] = useState(24); // 2 years = 24 months
  const [selectedLearningPreferences, setSelectedLearningPreferences] = useState<string[]>([]);
  const [workingWithRealtor, setWorkingWithRealtor] = useState('Yes');
  const [workingWithLoanOfficer, setWorkingWithLoanOfficer] = useState('Yes');
  const [selectedRewardPreferences, setSelectedRewardPreferences] = useState<string[]>([]);
  const [creditScore, setCreditScore] = useState('810');

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
          <OnestFont as="h3" weight={700} lineHeight="relaxed" className="text-base text-text-blue-black mb-2">
            Desired Homeownership Timeline
          </OnestFont>
          <OnestFont weight={300} lineHeight="relaxed" className="text-sm text-text-grey mb-6">
            This helps us customize your learning path and set realistic goals
          </OnestFont>
          
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="bg-elegant-blue px-3 py-1 rounded-full text-sm font-medium text-white">
                <OnestFont weight={500} lineHeight="relaxed">{getTimelineText()}</OnestFont>
              </div>
            </div>
            
            <div className="relative">
              <input
                type="range"
                min="6"
                max="60"
                value={timelineValue}
                onChange={handleTimelineChange}
                className="w-full h-2 bg-light-background-blue rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-logo-blue"
                style={{
                  background: `linear-gradient(to right, #6B85F5 0%, #6B85F5 ${((timelineValue - 6) / (60 - 6)) * 100}%, #EBEFFF ${((timelineValue - 6) / (60 - 6)) * 100}%, #EBEFFF 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-unavailable-button mt-2">
                <span><OnestFont weight={300} lineHeight="relaxed">6 months</OnestFont></span>
                <span><OnestFont weight={300} lineHeight="relaxed">5 years</OnestFont></span>
              </div>
            </div>
          </div>
        </div>
        {/* Learning Preferences */}
        <div className="border-t border-light-background-blue py-6">
          <OnestFont as="h3" weight={700} lineHeight="relaxed" className="text-base text-text-blue-black mb-2">
            Learning Preferences
          </OnestFont>
          <OnestFont weight={300} lineHeight="relaxed" className="text-sm text-text-grey mb-6">
            We'll personalize your experience based on your learning preferences
          </OnestFont>
          
          <div className="grid grid-cols-5 gap-4">
            {learningPreferences.map((preference) => (
              <div
                key={preference.id}
                onClick={() => handleLearningPreferenceToggle(preference.id)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all text-center ${
                  selectedLearningPreferences.includes(preference.id)
                    ? 'border-logo-blue bg-logo-blue/10'
                    : 'border-light-background-blue hover:border-light-background-blue/50'
                }`}
              >
                <div className="text-2xl mb-2">{preference.icon}</div>
                <OnestFont as="h4" weight={700} lineHeight="relaxed" className="text-sm text-text-blue-black mb-1">
                  {preference.title}
                </OnestFont>
                <OnestFont weight={300} lineHeight="relaxed" className="text-xs text-text-grey">
                  {preference.description}
                </OnestFont>
              </div>
            ))}
          </div>
        </div>

        {/* Working with Realtor */}
        <div className="border-t border-light-background-blue py-6">
          <OnestFont as="h3" weight={700} lineHeight="relaxed" className="text-base text-text-blue-black mb-2">
            Are you currently working with a realtor?
          </OnestFont>
          <OnestFont weight={300} lineHeight="relaxed" className="text-sm text-text-grey mb-4">
            A realtor can help you navigate the home buying process
          </OnestFont>
          
          <div className="flex gap-6 mt-2">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="realtor"
                value="Yes"
                checked={workingWithRealtor === 'Yes'}
                onChange={(e) => setWorkingWithRealtor(e.target.value)}
                className="w-4 h-4 text-logo-blue bg-light-background-blue border-light-background-blue focus:ring-logo-blue"
              />
              <OnestFont weight={300} lineHeight="relaxed" className="ml-2 text-sm text-text-grey">Yes</OnestFont>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="realtor"
                value="No"
                checked={workingWithRealtor === 'No'}
                onChange={(e) => setWorkingWithRealtor(e.target.value)}
                className="w-4 h-4 text-logo-blue bg-light-background-blue border-light-background-blue focus:ring-logo-blue"
              />
              <OnestFont weight={300} lineHeight="relaxed" className="ml-2 text-sm text-text-grey">No</OnestFont>
            </label>
          </div>
        </div>

        {/* Working with Loan Officer */}
        <div className="border-t border-light-background-blue py-6">
          <OnestFont as="h3" weight={700} lineHeight="relaxed" className="text-base text-text-blue-black mb-2">
            Are you currently working with a loan officer?
          </OnestFont>
          <OnestFont weight={300} lineHeight="relaxed" className="text-sm text-text-grey">
            A realtor can help you navigate the financial processes of home ownership
          </OnestFont>
          
          <div className="flex gap-6 mt-2">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="loanOfficer"
                value="Yes"
                checked={workingWithLoanOfficer === 'Yes'}
                onChange={(e) => setWorkingWithLoanOfficer(e.target.value)}
                className="w-4 h-4 text-logo-blue bg-light-background-blue border-light-background-blue focus:ring-logo-blue"
              />
              <OnestFont weight={300} lineHeight="relaxed" className="ml-2 text-sm text-text-grey">Yes</OnestFont>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="loanOfficer"
                value="No"
                checked={workingWithLoanOfficer === 'No'}
                onChange={(e) => setWorkingWithLoanOfficer(e.target.value)}
                className="w-4 h-4 text-logo-blue bg-light-background-blue border-light-background-blue focus:ring-logo-blue"
              />
              <OnestFont weight={300} lineHeight="relaxed" className="ml-2 text-sm text-text-grey">No</OnestFont>
            </label>
          </div>
        </div>
        {/* Reward Preference */}
        <div className="border-t border-light-background-blue py-6">
          <OnestFont as="h3" weight={700} lineHeight="relaxed" className="text-base text-text-blue-black mb-2">
            Reward Preference
          </OnestFont>
          <OnestFont weight={300} lineHeight="relaxed" className="text-sm text-text-grey mb-6">
            We'll customize your reward experience based on your preferences
          </OnestFont>
          
          <div className="grid grid-cols-3 gap-4">
            {rewardPreferences.map((preference) => (
              <div
                key={preference.id}
                onClick={() => handleRewardPreferenceToggle(preference.id)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all text-center ${
                  selectedRewardPreferences.includes(preference.id)
                    ? 'border-logo-blue bg-logo-blue/10'
                    : 'border-light-background-blue hover:border-light-background-blue/50'
                }`}
              >
                <div className="text-2xl mb-2">{preference.icon}</div>
                <OnestFont as="h4" weight={700} lineHeight="relaxed" className="text-sm text-text-blue-black mb-1">
                  {preference.title}
                </OnestFont>
                <OnestFont weight={300} lineHeight="relaxed" className="text-xs text-text-grey">
                  {preference.description}
                </OnestFont>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Information */}
        <div className="border-t border-light-background-blue py-6">
          <OnestFont as="h3" weight={700} lineHeight="relaxed" className="text-base text-text-blue-black mb-2">
            Financial Information
          </OnestFont>
          <OnestFont weight={300} lineHeight="relaxed" className="text-sm text-text-grey mb-6">
            This is optional, but will help us offer you personalized financial advice
          </OnestFont>
          
          <div className="max-w-md">
            <label className="block text-sm text-text-grey mb-2">
              <OnestFont weight={500} lineHeight="relaxed">Credit Score</OnestFont>
            </label>
            <div className="relative">
              <input
                type="text"
                value={creditScore}
                onChange={(e) => setCreditScore(e.target.value)}
                className="w-full px-3 py-3 border border-light-background-blue rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-logo-blue focus:border-transparent"
                placeholder="Enter your credit score"
              />
              <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-unavailable-button hover:text-text-grey">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between pt-4 border-t border-light-background-blue">
        <div>
          <OnestFont weight={300} lineHeight="relaxed" className="text-sm text-text-grey">
            Last edited 2 minutes ago
          </OnestFont>
        </div>
        <button
          onClick={handleSaveSettings}
          className="px-6 py-3 bg-elegant-blue rounded-lg text-sm font-medium text-white shadow-sm hover:opacity-90 transition-opacity"
        >
          <OnestFont weight={700} lineHeight="relaxed">
            Save Settings
          </OnestFont>
        </button>
      </div>
    </div>
  );
};

export default ProfileView;