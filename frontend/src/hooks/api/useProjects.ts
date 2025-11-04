/**
 * Custom hooks for Project management using react-query.
 */
import { ProjectsService } from "@/client";
import { useSnackBarContext } from "@/context/SnackBarContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useProjects = (clientId?: string) => {
  return useQuery({
    queryKey: ["projects", clientId],
    queryFn: () => ProjectsService.getProjectsApiProjectsGet(clientId),
  });
};

export const useProjectDetail = (projectId: string) => {
  return useQuery({
    queryKey: ["projects", projectId],
    queryFn: () => ProjectsService.getProjectApiProjectsProjectIdGet(projectId),
    enabled: !!projectId,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  const { createSnackBar } = useSnackBarContext();

  return useMutation({
    mutationFn: ProjectsService.createProjectApiProjectsPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      createSnackBar({ content: "Project created successfully", severity: "success", autoHide: true });
    },
    onError: (error: any) => {
      createSnackBar({ content: error.message || "Failed to create project", severity: "error", autoHide: true });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  const { createSnackBar } = useSnackBarContext();

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: any }) =>
      ProjectsService.updateProjectApiProjectsProjectIdPut(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      createSnackBar({ content: "Project updated successfully", severity: "success", autoHide: true });
    },
    onError: (error: any) => {
      createSnackBar({ content: error.message || "Failed to update project", severity: "error", autoHide: true });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  const { createSnackBar } = useSnackBarContext();

  return useMutation({
    mutationFn: ({ projectId, password }: { projectId: string; password: string }) =>
      ProjectsService.deleteProjectApiProjectsProjectIdDelete(projectId, { password }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      createSnackBar({ content: "Project deleted successfully", severity: "success", autoHide: true });
    },
    onError: (error: any) => {
      const message = error.body?.detail || error.message || "Failed to delete project";
      createSnackBar({ content: message, severity: "error", autoHide: true });
      // Rethrow error so component can handle it
      throw error;
    },
  });
};
