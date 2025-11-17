/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SitemapChangeRead } from './SitemapChangeRead';
/**
 * Response schema for paginated list of sitemap changes.
 */
export type SitemapChangeList = {
    /**
     * List of sitemap changes
     */
    items: Array<SitemapChangeRead>;
    /**
     * Total number of changes
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

