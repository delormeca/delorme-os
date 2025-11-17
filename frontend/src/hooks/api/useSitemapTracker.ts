/**
 * Custom hooks for Sitemap Tracker using react-query and direct axios calls.
 */
import { useSnackBarContext } from "@/context/SnackBarContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { OpenAPI } from "@/client";
import axios from "axios";

// Types based on backend schemas
export interface SitemapTrackerConfigUpdate {
  sitemap_url?: string;
  tracking_frequency?: string;
  enabled?: boolean;
}

export interface SitemapTrackerRunCreate {
  run_type: string;
}

export interface SitemapChangeRead {
  id: string;
  client_id: string;
  sitemap_tracker_run_id: string;
  url: string;
  change_type: string;
  old_status_code?: number;
  new_status_code?: number;
  detected_at: string;
  last_seen_at?: string;
  pushed_to_crawler: boolean;
  pushed_at?: string;
  importance?: string;
  notes?: string;
}

export interface SitemapTrackerRunRead {
  id: string;
  client_id: string;
  schedule_frequency: string;
  sitemap_url: string;
  status: string;
  progress_percentage: number;
  current_url_being_checked?: string;
  current_status_message?: string;
  total_urls_in_sitemap: number;
  total_urls_checked: number;
  new_urls_count: number;
  removed_urls_count: number;
  status_code_changes_count: number;
  unchanged_urls_count: number;
  status_code_summary?: Record<string, number>;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  error_message?: string;
  error_log?: Record<string, any>;
  previous_run_id?: string;
  comparison_baseline_snapshot?: Record<string, any>;
  execution_time_seconds?: number;
  average_response_time_ms?: number;
  changes: SitemapChangeRead[];
}

export interface SitemapTrackerRunList {
  items: SitemapTrackerRunRead[];
  total: number;
  page: number;
  page_size: number;
}

export interface SitemapChangeList {
  items: SitemapChangeRead[];
  total: number;
  page: number;
  page_size: number;
}

export interface SitemapTrackerDashboard {
  latest_run?: SitemapTrackerRunRead;
  total_runs: number;
  total_urls_tracked: number;
  recent_changes: SitemapChangeRead[];
  status_code_breakdown: Record<string, number>;
}

export interface RunComparisonRequest {
  run_id_1: string;
  run_id_2: string;
}

export interface RunComparisonResponse {
  run_1: SitemapTrackerRunRead;
  run_2: SitemapTrackerRunRead;
  added_urls: string[];
  removed_urls: string[];
  status_code_changes: Record<string, any>[];
  summary: Record<string, any>;
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
 * Configure sitemap tracker settings for a client
 */
export const useConfigureSitemapTracker = () => {
  const queryClient = useQueryClient();
  const { createSnackBar } = useSnackBarContext();

  return useMutation({
    mutationFn: async ({ clientId, config }: { clientId: string; config: SitemapTrackerConfigUpdate }) => {
      const response = await axios.post(
        `/api/sitemap-tracker/clients/${clientId}/configure`,
        config,
        getAxiosConfig()
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["clients", variables.clientId],
      });
      createSnackBar({
        content: "Sitemap tracker configured successfully",
        severity: "success",
        autoHide: true,
      });
    },
    onError: (error: any) => {
      createSnackBar({
        content: error.response?.data?.detail || error.message || "Failed to configure sitemap tracker",
        severity: "error",
        autoHide: true,
      });
    },
  });
};

/**
 * Start a new sitemap tracker run
 */
export const useStartTrackerRun = () => {
  const queryClient = useQueryClient();
  const { createSnackBar } = useSnackBarContext();

  return useMutation({
    mutationFn: async ({ clientId, data }: { clientId: string; data: SitemapTrackerRunCreate }) => {
      const response = await axios.post(
        `/api/sitemap-tracker/clients/${clientId}/runs`,
        data,
        getAxiosConfig()
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["sitemap-tracker-runs", variables.clientId],
      });
      queryClient.invalidateQueries({
        queryKey: ["clients", variables.clientId],
      });
      createSnackBar({
        content: "Tracker run started successfully",
        severity: "success",
        autoHide: true,
      });
    },
    onError: (error: any) => {
      createSnackBar({
        content: error.response?.data?.detail || error.message || "Failed to start tracker run",
        severity: "error",
        autoHide: true,
      });
    },
  });
};

