/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Response after starting a crawl.
 */
export type CrawlStartResponse = {
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
     * Crawl status
     */
    status: string;
    /**
     * Start timestamp
     */
    started_at?: (string | null);
    /**
     * Status message
     */
    message: string;
};

