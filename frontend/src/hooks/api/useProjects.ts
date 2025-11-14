/**
 * Stub hook for useProjects - Projects feature has been replaced with Clients
 * Returns empty data to prevent build errors
 */
import { useQuery } from "@tanstack/react-query";

export const useProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => [],
    enabled: false, // Never actually run this query
  });
};
