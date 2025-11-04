import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CrawlingService } from '@/client';

// Types
export interface CrawlJobStatus {
  id: string;
  project_id: string;
  phase: 'discovering' | 'testing' | 'extracting' | 'completed' | 'failed';
  status: 'pending' | 'running' | 'completed' | 'failed';
  urls_discovered: number;
  discovery_method: string | null;
  test_results: Record<string, any> | null;
  winning_method: string | null;
  pages_total: number;
  pages_crawled: number;
  pages_failed: number;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  progress_percentage: number;
}

export interface PageDetail {
  id: string;
  project_id: string;
  url: string;
  slug: string;
  status: 'discovered' | 'testing' | 'crawling' | 'crawled' | 'failed';
  extraction_method: string | null;
  last_crawled_at: string | null;
  created_at: string;
  page_data: PageData[];
}

export interface PageData {
  id: string;
  page_id: string;
  data_type: string;
  content: Record<string, any>;
  extracted_at: string;
}

// Start crawl
export function useStartCrawl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      const response = await CrawlingService.startCrawlJobApiCrawlStartPost({
        project_id: projectId
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crawlJobs'] });
    }
  });
}

// Get crawl job status (for polling)
export function useCrawlJobStatus(jobId: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: ['crawlJob', jobId],
    queryFn: async () => {
      if (!jobId) return null;
      const response = await CrawlingService.getCrawlJobStatusApiCrawlStatusCrawlJobIdGet(jobId);
      return response as CrawlJobStatus;
    },
    enabled: enabled && !!jobId,
    refetchInterval: (data) => {
      // Poll every 2 seconds if running, stop if completed/failed
      if (data && data.status === 'running') return 2000;
      return false;
    }
  });
}

// Get project pages
export function useProjectPages(projectId: string | undefined) {
  return useQuery({
    queryKey: ['projectPages', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const response = await CrawlingService.getProjectPagesApiCrawlProjectProjectIdPagesGet(projectId);
      return response as PageDetail[];
    },
    enabled: !!projectId
  });
}

// Get project crawl jobs
export function useProjectCrawlJobs(projectId: string | undefined) {
  return useQuery({
    queryKey: ['crawlJobs', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const response = await CrawlingService.getProjectCrawlJobsApiCrawlProjectProjectIdCrawlJobsGet(projectId);
      return response as CrawlJobStatus[];
    },
    enabled: !!projectId
  });
}

// Add manual page
export function useAddManualPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, url, slug }: { projectId: string; url: string; slug?: string }) => {
      const response = await CrawlingService.addManualPageApiCrawlManualPagePost({
        project_id: projectId,
        url: url,
        slug: slug || undefined
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectPages'] });
    }
  });
}

// Cancel crawl job
export function useCancelCrawl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const response = await CrawlingService.cancelCrawlJobEndpointApiCrawlCancelPost({
        crawl_job_id: jobId
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crawlJobs'] });
      queryClient.invalidateQueries({ queryKey: ['crawlJob'] });
    }
  });
}

// Rescan sitemap - detect new/removed URLs
export function useRescanSitemap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      const response = await CrawlingService.rescanSitemapApiCrawlRescanSitemapPost({
        project_id: projectId
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectPages'] });
      queryClient.invalidateQueries({ queryKey: ['projectPagesWithStats'] });
    }
  });
}

// Scrape selected pages with chosen extraction method
export function useScrapeSelectedPages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pageIds, extractionMethod }: { pageIds: string[]; extractionMethod: string }) => {
      const response = await CrawlingService.scrapeSelectedPagesApiCrawlScrapeSelectedPost({
        page_ids: pageIds,
        extraction_method: extractionMethod
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectPages'] });
      queryClient.invalidateQueries({ queryKey: ['projectPagesWithStats'] });
    }
  });
}

// Get project pages with statistics and version info
export function useProjectPagesWithStats(projectId: string | undefined) {
  return useQuery({
    queryKey: ['projectPagesWithStats', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const response = await CrawlingService.getProjectPagesWithStatsApiCrawlProjectProjectIdPagesWithStatsGet(projectId);
      return response;
    },
    enabled: !!projectId
  });
}
