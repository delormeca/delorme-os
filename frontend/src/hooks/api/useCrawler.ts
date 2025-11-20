/**
 * Custom hooks for Apify Crawler management using react-query.
 *
 * Provides START/STOP/PAUSE controls and real-time status monitoring
 * for Apify crawl runs.
 */
import { ApifyCrawlerService, CrawlStartRequest } from "@/client";
import { useSnackBarContext } from "@/context/SnackBarContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * Hook to start a new Apify crawl (MANUAL TRIGGER).
 *
 * @example
 * const { mutate: startCrawl, isPending } = useStartCrawl();
 * startCrawl({
 *   clientId: "client-uuid",
 *   data: { urls: ["https://example.com"], max_depth: 0 }
 * });
 */
export const useStartCrawl = () => {
  const queryClient = useQueryClient();
  const { createSnackBar } = useSnackBarContext();

  return useMutation({
    mutationFn: ({ clientId, data }: { clientId: string; data: CrawlStartRequest }) =>
      ApifyCrawlerService.startCrawlApiClientsClientIdCrawlStartPost(clientId, data),
    onSuccess: (response) => {
      // Invalidate client crawls list to refresh UI
      queryClient.invalidateQueries({
        queryKey: ["client-crawls"],
      });
      createSnackBar({
        content: `Crawl started successfully! Run ID: ${response.apify_run_id}`,
        severity: "success",
        autoHide: true,
      });
    },
    onError: (error: any) => {
      const errorMessage = error.body?.detail || error.message || "Failed to start crawl";
      createSnackBar({
        content: errorMessage,
        severity: "error",
        autoHide: false,
      });
    },
  });
};

/**
 * Hook to stop/abort a running crawl immediately.
 *
 * @example
 * const { mutate: stopCrawl } = useStopCrawl();
 * stopCrawl("crawl-run-uuid");
 */
export const useStopCrawl = () => {
  const queryClient = useQueryClient();
  const { createSnackBar } = useSnackBarContext();

  return useMutation({
    mutationFn: (crawlRunId: string) =>
      ApifyCrawlerService.stopCrawlApiCrawlCrawlRunIdStopPost(crawlRunId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["crawl-status"],
      });
      queryClient.invalidateQueries({
        queryKey: ["client-crawls"],
      });
      createSnackBar({
        content: "Crawl stopped successfully",
        severity: "success",
        autoHide: true,
      });
    },
    onError: (error: any) => {
      const errorMessage = error.body?.detail || error.message || "Failed to stop crawl";
      createSnackBar({
        content: errorMessage,
        severity: "error",
        autoHide: false,
      });
    },
  });
};

/**
 * Hook to pause a running crawl gracefully.
 *
 * Note: Apify doesn't support native pause/resume, this performs a graceful stop.
 *
 * @example
 * const { mutate: pauseCrawl } = usePauseCrawl();
 * pauseCrawl("crawl-run-uuid");
 */
export const usePauseCrawl = () => {
  const queryClient = useQueryClient();
  const { createSnackBar } = useSnackBarContext();

  return useMutation({
    mutationFn: (crawlRunId: string) =>
      ApifyCrawlerService.pauseCrawlApiCrawlCrawlRunIdPausePost(crawlRunId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["crawl-status"],
      });
      queryClient.invalidateQueries({
        queryKey: ["client-crawls"],
      });
      createSnackBar({
        content: "Crawl paused successfully",
        severity: "success",
        autoHide: true,
      });
    },
    onError: (error: any) => {
      const errorMessage = error.body?.detail || error.message || "Failed to pause crawl";
      createSnackBar({
        content: errorMessage,
        severity: "error",
        autoHide: false,
      });
    },
  });
};

/**
 * Hook to get real-time status of a crawl run.
 *
 * Supports automatic polling for live status updates during active crawls.
 *
 * @param crawlRunId - Crawl run UUID
 * @param options - Query options
 * @param options.refetchInterval - Polling interval in ms (default: 5000 for active crawls)
 * @param options.enabled - Whether to enable the query (default: true)
 *
 * @example
 * const { data: status, isLoading } = useCrawlStatus("crawl-run-uuid", {
 *   refetchInterval: (data) => data?.status === "RUNNING" ? 5000 : false
 * });
 */
export const useCrawlStatus = (
  crawlRunId: string,
  options?: {
    refetchInterval?: number | ((data: any) => number | false);
    enabled?: boolean;
  }
) => {
  return useQuery({
    queryKey: ["crawl-status", crawlRunId],
    queryFn: () => ApifyCrawlerService.getCrawlStatusApiCrawlCrawlRunIdStatusGet(crawlRunId),
    enabled: options?.enabled !== false && !!crawlRunId,
    refetchInterval: options?.refetchInterval ?? ((data) => {
      // Auto-poll every 5 seconds for active crawls
      const activeStatuses = ["READY", "RUNNING", "starting"];
      return data?.status && activeStatuses.includes(data.status) ? 5000 : false;
    }),
  });
};

/**
 * Hook to process completed crawl results.
 *
 * This fetches results from Apify, generates embeddings, and calculates similarity.
 *
 * @example
 * const { mutate: processCrawl, isPending } = useProcessCrawl();
 * processCrawl({
 *   crawlRunId: "crawl-run-uuid",
 *   generateEmbeddings: true,
 *   calculateSimilarity: true
 * });
 */
