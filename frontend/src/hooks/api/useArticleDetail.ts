/**
 * Stub hook for useArticleDetail - Articles feature has been removed
 * Returns empty data to prevent build errors
 */
import { useQuery } from "@tanstack/react-query";

export const useArticleDetail = (id: string) => {
  return useQuery({
    queryKey: ['article', id],
    queryFn: async () => null,
    enabled: false,
  });
};
