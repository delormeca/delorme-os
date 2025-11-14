/**
 * Stub hook for useDeleteArticle - Articles feature has been removed
 * Returns stub mutation to prevent build errors
 */
import { useMutation } from "@tanstack/react-query";

export const useDeleteArticle = () => {
  return useMutation({
    mutationFn: async () => {
      throw new Error("Articles feature is no longer available");
    },
  });
};
