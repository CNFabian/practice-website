import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { OnestFont } from '../../../assets';
import { ProfilePictureModal } from '../../../components';
import { updateUserProfile } from '../../../services/authAPI';
import { requestPasswordReset } from '../../../services/authAPI';
import { wipeUserData } from '../../../services/authAPI';
import { updateUserProfile as updateUserProfileAction, logout } from '../../../store/slices/authSlice';
import { clearAuthData } from '../../../services/authAPI';
import { useWalkthrough } from '../../../contexts/WalkthroughContext';
import GameManager from '../modules/phaser/managers/GameManager';
import type { RootState } from '../../../store/store';

const AccountView: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const { startWalkthrough, isWalkthroughActive, hasCompletedWalkthrough } = useWalkthrough();

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetPasswordMessage, setResetPasswordMessage] = useState<string | null>(null);
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(null);
  const [showNewPhone, setShowNewPhone] = useState(false);

  // Wipe data state
  const [isWiping, setIsWiping] = useState(false);
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [wipeMessage, setWipeMessage] = useState<string | null>(null);
  const [wipeError, setWipeError] = useState<string | null>(null);

  const handleSaveSettings = () => {
    console.log('Settings saved!');
  };

  const handleUploadPicture = () => {
    setIsProfileModalOpen(true);
  };

  const handleAvatarSelect = async (avatarId: string) => {
    try {
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
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

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

  const handleWipeData = async () => {
    setIsWiping(true);
    setWipeMessage(null);
    setWipeError(null);

    try {
      await wipeUserData();
      setWipeMessage('All data wiped successfully. Logging you out...');
      setShowWipeConfirm(false);

      // Log the user out after a brief delay so they can see the success message
      setTimeout(() => {
        clearAuthData();
        localStorage.removeItem('nestnav_walkthrough_completed');
        localStorage.removeItem('moduleNavState');
        dispatch(logout());
        navigate('/auth/login');
      }, 2000);
    } catch (error) {
      console.error('Wipe data failed:', error);
      setWipeError('Failed to wipe data. Please try again.');
      setIsWiping(false);
    }
  };

  const handleStartWalkthrough = () => {
    // Navigate to modules page first, then wait for Phaser assets before starting walkthrough
    navigate('/app');
    
    // Poll for Phaser game assets to be loaded before starting walkthrough
    // This prevents the race condition where walkthrough fires before textures are ready
    let attempts = 0;
    const maxAttempts = 40; // 40 * 150ms = 6s max wait
    const pollInterval = setInterval(() => {
      attempts++;
      const game = GameManager.getGame();
      if (game?.registry.get('assetsLoaded')) {
        clearInterval(pollInterval);
        startWalkthrough();
        return;
      }
      if (attempts >= maxAttempts) {
        clearInterval(pollInterval);
        // Fallback: start anyway after timeout
        startWalkthrough();
      }
    }, 150);
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
          <div>
            <label className="block text-sm text-text-grey mb-2">
              <OnestFont weight={500} lineHeight="relaxed">
                Current Phone Number
              </OnestFont>
            </label>
            <div className="relative max-w-md">
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

          {/* Change Phone Number button / New Phone Number field */}
          {!showNewPhone ? (
            <button
              onClick={() => setShowNewPhone(true)}
              className="mt-4 px-4 py-2 bg-elegant-blue rounded-lg text-sm font-medium text-white shadow-sm hover:opacity-90 transition-opacity"
            >
              <OnestFont weight={500} lineHeight="relaxed">
                Change Phone Number
              </OnestFont>
            </button>
          ) : (
            <div className="mt-4">
              <label className="block text-sm text-text-grey mb-2">
                <OnestFont weight={500} lineHeight="relaxed">
                  New Phone Number
                </OnestFont>
              </label>
              <div className="relative max-w-md">
                <input
                  type="tel"
                  placeholder="Enter new phone number"
                  className="w-full px-3 py-3 border border-light-background-blue rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-logo-blue focus:border-transparent"
                />
                <button
                  onClick={() => setShowNewPhone(false)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-unavailable-button hover:text-text-grey"
                >
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
          )}
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

        {/* ============================================================ */}
        {/* Module Tour */}
        {/* ============================================================ */}
        <div className="border-t border-light-background-blue py-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-logo-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="flex-1">
              <OnestFont
                as="h3"
                weight={700}
                lineHeight="relaxed"
                className="text-base text-text-blue-black mb-1"
              >
                Module Tour
              </OnestFont>
              <OnestFont
                as="p"
                weight={300}
                lineHeight="relaxed"
                className="text-sm text-text-grey mb-4"
              >
                {hasCompletedWalkthrough
                  ? 'Retake the guided tour to revisit how the platform works, including neighborhoods, houses, lessons, and minigames.'
                  : 'Take a guided tour of the platform to learn how neighborhoods, houses, lessons, and minigames work.'
                }
              </OnestFont>
              <button
                onClick={handleStartWalkthrough}
                disabled={isWalkthroughActive}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-opacity ${
                  isWalkthroughActive
                    ? 'bg-unavailable-button text-text-grey cursor-not-allowed'
                    : 'bg-logo-blue text-pure-white hover:opacity-90'
                }`}
              >
                <OnestFont weight={500} lineHeight="relaxed">
                  {isWalkthroughActive ? 'Tour in Progress...' : hasCompletedWalkthrough ? 'Restart Tour' : 'Start Tour'}
                </OnestFont>
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* TEMPORARY: Wipe User Data — Beta Testing Only */}
        {/* Remove this entire section before production launch */}
        {/* ============================================================ */}
        <div className="border-t border-light-background-blue py-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-status-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="flex-1">
              <OnestFont
                as="h3"
                weight={700}
                lineHeight="relaxed"
                className="text-base text-status-red mb-1"
              >
                Wipe All Data (Beta Testing)
              </OnestFont>
              <OnestFont
                as="p"
                weight={300}
                lineHeight="relaxed"
                className="text-sm text-text-grey mb-4"
              >
                This will permanently delete all your learning progress, coins, badges, quiz history, analytics, notifications, and onboarding data. Your account (email, password, profile info) will be preserved. You will be logged out after the wipe completes.
              </OnestFont>

              {wipeMessage && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-status-green/10 text-status-green text-sm">
                  <OnestFont weight={500} lineHeight="relaxed">
                    {wipeMessage}
                  </OnestFont>
                </div>
              )}

              {wipeError && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-status-red/10 text-status-red text-sm">
                  <OnestFont weight={500} lineHeight="relaxed">
                    {wipeError}
                  </OnestFont>
                </div>
              )}

              {!showWipeConfirm ? (
                <button
                  onClick={() => setShowWipeConfirm(true)}
                  disabled={isWiping}
                  className="px-4 py-2 bg-status-red text-pure-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <OnestFont weight={500} lineHeight="relaxed">
                    Wipe All Data
                  </OnestFont>
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <OnestFont weight={500} lineHeight="relaxed" className="text-sm text-status-red">
                    Are you sure? This cannot be undone.
                  </OnestFont>
                  <button
                    onClick={handleWipeData}
                    disabled={isWiping}
                    className="px-4 py-2 bg-status-red text-pure-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <OnestFont weight={500} lineHeight="relaxed">
                      {isWiping ? 'Wiping...' : 'Yes, Wipe Everything'}
                    </OnestFont>
                  </button>
                  <button
                    onClick={() => setShowWipeConfirm(false)}
                    disabled={isWiping}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-text-grey bg-light-background-blue hover:bg-light-background-blue/80 transition-colors disabled:opacity-50"
                  >
                    <OnestFont weight={500} lineHeight="relaxed">
                      Cancel
                    </OnestFont>
                  </button>
                </div>
              )}
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