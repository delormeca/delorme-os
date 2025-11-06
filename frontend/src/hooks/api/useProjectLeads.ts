import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ProjectLeadsService } from '@/client';
import type { ProjectLeadCreate, ProjectLeadRead, ProjectLeadUpdate } from '@/client';
import { useErrorHandler } from '@/hooks';

export const useProjectLeads = () => {
  const { handleApiError } = useErrorHandler();

  return useQuery({
    queryKey: ['project-leads'],
    queryFn: async () => {
      try {
        return await ProjectLeadsService.getProjectLeadsApiProjectLeadsGet();
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
  });
};

export const useProjectLead = (leadId: string) => {
  const { handleApiError } = useErrorHandler();

  return useQuery({
    queryKey: ['project-leads', leadId],
    queryFn: async () => {
      try {
        return await ProjectLeadsService.getProjectLeadApiProjectLeadsLeadIdGet(leadId);
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
    enabled: !!leadId,
  });
};

export const useCreateProjectLead = () => {
  const queryClient = useQueryClient();
  const { handleApiError } = useErrorHandler();

  return useMutation({
    mutationFn: async (data: ProjectLeadCreate) => {
      try {
        return await ProjectLeadsService.createProjectLeadApiProjectLeadsPost(data);
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-leads'] });
    },
  });
};

export const useUpdateProjectLead = () => {
  const queryClient = useQueryClient();
  const { handleApiError } = useErrorHandler();

  return useMutation({
    mutationFn: async ({ leadId, data }: { leadId: string; data: ProjectLeadUpdate }) => {
      try {
        return await ProjectLeadsService.updateProjectLeadApiProjectLeadsLeadIdPut(leadId, data);
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-leads'] });
    },
  });
};

export const useDeleteProjectLead = () => {
  const queryClient = useQueryClient();
  const { handleApiError } = useErrorHandler();

  return useMutation({
    mutationFn: async (leadId: string) => {
      try {
        return await ProjectLeadsService.deleteProjectLeadApiProjectLeadsLeadIdDelete(leadId);
      } catch (error) {
        handleApiError(error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-leads'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
};
