/**
 * Stub hook for useAnalytics - Analytics feature has been removed from backend
 * Returns empty data to prevent build errors
 */
import { useQuery } from "@tanstack/react-query";

export const useAnalytics = () => {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: async () => ({
      total_views: 0,
      total_clicks: 0,
      conversion_rate: 0,
      data: [],
    }),
    enabled: false,
  });
};

export const useAnalyticsOverview = () => {
  return useQuery({
    queryKey: ['analytics-overview'],
    queryFn: async () => null,
    enabled: false,
  });
};
