/**
 * Custom hook to request password reset email using the AuthService.
 *
 * This hook utilizes the `useMutation` hook from `@tanstack/react-query` to handle
 * the mutation for requesting a password reset email.
 *
 * @returns {UseMutationResult} The result of the mutation, including status and mutation functions.
 *
 * @example
 * const { mutateAsync: forgotPassword, isPending } = useForgotPassword();
 * await forgotPassword({ email: "user@example.com" });
 */
import { AuthService } from "@/client";
import { useMutation } from "@tanstack/react-query";

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: AuthService.forgotPasswordApiAuthForgotPasswordPost,
  });
}; 