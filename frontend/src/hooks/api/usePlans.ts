/**
 * Plan Management Hooks
 * 
 * Provides React hooks for plan information, feature access checks, and upgrade recommendations.
 */

import { useQuery } from '@tanstack/react-query';
import { PlansService } from '@/client';
import { useErrorHandler } from '@/hooks/useErrorHandler';

/**
 * Get current user's plan information
 */
export const useUserPlan = () => {
  const { handleApiError } = useErrorHandler();
  
  return useQuery({
    queryKey: ['userPlan'],
    queryFn: async () => {
      try {
        return await PlansService.getMyPlanInfoApiPlansMeGet();
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Check if user has access to a specific feature
 */
export const useFeatureAccess = (feature: string) => {
  const { handleApiError } = useErrorHandler();
  
  return useQuery({
    queryKey: ['featureAccess', feature],
    queryFn: async () => {
      try {
        return await PlansService.checkFeatureAccessApiPlansCheckFeaturePost({ feature });
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
    enabled: !!feature,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Get available plan upgrades for the current user
 */
export const useAvailableUpgrades = () => {
  const { handleApiError } = useErrorHandler();
  
  return useQuery({
    queryKey: ['availableUpgrades'],
    queryFn: async () => {
      try {
        return await PlansService.getAvailableUpgradesApiPlansUpgradesGet();
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
};

/**
 * Get all available features and their descriptions
 */
export const useAllFeatures = () => {
  const { handleApiError } = useErrorHandler();
  
  return useQuery({
    queryKey: ['allFeatures'],
    queryFn: async () => {
      try {
        return await PlansService.getAllFeaturesApiPlansFeaturesGet();
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

/**
 * Get plan comparison data
 */
export const usePlanComparison = () => {
  const { handleApiError } = useErrorHandler();
  
  return useQuery({
    queryKey: ['planComparison'],
    queryFn: async () => {
      try {
        return await PlansService.getPlanComparisonApiPlansComparisonGet();
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

/**
 * Hook to check multiple features at once
 */
export const useMultipleFeatureAccess = (features: string[]) => {
  const { handleApiError } = useErrorHandler();
  
  const results = useQuery({
    queryKey: ['multipleFeatureAccess', features],
    queryFn: async () => {
      try {
        const results = await Promise.all(
          features.map(feature => 
            PlansService.checkFeatureAccessApiPlansCheckFeaturePost({ feature })
          )
        );
        
        return features.reduce((acc, feature, index) => {
          acc[feature] = results[index];
          return acc;
        }, {} as Record<string, any>);
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
    enabled: features.length > 0,
    staleTime: 10 * 60 * 1000,
  });
  
  return results;
};
