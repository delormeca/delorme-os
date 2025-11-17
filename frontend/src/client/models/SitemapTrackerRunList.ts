/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SitemapTrackerRunRead } from './SitemapTrackerRunRead';
/**
 * Response schema for paginated list of tracker runs.
 */
export type SitemapTrackerRunList = {
    /**
     * List of tracker runs
     */
    items: Array<SitemapTrackerRunRead>;
    /**
     * Total number of runs
     */
    total: number;
    /**
     * Current page number
     */
    page: number;
    /**
     * Number of items per page
     */
    page_size: number;
};

