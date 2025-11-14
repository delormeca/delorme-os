/**
 * Stub hook for useArticles - Articles feature has been removed
 * Returns empty data to prevent build errors
 */
import { useQuery } from "@tanstack/react-query";

export const useArticles = () => {
  return useQuery({
    queryKey: ['articles'],
    queryFn: async () => [],
    enabled: false, // Never actually run this query
  });
};
