import React, { useState } from 'react';
import { OnestFont } from '../../../assets';
import { ProfilePictureModal } from '../../../components';

const AccountView: React.FC = () => {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleSaveSettings = () => {
    console.log('Settings saved!');
  };

  const handleUploadPicture = () => {
    setIsProfileModalOpen(true);
  };

  const handleDeletePicture = () => {
    console.log('Delete picture clicked');
  };

  const handleProfileUpload = (file: File) => {
    console.log('Profile picture uploaded:', file);
    // Handle the file upload logic here
  };

  return (
    <div className="space-y-6">
      {/* Form Container */}
      <div>
        {/* Profile Picture */}
        <div className="pb-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center opacity-100">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <OnestFont as="h3" weight={700} lineHeight="relaxed" className="text-base text-gray-900 mb-1">
                Profile Picture/Select Avatar
              </OnestFont>
              <OnestFont weight={300} lineHeight="relaxed" className="text-sm text-gray-600">
                PNG, JPEG under 15 MB
              </OnestFont>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleUploadPicture}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white shadow-sm hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#6B73FF' }}
              >
                <OnestFont weight={500} lineHeight="relaxed">
                  Upload New Picture
                </OnestFont>
              </button>
              <button
                onClick={handleDeletePicture}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <OnestFont weight={500} lineHeight="relaxed">
                  Delete
                </OnestFont>
              </button>
            </div>
          </div>
        </div>

        {/* Full Name */}
        <div className="border-t border-gray-200 py-6">
          <OnestFont as="h3" weight={700} lineHeight="relaxed" className="text-base text-gray-900 mb-4">
            Full Name
          </OnestFont>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">
                <OnestFont weight={500} lineHeight="relaxed">First Name</OnestFont>
              </label>
              <div className="relative">
                <input
                  type="text"
                  defaultValue="John"
                  className="w-full px-3 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">
                <OnestFont weight={500} lineHeight="relaxed">Last Name</OnestFont>
              </label>
              <div className="relative">
                <input
                  type="text"
                  defaultValue="Doe"
                  className="w-full px-3 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Password */}
        <div className="border-t border-gray-200 py-6">
          <OnestFont as="h3" weight={700} lineHeight="relaxed" className="text-base text-gray-900 mb-4">
            Password
          </OnestFont>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">
                <OnestFont weight={500} lineHeight="relaxed">Current Password</OnestFont>
              </label>
              <div className="relative">
                <input
                  type="password"
                  defaultValue="••••••••••••"
                  className="w-full px-3 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">
                <OnestFont weight={500} lineHeight="relaxed">New Password</OnestFont>
              </label>
              <div className="relative">
                <input
                  type="password"
                  defaultValue="••••••••••••"
                  className="w-full px-3 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Phone Number */}
        <div className="border-t border-gray-200 py-6">
          <OnestFont as="h3" weight={700} lineHeight="relaxed" className="text-base text-gray-900 mb-4">
            Phone Number
          </OnestFont>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">
                <OnestFont weight={500} lineHeight="relaxed">Current Phone Number</OnestFont>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  defaultValue="123 456 7890"
                  className="w-full px-3 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">
                <OnestFont weight={500} lineHeight="relaxed">New Phone Number</OnestFont>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  defaultValue="987 654 3210"
                  className="w-full px-3 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Email */}
        <div className="border-t border-gray-200 py-6">
          <OnestFont as="h3" weight={700} lineHeight="relaxed" className="text-base text-gray-900 mb-4">
            Email
          </OnestFont>
          <div>
            <label className="block text-sm text-gray-600 mb-2">
              <OnestFont weight={500} lineHeight="relaxed">Current Email</OnestFont>
            </label>
            <div className="max-w-md">
              <input
                type="email"
                defaultValue="jdoe123@gmail.com"
                className="w-full px-3 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 cursor-not-allowed"
                readOnly
              />
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

      {/* Profile Picture Modal */}
      <ProfilePictureModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onUpload={handleProfileUpload}
      />
    </div>
  );
};

export default AccountView;