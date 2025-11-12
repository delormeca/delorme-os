/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request to start a new crawl.
 */
export type app__controllers__page_crawl__StartCrawlRequest = {
    /**
     * Client ID to crawl
     */
    client_id: string;
    /**
     * Type of run: 'full', 'selective', or 'manual'
     */
    run_type?: string;
    /**
     * Optional list of specific page IDs to crawl (for selective runs)
     */
    selected_page_ids?: (Array<string> | null);
};

