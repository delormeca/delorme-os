/**
 * Stub hook for usePages - Pages feature has been replaced with ClientPages
 * Returns empty data to prevent build errors
 */
import { useQuery } from "@tanstack/react-query";

export const usePages = () => {
  return useQuery({
    queryKey: ['pages'],
    queryFn: async () => [],
    enabled: false,
  });
};