/**
 * Execute a pending tracker run
 */
export const useExecuteTrackerRun = () => {
  const queryClient = useQueryClient();
  const { createSnackBar } = useSnackBarContext();

  return useMutation({
    mutationFn: async (runId: string): Promise<SitemapTrackerRunRead> => {
      const response = await axios.post(
        `/api/sitemap-tracker/runs/${runId}/execute`,
        {},
        getAxiosConfig()
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["sitemap-tracker-run", data.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["sitemap-tracker-runs"],
      });
      createSnackBar({
        content: "Tracker run execution started",
        severity: "success",
        autoHide: true,
      });
    },
    onError: (error: any) => {
      createSnackBar({
        content: error.response?.data?.detail || error.message || "Failed to execute tracker run",
        severity: "error",
        autoHide: true,
      });
    },
  });
};

/**
 * Get a specific tracker run by ID
 */
export const useTrackerRun = (runId: string) => {
  return useQuery({
    queryKey: ["sitemap-tracker-run", runId],
    queryFn: async (): Promise<SitemapTrackerRunRead> => {
      const response = await axios.get(
        `/api/sitemap-tracker/runs/${runId}`,
        getAxiosConfig()
      );
      return response.data;
    },
    enabled: !!runId,
  });
};

/**
 * List all tracker runs for a client (paginated)
 */
export const useTrackerRuns = (
  clientId: string,
  page: number = 1,
  pageSize: number = 20
) => {
  return useQuery({
    queryKey: ["sitemap-tracker-runs", clientId, page, pageSize],
    queryFn: async (): Promise<SitemapTrackerRunList> => {
      const response = await axios.get(
        `/api/sitemap-tracker/clients/${clientId}/runs`,
        {
          ...getAxiosConfig(),
          params: { page, page_size: pageSize },
        }
      );
      return response.data;
    },
    enabled: !!clientId,
  });
};

/**
 * List changes detected in a tracker run (paginated)
 */
export const useTrackerChanges = (
  runId: string,
  changeType?: string,
  page: number = 1,
  pageSize: number = 50
) => {
  return useQuery({
    queryKey: ["sitemap-tracker-changes", runId, changeType, page, pageSize],
    queryFn: async (): Promise<SitemapChangeList> => {
      const response = await axios.get(
        `/api/sitemap-tracker/runs/${runId}/changes`,
        {
          ...getAxiosConfig(),
          params: {
            change_type: changeType,
            page,
            page_size: pageSize,
          },
        }
      );
      return response.data;
    },
    enabled: !!runId,
  });
};

/**
 * Compare two tracker runs side by side
 */
export const useCompareRuns = () => {
  const { createSnackBar } = useSnackBarContext();

  return useMutation({
    mutationFn: async (data: RunComparisonRequest): Promise<RunComparisonResponse> => {
      const response = await axios.post(
        `/api/sitemap-tracker/compare`,
        data,
        getAxiosConfig()
      );
      return response.data;
    },
    onError: (error: any) => {
      createSnackBar({
        content: error.response?.data?.detail || error.message || "Failed to compare runs",
        severity: "error",
        autoHide: true,
      });
    },
  });
};

/**
 * Get dashboard overview for a client's sitemap tracker
 * Refetches every 30 seconds for real-time updates
 */
export const useTrackerDashboard = (clientId: string) => {
  return useQuery({
    queryKey: ["sitemap-tracker-dashboard", clientId],
    queryFn: async (): Promise<SitemapTrackerDashboard> => {
      const response = await axios.get(
        `/api/sitemap-tracker/clients/${clientId}/dashboard`,
        getAxiosConfig()
      );
      return response.data;
    },
    enabled: !!clientId,
    refetchInterval: 30000,
  });
};
