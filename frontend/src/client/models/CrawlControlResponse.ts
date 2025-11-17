/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Response for control actions (stop/pause).
 */
export type CrawlControlResponse = {
    /**
     * Whether the action succeeded
     */
    success: boolean;
    /**
     * Crawl run ID
     */
    crawl_run_id: string;
    /**
     * Action performed
     */
    action: string;
    /**
     * Status message
     */
    message: string;
};

