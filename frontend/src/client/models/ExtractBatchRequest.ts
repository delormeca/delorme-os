/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request to extract data from multiple URLs.
 */
export type ExtractBatchRequest = {
    client_id: string;
    urls: Array<string>;
    crawl_run_id?: (string | null);
};

