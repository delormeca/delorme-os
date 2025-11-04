/**
 * Analytics Hooks
 * 
 * Provides React hooks for analytics data with plan-based access control.
 */

import { useQuery } from '@tanstack/react-query';
import { AnalyticsService } from '@/client';
import { useErrorHandler } from '@/hooks/useErrorHandler';

/**
 * Get basic analytics (Starter+ plan required)
 */
export const useBasicAnalytics = (enabled: boolean = true) => {
  const { handleApiError } = useErrorHandler();
  
  return useQuery({
    queryKey: ['analytics', 'basic'],
    queryFn: async () => {
      try {
        return await AnalyticsService.getBasicAnalyticsApiAnalyticsBasicGet();
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry if it's a permission error
      if (error?.status === 403) return false;
      return failureCount < 2;
    },
  });
};

/**
 * Get advanced analytics (Pro+ plan required)
 */
export const useAdvancedAnalytics = (enabled: boolean = true) => {
  const { handleApiError } = useErrorHandler();
  
  return useQuery({
    queryKey: ['analytics', 'advanced'],
    queryFn: async () => {
      try {
        return await AnalyticsService.getAdvancedAnalyticsApiAnalyticsAdvancedGet();
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      if (error?.status === 403) return false;
      return failureCount < 2;
    },
  });
};

/**
 * Get premium reporting (Premium subscription required)
 */
export const usePremiumReporting = (enabled: boolean = true) => {
  const { handleApiError } = useErrorHandler();
  
  return useQuery({
    queryKey: ['analytics', 'reporting'],
    queryFn: async () => {
      try {
        return await AnalyticsService.getPremiumReportingApiAnalyticsReportingGet();
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: any) => {
      if (error?.status === 403) return false;
      return failureCount < 2;
    },
  });
};

/**
 * Get team analytics (Enterprise subscription required)
 */
export const useTeamAnalytics = (enabled: boolean = true) => {
  const { handleApiError } = useErrorHandler();
  
  return useQuery({
    queryKey: ['analytics', 'team'],
    queryFn: async () => {
      try {
        return await AnalyticsService.getTeamAnalyticsApiAnalyticsTeamGet();
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: any) => {
      if (error?.status === 403) return false;
      return failureCount < 2;
    },
  });
};
