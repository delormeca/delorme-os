/**
 * Custom hooks for Client Pages using react-query and direct axios calls.
 */
import { useSnackBarContext } from "@/context/SnackBarContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { OpenAPI } from "@/client";
import axios from "axios";

// Import ClientPageRead from generated client (now has all 22 Phase 3 fields!)
import type { ClientPageRead } from "@/client";

export interface ClientPageList {
  pages: ClientPageRead[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ClientPageSearchParams {
  client_id: string;
  is_failed?: boolean;
  status_code?: number;
  search?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface ClientPageCount {
  client_id: string;
  total_pages: number;
  failed_pages: number;
  successful_pages: number;
}

// Helper to get axios config with auth
const getAxiosConfig = () => ({
  baseURL: OpenAPI.BASE,
  headers: {
    "Content-Type": "application/json",
    ...OpenAPI.HEADERS,
  },
  withCredentials: OpenAPI.WITH_CREDENTIALS,
});

/**
 * List client pages with filtering and pagination
 */
export const useClientPages = (params: ClientPageSearchParams) => {
  return useQuery({
    queryKey: ["client-pages", params],
    queryFn: async (): Promise<ClientPageList> => {
      const response = await axios.get(
        `/api/client-pages`,
        {
          ...getAxiosConfig(),
          params: {
            client_id: params.client_id,
            is_failed: params.is_failed,
            status_code: params.status_code,
            search: params.search,
            page: params.page || 1,
            page_size: params.page_size || 50,
            sort_by: params.sort_by || "created_at",
            sort_order: params.sort_order || "desc",
          },
        }
      );
      return response.data;
    },
    enabled: !!params.client_id,
  });
};

/**
 * Get a specific client page by ID
 */
export const useClientPage = (pageId: string) => {
  return useQuery({
    queryKey: ["client-page", pageId],
    queryFn: async (): Promise<ClientPageRead> => {
      const response = await axios.get(
        `/api/client-pages/${pageId}`,
        getAxiosConfig()
      );
      return response.data;
    },
    enabled: !!pageId,
  });
};

/**
 * Get page count statistics for a client
 */
export const useClientPageCount = (clientId: string) => {
  return useQuery({
    queryKey: ["client-page-count", clientId],
    queryFn: async (): Promise<ClientPageCount> => {
      const response = await axios.get(
        `/api/client-pages/client/${clientId}/count`,
        getAxiosConfig()
      );
      return response.data;
    },
    enabled: !!clientId,
  });
};

/**
 * Delete all pages for a client (reset engine setup)
 */
export const useDeleteAllClientPages = () => {
  const queryClient = useQueryClient();
  const { createSnackBar } = useSnackBarContext();

  return useMutation({
    mutationFn: async (clientId: string): Promise<{ deleted_count: number; message: string }> => {
      const response = await axios.delete(
        `/api/client-pages/client/${clientId}/all`,
        getAxiosConfig()
      );
      return response.data;
    },
    onSuccess: (data, clientId) => {
      queryClient.invalidateQueries({
        queryKey: ["client-pages"],
      });
      queryClient.invalidateQueries({
        queryKey: ["client-page-count", clientId],
      });
      queryClient.invalidateQueries({
        queryKey: ["clients", clientId],
      });
      createSnackBar({
        content: data.message || `Deleted ${data.deleted_count} pages`,
        severity: "success",
        autoHide: true,
      });
    },
    onError: (error: any) => {
      createSnackBar({
        content: error.response?.data?.detail || error.message || "Failed to delete pages",
        severity: "error",
        autoHide: true,
      });
    },
  });
};

/**
 * Delete a single client page
 */
export const useDeleteClientPage = () => {
  const queryClient = useQueryClient();
  const { createSnackBar } = useSnackBarContext();

  return useMutation({
    mutationFn: async (pageId: string): Promise<void> => {
      await axios.delete(
        `/api/client-pages/${pageId}`,
        getAxiosConfig()
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["client-pages"],
      });
      queryClient.invalidateQueries({
        queryKey: ["client-page-count"],
      });
      createSnackBar({
        content: "Page deleted successfully",
        severity: "success",
        autoHide: true,
      });
    },
    onError: (error: any) => {
      createSnackBar({
        content: error.response?.data?.detail || error.message || "Failed to delete page",
        severity: "error",
        autoHide: true,
      });
    },
  });
};
