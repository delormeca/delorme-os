/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Response schema for crawl job status.
 */
export type CrawlJobStatusResponse = {
    id: string;
    project_id: string;
    /**
     * Current phase: discovering, testing, extracting, completed, failed
     */
    phase: string;
    /**
     * Current status: pending, running, completed, failed
     */
    status: string;
    urls_discovered: number;
    discovery_method?: (string | null);
    test_results?: (Record<string, any> | null);
    winning_method?: (string | null);
    pages_total: number;
    pages_crawled: number;
    pages_failed: number;
    started_at?: (string | null);
    completed_at?: (string | null);
    error_message?: (string | null);
    /**
     * Overall progress percentage
     */
    progress_percentage?: number;
};

