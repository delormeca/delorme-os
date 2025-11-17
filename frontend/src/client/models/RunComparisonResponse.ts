/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SitemapTrackerRunRead } from './SitemapTrackerRunRead';
/**
 * Response schema for comparing two tracker runs.
 */
export type RunComparisonResponse = {
    /**
     * First run details
     */
    run_1: SitemapTrackerRunRead;
    /**
     * Second run details
     */
    run_2: SitemapTrackerRunRead;
    /**
     * URLs added between runs
     */
    added_urls?: Array<string>;
    /**
     * URLs removed between runs
     */
    removed_urls?: Array<string>;
    /**
     * URLs with status code changes
     */
    status_code_changes?: Array<Record<string, any>>;
    /**
     * Summary statistics of the comparison
     */
    summary?: Record<string, any>;
};

