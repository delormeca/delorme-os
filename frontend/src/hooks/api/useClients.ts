/**
 * Custom hooks for Client management using react-query.
 */
import { ClientsService } from "@/client";
import { useSnackBarContext } from "@/context/SnackBarContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useClients = (search?: string, projectLeadId?: string) => {
  return useQuery({
    queryKey: ["clients", search, projectLeadId],
    queryFn: () => ClientsService.getClientsApiClientsGet(search, projectLeadId),
  });
};

export const useClientDetail = (clientId: string) => {
  return useQuery({
    queryKey: ["clients", clientId],
    queryFn: () => ClientsService.getClientApiClientsClientIdGet(clientId),
    enabled: !!clientId,
  });
};

export const useCreateClient = () => {
  const queryClient = useQueryClient();
  const { createSnackBar } = useSnackBarContext();

  return useMutation({
    mutationFn: ClientsService.createClientApiClientsPost,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["clients"],
      });
      createSnackBar({
        content: "Client created successfully",
        severity: "success",
        autoHide: true,
      });
    },
    onError: (error: any) => {
      // Extract the detailed error message from FastAPI response
      const errorMessage = error.body?.detail || error.message || "Failed to create client";
      createSnackBar({
        content: errorMessage,
        severity: "error",
        autoHide: false, // Don't auto-hide errors so user can read them
      });
    },
  });
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();
  const { createSnackBar } = useSnackBarContext();

  return useMutation({
    mutationFn: ({ clientId, data }: { clientId: string; data: any }) =>
      ClientsService.updateClientApiClientsClientIdPut(clientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["clients"],
      });
      createSnackBar({
        content: "Client updated successfully",
        severity: "success",
        autoHide: true,
      });
    },
    onError: (error: any) => {
      const errorMessage = error.body?.detail || error.message || "Failed to update client";
      createSnackBar({
        content: errorMessage,
        severity: "error",
        autoHide: false,
      });
    },
  });
};

export const useDeleteClient = () => {
  const queryClient = useQueryClient();
  const { createSnackBar } = useSnackBarContext();

  return useMutation({
    mutationFn: ({ clientId, password }: { clientId: string; password: string }) =>
      ClientsService.deleteClientApiClientsClientIdDelete(clientId, { password }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["clients"],
      });
      createSnackBar({
        content: "Client deleted successfully",
        severity: "success",
        autoHide: true,
      });
    },
    onError: (error: any) => {
      const message = error.body?.detail || error.message || "Failed to delete client";
      createSnackBar({
        content: message,
        severity: "error",
        autoHide: true,
      });
      // Rethrow error so component can handle it
      throw error;
    },
  });
};

export const useBulkDeleteClients = () => {
  const queryClient = useQueryClient();
  const { createSnackBar } = useSnackBarContext();

  return useMutation({
    mutationFn: ({ clientIds, createBackup }: { clientIds: string[]; createBackup: boolean }) =>
      ClientsService.bulkDeleteClientsApiClientsBulkDeletePost({
        client_ids: clientIds,
        create_backup: createBackup,
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["clients"],
      });
      createSnackBar({
        content: `Successfully deleted ${variables.clientIds.length} client${variables.clientIds.length !== 1 ? 's' : ''}`,
        severity: "success",
        autoHide: true,
      });
    },
    onError: (error: any) => {
      const message = error.body?.detail || error.message || "Failed to delete clients";
      createSnackBar({
        content: message,
        severity: "error",
        autoHide: true,
      });
    },
  });
};
