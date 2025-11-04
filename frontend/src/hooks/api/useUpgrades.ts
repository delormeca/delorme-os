/**
 * Upgrade Hooks
 * 
 * Provides React hooks for plan upgrades with proration handling.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UpgradesService } from '@/client';
import { useErrorHandler } from '@/hooks/useErrorHandler';

/**
 * Get available upgrade options for the current user
 */
export const useUpgradeOptions = () => {
  const { handleApiError } = useErrorHandler();
  
  return useQuery({
    queryKey: ['upgradeOptions'],
    queryFn: async () => {
      try {
        return await UpgradesService.getUpgradeOptionsApiUpgradesOptionsGet();
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Get proration preview for a specific upgrade
 */
export const useProrationPreview = (targetPlan: string) => {
  const { handleApiError } = useErrorHandler();
  
  return useQuery({
    queryKey: ['prorationPreview', targetPlan],
    queryFn: async () => {
      try {
        return await UpgradesService.getProrationPreviewApiUpgradesProrationPreviewPost({ target_plan: targetPlan });
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
    enabled: !!targetPlan,
    staleTime: 2 * 60 * 1000, // 2 minutes (proration changes frequently)
  });
};

/**
 * Create upgrade checkout session
 */
export const useCreateUpgradeCheckout = () => {
  const queryClient = useQueryClient();
  const { handleApiError } = useErrorHandler();
  
  return useMutation({
    mutationFn: async ({ targetPlan }: { targetPlan: string }) => {
      try {
        return await UpgradesService.createUpgradeCheckoutApiUpgradesCheckoutPost({ target_plan: targetPlan });
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
      }
      
      // Invalidate upgrade-related queries
      queryClient.invalidateQueries({ queryKey: ['upgradeOptions'] });
      queryClient.invalidateQueries({ queryKey: ['userPlan'] });
    },
  });
};
