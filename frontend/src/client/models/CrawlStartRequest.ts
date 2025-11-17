/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request to start a new crawl.
 */
export type CrawlStartRequest = {
    /**
     * Client ID to crawl
     */
    client_id: string;
    /**
     * URLs to crawl (if None, uses client base_url)
     */
    urls?: (Array<string> | null);
    /**
     * Maximum crawl depth (0 = exact URLs only)
     */
    max_depth?: number;
    /**
     * Whether to save HTML
     */
    save_html?: boolean;
    /**
     * Whether to save markdown
     */
    save_markdown?: boolean;
    /**
     * Whether to capture screenshots
     */
    save_screenshots?: boolean;
};

