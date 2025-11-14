/**
 * Stub hook for useCrawling - Crawling feature has been replaced with PageCrawl
 * Returns stub hooks to prevent build errors
 */
import { useQuery, useMutation } from "@tanstack/react-query";

export const useStartCrawl = () => {
  return useMutation({
    mutationFn: async () => {
      throw new Error("Legacy crawling feature is no longer available. Use Page Crawl instead.");
    },
  });
};

export const useCrawlStatus = (jobId?: string) => {
  return useQuery({
    queryKey: ['crawl-status', jobId],
    queryFn: async () => null,
    enabled: false,
  });
};

export const useCancelCrawl = () => {
  return useMutation({
    mutationFn: async () => {
      throw new Error("Legacy crawling feature is no longer available.");
    },
  });
};

export const useCrawlJobStatus = (jobId?: string) => {
  return useQuery({
    queryKey: ['crawl-job-status', jobId],
    queryFn: async () => null,
    enabled: false,
  });
};

export const useProjectPages = (projectId?: string) => {
  return useQuery({
    queryKey: ['project-pages', projectId],
    queryFn: async () => [],
    enabled: false,
  });
};

export const useProjectCrawlJobs = (projectId?: string) => {
  return useQuery({
    queryKey: ['project-crawl-jobs', projectId],
    queryFn: async () => [],
    enabled: false,
  });
};

export const useProjectPagesWithStats = (projectId?: string) => {
  return useQuery({
    queryKey: ['project-pages-stats', projectId],
    queryFn: async () => null,
    enabled: false,
  });
};

export const useAddManualPage = () => {
  return useMutation({
    mutationFn: async () => {
      throw new Error("Legacy crawling feature is no longer available.");
    },
  });
};

export const useRescanSitemap = () => {
  return useMutation({
    mutationFn: async () => {
      throw new Error("Legacy crawling feature is no longer available.");
    },
  });
};
