import { useMutation } from '@tanstack/react-query';
import {
  confirmPasswordReset,
  verifyEmail,
  resendVerificationEmail,
} from '../../services/authAPI';

// ==================== CONFIRM PASSWORD RESET ====================

interface ConfirmPasswordResetParams {
  token: string;
  newPassword: string;
}

/**
 * Mutation hook for confirming a password reset.
 * Called from the password reset confirmation page after user clicks
 * the reset link in their email and enters a new password.
 *
 * Usage:
 * ```tsx
 * const { mutate: confirmReset, isPending, isSuccess, error } = useConfirmPasswordReset();
 * confirmReset({ token: urlToken, newPassword: formPassword });
 * ```
 */
export const useConfirmPasswordReset = () => {
  return useMutation<void, Error, ConfirmPasswordResetParams>({
    mutationFn: ({ token, newPassword }) =>
      confirmPasswordReset(token, newPassword),
  });
};

// ==================== VERIFY EMAIL ====================

/**
 * Mutation hook for verifying a user's email address.
 * Called when user clicks the verification link in their email.
 * Token is extracted from the URL query parameter.
 *
 * Usage:
 * ```tsx
 * const { mutate: verify, isPending, isSuccess, error } = useVerifyEmail();
 * verify(tokenFromUrl);
 * ```
 */
export const useVerifyEmail = () => {
  return useMutation<void, Error, string>({
    mutationFn: (token: string) => verifyEmail(token),
  });
};

// ==================== RESEND VERIFICATION EMAIL ====================

/**
 * Mutation hook for resending the verification email.
 * Called from a "Resend verification" button when user is logged in
 * but hasn't verified their email yet.
 *
 * Usage:
 * ```tsx
 * const { mutate: resend, isPending, isSuccess, error } = useResendVerificationEmail();
 * resend();
 * ```
 */
export const useResendVerificationEmail = () => {
  return useMutation<void, Error, void>({
    mutationFn: () => resendVerificationEmail(),
  });
};
