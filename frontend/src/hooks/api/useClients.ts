/**
 * Custom hooks for Client management using react-query.
 */
import { ClientsService } from "@/client";
import { useSnackBarContext } from "@/context/SnackBarContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useClients = () => {
  return useQuery({
    queryKey: ["clients"],
    queryFn: () => ClientsService.getClientsApiClientsGet(),
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
      createSnackBar({
        content: error.message || "Failed to create client",
        severity: "error",
        autoHide: true,
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
      createSnackBar({
        content: error.message || "Failed to update client",
        severity: "error",
        autoHide: true,
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
