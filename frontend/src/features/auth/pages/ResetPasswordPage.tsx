import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { OnestFont, LoginImage, Eye, Blind } from '../../../assets';
import { useConfirmPasswordReset } from '../hooks/useAuthMutations';

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  const {
    mutate: confirmReset,
    isPending,
    isSuccess,
    error: resetError,
  } = useConfirmPasswordReset();

  // Auto-close tab after successful reset
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        window.close();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!token) {
      setValidationError('Invalid reset link. Please request a new password reset.');
      return;
    }

    if (newPassword.length < 8) {
      setValidationError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    confirmReset({ token, newPassword });
  };

  // No token in URL
  if (!token) {
    return (
      <div className="min-h-screen flex">
        <div className="flex-1 flex items-center justify-center px-6 lg:px-8">
          <div className="w-full max-w-md space-y-8 text-center">
            <div>
              <OnestFont
                as="h1"
                weight={700}
                lineHeight="tight"
                className="text-3xl text-text-blue-black mb-4"
              >
                Invalid Reset Link
              </OnestFont>
              <OnestFont
                weight={300}
                lineHeight="relaxed"
                className="text-text-grey text-lg mb-6"
              >
                This password reset link is invalid or has expired. Please request a new one.
              </OnestFont>
            </div>
            <button
              onClick={() => window.close()}
              className="mx-auto w-56 bg-logo-blue text-pure-white py-3 px-6 rounded-full hover:opacity-90 transition-opacity flex items-center justify-center"
            >
              <OnestFont weight={700} lineHeight="relaxed" className="text-lg">
                Close Window
              </OnestFont>
            </button>
          </div>
        </div>

        {/* Right Side - Image */}
        <div className="hidden lg:flex flex-1 items-center justify-center m-10">
          <div className="max-w-2xl max-h-[80vh] flex items-center justify-center">
            <img
              src={LoginImage}
              alt="Home ownership journey"
              className="max-w-full max-h-full object-cover rounded-2xl"
            />
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen flex">
        <div className="flex-1 flex items-center justify-center px-6 lg:px-8">
          <div className="w-full max-w-md space-y-8 text-center">
            <div>
              <div className="w-16 h-16 bg-status-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-status-green"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <OnestFont
                as="h1"
                weight={700}
                lineHeight="tight"
                className="text-3xl text-text-blue-black mb-4"
              >
                Password Reset!
              </OnestFont>
              <OnestFont
                weight={300}
                lineHeight="relaxed"
                className="text-text-grey text-lg mb-2"
              >
                Your password has been successfully updated. This window will close shortly.
              </OnestFont>
            </div>
            <button
              onClick={() => window.close()}
              className="mx-auto w-56 bg-logo-blue text-pure-white py-3 px-6 rounded-full hover:opacity-90 transition-opacity flex items-center justify-center"
            >
              <OnestFont weight={700} lineHeight="relaxed" className="text-lg">
                Close Window
              </OnestFont>
            </button>
          </div>
        </div>

        {/* Right Side - Image */}
        <div className="hidden lg:flex flex-1 items-center justify-center m-10">
          <div className="max-w-2xl max-h-[80vh] flex items-center justify-center">
            <img
              src={LoginImage}
              alt="Home ownership journey"
              className="max-w-full max-h-full object-cover rounded-2xl"
            />
          </div>
        </div>
      </div>
    );
  }

  // Form state
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-6 lg:px-8 my-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <OnestFont
              as="h1"
              weight={700}
              lineHeight="tight"
              className="text-4xl text-text-blue-black mb-4"
            >
              Reset Password
            </OnestFont>
            <OnestFont
              weight={300}
              lineHeight="relaxed"
              className="text-text-grey text-lg"
            >
              Enter your new password below
            </OnestFont>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Validation Error */}
            {validationError && (
              <div className="bg-status-red/10 border border-status-red rounded-lg p-3">
                <OnestFont
                  weight={500}
                  lineHeight="relaxed"
                  className="text-status-red text-sm"
                >
                  {validationError}
                </OnestFont>
              </div>
            )}

            {/* API Error */}
            {resetError && (
              <div className="bg-status-red/10 border border-status-red rounded-lg p-3">
                <OnestFont
                  weight={500}
                  lineHeight="relaxed"
                  className="text-status-red text-sm"
                >
                  {resetError.message.includes('400')
                    ? 'This reset link has expired. Please request a new one.'
                    : 'Something went wrong. Please try again.'}
                </OnestFont>
              </div>
            )}

            {/* New Password */}
            <div>
              <label className="block mb-2">
                <OnestFont
                  weight={500}
                  lineHeight="relaxed"
                  className="text-sm text-text-grey"
                >
                  New Password
                </OnestFont>
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onPaste={(e) => e.preventDefault()}
                  required
                  className="w-full px-4 py-3 pr-12 border-0 rounded-lg bg-light-background-blue text-text-blue-black placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-logo-blue focus:bg-pure-white"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-unavailable-button hover:text-text-grey focus:outline-none"
                >
                  <img
                    src={showNewPassword ? Eye : Blind}
                    alt={showNewPassword ? 'Hide password' : 'Show password'}
                    className="w-5 h-5"
                  />
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block mb-2">
                <OnestFont
                  weight={500}
                  lineHeight="relaxed"
                  className="text-sm text-text-grey"
                >
                  Confirm New Password
                </OnestFont>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onPaste={(e) => e.preventDefault()}
                  required
                  className="w-full px-4 py-3 pr-12 border-0 rounded-lg bg-light-background-blue text-text-blue-black placeholder-text-grey focus:outline-none focus:ring-2 focus:ring-logo-blue focus:bg-pure-white"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-unavailable-button hover:text-text-grey focus:outline-none"
                >
                  <img
                    src={showConfirmPassword ? Eye : Blind}
                    alt={showConfirmPassword ? 'Hide password' : 'Show password'}
                    className="w-5 h-5"
                  />
                </button>
              </div>
            </div>

            {/* Password Requirements Hint */}
            <OnestFont
              weight={300}
              lineHeight="relaxed"
              className="text-xs text-text-grey"
            >
              Password must be at least 8 characters long.
            </OnestFont>

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending}
              className="mx-auto w-56 bg-logo-blue text-pure-white py-3 px-6 rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center"
            >
              {isPending ? (
                <div className="w-5 h-5 border-2 border-pure-white border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : null}
              <OnestFont weight={700} lineHeight="relaxed" className="text-lg">
                {isPending ? 'Resetting...' : 'Reset Password'}
              </OnestFont>
            </button>
          </form>

          <div className="text-center">
            <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey">
              You can close this window after resetting your password.
            </OnestFont>
          </div>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:flex flex-1 items-center justify-center m-10">
        <div className="max-w-2xl max-h-[80vh] flex items-center justify-center">
          <img
            src={LoginImage}
            alt="Home ownership journey"
            className="max-w-full max-h-full object-cover rounded-2xl"
          />
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;