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