export const useProcessCrawl = () => {
  const queryClient = useQueryClient();
  const { createSnackBar } = useSnackBarContext();

  return useMutation({
    mutationFn: ({
      crawlRunId,
      generateEmbeddings = true,
      calculateSimilarity = true,
    }: {
      crawlRunId: string;
      generateEmbeddings?: boolean;
      calculateSimilarity?: boolean;
    }) =>
      ApifyCrawlerService.processCrawlResultsApiCrawlCrawlRunIdProcessPost(
        crawlRunId,
        generateEmbeddings,
        calculateSimilarity
      ),
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: ["crawl-status"],
      });
      queryClient.invalidateQueries({
        queryKey: ["client-crawls"],
      });
      queryClient.invalidateQueries({
        queryKey: ["client-pages"],
      });
      createSnackBar({
        content: `Processed ${response.pages_processed} pages successfully! Generated ${response.embeddings_generated} embeddings.`,
        severity: "success",
        autoHide: true,
      });
    },
    onError: (error: any) => {
      const errorMessage = error.body?.detail || error.message || "Failed to process crawl results";
      createSnackBar({
        content: errorMessage,
        severity: "error",
        autoHide: false,
      });
    },
  });
};

/**
 * Hook to get all crawl runs for a client.
 *
 * Returns crawl history ordered by most recent first.
 *
 * @param clientId - Client UUID
 * @param limit - Maximum number of crawls to return (default: 10)
 *
 * @example
 * const { data: crawls, isLoading } = useClientCrawls("client-uuid", 20);
 */
export const useClientCrawls = (clientId: string, limit: number = 10) => {
  return useQuery({
    queryKey: ["client-crawls", clientId, limit],
    queryFn: () => ApifyCrawlerService.getClientCrawlsApiClientsClientIdCrawlsGet(clientId, limit),
    enabled: !!clientId,
  });
};

/**
 * Hook to pull latest pages from sitemap tracker.
 *
 * This fetches URLs from the latest completed sitemap tracker run
 * and adds only new pages that don't already exist in the client's page list.
 *
 * @example
 * const { mutate: pullPages, isPending } = usePullPagesFromSitemap();
 * pullPages("client-uuid");
 */
export const usePullPagesFromSitemap = () => {
  const queryClient = useQueryClient();
  const { createSnackBar } = useSnackBarContext();

  return useMutation({
    mutationFn: (clientId: string) =>
      ApifyCrawlerService.pullPagesFromSitemapApiClientsClientIdPullFromSitemapPost(clientId),
    onSuccess: (response) => {
      // Invalidate client pages and crawls to refresh UI
      queryClient.invalidateQueries({
        queryKey: ["client-pages"],
      });
      queryClient.invalidateQueries({
        queryKey: ["client-crawls"],
      });
      queryClient.invalidateQueries({
        queryKey: ["client-detail"],
      });
      createSnackBar({
        content: `Successfully pulled ${response.new_pages_added} new pages from sitemap. ${response.existing_pages_skipped} pages already existed.`,
        severity: "success",
        autoHide: true,
      });
    },
    onError: (error: any) => {
      const errorMessage = error.body?.detail || error.message || "Failed to pull pages from sitemap";
      createSnackBar({
        content: errorMessage,
        severity: "error",
        autoHide: false,
      });
    },
  });
};

/**
 * Hook to download crawl results to JSON file (Phase 1).
 *
 * Fetches completed crawl results from Apify and stores them in a persistent
 * JSON file for later processing.
 *
 * @example
 * const { mutate: downloadJson, isPending } = useDownloadCrawlJson();
 * downloadJson("crawl-run-uuid");
 */
export const useDownloadCrawlJson = () => {
  const queryClient = useQueryClient();
  const { createSnackBar } = useSnackBarContext();

  return useMutation({
    mutationFn: (crawlRunId: string) =>
      ApifyCrawlerService.downloadCrawlJsonApiCrawlCrawlRunIdDownloadJsonGet(crawlRunId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: ["crawl-status", response.crawl_run_id],
      });
      createSnackBar({
        content: `Downloaded ${response.total_items} items to JSON (${response.file_size_mb} MB)`,
        severity: "success",
        autoHide: true,
      });
    },
    onError: (error: any) => {
      const errorMessage = error.body?.detail || error.message || "Failed to download crawl to JSON";
      createSnackBar({
        content: errorMessage,
        severity: "error",
        autoHide: false,
      });
    },
  });
};

/**
 * Hook to import crawl results from JSON file into database (Phase 2).
 *
 * Loads the JSON file created by download-json and processes all items
 * into the database. Can be run multiple times (idempotent).
 *
 * @example
 * const { mutate: importFromJson, isPending } = useImportCrawlFromJson();
 * importFromJson({
 *   crawlRunId: "crawl-run-uuid",
 *   generateEmbeddings: true,
 *   calculateSimilarity: false
 * });
 */
export const useImportCrawlFromJson = () => {
  const queryClient = useQueryClient();
  const { createSnackBar } = useSnackBarContext();

  return useMutation({
    mutationFn: ({
      crawlRunId,
      generateEmbeddings = true,
      calculateSimilarity = true,
    }: {
      crawlRunId: string;
      generateEmbeddings?: boolean;
      calculateSimilarity?: boolean;
    }) =>
      ApifyCrawlerService.importCrawlFromJsonApiCrawlCrawlRunIdImportFromJsonPost(
        crawlRunId,
        { generate_embeddings: generateEmbeddings, calculate_similarity: calculateSimilarity }
      ),
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: ["crawl-status"],
      });
      queryClient.invalidateQueries({
        queryKey: ["client-crawls"],
      });
      queryClient.invalidateQueries({
        queryKey: ["client-pages"],
      });
      createSnackBar({
        content: `Successfully imported ${response.pages_processed} pages from JSON! Generated ${response.embeddings_generated} embeddings.`,
        severity: "success",
        autoHide: true,
      });
    },
    onError: (error: any) => {
      const errorMessage = error.body?.detail || error.message || "Failed to import from JSON";
      createSnackBar({
        content: errorMessage,
        severity: "error",
        autoHide: false,
      });
    },
  });
};
