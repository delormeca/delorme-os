/**
 * Custom hook to reset password using token from the AuthService.
 *
 * This hook utilizes the `useMutation` hook from `@tanstack/react-query` to handle
 * the mutation for resetting a user's password with a valid reset token.
 *
 * @returns {UseMutationResult} The result of the mutation, including status and mutation functions.
 *
 * @example
 * const { mutateAsync: resetPassword, isPending } = useResetPassword();
 * await resetPassword({ token: "abc123", password: "newPassword123" });
 */
import { AuthService } from "@/client";
import { useMutation } from "@tanstack/react-query";

export const useResetPassword = () => {
  return useMutation({
    mutationFn: AuthService.resetPasswordApiAuthResetPasswordPost,
  });
}; 