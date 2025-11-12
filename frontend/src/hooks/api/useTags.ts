/**
 * Custom hooks for Tag Management using react-query and axios.
 */
import { useSnackBarContext } from "@/context/SnackBarContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { OpenAPI } from "@/client";
import axios from "axios";
import type { ClientPageRead } from "@/client";

interface UpdateTagsRequest {
  tags: string[];
}

interface BulkUpdateTagsRequest {
  page_ids: string[];
  tags: string[];
  mode: 'replace' | 'append';
}

interface BulkUpdateTagsResponse {
  updated_count: number;
  page_ids: string[];
}

interface AllTagsResponse {
  client_id: string;
  tags: string[];
  tag_count: number;
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
 * Update tags for a single page
 */
export const useUpdatePageTags = () => {
  const queryClient = useQueryClient();
  const { showSnackBar } = useSnackBarContext();

  return useMutation({
    mutationFn: async ({
      pageId,
      tags,
    }: {
      pageId: string;
      tags: string[];
    }): Promise<ClientPageRead> => {
      const response = await axios.put(
        `/api/tags/${pageId}`,
        { tags } as UpdateTagsRequest,
        getAxiosConfig()
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-pages"] });
      showSnackBar("Tags updated successfully", "success");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || "Failed to update tags";
      showSnackBar(message, "error");
    },
  });
};

/**
 * Bulk update tags for multiple pages
 */
export const useBulkUpdateTags = () => {
  const queryClient = useQueryClient();
  const { showSnackBar } = useSnackBarContext();

  return useMutation({
    mutationFn: async (
      request: BulkUpdateTagsRequest
    ): Promise<BulkUpdateTagsResponse> => {
      const response = await axios.post(
        `/api/tags/bulk-update`,
        request,
        getAxiosConfig()
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["client-pages"] });
      showSnackBar(
        `Tags updated for ${data.updated_count} page${data.updated_count !== 1 ? 's' : ''}`,
        "success"
      );
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || "Failed to update tags";
      showSnackBar(message, "error");
    },
  });
};

/**
 * Delete all tags from a page
 */
export const useDeletePageTags = () => {
  const queryClient = useQueryClient();
  const { showSnackBar } = useSnackBarContext();

  return useMutation({
    mutationFn: async (pageId: string): Promise<ClientPageRead> => {
      const response = await axios.delete(
        `/api/tags/${pageId}`,
        getAxiosConfig()
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-pages"] });
      showSnackBar("Tags deleted successfully", "success");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || "Failed to delete tags";
      showSnackBar(message, "error");
    },
  });
};

/**
 * Get all unique tags for a client
 */
export const useClientTags = (clientId: string) => {
  return useQuery({
    queryKey: ["client-tags", clientId],
    queryFn: async (): Promise<AllTagsResponse> => {
      const response = await axios.get(
        `/api/tags/client/${clientId}/all-tags`,
        getAxiosConfig()
      );
      return response.data;
    },
    enabled: !!clientId,
  });
};
