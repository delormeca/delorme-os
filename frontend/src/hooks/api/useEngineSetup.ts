/**
 * Custom hooks for Engine Setup using react-query and direct axios calls.
 */
import { useSnackBarContext } from "@/context/SnackBarContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { OpenAPI } from "@/client";
import axios from "axios";

// Types based on backend schemas
export interface EngineSetupRequest {
  client_id: string;
  setup_type: "sitemap" | "manual";
  sitemap_url?: string;
  manual_urls?: string[];
}

export interface EngineSetupStartResponse {
  run_id: string;
  message: string;
  status: string;
}

export interface EngineSetupProgressResponse {
  run_id: string;
  status: string;
  progress_percentage: number;
  current_url?: string;
  total_pages: number;
  successful_pages: number;
  failed_pages: number;
  skipped_pages: number;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
}

export interface EngineSetupRunRead {
  id: string;
  client_id: string;
  setup_type: string;
  total_pages: number;
  successful_pages: number;
  failed_pages: number;
  skipped_pages: number;
  status: string;
  current_url?: string;
  progress_percentage: number;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface EngineSetupStatsResponse {
  client_id: string;
  total_runs: number;
  total_pages_discovered: number;
  last_run_at?: string;
  engine_setup_completed: boolean;
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
 * Start an engine setup run
 */
export const useStartEngineSetup = () => {
  const queryClient = useQueryClient();
  const { createSnackBar } = useSnackBarContext();

  return useMutation({
    mutationFn: async (request: EngineSetupRequest): Promise<EngineSetupStartResponse> => {
      const response = await axios.post(
        `/api/engine-setup/start`,
        request,
        getAxiosConfig()
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["engine-setup-runs"],
      });
      createSnackBar({
        content: data.message || "Engine setup started successfully",
        severity: "success",
        autoHide: true,
      });
    },
    onError: (error: any) => {
      createSnackBar({
        content: error.response?.data?.detail || error.message || "Failed to start engine setup",
        severity: "error",
        autoHide: true,
      });
    },
  });
};

/**
 * Get progress of a setup run (for polling)
 */
export const useEngineSetupProgress = (runId: string | null, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["engine-setup-progress", runId],
    queryFn: async (): Promise<EngineSetupProgressResponse> => {
      const response = await axios.get(
        `/api/engine-setup/${runId}/progress`,
        getAxiosConfig()
      );
      return response.data;
    },
    enabled: !!runId && enabled,
    refetchInterval: (query) => {
      // Poll every 2 seconds if status is pending or in_progress
      const data = query.state.data;
      if (data?.status === "pending" || data?.status === "in_progress") {
        return 2000;
      }
      // Stop polling once completed or failed
      return false;
    },
    refetchIntervalInBackground: false,
  });
};

/**
 * Get a specific setup run
 */
export const useEngineSetupRun = (runId: string) => {
  return useQuery({
    queryKey: ["engine-setup-run", runId],
    queryFn: async (): Promise<EngineSetupRunRead> => {
      const response = await axios.get(
        `/api/engine-setup/${runId}`,
        getAxiosConfig()
      );
      return response.data;
    },
    enabled: !!runId,
  });
};

/**
 * List all setup runs for a client
 */
export const useEngineSetupRuns = (clientId: string, limit: number = 10) => {
  return useQuery({
    queryKey: ["engine-setup-runs", clientId, limit],
    queryFn: async (): Promise<{ runs: EngineSetupRunRead[]; total: number }> => {
      const response = await axios.get(
        `/api/engine-setup/client/${clientId}/runs`,
        {
          ...getAxiosConfig(),
          params: { limit },
        }
      );
      return response.data;
    },
    enabled: !!clientId,
  });
};

/**
 * Get engine setup statistics for a client
 */
export const useEngineSetupStats = (clientId: string) => {
  return useQuery({
    queryKey: ["engine-setup-stats", clientId],
    queryFn: async (): Promise<EngineSetupStatsResponse> => {
      const response = await axios.get(
        `/api/engine-setup/client/${clientId}/stats`,
        getAxiosConfig()
      );
      return response.data;
    },
    enabled: !!clientId,
  });
};

/**
 * Cancel a running setup
 */
export const useCancelEngineSetup = () => {
  const queryClient = useQueryClient();
  const { createSnackBar } = useSnackBarContext();

  return useMutation({
    mutationFn: async (runId: string): Promise<EngineSetupRunRead> => {
      const response = await axios.post(
        `/api/engine-setup/${runId}/cancel`,
        {},
        getAxiosConfig()
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["engine-setup-runs"],
      });
      queryClient.invalidateQueries({
        queryKey: ["engine-setup-progress"],
      });
      createSnackBar({
        content: "Engine setup cancelled",
        severity: "info",
        autoHide: true,
      });
    },
    onError: (error: any) => {
      createSnackBar({
        content: error.response?.data?.detail || error.message || "Failed to cancel setup",
        severity: "error",
        autoHide: true,
      });
    },
  });
};
