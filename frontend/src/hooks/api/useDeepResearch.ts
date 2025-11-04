/**
 * Deep Research API hooks
 * React Query hooks for managing research requests and chat
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useSnackBarContext } from "@/context/SnackBarContext";

// Types (will be replaced by generated types once backend is running)
export interface ResearchRequestCreate {
  query: string;
  report_type?: string;
  tone?: string;
  max_iterations?: number;
  search_depth?: number;
  retrievers?: string[];
  auto_start?: boolean;
}

export interface ResearchRequestRead {
  id: string;
  user_id: string;
  query: string;
  report_type: string;
  tone: string;
  status: string;
  progress: number;
  total_sources: number;
  cost_usd: number;
  duration_seconds: number | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface ResearchSourceRead {
  id: string;
  url: string;
  title: string | null;
  summary: string | null;
  retriever: string;
  relevance_score: number | null;
  created_at: string;
}

export interface ResearchRequestDetail extends ResearchRequestRead {
  report_content: string | null;
  report_markdown: string | null;
  sources: ResearchSourceRead[];
  error_message: string | null;
}

export interface ChatMessageCreate {
  content: string;
}

export interface ChatMessageRead {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

export interface ChatMessageResponse {
  message: ChatMessageRead;
  response: ChatMessageRead;
}

export interface RetrieverInfo {
  name: string;
  display_name: string;
  description: string;
  requires_api_key: boolean;
  is_configured: boolean;
  category: string;
}

export interface RetrieverListResponse {
  retrievers: RetrieverInfo[];
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8020";

// ==================== List Research Requests ====================

export const useResearchList = () => {
  return useQuery({
    queryKey: ["research"],
    queryFn: async () => {
      const response = await axios.get<ResearchRequestRead[]>(`${API_URL}/api/research`, {
        withCredentials: true,
      });
      return response.data;
    },
  });
};

// ==================== Get Research Detail ====================

export const useResearchDetail = (researchId: string | undefined) => {
  return useQuery({
    queryKey: ["research", researchId],
    queryFn: async () => {
      if (!researchId) throw new Error("Research ID is required");
      const response = await axios.get<ResearchRequestDetail>(
        `${API_URL}/api/research/${researchId}`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    },
    enabled: !!researchId,
  });
};

// ==================== Create Research ====================

export const useCreateResearch = () => {
  const queryClient = useQueryClient();
  const { createSnackBar } = useSnackBarContext();

  return useMutation({
    mutationFn: async (data: ResearchRequestCreate) => {
      const response = await axios.post<ResearchRequestRead>(
        `${API_URL}/api/research`,
        data,
        {
          withCredentials: true,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["research"] });
      createSnackBar({
        content: "Research request created successfully",
        severity: "success",
        autoHide: true,
      });
    },
    onError: (error: any) => {
      createSnackBar({
        content: error.response?.data?.detail || "Failed to create research",
        severity: "error",
        autoHide: true,
      });
    },
  });
};

// ==================== Cancel Research ====================

export const useCancelResearch = () => {
  const queryClient = useQueryClient();
  const { createSnackBar } = useSnackBarContext();

  return useMutation({
    mutationFn: async (researchId: string) => {
      const response = await axios.post<ResearchRequestRead>(
        `${API_URL}/api/research/${researchId}/cancel`,
        {},
        {
          withCredentials: true,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["research"] });
      createSnackBar({
        content: "Research cancelled",
        severity: "info",
        autoHide: true,
      });
    },
    onError: (error: any) => {
      createSnackBar({
        content: error.response?.data?.detail || "Failed to cancel research",
        severity: "error",
        autoHide: true,
      });
    },
  });
};

// ==================== Delete Research ====================

export const useDeleteResearch = () => {
  const queryClient = useQueryClient();
  const { createSnackBar } = useSnackBarContext();

  return useMutation({
    mutationFn: async (researchId: string) => {
      await axios.delete(`${API_URL}/api/research/${researchId}`, {
        withCredentials: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["research"] });
      createSnackBar({
        content: "Research deleted",
        severity: "success",
        autoHide: true,
      });
    },
    onError: (error: any) => {
      createSnackBar({
        content: error.response?.data?.detail || "Failed to delete research",
        severity: "error",
        autoHide: true,
      });
    },
  });
};

// ==================== Chat with Research ====================

export const useChatWithResearch = (researchId: string | undefined) => {
  const { createSnackBar } = useSnackBarContext();

  return useMutation({
    mutationFn: async (message: ChatMessageCreate) => {
      if (!researchId) throw new Error("Research ID is required");
      const response = await axios.post<ChatMessageResponse>(
        `${API_URL}/api/research/${researchId}/chat`,
        message,
        {
          withCredentials: true,
        }
      );
      return response.data;
    },
    onError: (error: any) => {
      createSnackBar({
        content: error.response?.data?.detail || "Failed to send message",
        severity: "error",
        autoHide: true,
      });
    },
  });
};

// ==================== Get Available Retrievers ====================

export const useAvailableRetrievers = () => {
  return useQuery({
    queryKey: ["retrievers"],
    queryFn: async () => {
      const response = await axios.get<RetrieverListResponse>(
        `${API_URL}/api/research/retrievers/list`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    },
  });
};
