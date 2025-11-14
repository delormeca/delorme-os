/**
 * Stub hook for useCreateArticle - Articles feature has been removed
 * Returns stub mutation to prevent build errors
 */
import { useMutation } from "@tanstack/react-query";

export const useCreateArticle = () => {
  return useMutation({
    mutationFn: async () => {
      throw new Error("Articles feature is no longer available");
    },
  });
};
