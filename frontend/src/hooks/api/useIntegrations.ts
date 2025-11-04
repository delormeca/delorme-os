/**
 * Integrations Hooks
 * 
 * Provides React hooks for integration management with plan-based access control.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IntegrationsService } from '@/client';
import { useErrorHandler } from '@/hooks/useErrorHandler';

/**
 * Get available integrations based on user's plan
 */
export const useAvailableIntegrations = () => {
  const { handleApiError } = useErrorHandler();
  
  return useQuery({
    queryKey: ['integrations', 'available'],
    queryFn: async () => {
      try {
        return await IntegrationsService.getAvailableIntegrationsApiIntegrationsGet();
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
};

/**
 * Get status of configured integrations
 */
export const useIntegrationStatus = () => {
  const { handleApiError } = useErrorHandler();
  
  return useQuery({
    queryKey: ['integrations', 'status'],
    queryFn: async () => {
      try {
        return await IntegrationsService.getIntegrationStatusApiIntegrationsStatusGet();
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Get details for a specific integration
 */
export const useIntegrationDetails = (integrationId: string) => {
  const { handleApiError } = useErrorHandler();
  
  return useQuery({
    queryKey: ['integrations', 'details', integrationId],
    queryFn: async () => {
      try {
        return await IntegrationsService.getIntegrationDetailsApiIntegrationsIntegrationIdGet(integrationId);
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
    enabled: !!integrationId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Setup a new integration
 */
export const useSetupIntegration = () => {
  const queryClient = useQueryClient();
  const { handleApiError } = useErrorHandler();
  
  return useMutation({
    mutationFn: async ({ integrationId, config }: { integrationId: string; config: Record<string, any> }) => {
      try {
        return await IntegrationsService.setupIntegrationApiIntegrationsIntegrationIdSetupPost(integrationId, { config });
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate integration-related queries
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });
};
