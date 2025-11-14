/**
 * Stub hook for useProjects - Projects feature has been replaced with Clients
 * Returns empty data to prevent build errors
 */
import { useQuery, useMutation } from "@tanstack/react-query";

export const useProjects = (clientId?: string) => {
  return useQuery({
    queryKey: ['projects', clientId],
    queryFn: async () => [],
    enabled: false, // Never actually run this query
  });
};

export const useProjectDetail = (projectId: string) => {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => null,
    enabled: false,
  });
};

export const useCreateProject = () => {
  return useMutation({
    mutationFn: async () => null,
  });
};

export const useDeleteProject = () => {
  return useMutation({
    mutationFn: async () => null,
  });
};
