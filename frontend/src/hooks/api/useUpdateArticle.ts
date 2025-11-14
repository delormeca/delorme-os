/**
 * Stub hook for useUpdateArticle - Articles feature has been removed
 * Returns stub mutation to prevent build errors
 */
import { useMutation } from "@tanstack/react-query";

export const useUpdateArticle = () => {
  return useMutation({
    mutationFn: async () => {
      throw new Error("Articles feature is no longer available");
    },
  });
};
