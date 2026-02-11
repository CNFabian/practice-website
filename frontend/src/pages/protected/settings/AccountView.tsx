import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { OnestFont } from '../../../assets';
import { ProfilePictureModal } from '../../../components';
import { updateUserProfile } from '../../../services/authAPI';
import { requestPasswordReset } from '../../../services/authAPI';
import { updateUserProfile as updateUserProfileAction } from '../../../store/slices/authSlice';
import type { RootState } from '../../../store/store';

const AccountView: React.FC = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetPasswordMessage, setResetPasswordMessage] = useState<string | null>(null);
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(null);

  const handleSaveSettings = () => {
    console.log('Settings saved!');
  };

  const handleUploadPicture = () => {
    setIsProfileModalOpen(true);
  };

  const handleAvatarSelect = async (avatarId: string) => {
    try {
      // Store the avatar ID as the profile picture URL (e.g., "avatar:curious-cat")
      const avatarUrl = `avatar:${avatarId}`;
      await updateUserProfile({ photoURL: avatarUrl });
      dispatch(updateUserProfileAction({ photoURL: avatarUrl }));
      console.log('Avatar selected and saved:', avatarId);
    } catch (error) {
      console.error('Failed to save avatar selection:', error);
    }
  };

  const handleDeletePicture = async () => {
    try {
      await updateUserProfile({ photoURL: '' });
      dispatch(updateUserProfileAction({ photoURL: '' }));
      console.log('Profile picture deleted');
    } catch (error) {
      console.error('Failed to delete profile picture:', error);
    }
  };

  const handleProfileUpload = async (file: File) => {
    setIsUploadingPicture(true);
    try {
      // Convert file to base64 data URL
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      // Send to backend via profile update
      await updateUserProfile({ photoURL: base64 });
      dispatch(updateUserProfileAction({ photoURL: base64 }));
      console.log('Profile picture uploaded successfully');
    } catch (error) {
      console.error('Failed to upload profile picture:', error);
    } finally {
      setIsUploadingPicture(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user?.email) {
      setResetPasswordError('No email address found on your account.');
      return;
    }

    setIsResettingPassword(true);
    setResetPasswordMessage(null);
    setResetPasswordError(null);

    try {
      await requestPasswordReset(user.email);
      setResetPasswordMessage('A password reset link has been sent to your email.');
    } catch (error) {
      console.error('Password reset request failed:', error);
      setResetPasswordError('Failed to send password reset email. Please try again.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Form Container */}
      <div>
        {/* Profile Picture */}
        <div className="pb-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-light-background-blue flex items-center justify-center opacity-100 overflow-hidden">
              {user?.photoURL && user.photoURL.startsWith('avatar:') ? (
                <span className="text-4xl">
                  {(() => {
                    const avatarMap: Record<string, string> = {
                      'curious-cat': '🐱',
                      'celebrating-bird': '🐦',
                      'careful-elephant': '🐘',
                      'protective-dog': '🐶',
                    };
                    const avatarId = user.photoURL.replace('avatar:', '');
                    return avatarMap[avatarId] || '👤';
                  })()}
                </span>
              ) : user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg
                  className="w-10 h-10 text-unavailable-button"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <OnestFont
                as="h3"
                weight={700}
                lineHeight="relaxed"
                className="text-base text-text-blue-black mb-1"
              >
                Profile Picture/Select Avatar
              </OnestFont>
              <OnestFont
                weight={300}
                lineHeight="relaxed"
                className="text-sm text-text-grey"
              >
                PNG, JPEG under 15 MB
              </OnestFont>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleUploadPicture}
                disabled={isUploadingPicture}
                className="px-4 py-2 bg-elegant-blue rounded-lg text-sm font-medium text-white shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <OnestFont weight={500} lineHeight="relaxed">
                  {isUploadingPicture ? 'Uploading...' : 'Upload New Picture'}
                </OnestFont>
              </button>
              <button
                onClick={handleDeletePicture}
                className="px-4 py-2 rounded-lg text-sm font-medium text-text-grey bg-light-background-blue hover:bg-light-background-blue/80 transition-colors"
              >
                <OnestFont weight={500} lineHeight="relaxed">
                  Delete
                </OnestFont>
              </button>
            </div>
          </div>
        </div>

        {/* Full Name */}
        <div className="border-t border-light-background-blue py-6">
          <OnestFont
            as="h3"
            weight={700}
            lineHeight="relaxed"
            className="text-base text-text-blue-black mb-4"
          >
            Full Name
          </OnestFont>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-grey mb-2">
                <OnestFont weight={500} lineHeight="relaxed">
                  First Name
                </OnestFont>
              </label>
              <div className="relative">
                <input
                  type="text"
                  defaultValue={user?.firstName || 'John'}
                  className="w-full px-3 py-3 border border-light-background-blue rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-logo-blue focus:border-transparent"
                />
                <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-unavailable-button hover:text-text-grey">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-text-grey mb-2">
                <OnestFont weight={500} lineHeight="relaxed">
                  Last Name
                </OnestFont>
              </label>
              <div className="relative">
                <input
                  type="text"
                  defaultValue={user?.lastName || 'Doe'}
                  className="w-full px-3 py-3 border border-light-background-blue rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-logo-blue focus:border-transparent"
                />
                <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-unavailable-button hover:text-text-grey">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Password - replaced with Reset Password */}
        <div className="border-t border-light-background-blue py-6">
          <OnestFont
            as="h3"
            weight={700}
            lineHeight="relaxed"
            className="text-base text-text-blue-black mb-2"
          >
            Password
          </OnestFont>
          <OnestFont
            as="p"
            weight={300}
            lineHeight="relaxed"
            className="text-sm text-text-grey mb-4"
          >
            To change your password, we'll send a reset link to your email address ({user?.email || 'your email'}).
          </OnestFont>

          {resetPasswordMessage && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-status-green/10 text-status-green text-sm">
              <OnestFont weight={500} lineHeight="relaxed">
                {resetPasswordMessage}
              </OnestFont>
            </div>
          )}

          {resetPasswordError && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-status-red/10 text-status-red text-sm">
              <OnestFont weight={500} lineHeight="relaxed">
                {resetPasswordError}
              </OnestFont>
            </div>
          )}

          <button
            onClick={handleResetPassword}
            disabled={isResettingPassword}
            className="px-4 py-2 bg-elegant-blue rounded-lg text-sm font-medium text-white shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <OnestFont weight={500} lineHeight="relaxed">
              {isResettingPassword ? 'Sending...' : 'Reset Password'}
            </OnestFont>
          </button>
        </div>

        {/* Phone Number */}
        <div className="border-t border-light-background-blue py-6">
          <OnestFont
            as="h3"
            weight={700}
            lineHeight="relaxed"
            className="text-base text-text-blue-black mb-4"
          >
            Phone Number
          </OnestFont>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-grey mb-2">
                <OnestFont weight={500} lineHeight="relaxed">
                  Current Phone Number
                </OnestFont>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  defaultValue={user?.phone || '123 456 7890'}
                  className="w-full px-3 py-3 border border-light-background-blue rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-logo-blue focus:border-transparent"
                />
                <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-unavailable-button hover:text-text-grey">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-text-grey mb-2">
                <OnestFont weight={500} lineHeight="relaxed">
                  New Phone Number
                </OnestFont>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  defaultValue="987 654 3210"
                  className="w-full px-3 py-3 border border-light-background-blue rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-logo-blue focus:border-transparent"
                />
                <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-unavailable-button hover:text-text-grey">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Email */}
        <div className="border-t border-light-background-blue py-6">
          <OnestFont
            as="h3"
            weight={700}
            lineHeight="relaxed"
            className="text-base text-text-blue-black mb-4"
          >
            Email
          </OnestFont>
          <div>
            <label className="block text-sm text-text-grey mb-2">
              <OnestFont weight={500} lineHeight="relaxed">
                Current Email
              </OnestFont>
            </label>
            <div className="max-w-md">
              <input
                type="email"
                defaultValue={user?.email || 'jdoe123@gmail.com'}
                className="w-full px-3 py-3 border border-light-background-blue rounded-lg text-sm bg-light-background-blue cursor-not-allowed"
                readOnly
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between pt-4 border-t border-light-background-blue">
        <div>
          <OnestFont
            weight={300}
            lineHeight="relaxed"
            className="text-sm text-text-grey"
          >
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

      {/* Profile Picture Modal */}
      <ProfilePictureModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onUpload={handleProfileUpload}
        onAvatarSelect={handleAvatarSelect}
      />
    </div>
  );
};

export default AccountView;