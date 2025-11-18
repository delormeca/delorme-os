/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Historical value for a single datapoint.
 */
export type DatapointHistory = {
    /**
     * Historical value
     */
    value?: (string | number | boolean | Record<string, any> | null);
    /**
     * When this value was crawled
     */
    crawled_at: string;
    /**
     * Crawl run that produced this value
     */
    crawl_run_id: string;
    /**
     * Version number
     */
    version: number;
};

