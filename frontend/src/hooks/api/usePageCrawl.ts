/**
 * Custom hooks for Page Crawl (Phase 4) using react-query and direct axios calls.
 */
import { useSnackBarContext } from "@/context/SnackBarContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { OpenAPI } from "@/client";
import axios from "axios";

// Types based on backend schemas
export interface StartCrawlRequest {
  client_id: string;
  run_type: "full" | "selective" | "manual";
  selected_page_ids?: string[];
}

export interface JobResponse {
  job_id: string;
  message: string;
}

export interface CrawlStatusResponse {
  id: string;
  status: "pending" | "in_progress" | "completed" | "failed" | "partial";
  progress_percentage: number;
  current_page_url?: string;
  current_status_message?: string;
  total_pages: number;
  successful_pages: number;
  failed_pages: number;
  started_at?: string;
  completed_at?: string;
  performance_metrics?: {
    total_time_seconds?: number;
    avg_time_per_page?: number;
    pages_per_minute?: number;
    total_pages_crawled?: number;
  };
  api_costs?: {
    openai_embeddings?: {
      requests: number;
      tokens: number;
      cost_usd: number;
    };
    google_nlp?: {
      requests: number;
      cost_usd: number;
    };
  };
  errors: Array<{
    url: string;
    error: string;
    timestamp: string;
  }>;
}

export interface CrawlRunSummary {
  id: string;
  run_type: string;
  status: string;
  total_pages: number;
  successful_pages: number;
  failed_pages: number;
  progress_percentage: number;
  started_at?: string;
  completed_at?: string;
}

export interface CrawlJob {
  id: string;
  name: string;
  next_run_time?: string;
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
 * Start a new page crawl job
 */
export const useStartPageCrawl = () => {
  const queryClient = useQueryClient();
  const { createSnackBar } = useSnackBarContext();

  return useMutation({
    mutationFn: async (request: StartCrawlRequest): Promise<JobResponse> => {
      const response = await axios.post(
        `/api/page-crawl/start`,
        request,
        getAxiosConfig()
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["page-crawl-runs"],
      });
      queryClient.invalidateQueries({
        queryKey: ["page-crawl-jobs"],
      });
      createSnackBar({
        content: data.message || "Page crawl started successfully",
        severity: "success",
        autoHide: true,
      });
    },
    onError: (error: any) => {
      console.error("Start crawl error details:", error.response?.data);
      let errorMessage = "Failed to start page crawl";

      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        // Handle Pydantic validation errors (array of objects)
        if (Array.isArray(detail)) {
          errorMessage = detail.map((err: any) => err.msg).join(", ");
        } else if (typeof detail === "string") {
          errorMessage = detail;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      createSnackBar({
        content: errorMessage,
        severity: "error",
        autoHide: true,
      });
    },
  });
};

/**
 * Get crawl run status (for real-time polling)
 */
export const usePageCrawlStatus = (
  crawlRunId: string | null,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["page-crawl-status", crawlRunId],
    queryFn: async (): Promise<CrawlStatusResponse> => {
      const response = await axios.get(
        `/api/page-crawl/status/${crawlRunId}`,
        getAxiosConfig()
      );
      return response.data;
    },
    enabled: !!crawlRunId && enabled,
    refetchInterval: (query) => {
      // Poll every 2 seconds if status is pending or in_progress
      const data = query.state.data;
      if (data?.status === "pending" || data?.status === "in_progress") {
        return 2000; // 2 seconds
      }
      // Stop polling once completed or failed
      return false;
    },
    refetchIntervalInBackground: false,
  });
};

/**
 * List recent crawl runs for a client
 */
export const usePageCrawlRuns = (clientId: string, limit: number = 10) => {
  return useQuery({
    queryKey: ["page-crawl-runs", clientId, limit],
    queryFn: async (): Promise<CrawlRunSummary[]> => {
      const response = await axios.get(
        `/api/page-crawl/client/${clientId}/runs`,
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
 * List active crawl jobs
 */
export const usePageCrawlJobs = () => {
  return useQuery({
    queryKey: ["page-crawl-jobs"],
    queryFn: async (): Promise<CrawlJob[]> => {
      const response = await axios.get(`/api/page-crawl/jobs`, getAxiosConfig());
      return response.data;
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });
};

/**
 * Cancel a crawl job
 */
export const useCancelPageCrawl = () => {
  const queryClient = useQueryClient();
  const { createSnackBar } = useSnackBarContext();

  return useMutation({
    mutationFn: async (jobId: string): Promise<JobResponse> => {
      const response = await axios.post(
        `/api/page-crawl/cancel/${jobId}`,
        {},
        getAxiosConfig()
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["page-crawl-jobs"],
      });
      queryClient.invalidateQueries({
        queryKey: ["page-crawl-status"],
      });
      createSnackBar({
        content: "Page crawl cancelled",
        severity: "info",
        autoHide: true,
      });
    },
    onError: (error: any) => {
      let errorMessage = "Failed to cancel crawl";

      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        // Handle Pydantic validation errors (array of objects)
        if (Array.isArray(detail)) {
          errorMessage = detail.map((err: any) => err.msg).join(", ");
        } else if (typeof detail === "string") {
          errorMessage = detail;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      createSnackBar({
        content: errorMessage,
        severity: "error",
        autoHide: true,
      });
    },
  });
};
