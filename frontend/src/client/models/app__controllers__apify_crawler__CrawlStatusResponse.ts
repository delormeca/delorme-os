/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Crawl status response.
 */
export type app__controllers__apify_crawler__CrawlStatusResponse = {
    /**
     * Crawl run ID
     */
    id: string;
    /**
     * Client ID
     */
    client_id: string;
    /**
     * Apify run ID
     */
    apify_run_id?: (string | null);
    /**
     * Current status
     */
    status: string;
    /**
     * Total pages to crawl
     */
    total_pages: number;
    /**
     * Pages crawled so far
     */
    pages_crawled: number;
    /**
     * Pages that failed
     */
    pages_failed: number;
    /**
     * Start timestamp
     */
    started_at?: (string | null);
    /**
     * Completion timestamp
     */
    completed_at?: (string | null);
    /**
     * Detailed Apify status
     */
    apify_status?: (Record<string, any> | null);
};

