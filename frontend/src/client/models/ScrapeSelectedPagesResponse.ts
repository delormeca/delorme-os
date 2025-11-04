/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Response schema for scraping selected pages.
 */
export type ScrapeSelectedPagesResponse = {
    success_count: number;
    failed_count: number;
    total: number;
    results: Array<Record<string, any>>;
    message: string;
};

